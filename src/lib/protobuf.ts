import protobuf from "protobufjs";

const MAX_DEPTH = 100;
const own = (object: object, key: string) => Object.hasOwn(object, key);
const detail = (error: unknown) => error instanceof Error ? error.message : String(error);

/** Parse a standalone schema. Field names use protobufjs's default camel casing. */
export function parseSchema(source: string): { root: protobuf.Root; messageTypes: string[] } {
  try {
    const parsed = protobuf.parse(source);
    if (parsed.imports?.length || parsed.weakImports?.length) {
      throw new Error("Imports are not supported; include all definitions in one schema");
    }
    const root = parsed.root;
    root.resolveAll();
    const messageTypes: string[] = [];
    const visit = (namespace: protobuf.NamespaceBase) => {
      for (const child of namespace.nestedArray) {
        if (child instanceof protobuf.Type) {
          for (const field of child.fieldsArray) {
            if (field.id < 1 || field.id > 536870911 || (field.id >= 19000 && field.id <= 19999)) {
              throw new Error(`${field.fullName}: invalid field number ${field.id}`);
            }
          }
          messageTypes.push(child.fullName.replace(/^\./, ""));
        }
        if (child instanceof protobuf.Namespace) visit(child);
      }
    };
    visit(root);
    if (!messageTypes.length) throw new Error("Schema contains no message types");
    return { root, messageTypes };
  } catch (error) {
    throw new Error(`Invalid protobuf schema: ${detail(error)}`, { cause: error });
  }
}

export function getMessageType(root: protobuf.Root, name: string): protobuf.Type {
  try {
    if (!name.trim()) throw new Error("a message name is required");
    const type = root.lookupType(name);
    type.resolveAll();
    return type;
  } catch (error) {
    throw new Error(`Unknown protobuf message type "${name}": ${detail(error)}`, { cause: error });
  }
}

function base64Bytes(input: string): Uint8Array {
  if (typeof input !== "string") throw new Error("Base64 must be a string");
  const text = input.replace(/\s/g, "").replace(/-/g, "+").replace(/_/g, "/");
  const body = text.replace(/=+$/, "");
  const padding = text.length - body.length;
  if (!/^[A-Za-z0-9+/]*$/.test(body) || body.length % 4 === 1 ||
      padding > 2 || (padding > 0 && (text.length % 4 !== 0 || padding !== (4 - body.length % 4) % 4))) {
    throw new Error("Invalid Base64 alphabet, length, or padding");
  }
  const bytes = new Uint8Array(Math.floor(body.length * 6 / 8));
  protobuf.util.base64.decode(body, bytes, 0);
  // Reject nonzero unused bits, rather than silently accepting corrupted text.
  if (protobuf.util.base64.encode(bytes, 0, bytes.length).replace(/=+$/, "") !== body) {
    throw new Error("Invalid Base64 trailing bits");
  }
  return bytes;
}

function record(value: unknown, path: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" ||
      (Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null)) {
    throw new Error(`${path}: plain object expected`);
  }
  return value as Record<string, unknown>;
}

function integer(value: unknown, type: string, path: string, mapKey = false): string | number {
  const long = type.endsWith("64");
  if (typeof value === "string" && (long || mapKey) && /^-?(0|[1-9]\d*)$/.test(value)) {
    // Range checking with BigInt avoids protobufjs's wrapping/truncating conversions.
  } else if (typeof value !== "number" || !Number.isSafeInteger(value)) {
    throw new Error(`${path}: ${long ? "safe integer or decimal integer string" : "integer"} expected`);
  }
  const number = BigInt(value as string | number);
  const unsigned = type.startsWith("u") || type.startsWith("fixed");
  const bits = long ? 64n : 32n;
  const min = unsigned ? 0n : -(1n << (bits - 1n));
  const max = (1n << (unsigned ? bits : bits - 1n)) - 1n;
  if (number < min || number > max) throw new Error(`${path}: ${type} out of range`);
  return long ? number.toString() : Number(number);
}

function scalar(field: protobuf.Field, value: unknown, path: string, depth: number): unknown {
  if (field.resolvedType instanceof protobuf.Type) {
    return normalize(field.resolvedType, value, path, depth + 1);
  }
  if (field.resolvedType instanceof protobuf.Enum) {
    const values = field.resolvedType.values;
    if (typeof value === "string" && own(values, value)) return values[value];
    if (typeof value === "number" && Object.values(values).includes(value)) return value;
    throw new Error(`${path}: declared enum name or number expected`);
  }
  switch (field.type) {
    case "string":
      if (typeof value === "string") return value;
      break;
    case "bool":
      if (typeof value === "boolean") return value;
      break;
    case "float":
    case "double":
      if (typeof value === "number" && Number.isFinite(value) &&
          (field.type !== "float" || Number.isFinite(Math.fround(value)))) return value;
      break;
    case "bytes":
      if (typeof value === "string") return base64Bytes(value);
      if (value instanceof Uint8Array) return value;
      if (Array.isArray(value) && Array.from(value).every(byte =>
        typeof byte === "number" && Number.isInteger(byte) && byte >= 0 && byte <= 255)) {
        return Uint8Array.from(value);
      }
      break;
    default:
      return integer(value, field.type, path);
  }
  throw new Error(`${path}: invalid ${field.type} value`);
}

// Validate before fromObject: that API intentionally coerces strings, booleans,
// integers, enums, and bytes, which would otherwise conceal JSON input mistakes.
function normalize(type: protobuf.Type, input: unknown, path: string, depth = 0): Record<string, unknown> {
  if (depth > MAX_DEPTH) throw new Error(`${path}: maximum message depth exceeded`);
  const values = record(input, path);
  const result: Record<string, unknown> = Object.create(null);
  const oneofs = new Set<string>();
  for (const key of Object.keys(values)) {
    if (!own(type.fields, key)) throw new Error(`${path}.${key}: unknown field`);
  }
  for (const field of type.fieldsArray) {
    if (!own(values, field.name)) {
      if (field.required) throw new Error(`${path}.${field.name}: required field missing`);
      continue;
    }
    const value = values[field.name];
    const location = `${path}.${field.name}`;
    if (field.partOf) {
      if (oneofs.has(field.partOf.name)) throw new Error(`${location}: multiple values for oneof ${field.partOf.name}`);
      oneofs.add(field.partOf.name);
    }
    if (field instanceof protobuf.MapField) {
      const entries = record(value, location);
      const map: Record<string, unknown> = Object.create(null);
      const keyType = field.keyType;
      for (const [key, entry] of Object.entries(entries)) {
        if (keyType === "bool") {
          if (key !== "true" && key !== "false") throw new Error(`${location}: boolean map key expected`);
        } else if (keyType !== "string") integer(key, keyType, `${location} map key`, true);
        map[key] = scalar(field, entry, `${location}[${JSON.stringify(key)}]`, depth);
      }
      result[field.name] = map;
    } else if (field.repeated) {
      if (!Array.isArray(value)) throw new Error(`${location}: array expected`);
      result[field.name] = Array.from(value, (entry, index) => scalar(field, entry, `${location}[${index}]`, depth));
    } else {
      result[field.name] = scalar(field, value, location, depth);
    }
  }
  return result;
}

export function encodeMessage(type: protobuf.Type, values: Record<string, unknown>): string {
  try {
    type.resolveAll();
    const message = type.fromObject(normalize(type, values, type.fullName));
    const error = type.verify(message);
    if (error) throw new Error(error);
    const bytes = type.encode(message).finish();
    return protobuf.util.base64.encode(bytes, 0, bytes.length);
  } catch (error) {
    throw new Error(`Cannot encode ${type.fullName}: ${detail(error)}`, { cause: error });
  }
}

type WireField = {
  type: string;
  resolvedType?: protobuf.Type | protobuf.Enum | null;
  repeated?: boolean;
  map?: boolean;
  delimited?: boolean;
  keyType?: string;
};

function wireType(field: WireField): number {
  if (field.map) return 2;
  if (field.resolvedType instanceof protobuf.Type) return field.delimited ? 3 : 2;
  if (field.resolvedType instanceof protobuf.Enum) return 0;
  if (field.type === "string" || field.type === "bytes") return 2;
  if (["double", "fixed64", "sfixed64"].includes(field.type)) return 1;
  if (["float", "fixed32", "sfixed32"].includes(field.type)) return 5;
  return 0;
}

// A small structural preflight closes permissive reader paths (e.g. oversized
// unknown varints and mismatched known wire types). protobufjs does the decoding.
function validateWire(bytes: Uint8Array, type: protobuf.Type): void {
  let pos = 0;
  const varint = (end: number): bigint => {
    let value = 0n;
    for (let i = 0; i < 10 && pos < end; i++) {
      const byte = bytes[pos++];
      if (i === 9 && byte > 1) throw new Error("invalid 64-bit varint");
      value |= BigInt(byte & 127) << BigInt(i * 7);
      if (byte < 128) return value;
    }
    throw new Error("truncated or oversized varint");
  };
  const skip = (size: number, end: number) => {
    pos += size;
    if (pos > end) throw new Error("truncated field");
  };
  const scan = (end: number, fields?: Record<number, WireField>, depth = 0, group?: number) => {
    if (depth > MAX_DEPTH) throw new Error("maximum wire depth exceeded");
    while (pos < end) {
      const tag = varint(end);
      if (tag > 0xffffffffn || tag < 8n) throw new Error("invalid field tag");
      const id = Number(tag >> 3n);
      const wire = Number(tag & 7n);
      if (wire === 4) {
        if (id === group) return;
        throw new Error("unexpected end group");
      }
      const field = fields?.[id];
      const expected = field && wireType(field);
      const packed = field?.repeated && wire === 2 && (expected === 0 || expected === 1 || expected === 5);
      if (field && wire !== expected && !packed) throw new Error(`field ${id}: wrong wire type ${wire}`);
      if (wire === 0) varint(end);
      else if (wire === 1) skip(8, end);
      else if (wire === 5) skip(4, end);
      else if (wire === 3) {
        scan(end, field?.resolvedType instanceof protobuf.Type ? field.resolvedType.fieldsById : undefined, depth + 1, id);
      } else if (wire === 2) {
        const length = varint(end);
        if (length > BigInt(end - pos)) throw new Error("truncated length-delimited field");
        const limit = pos + Number(length);
        if (packed) {
          while (pos < limit) {
            if (expected === 0) varint(limit);
            else skip(expected === 1 ? 8 : 4, limit);
          }
        } else if (field?.map) {
          scan(limit, {
            1: { type: field.keyType! },
            2: { type: field.type, resolvedType: field.resolvedType },
          }, depth + 1);
        } else if (field?.resolvedType instanceof protobuf.Type) {
          scan(limit, field.resolvedType.fieldsById, depth + 1);
        } else pos = limit;
      } else throw new Error(`invalid wire type ${wire}`);
    }
    if (group !== undefined) throw new Error("missing end group");
  };
  scan(bytes.length, type.fieldsById);
}

export function decodeMessage(type: protobuf.Type, base64: string): Record<string, unknown> {
  try {
    type.resolveAll();
    const bytes = base64Bytes(base64);
    validateWire(bytes, type);
    const message = type.decode(bytes);
    return type.toObject(message, { longs: String, bytes: String, enums: String, json: true });
  } catch (error) {
    throw new Error(`Cannot decode ${type.fullName}: ${detail(error)}`, { cause: error });
  }
}
