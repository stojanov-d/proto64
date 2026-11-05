import { ArrowRight, CircleAlert, ListTree } from "lucide-react";
import type { Type } from "protobufjs";

import type { Draft, Mode } from "@/features/workspace/model/types";
import { MessageFields } from "./message-fields";

const control = "workspace-control";

interface InputsPanelProps {
  mode: Mode;
  selected: string;
  type: Type | null;
  messageTypes: string[];
  schemaError: string;
  draft: Draft;
  base64: string;
  result: string | null;
  error: string;
  changeType: (name: string) => void;
  changeField: (name: string, text: string, included: boolean) => void;
  changeBase64: (source: string) => void;
  convert: () => void;
}

export function InputsPanel({
  mode,
  selected,
  type,
  messageTypes,
  schemaError,
  draft,
  base64,
  result,
  error,
  changeType,
  changeField,
  changeBase64,
  convert,
}: InputsPanelProps) {
  return (
    <section className="workspace-panel" aria-labelledby="inputs-heading">
      <div className="panel-heading">
        <div className="flex items-center gap-2.5">
          <span className="step-number">02</span>
          <h2 id="inputs-heading">
            {mode === "encode" ? "Message inputs" : "Decode inputs"}
          </h2>
        </div>
        <ListTree className="size-4 text-muted-foreground" aria-hidden="true" />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4 xl:p-5">
        <label
          htmlFor="message-type"
          className="mb-2 block text-xs font-medium"
        >
          Message type
        </label>
        <select
          id="message-type"
          className={`${control} font-mono text-xs`}
          value={type ? selected : ""}
          disabled={!messageTypes.length}
          onChange={(event) => changeType(event.target.value)}
        >
          {!messageTypes.length && (
            <option value="">No message types available</option>
          )}
          {messageTypes.map((name) => (
            <option key={name} value={name}>
              {name.replace(/^\./, "")}
            </option>
          ))}
        </select>
        {mode === "decode" && (
          <div className="mt-5 rounded-lg border border-primary/25 bg-accent/35 p-3">
            <label
              htmlFor="base64-source"
              className="mb-2 block text-xs font-semibold"
            >
              Base64 source
            </label>
            <textarea
              id="base64-source"
              className={`${control} min-h-28 resize-y break-all font-mono text-xs leading-6`}
              value={base64}
              onChange={(event) => changeBase64(event.target.value)}
              placeholder="Paste a Base64 protobuf payload…"
              spellCheck={false}
              autoCapitalize="off"
              aria-describedby="base64-help"
            />
            <p
              id="base64-help"
              className="mt-2 text-[11px] leading-5 text-muted-foreground"
            >
              Standard Base64, including an empty payload. Decode to inspect its
              fields below.
            </p>
          </div>
        )}
        <div className="mt-4 mb-3 flex items-center justify-between gap-2 border-t pt-3">
          <h3 className="text-[11px] font-medium tracking-wide text-muted-foreground">
            {mode === "encode" ? "FIELD VALUES" : "DECODED FIELDS"}
          </h3>
          <span className="font-mono text-[10px] text-muted-foreground">
            {type?.fieldsArray.length ?? 0} fields
          </span>
        </div>
        {mode === "encode" && type && (
          <p className="mb-4 text-[11px] leading-5 text-muted-foreground">
            Unchecked fields are omitted. Edit a value to include it; zero,
            false, and empty values are accepted.
          </p>
        )}
        {mode === "decode" && (
          <p className="mb-4 text-[11px] leading-5 text-muted-foreground">
            Read-only fields. Default means absent; uses the protobuf default.
          </p>
        )}
        {type ? (
          mode === "decode" && result === null ? (
            <div className="rounded-lg border border-dashed p-5 text-xs leading-6 text-muted-foreground">
              Decode the source to inspect its field values here.
            </div>
          ) : (
            <MessageFields
              type={type}
              draft={draft}
              onChange={changeField}
              decode={mode === "decode"}
            />
          )
        ) : (
          <div className="rounded-lg border border-dashed p-5 text-xs leading-6 text-muted-foreground">
            {schemaError
              ? "Fix the schema to generate message inputs."
              : "Add a message to your schema to get started."}
          </div>
        )}
      </div>
      <div className="border-t bg-muted/20 p-4">
        {error && (
          <p
            role="alert"
            className="mb-3 flex items-start gap-2 break-words rounded-lg border border-destructive/25 bg-destructive/5 p-3 text-xs leading-5 text-destructive"
          >
            <CircleAlert
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />
            <span>{error}</span>
          </p>
        )}
        <button
          type="button"
          onClick={convert}
          disabled={!type}
          className="workspace-button min-h-11 w-full justify-between rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <span>
            {mode === "encode" ? "Encode to Base64" : "Decode message"}
          </span>
          <ArrowRight className="size-4" aria-hidden="true" />
        </button>
        <p className="mt-2 text-center text-[10px] leading-5 text-muted-foreground">
          {mode === "encode"
            ? "Field values → protobuf bytes → Base64"
            : "Base64 → protobuf bytes → JSON"}
        </p>
      </div>
    </section>
  );
}
