# proto64

A browser-based workspace for composing and inspecting Protocol Buffers payloads.
Define a schema, encode field values to Base64, or decode a payload into readable
JSON. Schemas and message data are processed locally in your browser, not uploaded.

## Features and workflows

- **Encode:** edit a self-contained `.proto` schema, choose a message type, and
  fill in the generated fields. Encode the message to standard Base64 and copy
  the result.
- **Decode:** use the matching schema and message type, paste a Base64 payload
  into the source input, and decode it to formatted JSON. Decoded fields are
  also available as read-only controls.
- **Try it:** the initial Person example includes nested data, repeated strings,
  a boolean, and a 64-bit integer. “Reset to example” restores the schema and
  values; in decode mode it also loads an example Base64 source.

Desktop panels resize by dragging the two dividers, or by focusing a divider and
using the arrow keys. On smaller screens the panels stack in workflow order.
Both light and dark themes are supported.

### Field values

Field controls follow the schema. Check the box beside a field name to send it,
or edit its value to include it automatically. Unchecked fields are marked
**Omitted** and are not sent. Zero, false, and empty strings are valid inputs.
Required fields stay included; selecting one oneof member clears its siblings.
Field names use protobufjs's camel casing (`account_id` becomes `accountId`).
Decoded fields show **Present** or **Default**; Default means the field is absent
and uses its protobuf default.

Nested messages, repeated fields, and maps use labeled JSON inputs. Quote
64-bit integers in JSON to preserve precision, use enum names, and represent
bytes as Base64 strings. Scalar 64-bit inputs retain their digits as text;
decoded 64-bit values are JSON strings.

Changing the schema resets field values. Changing any input, message type, or
mode clears the previous result. An empty message may validly encode to an empty
Base64 string. Errors leave inputs editable so you can correct and retry.

## Getting started

Install **Node.js 24 LTS** and **pnpm**, then run:

```sh
pnpm install
pnpm dev
```

Open the local URL printed by Vite. The schema editor is an accessible textarea;
no editor CDN is required.

## Development

Built with React 19, TypeScript, Vite 8, Tailwind CSS 4, shadcn/Base UI,
protobufjs, Zustand, and react-resizable-panels.

```sh
pnpm dev     # Start the development server
pnpm build   # TypeScript check and production bundle
pnpm lint    # ESLint
pnpm test    # Protobuf, workspace model, and workspace transition checks
pnpm preview # Serve the production bundle after building
```

### Architecture

| Path | Responsibility |
| --- | --- |
| `src/App.tsx` | Composes the shared header and workspace. |
| `src/features/workspace/workspace.tsx` | Connects workspace state to the panels and layout. |
| `src/features/workspace/components/` | Schema, input, and result panels; generated field controls, toolbar, and responsive layout. |
| `src/features/workspace/model/` | Draft conversion, field metadata, example data, and workspace types. |
| `src/hooks/` | Page-local workspace state/handlers, responsive subscriptions, and reusable hooks. |
| `src/components/` | Shared application chrome: site header and theme toggle. |
| `src/ui/` | Shared shadcn/Base UI button and sheet primitives. |
| `src/stores/` | Shared Zustand navigation state; workspace state stays local to its hook. |
| `src/utils/` | Generic helpers, including `cn.ts` for class names and `breakpoints.ts` for shared breakpoints. |
| `src/lib/protobuf.ts` | Protobuf domain boundary: schema reflection, value/wire validation, and Base64 encoding/decoding. |
| `src/index.css` | Theme tokens and application styles. |

### Tests

The suites use Node's built-in test runner and TypeScript stripping, with no
separate loader or test dependencies. They have been verified with Node
**v24.11.0**. The transition suite also uses `node:module`'s
`stripTypeScriptTypes`, which may emit an experimental API warning on this runtime.

`pnpm test` runs three suites in order and stops on the first failure:

1. `scripts/verify-protobuf.mjs`: schema reflection, wire fixtures, round trips,
   precision, required fields, and invalid schemas, values, Base64, and wire data.
2. `scripts/verify-workspace.mjs`: draft defaults and presence, field metadata,
   scalar/JSON parsing, 64-bit precision, and oneof exclusion.
3. `scripts/verify-workspace-transitions.mjs`: workspace handlers,
   schema/type selection, invalidation, mode seeding, reset, pending clipboard
   revision guards, and responsive subscription/snapshot behavior.

These are characterization tests, not rendered-UI tests. The synchronous hook
runner does not validate React scheduling or StrictMode. Clipboard permissions,
real media-query events, panel resizing, keyboard/focus behavior, and appearance
across viewport sizes and themes require separate browser checks. Run lint and
build separately; tests do not replace them.

## Web Analytics deployment

Enable **Web Analytics** in the Vercel project dashboard, then redeploy to start
production visitor and page-view collection. The app mounts Vercel's React
analytics component once with its defaults; development mode does not send
analytics. No custom events are configured.

See the [Vercel Web Analytics quickstart](https://vercel.com/docs/analytics/quickstart)
for setup details.

## Limitations and privacy

- Schemas must be self-contained and contain at least one message type. Imports
  are unsupported; include all definitions in the schema editor.
- Decoding requires the matching schema and message type. Protobuf bytes do not
  identify their own type, and a successful decode alone does not prove a match.
- Keep 64-bit integers quoted in JSON. Unsafe integer numbers are rejected rather
  than silently rounded; floating-point fields still use JavaScript number
  precision. Bytes use Base64, and decoded absent fields are omitted from JSON.
- This is a payload inspection tool, not a gRPC client or message store.
  Workspace inputs and results are not persisted across page reloads.
- Conversion inputs remain local. Vercel Web Analytics collects visitor and
  page-view metadata on enabled production deployments; no schemas, field values,
  or payloads are passed as custom events. See
  [Vercel's privacy policy](https://vercel.com/legal/privacy-policy).
- Copying a result writes it to the system clipboard. Base64 is an encoding,
  not encryption.

## License

Licensed under the [MIT License](LICENSE). Copyright (c) 2026 proto64 contributors.
