import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";
import { test } from "node:test";
import { EXAMPLE, SAMPLE } from "../src/features/workspace/model/example.ts";
import { encodeMessage, getMessageType, parseSchema } from "../src/lib/protobuf.ts";

// A small synchronous hook runner exercises the actual extracted handlers, not a
// second implementation of workspace transitions. This is not a React/browser
// integration test: scheduling, StrictMode, and DOM behavior remain integration checks.
const moduleURL = (code) => `data:text/javascript;base64,${Buffer.from(code).toString("base64")}`;
const reactURL = moduleURL(`
let active;
export function createHarness(hook, server = false) {
  const context = { slots: [], cursor: 0, server };
  return {
    render() {
      active = context;
      context.cursor = 0;
      try { return hook(); } finally { active = null; }
    },
    get store() { return context.store; },
  };
}
export function useState(initial) {
  const context = active;
  const index = context.cursor++;
  if (!(index in context.slots)) context.slots[index] = typeof initial === "function" ? initial() : initial;
  return [context.slots[index], (next) => {
    context.slots[index] = typeof next === "function" ? next(context.slots[index]) : next;
  }];
}
export function useRef(initial) {
  const index = active.cursor++;
  return active.slots[index] ??= { current: initial };
}
export function useMemo(factory, deps) {
  const index = active.cursor++;
  const previous = active.slots[index];
  if (!previous || deps.some((value, i) => !Object.is(value, previous.deps[i]))) {
    active.slots[index] = { deps, value: factory() };
  }
  return active.slots[index].value;
}
export function useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot) {
  active.store = { subscribe, getSnapshot, getServerSnapshot };
  return active.server ? getServerSnapshot() : getSnapshot();
}
`);
const { createHarness } = await import(reactURL);
async function importHook(path) {
  const url = new URL(path, import.meta.url);
  const source = stripTypeScriptTypes(await readFile(url, "utf8"))
    .replace(/from "([^"]+)"/g, (_, specifier) => {
      assert.ok(specifier === "react" || specifier.startsWith("."));
      return `from "${specifier === "react" ? reactURL : new URL(specifier, url).href}"`;
    });
  return import(moduleURL(source));
}
const { useWorkspace } = await importHook("../src/hooks/use-workspace.ts");
const { useWorkspaceDesktop } = await importHook("../src/hooks/use-workspace-desktop.ts");
function workspace() {
  const harness = createHarness(useWorkspace);
  let current = harness.render();
  return {
    get state() { return current; },
    act(action) { const value = action(current); current = harness.render(); return value; },
    refresh() { current = harness.render(); },
  };
}
const sampleType = getMessageType(parseSchema(EXAMPLE).root, "example.Person");
const sampleBase64 = encodeMessage(sampleType, SAMPLE);

test("workspace state stays instance-local; schema edits reset values and preserve/fallback selection", () => {
  const first = workspace();
  const second = workspace();
  assert.equal(first.state.mode, "encode");
  assert.equal(first.state.selected, "example.Person");
  assert.equal(first.state.result, null);
  first.act((state) => state.convert());
  assert.equal(first.state.result, sampleBase64);
  first.act((state) => state.changeType("example.Address"));
  assert.equal(first.state.resultChanged, true);
  first.act((state) => state.changeField("city", "Paris", true));
  first.act((state) => state.editSchema(EXAMPLE + "\n"));
  assert.equal(first.state.selected, "example.Address");
  assert.deepEqual(first.state.draft.city, { included: false, text: "" });
  first.act((state) => state.editSchema("message Broken {"));
  assert.equal(first.state.selected, "example.Address");
  assert.equal(first.state.type, null);
  assert.deepEqual(first.state.draft, {});
  assert.match(first.state.parsed.error, /Invalid protobuf schema/);
  first.act((state) => state.convert());
  assert.equal(first.state.result, null);
  assert.equal(first.state.error, "");
  first.act((state) => state.editSchema("message Other { optional int32 id = 1; }"));
  assert.equal(first.state.selected, "Other");
  assert.equal(first.state.parsed.error, "");
  assert.equal(first.state.resultChanged, true);
  assert.equal(second.state.schema, EXAMPLE);
  assert.equal(second.state.selected, "example.Person");
  assert.equal(second.state.resultChanged, false);
});

test("mode changes seed decode only from a current encode result, including an empty payload", () => {
  const app = workspace();
  app.act((state) => state.convert());
  app.act((state) => state.changeMode("encode"));
  assert.equal(app.state.result, sampleBase64);
  app.act((state) => state.changeMode("decode"));
  assert.equal(app.state.base64, sampleBase64);
  assert.equal(app.state.result, null);
  assert.equal(app.state.resultChanged, true);
  app.act((state) => state.convert());
  assert.deepEqual(JSON.parse(app.state.result), SAMPLE);
  assert.equal(app.state.resultChanged, false);
  app.act((state) => state.changeMode("encode"));
  assert.equal(app.state.base64, sampleBase64);
  app.act((state) => state.changeMode("decode"));
  assert.equal(app.state.base64, sampleBase64);
  app.act((state) => { state.setBase64(""); state.invalidate(); });
  app.act((state) => state.convert());
  assert.equal(app.state.result, "{}");
  assert.equal(app.state.draft.name.included, false);
  app.act((state) => state.changeMode("encode"));
  app.act((state) => state.convert());
  assert.equal(app.state.result, "");
  app.act((state) => state.changeMode("decode"));
  assert.equal(app.state.base64, "");
});

test("field changes enforce oneof exclusion; invalid conversion keeps result stale until success/reset", () => {
  const app = workspace();
  app.act((state) => state.editSchema("message Choice { oneof value { string text = 1; int32 number = 2; } }"));
  app.act((state) => state.changeField("text", "kept", true));
  app.act((state) => state.changeField("number", "0", true));
  assert.deepEqual(app.state.draft.text, { text: "kept", included: false });
  app.act((state) => state.convert());
  assert.notEqual(app.state.result, null);
  app.act((state) => state.changeField("number", "1.5", true));
  assert.equal(app.state.result, null);
  assert.equal(app.state.resultChanged, true);
  app.act((state) => state.convert());
  assert.match(app.state.error, /^number: Enter a whole number/);
  assert.equal(app.state.resultChanged, true);
  app.act((state) => state.changeField("number", "7", true));
  assert.equal(app.state.error, "");
  app.act((state) => state.convert());
  assert.equal(app.state.resultChanged, false);
  app.act((state) => state.loadExample());
  assert.equal(app.state.schema, EXAMPLE);
  assert.equal(app.state.selected, "example.Person");
  assert.equal(app.state.draft.accountId.text, SAMPLE.accountId);
  assert.equal(app.state.result, null);
  assert.equal(app.state.resultChanged, false);
  app.act((state) => state.changeMode("decode"));
  app.act((state) => { state.setBase64("!"); state.invalidate(); });
  app.act((state) => state.convert());
  assert.match(app.state.error, /Base64/);
  app.act((state) => state.loadExample());
  assert.equal(app.state.mode, "decode");
  assert.equal(app.state.base64, sampleBase64);
  assert.equal(app.state.error, "");
  assert.equal(app.state.resultChanged, false);
  app.act((state) => state.convert());
  assert.deepEqual(JSON.parse(app.state.result), SAMPLE);
});

test("clipboard success/failure and pending completions obey result revisions", async () => {
  const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  let writeText;
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: { clipboard: { writeText: (text) => writeText(text) } } });
  try {
    const app = workspace();
    writeText = () => assert.fail("No result must not invoke clipboard");
    await app.act((state) => state.copyResult());
    app.act((state) => state.convert());
    writeText = async (text) => assert.equal(text, sampleBase64);
    await app.act((state) => state.copyResult());
    app.refresh();
    assert.equal(app.state.copyStatus, "Copied to clipboard");
    writeText = async () => { throw new Error("denied"); };
    await app.act((state) => state.copyResult());
    app.refresh();
    assert.equal(app.state.copyStatus, "Clipboard unavailable. Select and copy the result below.");

    // Every invalidating action must suppress both late success and late failure.
    for (const reject of [false, true]) {
      for (const invalidate of [
        (state) => state.changeField("name", "changed", true),
        (state) => state.editSchema(EXAMPLE + "\n"),
        (state) => state.changeType("example.Address"),
        (state) => state.changeMode("decode"),
        (state) => state.loadExample(),
        (state) => state.convert(),
        (state) => { state.setBase64("new source"); state.invalidate(); },
      ]) {
        app.act((state) => state.changeMode("encode"));
        app.act((state) => state.loadExample());
        app.act((state) => state.convert());
        let finish;
        writeText = () => new Promise((resolve, fail) => { finish = () => reject ? fail(new Error("denied")) : resolve(); });
        const pending = app.act((state) => state.copyResult());
        app.act(invalidate);
        finish();
        await pending;
        app.refresh();
        assert.equal(app.state.copyStatus, "");
      }
    }
    // An unchanged-mode click intentionally does not invalidate a pending copy.
    app.act((state) => state.changeMode("encode"));
    app.act((state) => state.loadExample());
    app.act((state) => state.convert());
    let finish;
    writeText = () => new Promise((resolve) => { finish = resolve; });
    const pending = app.act((state) => state.copyResult());
    app.act((state) => state.changeMode("encode"));
    finish();
    await pending;
    app.refresh();
    assert.equal(app.state.copyStatus, "Copied to clipboard");
  } finally {
    if (originalNavigator) Object.defineProperty(globalThis, "navigator", originalNavigator);
    else delete globalThis.navigator;
  }
});

test("workspace desktop preserves 1024px subscription, snapshots, server fallback and cleanup", () => {
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  try {
    delete globalThis.window;
    const server = createHarness(useWorkspaceDesktop, true);
    assert.equal(server.render(), false);
    const calls = [];
    const media = {
      matches: false,
      addEventListener: (...args) => calls.push(["add", ...args]),
      removeEventListener: (...args) => calls.push(["remove", ...args]),
    };
    Object.defineProperty(globalThis, "window", { configurable: true, value: { matchMedia: (query) => {
      assert.equal(query, "(min-width: 1024px)");
      return media;
    } } });
    const client = createHarness(useWorkspaceDesktop);
    assert.equal(client.render(), false);
    const callback = () => {};
    const subscribe = client.store.subscribe;
    const unsubscribe = subscribe(callback);
    assert.deepEqual(calls, [["add", "change", callback]]);
    media.matches = true;
    assert.equal(client.store.getSnapshot(), true);
    assert.equal(client.render(), true);
    assert.equal(client.store.subscribe, subscribe);
    assert.equal(client.store.getServerSnapshot(), false);
    unsubscribe();
    assert.deepEqual(calls[1], ["remove", "change", callback]);
  } finally {
    if (originalWindow) Object.defineProperty(globalThis, "window", originalWindow);
    else delete globalThis.window;
  }
});
