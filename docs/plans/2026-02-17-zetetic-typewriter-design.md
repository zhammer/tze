# Zetetic Typewriter — Design

## Overview

A writing tool / art piece. The user types text and each letter is paired with a randomly selected GIF. The GIF loops as a small thumbnail above the letter and plays once in a large showcase area. The session is recorded and can be saved as JSON for future replay.

## Stack

- Vite + React + TypeScript
- XState v5 + @xstate/react
- Giphy API (temporary GIF source; will move to a pre-bundled set later)
- CSS for layout and square GIF cropping

## Layout

- White background, centered content
- Top ~60%: **Showcase area** — displays the most recent GIF at large size, plays once through then freezes on last frame
- Bottom ~40%: **Text line** — letters appear left to right, monospace, uppercase, wide letter-spacing. Each letter has a small looping square GIF thumbnail above it. Wraps to new lines as needed.

## State Machines

### GifProvider (child actor)

Manages a "bag" of GIF URLs. Initialized with a batch fetched from Giphy.

- **Context:** `{ gifs: string[], bag: string[] }`
- `gifs` is the full set (never mutated after init). `bag` is a shuffled copy that gets popped from.
- When asked for a GIF: pops one from `bag`. If `bag` is empty, reshuffles `gifs` into `bag` first.
- All GIFs are square (or cropped to square via CSS `object-fit: cover`).

### ZeteticTypewriter (main machine)

Orchestrates the session.

- **States:** `loading` → `ready` → `typing` → `saved`
  - `loading`: fetching initial GIFs from Giphy, initializing GifProvider
  - `ready`: waiting for first keystroke
  - `typing`: recording keystrokes
  - `saved`: session exported, done
- **Context:**
  - `events: Array<{ t: number, type: 'keystroke' | 'backspace', letter?: string, gifUrl?: string }>`
  - `startTime: number`
- Spawns GifProvider as a child actor.
- **KEYSTROKE event:** validates key (letters, space, printable ASCII), records timestamp relative to `startTime`, requests a GIF from GifProvider (spaces get no GIF), appends to `events`.
- **BACKSPACE event:** appends a backspace event to the log (for replay fidelity). The rendered text is derived by replaying events.
- **SAVE event:** exports `events` array as JSON download, transitions to `saved`.

## Derived State

The visible letters displayed on screen are derived from the events log:
- Keystroke events append a letter (with its GIF).
- Backspace events remove the last visible letter.
- The events log itself is append-only.

## Recording Format

```json
{
  "events": [
    { "t": 0, "type": "keystroke", "letter": "T", "gifUrl": "https://..." },
    { "t": 450, "type": "keystroke", "letter": "O", "gifUrl": "https://..." },
    { "t": 900, "type": "backspace" },
    { "t": 1200, "type": "keystroke", "letter": "W", "gifUrl": "https://..." }
  ]
}
```

## UI Components

- **App** — subscribes to the typewriter machine, renders Showcase and TextLine
- **Showcase** — large center area, plays the most recently added GIF once (no loop), freezes on last frame
- **TextLine** — row of letter+GIF pairs derived from events. Each GIF thumbnail loops. Letters are uppercase monospace with wide spacing.

## GIF Display

- Thumbnails above letters: small square, looping
- Showcase: larger square, plays once then stops
- All cropped to square via CSS

## Future

- Replace Giphy with a pre-bundled set of GIFs/videos
- Replay mode: load a saved JSON and play it back in real time
- Static image export
