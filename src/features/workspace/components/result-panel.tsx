import { Check, CheckCheck, Code2, Copy, Terminal } from "lucide-react";

import type { Mode } from "@/features/workspace/model/types";

interface ResultPanelProps {
  mode: Mode;
  result: string | null;
  error: string;
  schemaError: string;
  copyStatus: string;
  resultChanged: boolean;
  copyResult: () => Promise<void>;
}

export function ResultPanel({
  mode,
  result,
  error,
  schemaError,
  copyStatus,
  resultChanged,
  copyResult,
}: ResultPanelProps) {
  let emptyTitle: string;
  let emptyDescription: string;
  if (error || schemaError) {
    emptyTitle = "Check your inputs";
    emptyDescription =
      "Resolve the error, then try again. Nothing has been converted.";
  } else if (resultChanged) {
    emptyTitle = "Inputs changed—convert again";
    emptyDescription =
      "The previous result was cleared. Convert the current inputs to get a new result.";
  } else if (mode === "encode") {
    emptyTitle = "Your payload starts here";
    emptyDescription =
      "Choose a message, set its fields, and encode to get a Base64 payload.";
  } else {
    emptyTitle = "Make the bytes readable";
    emptyDescription =
      "Paste your Base64 source and decode it using the selected message type.";
  }

  let footerMessage: string;
  if (copyStatus) {
    footerMessage = copyStatus;
  } else if (result !== null) {
    footerMessage = `${result.length.toLocaleString()} characters · ${mode === "encode" ? "Standard Base64" : "Absent fields omitted · 64-bit integers are strings"}`;
  } else if (error || schemaError) {
    footerMessage = "Fix the error to continue.";
  } else if (resultChanged) {
    footerMessage = "Previous result cleared.";
  } else {
    footerMessage = "Ready when you are. Results clear when inputs change.";
  }

  return (
    <section
      className="workspace-panel result-panel"
      aria-labelledby="result-heading"
    >
      <div className="panel-heading">
        <div className="flex items-center gap-2.5">
          <span className="step-number">03</span>
          <h2 id="result-heading">
            {mode === "encode" ? "Base64 result" : "Decoded message"}
          </h2>
        </div>
        <Terminal className="size-4 text-muted-foreground" aria-hidden="true" />
      </div>
      <div className="flex min-h-11 flex-wrap items-center justify-between gap-2 border-b bg-muted/35 px-4 py-2">
        <span className="font-mono text-[10px] tracking-wider text-muted-foreground">
          {mode === "encode" ? "BASE64" : "FORMATTED JSON"}
        </span>
        <button
          type="button"
          onClick={copyResult}
          disabled={result === null}
          className="workspace-button gap-1.5 rounded-md px-2 py-1 text-[11px] text-muted-foreground hover:bg-accent hover:text-primary disabled:opacity-40"
        >
          {copyStatus === "Copied to clipboard" ? (
            <CheckCheck className="size-3.5" aria-hidden="true" />
          ) : (
            <Copy className="size-3.5" aria-hidden="true" />
          )}
          {copyStatus === "Copied to clipboard" ? "Copied" : "Copy result"}
        </button>
      </div>
      {result !== null ? (
        <div className="flex min-h-0 flex-1 flex-col p-4 xl:p-5">
          <p
            className="mb-4 flex items-center gap-2 text-[11px] text-primary"
            role="status"
          >
            <Check className="size-3.5" aria-hidden="true" />
            {mode === "encode" ? "Message encoded" : "Message decoded"}
          </p>
          {result === "" && (
            <p className="mb-3 rounded-md border bg-muted/50 p-3 text-xs leading-5 text-muted-foreground">
              Empty message encoded successfully. Its Base64 representation is
              an empty string.
            </p>
          )}
          <textarea
            aria-label={
              mode === "encode"
                ? "Encoded Base64 result"
                : "Decoded message as formatted JSON"
            }
            className="min-h-60 w-full flex-1 resize-none bg-transparent font-mono text-xs leading-7 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            readOnly
            spellCheck={false}
            value={result}
          />
        </div>
      ) : (
        <div className="result-empty flex min-h-80 flex-1 flex-col items-center justify-center p-7 text-center">
          <span className="mb-5 flex size-14 items-center justify-center rounded-2xl border border-primary/15 bg-card text-primary shadow-sm">
            <Code2 className="size-6" strokeWidth={1.5} aria-hidden="true" />
          </span>
          <h3 className="text-sm font-medium">{emptyTitle}</h3>
          <p className="mt-2 max-w-56 text-xs leading-6 text-muted-foreground">
            {emptyDescription}
          </p>
          <span className="mt-6 rounded-full border bg-card/70 px-3 py-1.5 font-mono text-[10px] text-muted-foreground">
            {mode === "encode" ? "message → Base64" : "Base64 → JSON"}
          </span>
        </div>
      )}
      <div className="border-t px-4 py-3 text-[10px] leading-5 text-muted-foreground">
        <p aria-live="polite">{footerMessage}</p>
      </div>
    </section>
  );
}
