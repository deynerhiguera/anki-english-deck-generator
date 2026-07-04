# Personal AI Anki Builder

Local-first desktop app that generates Anki cards following a personal learning methodology.

Runs as an Electron app on macOS. All processing is local. No deployment. No auth. No cloud-only backend.

## Stack

- Electron + electron-vite
- React + TypeScript
- OpenAI API (gpt-4o for content, TTS for audio)
- AnkiConnect (existing plugin running inside Anki)

## Architecture

The app is structured for clean separation between domain logic, infrastructure, and UI:

```
src/
├── main/          Electron main process (Node)
├── preload/       Preload script — typed bridge to renderer
├── renderer/      React UI
└── shared/        Pure TS types and domain logic (used by main + renderer)
```

See `docs/card-philosophy.md`, `docs/style-guide.md`, and `docs/quality-checklist.md` for the methodology rules the app enforces on every generated card.

## Setup

Requirements:

- Node.js ≥ 22
- macOS
- Anki with the AnkiConnect plugin installed and running

Steps:

1. Clone the repo.
2. Copy `.env.example` to `.env` and fill in your OpenAI API key:
   ```
   OPENAI_API_KEY=sk-...
   ```
3. Install dependencies:
   ```
   npm install
   ```
4. Start Anki (the AnkiConnect plugin must be enabled).
5. Run in dev mode:
   ```
   npm run dev
   ```

## Scripts

- `npm run dev` — start the app in dev mode (HMR for renderer).
- `npm run build` — build main, preload, and renderer.
- `npm run preview` — run the production build locally.
- `npm run typecheck` — type-check main and renderer.

## Folder layout

| Path                                  | Purpose                                       |
|---------------------------------------|-----------------------------------------------|
| `src/main/`                           | Electron main process (Node)                  |
| `src/main/config/env.ts`              | Zod-validated env config                       |
| `src/main/infrastructure/anki/`       | AnkiConnect HTTP client                       |
| `src/main/infrastructure/openai/`     | OpenAI client (chat + TTS)                    |
| `src/main/infrastructure/storage/`    | Audio storage + Anki media sync               |
| `src/main/services/`                  | CardBuilder, PromptBuilder orchestration      |
| `src/preload/`                        | contextBridge typed API                       |
| `src/renderer/src/`                   | React UI                                       |
| `src/shared/domain/`                  | Card, errors, validator                       |
| `src/shared/types/`                   | ipc, anki, settings types                     |
| `docs/`                               | Source-of-truth docs for the methodology      |
| `media/`                              | Local mirror of generated audio (gitignored)  |

## Status

Phase 0 — foundation.

## Background selection capture (macOS)

Highlight any text in any app, then press **⌘⇧A** (Cmd+Shift+A). The app runs entirely in the background — no window focus, no UI changes. The card is generated, saved to Anki, and a native macOS notification confirms the result.

How it works:

- `src/main/utils/selection.ts` captures the selection via a 3-strategy waterfall: `AXSelectedText` (accessibility API), then synthetic `Cmd+C` via `keystroke`, then synthetic `Cmd+C` via `key code 8`. A clipboard sentinel detects when the synthetic copy silently failed, preventing stale-clipboard false positives.
- `src/main/ipc/register.ts` runs the full build pipeline directly in the main process (no IPC round-trip to the renderer), then shows a native macOS notification (`Notification` API) with the result.
- The renderer is untouched during the build — the app stays in the background while you're reading, working, or watching a video.

First-time setup on macOS: grant Accessibility permission to the Electron-built app under **System Settings → Privacy & Security → Accessibility**. Without it, the synthetic `Cmd+C` and accessibility read both fail and you'll get a *"No selection captured"* notification.
