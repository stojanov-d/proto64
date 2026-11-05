import assert from "node:assert/strict";
import { test } from "node:test";
import { parseSchema, getMessageType, encodeMessage, decodeMessage } from "../src/lib/protobuf.ts";
import { changeDraftField, makeDraft, messageOf, readDraft } from "../src/features/workspace/model/draft.ts";
import { complex, defaultText, fieldHelp, INTEGER, LONG } from "../src/features/workspace/model/fields.ts";
import { EXAMPLE, SAMPLE } from "../src/features/workspace/model/example.ts";

const { root } = parseSchema(`syntax = "proto3";
message Fixture {
  enum State { UNKNOWN = 0; READY = 1; }
  message Child { int64 id = 1; double amount = 2; }
  string name = 1;
  bool active = 2;
  int32 count = 3;
  int64 id = 4;
  uint64 unsigned_id = 5;
  double amount = 6;
  bytes payload = 7;
  State state = 8;
  Child child = 9;
  repeated Child children = 10;
  map<string, Child> labels = 11;
  oneof choice { string text = 12; int32 number = 13; }
}`);
const type = getMessageType(root, "Fixture");
const valuesOf = (name, text) => readDraft(type, {
  ...makeDraft(type), [name]: { included: true, text },
});

test("initial sample preserves all values, including the 64-bit identifier", () => {
  const person = getMessageType(parseSchema(EXAMPLE).root, "example.Person");
  const draft = makeDraft(person, SAMPLE);
  assert.equal(draft.accountId.text, "9007199254740993");
  assert.equal(draft.address.text, '{\n  "city": "London",\n  "country": "UK"\n}');
  assert.deepEqual(readDraft(person, draft), SAMPLE);
  assert.deepEqual(decodeMessage(person, encodeMessage(person, readDraft(person, draft))), SAMPLE);
});

test("absent fields show defaults but stay omitted; explicit empty/false/zero remain included", () => {
  const draft = makeDraft(type);
  for (const field of type.fieldsArray) {
    assert.deepEqual(draft[field.name], { included: false, text: defaultText(field) });
  }
  assert.deepEqual(readDraft(type, draft), {});
  assert.deepEqual(makeDraft(type, { name: null }).name, draft.name);
  const present = { name: "", active: false, count: 0, id: "0", payload: "", children: [], labels: {} };
  const presentDraft = makeDraft(type, present);
  for (const name of Object.keys(present)) assert.equal(presentDraft[name].included, true);
  assert.deepEqual(readDraft(type, presentDraft), present);
  assert.deepEqual(readDraft(type, {}), {});
  assert.deepEqual(makeDraft(type, decodeMessage(type, "")), draft);
});

test("proto2 required fields are included and enum defaults use reflected names", () => {
  const required = getMessageType(parseSchema(`message Required {
    enum State { FIRST = 3; SECOND = 5; }
    required int32 id = 1 [default = 7];
    optional State state = 2 [default = SECOND];
    required string name = 3;
  }`).root, "Required");
  const draft = makeDraft(required);
  assert.deepEqual(draft.id, { included: true, text: "7" });
  assert.deepEqual(draft.name, { included: true, text: "" });
  assert.deepEqual(draft.state, { included: false, text: "SECOND" });
  assert.deepEqual(readDraft(required, draft), { id: 7, name: "" });
});

test("field metadata retains complex/default/help and integer classifications", () => {
  assert.equal(complex(type.fields.child), true);
  assert.equal(complex(type.fields.children), true);
  assert.equal(complex(type.fields.labels), true);
  assert.equal(complex(type.fields.name), false);
  for (const [name, text] of Object.entries({ name: "", active: "false", count: "0", id: "0", amount: "0", payload: "", state: "UNKNOWN", child: "{}", children: "[]", labels: "{}" })) {
    assert.equal(defaultText(type.fields[name]), text, name);
  }
  assert.equal(fieldHelp(type.fields.labels), "JSON object. Quote 64-bit integers; bytes use Base64.");
  assert.equal(fieldHelp(type.fields.children), "JSON array. Quote 64-bit integers; bytes use Base64.");
  assert.equal(fieldHelp(type.fields.child), "JSON object using field names. Quote 64-bit integers.");
  assert.equal(fieldHelp(type.fields.id), "64-bit integer. Kept as text to preserve every digit.");
  assert.equal(fieldHelp(type.fields.payload), "Standard Base64-encoded bytes.");
  assert.equal(fieldHelp(type.fields.amount), "Number. Decimals and scientific notation accepted.");
  assert.equal(fieldHelp(type.fields.name), "");
  for (const name of ["int64", "uint64", "sint64", "fixed64", "sfixed64"]) assert.equal(LONG.test(name), true);
  for (const name of ["int32", "uint32", "sint32", "fixed32", "sfixed32"]) assert.equal(INTEGER.test(name), true);
  assert.equal(LONG.test("int32"), false);
  assert.equal(INTEGER.test("int64"), false);
});

test("scalar parsing preserves long digits and defers reflected range/bytes/enum validation", () => {
  assert.deepEqual(valuesOf("id", "-9223372036854775808"), { id: "-9223372036854775808" });
  assert.deepEqual(valuesOf("unsignedId", "18446744073709551615"), { unsignedId: "18446744073709551615" });
  assert.deepEqual(valuesOf("count", "-2147483648"), { count: -2147483648 });
  assert.deepEqual(valuesOf("amount", "1e100"), { amount: 1e100 });
  assert.deepEqual(valuesOf("active", "false"), { active: false });
  assert.deepEqual(valuesOf("active", "true"), { active: true });
  assert.deepEqual(valuesOf("state", "READY"), { state: "READY" });
  for (const [name, text] of [["id", "9223372036854775808"], ["unsignedId", "-1"], ["count", "2147483648"], ["payload", "!"], ["state", "INVALID"]]) {
    assert.throws(() => encodeMessage(type, valuesOf(name, text)), /Cannot encode/);
  }
  for (const [name, texts, detail] of [
    ["id", [" 1", "1 ", "1.0", "1e3", "+1", ""], "Enter a whole number, with no spaces or decimals."],
    ["count", [" 1", "1.5", "9007199254740992", "1e3", ""], "Enter a whole number within the field's range."],
    ["amount", ["", " ", "Infinity", "NaN", "1e400"], "Enter a finite number."],
  ]) {
    for (const text of texts) assert.throws(() => valuesOf(name, text), (error) => {
      assert.equal(error.message, `${name}: ${detail}`);
      assert.ok(error.cause instanceof Error);
      return true;
    });
  }
});

test("complex fields validate JSON shape while core validates nested precision and values", () => {
  const child = { id: "9007199254740993", amount: 1e100 };
  assert.deepEqual(valuesOf("child", JSON.stringify(child)), { child });
  assert.deepEqual(valuesOf("children", JSON.stringify([child])), { children: [child] });
  assert.deepEqual(valuesOf("labels", JSON.stringify({ key: child })), { labels: { key: child } });
  assert.doesNotThrow(() => encodeMessage(type, valuesOf("child", JSON.stringify(child))));
  assert.throws(() => encodeMessage(type, valuesOf("child", '{"id":9007199254740992}')), /Cannot encode/);
  for (const name of ["child", "labels"]) {
    for (const text of ["[]", "null", "false", "1", '"text"']) {
      assert.throws(() => valuesOf(name, text), { message: `${name}: Enter a JSON object.` });
    }
  }
  for (const text of ["{}", "null", "1"]) assert.throws(() => valuesOf("children", text), { message: "children: Enter a JSON array." });
  assert.throws(() => valuesOf("child", "{"), (error) => error.message.startsWith("child: ") && error.cause instanceof SyntaxError);
});

test("oneof inclusion excludes siblings without losing their text or mutating previous drafts", () => {
  const previous = makeDraft(type, { text: "kept", name: "unrelated" });
  const next = changeDraftField(type, previous, "number", "0", true);
  assert.deepEqual(next.text, { included: false, text: "kept" });
  assert.deepEqual(next.number, { included: true, text: "0" });
  assert.equal(previous.text.included, true);
  assert.equal(next.name, previous.name);
  assert.deepEqual(readDraft(type, next), { name: "unrelated", number: 0 });
  const excluded = changeDraftField(type, previous, "number", "1", false);
  assert.equal(excluded.text.included, true);
  assert.deepEqual(changeDraftField(null, {}, "name", "free", true), { name: { text: "free", included: true } });
});

test("error messages preserve Error messages and stringify non-Error throws", () => {
  assert.equal(messageOf(new Error("detail")), "detail");
  assert.equal(messageOf("detail"), "detail");
  assert.equal(messageOf(null), "null");
});
