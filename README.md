# Personal AI Anki Builder

Highlight any English word on your Mac, press **⌘⇧A**, and a complete Anki card appears in your deck: IPA, an English meaning, a natural example sentence about *your* life, a fill-in-the-blank, and audio.

<!-- TODO: add demo GIF here: docs/demo.gif -->

## Why I built this

I'm a software developer from Colombia learning English. Making good cards by hand was slow, and dictionary examples never sounded like things I would actually say. So I wrote my learning method down as docs (`docs/card-philosophy.md`) and built an app that follows it on every card.

## How it works

1. **Capture**: `⌘⇧A` reads the selected text from any app (macOS Accessibility, with a clipboard fallback that restores your clipboard).
2. **Generate**: GPT-4o writes the card as strict JSON, guided by the methodology docs.
3. **Validate**: ~29 quality rules (word count, no Spanish, valid IPA, exactly one blank…). Hard failures are sent back to the model as feedback and it retries.
4. **Audio**: OpenAI TTS creates audio for the word and for the example sentence.
5. **Save**: the card goes to Anki through AnkiConnect, with duplicate detection and a native notification.

Local-first: your cards and audio live on your Mac, and there is no backend, deployment or account. The only network calls are to the OpenAI API (content + audio) and to AnkiConnect on localhost.

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

Working daily driver on macOS. Ideas next: Windows/Linux support, choosing the deck from the UI, other target languages.

## License

MIT. See `LICENSE`.

## Running in the background (no VS Code, no terminal kept open)

The app is a true menu bar app — no dock icon, no window on launch. It runs as a background process; you launch it once from the terminal and forget about it.

### Launch

```bash
# One-shot: builds (if needed) and launches detached from the terminal.
# The process survives shell exit. Click the 'Anki' item in your menu bar
# to show the window or quit.
npm run start:detach
```

That script:
1. Installs dependencies on first run (`npm install`).
2. Builds the production bundle (`npm run build`) if `out/main/index.js` is missing.
3. Launches `npm run preview` with `nohup`, redirecting logs to `~/.anki-builder.log` and the PID to `~/.anki-builder.pid`.

### Stop

```bash
npm run stop
# or
kill $(cat ~/.anki-builder.pid)
```

### Window behavior

- The window is hidden on launch. The tray (menu bar) icon reads `Anki`.
- Click the tray → menu: **Show Window** / **Quit Anki Builder**.
- Closing the window with `⌘W` or the red dot **hides** it — the process keeps running so `⌘⇧A` keeps working.
- The dock icon is hidden via `app.dock.hide()`. The app only shows up in the menu bar.

### Selection capture still works

Once the background process is up, press `⌘⇧A` anywhere on your Mac. You'll get one native macOS notification at the end (`Saved:`, `Duplicate:`, `Failed:`, etc.) and the card will be in your Anki deck.

First-time setup on macOS: grant Accessibility permission to the Electron-built app under **System Settings → Privacy & Security → Accessibility**.
