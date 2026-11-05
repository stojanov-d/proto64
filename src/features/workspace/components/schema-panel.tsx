import { Check, CircleAlert, FileCode2 } from "lucide-react";

interface SchemaPanelProps {
  schema: string;
  schemaError: string;
  messageTypeCount: number;
  editSchema: (source: string) => void;
}

export function SchemaPanel({
  schema,
  schemaError,
  messageTypeCount,
  editSchema,
}: SchemaPanelProps) {
  return (
    <section className="workspace-panel" aria-labelledby="schema-heading">
      <div className="panel-heading">
        <div className="flex items-center gap-2.5">
          <span className="step-number">01</span>
          <h2 id="schema-heading">Schema</h2>
        </div>
        <FileCode2
          className="size-4 text-muted-foreground"
          aria-hidden="true"
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b bg-muted/35 px-4 py-2.5 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5 font-mono">
          <span className="size-1.5 rounded-full bg-primary" />
          .proto schema
        </span>
        <span id="schema-edit-help" className="text-[10px]">
          Editing resets field values
        </span>
      </div>
      <div className="schema-editor flex min-h-0 flex-1">
        <div
          aria-hidden="true"
          className="schema-lines select-none border-r border-border/60 py-4 pr-3 pl-3 text-right font-mono text-xs leading-6 text-muted-foreground/60"
        >
          {schema.split("\n").map((_, index) => (
            <div key={index}>{index + 1}</div>
          ))}
        </div>
        <textarea
          id="schema-source"
          aria-label="Protobuf schema (.proto)"
          aria-describedby="schema-edit-help schema-help schema-validation"
          className="min-h-[410px] min-w-0 flex-1 resize-none bg-transparent p-4 font-mono text-xs leading-6 text-foreground outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--ring)] lg:min-h-0"
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          value={schema}
          onChange={(event) => editSchema(event.target.value)}
          onScroll={(event) => {
            const gutter = event.currentTarget.previousElementSibling;
            if (gutter) gutter.scrollTop = event.currentTarget.scrollTop;
          }}
          wrap="off"
        />
      </div>
      <div className="border-t px-4 py-3">
        <p
          id="schema-validation"
          className={`flex items-start gap-2 text-[11px] leading-5 ${schemaError ? "text-destructive" : "text-muted-foreground"}`}
          aria-live="polite"
        >
          {schemaError ? (
            <CircleAlert
              className="mt-0.5 size-3.5 shrink-0"
              aria-hidden="true"
            />
          ) : (
            <Check
              className="mt-0.5 size-3.5 shrink-0 text-primary"
              aria-hidden="true"
            />
          )}
          {schemaError || `${messageTypeCount} message types found`}
        </p>
        <p
          id="schema-help"
          className="mt-1 text-[10px] leading-4 text-muted-foreground"
        >
          Standalone schema · imports unsupported
        </p>
      </div>
    </section>
  );
}
