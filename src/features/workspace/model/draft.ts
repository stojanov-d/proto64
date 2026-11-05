import type { Type } from "protobufjs";

import { complex, defaultText, INTEGER, LONG } from "./fields.ts";
import type { Draft } from "./types.ts";

export const messageOf = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

export function makeDraft(type: Type, values?: Record<string, unknown>): Draft {
  return Object.fromEntries(
    type.fieldsArray.map((field) => {
      const value = values?.[field.name];
      const hasValue = value !== undefined && value !== null;
      let text: string;
      if (!hasValue) {
        text = defaultText(field);
      } else if (complex(field)) {
        text = JSON.stringify(value, null, 2);
      } else {
        text = String(value);
      }
      return [
        field.name,
        {
          included: hasValue || field.required,
          text,
        },
      ];
    }),
  );
}

export function readDraft(type: Type, draft: Draft): Record<string, unknown> {
  return Object.fromEntries(
    type.fieldsArray
      .filter((field) => draft[field.name]?.included)
      .map((field) => {
        const text = draft[field.name].text;
        let value: unknown = text;
        try {
          if (complex(field)) {
            value = JSON.parse(text);
            if (
              field.repeated
                ? !Array.isArray(value)
                : !value || typeof value !== "object" || Array.isArray(value)
            ) {
              throw new Error(
                field.repeated ? "Enter a JSON array." : "Enter a JSON object.",
              );
            }
            // The conversion utility validates numbers against each reflected
            // field, rejecting unsafe integers without rejecting large doubles.
          } else if (field.type === "bool") value = text === "true";
          else if (LONG.test(field.type)) {
            if (!/^-?\d+$/.test(text))
              throw new Error(
                "Enter a whole number, with no spaces or decimals.",
              );
            value = text;
          } else if (INTEGER.test(field.type)) {
            if (!/^-?\d+$/.test(text) || !Number.isSafeInteger(Number(text)))
              throw new Error("Enter a whole number within the field's range.");
            value = Number(text);
          } else if (field.type === "float" || field.type === "double") {
            if (!text.trim() || !Number.isFinite(Number(text)))
              throw new Error("Enter a finite number.");
            value = Number(text);
          }
        } catch (error) {
          throw new Error(`${field.name}: ${messageOf(error)}`, {
            cause: error,
          });
        }
        return [field.name, value];
      }),
  );
}

export function changeDraftField(
  type: Type | null,
  previous: Draft,
  name: string,
  text: string,
  included: boolean,
): Draft {
  const next = { ...previous, [name]: { text, included } };
  const oneof = type?.fields[name]?.partOf;
  if (included && oneof)
    oneof.oneof
      .filter((sibling) => sibling !== name)
      .forEach((sibling) => {
        next[sibling] = { ...next[sibling], included: false };
      });
  return next;
}
