import { useWorkspace } from "@/hooks/use-workspace";
import { useWorkspaceDesktop } from "@/hooks/use-workspace-desktop";

import { InputsPanel } from "./components/inputs-panel";
import { ResultPanel } from "./components/result-panel";
import { SchemaPanel } from "./components/schema-panel";
import { WorkspaceLayout } from "./components/workspace-layout";
import { WorkspaceToolbar } from "./components/workspace-toolbar";

export function Workspace() {
  const {
    schema,
    selected,
    draft,
    mode,
    base64,
    result,
    error,
    copyStatus,
    resultChanged,
    parsed,
    type,
    setBase64,
    invalidate,
    editSchema,
    changeType,
    changeField,
    changeMode,
    loadExample,
    convert,
    copyResult,
  } = useWorkspace();
  const desktop = useWorkspaceDesktop();

  // Keep source edits and invalidation together: stale decoded fields/results
  // must disappear as soon as the Base64 input changes.
  function changeBase64(source: string) {
    setBase64(source);
    invalidate();
  }

  const schemaPanel = (
    <SchemaPanel
      schema={schema}
      schemaError={parsed.error}
      messageTypeCount={parsed.messageTypes.length}
      editSchema={editSchema}
    />
  );
  const inputsPanel = (
    <InputsPanel
      mode={mode}
      selected={selected}
      type={type}
      messageTypes={parsed.messageTypes}
      schemaError={parsed.error}
      draft={draft}
      base64={base64}
      result={result}
      error={error}
      changeType={changeType}
      changeField={changeField}
      changeBase64={changeBase64}
      convert={convert}
    />
  );
  const resultPanel = (
    <ResultPanel
      mode={mode}
      result={result}
      error={error}
      schemaError={parsed.error}
      copyStatus={copyStatus}
      resultChanged={resultChanged}
      copyResult={copyResult}
    />
  );

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto max-w-[1440px] px-5 pt-6 pb-6 outline-none sm:px-8 lg:px-12"
    >
      <WorkspaceToolbar
        mode={mode}
        changeMode={changeMode}
        loadExample={loadExample}
      />
      <WorkspaceLayout
        desktop={desktop}
        schemaPanel={schemaPanel}
        inputsPanel={inputsPanel}
        resultPanel={resultPanel}
      />
      <footer className="mt-4 flex flex-wrap justify-between gap-2 text-[10px] leading-5 text-muted-foreground">
        <p>
          Built for inspecting messages, not storing them. Nothing is uploaded.
        </p>
      </footer>
      <p className="sr-only" role="status">
        {parsed.error
          ? "Invalid schema. Fix the schema to continue."
          : error
            ? "Conversion failed. Check the error above the conversion button."
            : result !== null
              ? `${mode === "encode" ? "Encoding" : "Decoding"} complete.`
              : resultChanged
                ? "Inputs changed—convert again"
                : "Ready to convert."}
      </p>
    </main>
  );
}
