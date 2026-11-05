# proto64

A browser-based workspace for composing and inspecting Protocol Buffers payloads.
All conversion happens locally; schemas and message data are not uploaded.

## Workflows

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

## Field values

Field controls follow the schema. Check the box beside a field name to send it,
or edit its value to include it automatically. Unchecked fields are marked **Omitted** and
retain protobuf defaults. Zero, false, and empty strings are valid inputs.
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

Schemas must contain all their definitions; imports are not loaded. This tool
prepares payloads, not network requests; it does not send gRPC requests. Use the
correct schema and message type: protobuf bytes do not identify their own type.

## Development

React 19, TypeScript, Vite, Tailwind CSS 4, shadcn/Base UI, protobufjs, and
react-resizable-panels. No editor CDN is required: the schema editor is an
accessible textarea.

With Node.js compatible with Vite 8 and pnpm installed:

```sh
pnpm install
pnpm dev
```

```sh
pnpm build   # TypeScript check and production bundle
pnpm lint    # ESLint
pnpm test    # Protobuf, workspace model, and workspace transition checks
pnpm preview # Serve the production bundle after building
```

### Project organization

- `src/ui/`: shared shadcn/Base UI primitives and their supporting UI utilities.
- `src/components/`: shared application chrome, such as the header and navigation.
- `src/features/workspace/`: workspace composition, with presentation panels in
  `components/` and feature-owned draft helpers, field metadata, example data, and
  types in `model/`.
- `src/hooks/`: workspace state and orchestration hooks alongside reusable hooks.
  Workspace state stays local to its mounted workspace rather than in a global
  store.
- `src/stores/`: shared Zustand navigation state.
- `src/utils/`: generic helpers, not workspace-specific domain logic.
- `src/lib/protobuf.ts`: the protobuf domain boundary for schema reflection,
  validation, and Base64 encoding/decoding. Workspace code delegates protobuf
  validation to this module rather than duplicating its rules.

### Verification

Use Node.js 24 LTS for these tests; they have been verified with **v24.11.0**.
The suites import TypeScript files directly using Node's built-in TypeScript
stripping. The transition suite also uses `stripTypeScriptTypes` from
`node:module`, which may emit an experimental API warning on this runtime.
No separate TypeScript loader or new dependencies are required for these checks
or the organization refactor.

`pnpm test` runs three suites in order and stops on the first failure:

1. `scripts/verify-protobuf.mjs`: schema reflection, wire fixtures, round trips,
   precision, required fields, and invalid schemas, values, Base64, and wire data.
2. `scripts/verify-workspace.mjs`: draft defaults and presence, field metadata,
   scalar/JSON parsing, 64-bit precision, and oneof exclusion.
3. `scripts/verify-workspace-transitions.mjs`: extracted workspace handlers,
   schema/type selection, invalidation, mode seeding, reset, pending clipboard
   revision guards, and responsive subscription/snapshot behavior.

These are Node characterization tests, not browser or rendered-UI tests. The
transition suite uses a small synchronous hook runner; it does not establish
React scheduling or StrictMode behavior. Browser clipboard permissions, actual
media-query events and panel resizing, keyboard/focus interactions, and visual
equivalence across viewport sizes and themes need separate browser checks.
Run `pnpm lint` and `pnpm build` separately for linting, TypeScript checking, and
production bundling; `pnpm test` does not replace those checks.
