import { Enum, Type, type Field } from "protobufjs";

export const LONG = /^(u?int64|sint64|s?fixed64)$/;
export const INTEGER = /^(u?int32|sint32|s?fixed32)$/;
export const complex = (field: Field) =>
  field.map || field.repeated || field.resolvedType instanceof Type;

export function defaultText(field: Field): string {
  if (field.map) return "{}";
  if (field.repeated) return "[]";
  if (field.resolvedType instanceof Type) return "{}";
  if (field.resolvedType instanceof Enum)
    return field.resolvedType.valuesById[Number(field.defaultValue)] ?? "";
  if (field.type === "bytes") return "";
  return String(field.defaultValue ?? "");
}

export function fieldHelp(field: Field) {
  if (field.map) return "JSON object. Quote 64-bit integers; bytes use Base64.";
  if (field.repeated)
    return "JSON array. Quote 64-bit integers; bytes use Base64.";
  if (field.resolvedType instanceof Type)
    return "JSON object using field names. Quote 64-bit integers.";
  if (LONG.test(field.type))
    return "64-bit integer. Kept as text to preserve every digit.";
  if (field.type === "bytes") return "Standard Base64-encoded bytes.";
  if (field.type === "float" || field.type === "double")
    return "Number. Decimals and scientific notation accepted.";
  return "";
}
