import { Enum, type Type } from "protobufjs";

import {
  complex,
  defaultText,
  fieldHelp,
  INTEGER,
  LONG,
} from "@/features/workspace/model/fields";
import type { Draft } from "@/features/workspace/model/types";

const control = "workspace-control";

export function MessageFields({
  type,
  draft,
  onChange,
  decode,
}: {
  type: Type;
  draft: Draft;
  onChange: (name: string, text: string, included: boolean) => void;
  decode: boolean;
}) {
  return (
    <div className="space-y-4">
      {type.fieldsArray.length === 0 && (
        <p className="text-sm text-muted-foreground">
          This message has no fields. It encodes to an empty payload.
        </p>
      )}
      {type.fieldsArray.map((field) => {
        const value = draft[field.name] ?? {
          included: field.required,
          text: defaultText(field),
        };
        const id = `field-${field.id}`;
        const enumType =
          field.resolvedType instanceof Enum ? field.resolvedType : null;
        const label = field.map
          ? `map<${"keyType" in field ? field.keyType : "string"}, ${field.type}>`
          : `${field.repeated ? "repeated " : ""}${field.type}`;
        const help = [
          fieldHelp(field),
          field.partOf ? `One of “${field.partOf.name}”.` : "",
        ]
          .filter(Boolean)
          .join(" ");
        const description = `${id}-type ${id}-presence${help ? ` ${id}-help` : ""}`;
        return (
          <div
            key={field.name}
            data-field={field.name}
            className="relative min-w-0"
          >
            <div className="mb-2 flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
              <div className="flex min-w-0 max-w-full items-center gap-2">
                {!decode && !field.required && (
                  <label className="-my-1 -ml-1 inline-flex min-h-7 min-w-6 shrink-0 cursor-pointer items-center justify-center">
                    <input
                      className="size-3.5 shrink-0 accent-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                      type="checkbox"
                      aria-label={`Include ${field.name}`}
                      checked={value.included}
                      onChange={(event) =>
                        onChange(field.name, value.text, event.target.checked)
                      }
                    />
                  </label>
                )}
                <label
                  htmlFor={id}
                  className="font-mono text-[13px] font-semibold [overflow-wrap:anywhere]"
                >
                  {field.name}
                </label>
              </div>
              <div className="flex max-w-full flex-wrap items-center gap-1.5">
                <span
                  id={`${id}-type`}
                  className="max-w-full truncate rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
                  title={label}
                >
                  {label}
                </span>
                {field.required && (
                  <span className="text-[10px] font-medium text-primary">
                    Required
                  </span>
                )}
                <span
                  id={`${id}-presence`}
                  className={
                    decode || !value.included
                      ? "rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground"
                      : "sr-only"
                  }
                >
                  {decode ? (
                    value.included ? (
                      "Present"
                    ) : (
                      <>
                        Default
                        <span className="sr-only">
                          {" "}
                          — absent; uses protobuf default
                        </span>
                      </>
                    )
                  ) : value.included ? (
                    "Included"
                  ) : (
                    "Omitted"
                  )}
                </span>
              </div>
            </div>
            {complex(field) ? (
              <textarea
                id={id}
                className={`${control} min-h-24 resize-y font-mono text-xs leading-6`}
                rows={field.repeated ? 3 : 4}
                value={value.text}
                spellCheck={false}
                readOnly={decode}
                aria-describedby={description}
                onChange={(event) =>
                  onChange(field.name, event.target.value, true)
                }
              />
            ) : field.type === "bool" || enumType ? (
              <select
                id={id}
                className={control}
                value={value.text}
                disabled={decode}
                aria-describedby={description}
                onChange={(event) =>
                  onChange(field.name, event.target.value, true)
                }
              >
                {enumType ? (
                  Object.keys(enumType.values).map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="false">false</option>
                    <option value="true">true</option>
                  </>
                )}
              </select>
            ) : (
              <input
                id={id}
                className={`${control} ${field.type !== "string" ? "font-mono" : ""}`}
                type={
                  field.type === "float" || field.type === "double"
                    ? "number"
                    : "text"
                }
                step="any"
                inputMode={
                  LONG.test(field.type) || INTEGER.test(field.type)
                    ? "numeric"
                    : undefined
                }
                value={value.text}
                readOnly={decode}
                spellCheck={false}
                aria-describedby={description}
                onChange={(event) =>
                  onChange(field.name, event.target.value, true)
                }
              />
            )}
            {help && (
              <p
                id={`${id}-help`}
                className="mt-1.5 text-[11px] leading-5 text-muted-foreground"
              >
                {help}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
