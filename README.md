# Diff MCP App (Next.js + Firestore)

This is an MVP Diff App + MCP "diff service" with local document storage.

- Humans resolve diffs in the UI.
- Codex (or any client) creates sessions and pulls resolutions via MCP.
- Session state is stored in local JSON files.

## Features (v1)
- Batch + session creation from a manifest (src/target strings included)
- Monaco-based diff view
- Resolutions stored as `resolvedText` with status transitions:
  - `PENDING` -> `RESOLVED` -> `APPLIED`
- MCP API tools:
  - `diff.create_sessions`
  - `diff.get_batch_status`
  - `diff.list_sessions`
  - `diff.get_resolved`
  - `diff.mark_applied`

## Environment variables
Create a `.env.local` (for local dev) or set these in Vercel:

Required:
- `DIFF_DATA_DIR (optional)` : service account JSON string (minimally contains `project_id`, `client_email`, `private_key`)
- `DIFF_MCP_TOKEN` : bearer token used to protect `/api/mcp`

Optional:
- `APP_BASE_URL` : public base URL (e.g. `https://your-app.vercel.app`). If not set, it is derived from request headers.
- `DIFF_UI_TOKEN` : if set, UI API endpoints require `x-ui-token: <DIFF_UI_TOKEN>`
- `NEXT_PUBLIC_APP_BASE_URL` : if set, UI pages use it when server-side fetching (handy for some deployments). Usually can be omitted.

See `.env.example`.

## Local development
```bash
npm install
npm run dev
```

## MCP endpoint
`POST /api/mcp`

Headers:
- `Authorization: Bearer <DIFF_MCP_TOKEN>`

Body:
```json
{ "tool": "diff.create_sessions", "args": { "source": { "commit": "..." }, "items": [ ... ] } }
```

## Local storage
- `.data/batches.json`
- `.data/sessions.json`

## Notes
- The app stores `src_description`, `target_description`, and `resolvedText` in local JSON. If you want to reduce breach impact, the next step is application-level encryption of these text fields.
