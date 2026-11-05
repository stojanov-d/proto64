import assert from "node:assert/strict";
import { test } from "node:test";
import { parseSchema, getMessageType, encodeMessage, decodeMessage } from "../src/lib/protobuf.ts";

const schema = `
syntax = "proto3";
package demo;
message Fixture { int32 id = 1; string name = 2; }
message Envelope {
  message Child { string label = 1; }
  enum State { UNKNOWN = 0; READY = 1; }
  Child child = 1;
  repeated sint32 scores = 2;
  State state = 3;
  bytes payload = 4;
  int64 signed_id = 5;
  uint64 unsigned_id = 6;
  repeated Child children = 7;
  map<string, Child> labels = 8;
  bool active = 9;
  uint32 count = 10;
  float ratio = 11;
  oneof choice { string text = 12; int32 number = 13; }
  map<bool, int32> flags = 14;
  map<int64, string> ids = 15;
}
`;
const { root, messageTypes } = parseSchema(schema);
const fixture = getMessageType(root, "demo.Fixture");
const envelope = getMessageType(root, "demo.Envelope");
const wire = (...bytes) => Buffer.from(bytes).toString("base64");

test("fully qualified names, nested reflection, and message lookup", () => {
  assert.deepEqual(messageTypes, ["demo.Fixture", "demo.Envelope", "demo.Envelope.Child"]);
  assert.equal(getMessageType(root, ".demo.Envelope.Child").fields.label.type, "string");
  assert.equal(envelope.fields.signedId.type, "int64");
  assert.throws(() => getMessageType(root, "demo.Envelope.State"), /Unknown protobuf message/);
  assert.throws(() => getMessageType(root, "Missing"), /Unknown protobuf message/);
  assert.throws(() => getMessageType(root, ""), /message name/);
});

test("known wire fixture: id=150, name=foo", () => {
  // 08 96 01 12 03 66 6f 6f
  const known = "CJYBEgNmb28=";
  const values = { id: 150, name: "foo" };
  assert.equal(encodeMessage(fixture, values), known);
  assert.deepEqual(decodeMessage(fixture, known), values);
  assert.deepEqual(decodeMessage(fixture, " CJYB\nEgNmb28=\t"), values);
  assert.deepEqual(decodeMessage(fixture, known.replace(/=+$/, "")), values);
  assert.deepEqual(decodeMessage(fixture, ""), {});
  assert.equal(encodeMessage(fixture, {}), "");
});

test("nested/repeated/enum/bytes/64-bit/map/oneof round trip is JSON compatible", () => {
  const values = {
    child: { label: "nested" }, scores: [-1, 0, 150], state: "READY",
    payload: "+/8=", signedId: "-9223372036854775808", unsignedId: "18446744073709551615",
    children: [{ label: "a" }, { label: "b" }], labels: { greeting: { label: "hello" } },
    active: true, count: 4294967295, ratio: 1.5, number: 5,
    flags: { true: 1, false: 2 }, ids: { "9223372036854775807": "max" },
  };
  const encoded = encodeMessage(envelope, values);
  const decoded = decodeMessage(envelope, encoded);
  assert.deepEqual(decoded, values);
  assert.deepEqual(JSON.parse(JSON.stringify(decoded)), values);
  assert.equal(encodeMessage(envelope, decoded), encoded);
  assert.equal(decodeMessage(envelope, encodeMessage(envelope, { payload: "-_8" })).payload, "+/8=");
  assert.equal(decodeMessage(envelope, encodeMessage(envelope, { payload: [251, 255] })).payload, "+/8=");
  assert.equal(decodeMessage(envelope, encodeMessage(envelope, { payload: new Uint8Array([251, 255]) })).payload, "+/8=");
  assert.equal(decodeMessage(envelope, encodeMessage(envelope, { state: 1 })).state, "READY");
  assert.equal(decodeMessage(envelope, encodeMessage(envelope, { signedId: 42 })).signedId, "42");
  assert.deepEqual(decodeMessage(envelope, "IgL7_w"), { payload: "+/8=" });
});

test("invalid schemas and unresolved references fail clearly", () => {
  for (const source of ["", "syntax = 'proto3';", "message Broken {", "message A { Missing x = 1; }",
    "message A { optional int32 x = 0; }", "message A { optional int32 x = 19000; }",
    "message A { optional int32 x = 536870912; }", "enum Only { ZERO = 0; }",
    "import 'missing.proto'; message A {}", "message A { optional int32 x = 1; optional string y = 1; }"]) {
    assert.throws(() => parseSchema(source), /Invalid protobuf schema/, source);
  }
});

test("malformed Base64 is rejected rather than partially decoded", () => {
  for (const input of ["!", "A", "A===", "AA=", "AA===", "=AAA", "AA=A", "AB==", "AAB=", "====", "CJYBEgNmb28=garbage"]) {
    assert.throws(() => decodeMessage(fixture, input), /Base64/, input);
  }
});

test("malformed wire tags, lengths, varints, packed fields, and nested messages fail", () => {
  for (const input of [wire(0), wire(8, 128), wire(18, 3, 102), wire(15), wire(12),
    wire(9, 0, 0, 0, 0, 0, 0, 0, 0), wire(0x80, 0x80, 0x80, 0x80, 0x10),
    wire(0x98, 6, ...Array(10).fill(0x80), 0)]) {
    assert.throws(() => decodeMessage(fixture, input), /Cannot decode/, input);
  }
  for (const input of [wire(10, 1, 0), wire(18, 1, 128), wire(66, 2, 18, 1)]) {
    assert.throws(() => decodeMessage(envelope, input), /Cannot decode/, input);
  }
  // Valid unknown fields remain forward compatible.
  assert.deepEqual(decodeMessage(fixture, wire(0x98, 6, 1)), {});
});

test("invalid values are never coerced, truncated, wrapped, or silently discarded", () => {
  const bad = [
    { active: "false" }, { active: 0 }, { count: -1 }, { count: 4294967296 }, { count: 1.5 }, { count: "2" },
    { signedId: "9223372036854775808" }, { signedId: "-9223372036854775809" },
    { signedId: Number.MAX_SAFE_INTEGER + 1 }, { signedId: "1e3" }, { signedId: "12oops" },
    { unsignedId: "-1" }, { unsignedId: "18446744073709551616" }, { signedId: { low: 1, high: 0 } },
    { state: "NOPE" }, { state: 3 }, { payload: "!" }, { payload: [256] }, { payload: [-1] },
    { payload: [1.5] }, { payload: new Array(1) }, { child: [] }, { child: { label: 1 } },
    { child: { typo: 1 } }, { scores: "1" }, { scores: ["1"] }, { scores: [null] },
    { scores: [2147483648] }, { count: null }, { typo: true }, { signed_id: "1" },
    { ratio: "1.5" }, { ratio: Infinity }, { ratio: NaN }, { ratio: 1e39 },
    { text: "", number: 0 }, { labels: [] }, { labels: { key: null } },
    { flags: { nope: 1 } }, { ids: { "18446744073709551616": "too big" } },
  ];
  for (const input of bad) assert.throws(() => encodeMessage(envelope, input), /Cannot encode/, JSON.stringify(input));
  assert.throws(() => encodeMessage(envelope, null), /plain object/);
  assert.throws(() => encodeMessage(fixture, { id: -2147483649 }), /out of range/);
});

test("proto2 required fields and groups, and recursion bounds", () => {
  const proto2 = parseSchema(`message Required {
    required int32 id = 1;
    optional group Child = 2 { required string name = 3; }
  }`);
  const required = getMessageType(proto2.root, "Required");
  assert.throws(() => encodeMessage(required, {}), /required field missing/);
  assert.throws(() => decodeMessage(required, ""), /missing required/);
  const values = { id: 1, child: { name: "group" } };
  assert.deepEqual(decodeMessage(required, encodeMessage(required, values)), values);
  assert.throws(() => decodeMessage(required, wire(8, 1, 19, 28)), /end group/);
  const recursive = parseSchema("message Recursive { optional Recursive child = 1; }");
  const type = getMessageType(recursive.root, "Recursive");
  const cycle = {}; cycle.child = cycle;
  assert.throws(() => encodeMessage(type, cycle), /depth/);
});
