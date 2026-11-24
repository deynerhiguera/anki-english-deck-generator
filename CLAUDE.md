# CLAUDE.md

Project context for Claude Code sessions in this repo.

## What this is

Personal AI Anki Builder: a macOS menu bar app (Electron + electron-vite + React + TypeScript). The user highlights an English word anywhere on the Mac, presses ⌘⇧A, and a full Anki card is created: IPA, English meaning, a natural example sentence, a cloze, word audio and example audio.

The owner is a Spanish-speaking developer learning English. The cards follow his learning method in `docs/card-philosophy.md`, `docs/style-guide.md` and `docs/quality-checklist.md`. Those docs are the source of truth for card content. Don't change them unless asked.

## Pipeline (where things live)

1. `src/main/utils/selection.ts`: captures the selected text (AX API via osascript, then a ⌘C clipboard fallback that restores the clipboard).
2. `src/main/services/PromptBuilder.ts`: builds the system prompt from the docs.
3. `src/main/infrastructure/openai/OpenAIClient.ts`: card content as strict JSON schema (gpt-4o) + TTS.
4. `src/shared/domain/CardValidator.ts`: rules Q1–Q29 (HARD/SOFT). `CardBuilder` retries up to 2 times, sending hard failures back to the model as feedback.
5. `src/main/infrastructure/storage/`: saves mp3s locally (`media/`) and copies them into Anki's media folder.
6. `src/main/services/AnkiFieldMapper.ts` + `infrastructure/anki/AnkiClient.ts`: map fields by alias and call AnkiConnect `addNote` (tag `auto-generated`, no duplicates per deck).
7. `src/main/ipc/register.ts`: IPC handlers, global shortcut, native notifications.

Fields: `Word`, `Sound` (word audio), `Sound_Example`, `Meaning`, `Example`, `IPA`, `Cloze`.

## Commands

- `npm run dev`: dev mode (needs Anki open with AnkiConnect on 127.0.0.1:8765 and `.env` with `OPENAI_API_KEY`)
- `npm run typecheck`: run after every change
- `npm run build` / `npm run start:detach` / `npm run stop`: background menu bar mode (logs in `~/.anki-builder.log`)

## Conventions

- Keep domain logic in `src/shared/domain` free of Electron/Node imports.
- Never commit `.env` or generated audio in `media/`.
- Work on a branch, open a PR, use conventional commit messages (`fix:`, `feat:`, `docs:`).
- The README is public-facing: keep it honest (content and audio go through the OpenAI API).

## Current focus

- Verify the word-audio fix end to end (PR #1): make a card and check that both `Sound` and `Sound_Example` play in Anki.
- Record a demo GIF of the ⌘⇧A flow and add it at `docs/demo.gif` (the README has a placeholder).
