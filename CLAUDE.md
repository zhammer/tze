# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

"tze" (towards zetetic ends) — a GIF-backed typewriter web app. Each keystroke displays a letter overlaid on a random ocean/sunset GIF. Users type, see their text with GIF backgrounds per letter, and can save recordings as JSON (Cmd+S).

## Commands

- `npm run dev` — start Vite dev server with HMR
- `npm run build` — type-check with `tsc -b` then build with Vite
- `npm run lint` — ESLint
- `npx vitest run` — run all tests
- `npx vitest run src/machines/typewriter.test.ts` — run a single test file
- `npx vitest --watch` — run tests in watch mode

## Architecture

The app uses **XState v5** state machines as the core logic layer, with React as the view.

**State machine layer** (`src/machines/`):
- `typewriterMachine` — the main machine. States: `loading` → `ready` → `typing` → `saved`. Accumulates an event log (`TypewriterEvent[]`) of timestamped keystrokes and backspaces. Spawns a `gifProviderMachine` child actor when GIFs finish loading.
- `gifProviderMachine` — child actor that deals GIFs from a shuffled bag. When the bag empties, it reshuffles. The typewriter machine reads `lastProvided` synchronously from the child's snapshot after sending `GET_GIF`.

**React integration** (`src/hooks/useTypewriter.ts`):
- `useTypewriter` hook wires the typewriter machine to the DOM via `useMachine` from `@xstate/react`. Fetches GIFs on mount, listens for `keydown` events, and maps keys to machine events.

**GIF data** (`src/gif/fetchGifs.ts`):
- Hardcoded list of Giphy media URLs (no API key needed). `fetchGifs()` preloads all GIFs into the browser cache via `Image()` before returning.

**Key data flow**: keydown → `useTypewriter` → `typewriterMachine` (synchronously reads GIF from child actor snapshot) → context update → React re-render.

## Testing

Tests use **Vitest** and run XState machines directly via `createActor` — no React rendering or DOM needed. Test files are co-located with their source (`.test.ts` suffix).
