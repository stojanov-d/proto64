# proto64

proto64 is a web-based Protocol Buffers encoder/decoder in development, intended
for composing message request payloads and converting between protobuf bytes and
Base64 text.

## Current status

The app is currently a starter screen with a single **Click me** button. Schema
loading, message selection, JSON input, protobuf encoding/decoding, and Base64
conversion are **not implemented**. `protobufjs` and `b64u` are installed, but are
not yet wired into the app.

The planned scope is payload preparation and inspection, not sending requests.
There is no request-sending or gRPC support.

## Planned workflows

These workflows describe the intended functionality, not features available today:

- **Encode:** provide a `.proto` schema, select a message type, and compose JSON
  data → encode it as protobuf bytes → convert those bytes to Base64 text for use
  as a request payload outside the app.
- **Decode:** provide a `.proto` schema and select the matching message type, then
  supply Base64 text → convert it to protobuf bytes → decode the bytes into
  structured message data for inspection.

Both directions require the appropriate schema and message type to interpret the
protobuf message correctly.

## Stack

- React 19 and TypeScript, built with Vite.
- Tailwind CSS 4 and shadcn/Base UI components for the interface.
- `protobufjs` and `b64u` installed for the planned serialization and Base64 work.
- ESLint for linting; pnpm for dependency management and scripts.

## Development

With Node.js compatible with Vite 8 and pnpm installed, run these commands from
the project root:

```sh
pnpm install
pnpm dev
```

`pnpm dev` starts the Vite development server; open the local URL it prints.

```sh
pnpm build
pnpm lint
pnpm preview
```

- `pnpm build` runs the TypeScript build check and creates the production bundle
  in `dist/` using Vite.
- `pnpm lint` runs ESLint across the project.
- `pnpm preview` serves the production bundle locally for inspection; run
  `pnpm build` first. It is not a production deployment server.
