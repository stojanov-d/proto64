import {
  ArrowRight,
  Code2,
  GripVertical,
  LockKeyhole,
  RotateCcw,
} from "lucide-react";

import type { Mode } from "@/features/workspace/model/types";

interface WorkspaceToolbarProps {
  mode: Mode;
  changeMode: (mode: Mode) => void;
  loadExample: () => void;
}

export function WorkspaceToolbar({
  mode,
  changeMode,
  loadExample,
}: WorkspaceToolbarProps) {
  return (
    <>
      <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <div className="mb-1 flex items-center gap-2 text-[10px] font-semibold tracking-[0.16em] text-primary">
            <span className="size-1.5 rounded-full bg-primary" />
            PROTOBUF WORKSPACE
          </div>
          <h1 className="text-[26px] font-semibold tracking-tight sm:text-[30px]">
            Protobuf encoder & decoder
          </h1>
          <p className="mt-1 text-xs leading-6 text-muted-foreground sm:text-[13px]">
            Define a schema. Work with real values. Convert in either direction.
          </p>
        </div>
        <button
          type="button"
          className="workspace-button w-fit gap-2 rounded-lg border bg-card px-3.5 py-2.5 text-xs font-medium hover:border-primary/35 hover:bg-accent"
          onClick={loadExample}
        >
          <RotateCcw className="size-3.5 text-primary" aria-hidden="true" />
          Reset to example
        </button>
      </div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div
          className="flex rounded-xl border bg-muted p-1"
          role="group"
          aria-label="Conversion mode"
        >
          {(["encode", "decode"] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={mode === option}
              onClick={() => changeMode(option)}
              className={`workspace-button min-h-9 gap-2 rounded-lg px-5 text-xs font-medium ${mode === option ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              {option === "encode" ? (
                <ArrowRight className="size-3.5" aria-hidden="true" />
              ) : (
                <Code2 className="size-3.5" aria-hidden="true" />
              )}
              {option === "encode" ? "Encode" : "Decode"}
            </button>
          ))}
        </div>
        <div className="flex flex-col items-start gap-1 sm:items-end">
          <p
            id="resize-help"
            className="hidden items-center gap-1.5 text-[10px] text-muted-foreground lg:flex"
          >
            <GripVertical className="size-3" aria-hidden="true" />
            Drag dividers to resize · or focus and use arrow keys
          </p>
          <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <LockKeyhole className="size-3.5 text-primary" aria-hidden="true" />
            Runs locally in your browser
          </p>
        </div>
      </div>
    </>
  );
}
