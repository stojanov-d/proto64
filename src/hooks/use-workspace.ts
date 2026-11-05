import { useMemo, useRef, useState } from "react";

import {
  changeDraftField,
  makeDraft,
  messageOf,
  readDraft,
} from "../features/workspace/model/draft.ts";
import { EXAMPLE, SAMPLE } from "../features/workspace/model/example.ts";
import type { Draft, Mode } from "../features/workspace/model/types.ts";
import {
  parseSchema,
  getMessageType,
  encodeMessage,
  decodeMessage,
} from "../lib/protobuf.ts";

export function useWorkspace() {
  const [schema, setSchema] = useState(EXAMPLE);
  const [selected, setSelected] = useState("example.Person");
  const [draft, setDraft] = useState<Draft>(() =>
    makeDraft(
      getMessageType(parseSchema(EXAMPLE).root, "example.Person"),
      SAMPLE,
    ),
  );
  const [mode, setMode] = useState<Mode>("encode");
  const [base64, setBase64] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const [resultChanged, setResultChanged] = useState(false);
  const resultRevision = useRef(0);
  const parsed = useMemo(() => {
    try {
      return { ...parseSchema(schema), error: "" };
    } catch (error) {
      return { root: null, messageTypes: [], error: messageOf(error) };
    }
  }, [schema]);
  const type = useMemo(
    () =>
      parsed.root && selected ? getMessageType(parsed.root, selected) : null,
    [parsed, selected],
  );

  function invalidate(inputChanged = true) {
    resultRevision.current += 1;
    if (inputChanged) setResultChanged((changed) => changed || result !== null);
    setResult(null);
    setError("");
    setCopyStatus("");
  }
  function editSchema(source: string) {
    setSchema(source);
    invalidate();
    try {
      const next = parseSchema(source);
      const name = next.messageTypes.includes(selected)
        ? selected
        : (next.messageTypes[0] ?? "");
      setSelected(name);
      setDraft(name ? makeDraft(getMessageType(next.root, name)) : {});
    } catch {
      setDraft({});
    }
  }
  function changeType(name: string) {
    setSelected(name);
    setDraft(
      parsed.root && name ? makeDraft(getMessageType(parsed.root, name)) : {},
    );
    invalidate();
  }
  function changeField(name: string, text: string, included: boolean) {
    setDraft((previous) =>
      changeDraftField(type, previous, name, text, included),
    );
    invalidate();
  }
  function changeMode(next: Mode) {
    if (next === mode) return;
    if (next === "decode" && result !== null) setBase64(result);
    setMode(next);
    invalidate();
  }
  function loadExample() {
    const exampleType = getMessageType(
      parseSchema(EXAMPLE).root,
      "example.Person",
    );
    setSchema(EXAMPLE);
    setSelected("example.Person");
    setDraft(makeDraft(exampleType, SAMPLE));
    if (mode === "decode") setBase64(encodeMessage(exampleType, SAMPLE));
    invalidate(false);
    setResultChanged(false);
  }
  function convert() {
    invalidate(false);
    if (!type) return;
    try {
      if (mode === "encode")
        setResult(encodeMessage(type, readDraft(type, draft)));
      else {
        const decoded = decodeMessage(type, base64);
        setDraft(makeDraft(type, decoded));
        setResult(JSON.stringify(decoded, null, 2));
      }
      setResultChanged(false);
    } catch (error) {
      setError(messageOf(error));
    }
  }
  async function copyResult() {
    if (result === null) return;
    const revision = resultRevision.current;
    try {
      await navigator.clipboard.writeText(result);
      if (revision === resultRevision.current)
        setCopyStatus("Copied to clipboard");
    } catch {
      if (revision === resultRevision.current)
        setCopyStatus(
          "Clipboard unavailable. Select and copy the result below.",
        );
    }
  }

  return {
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
  };
}
