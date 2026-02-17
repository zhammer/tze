# Zetetic Typewriter Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a writing tool where each typed letter is paired with a random GIF — looping above the letter and playing once in a showcase area — with the session recorded as JSON.

**Architecture:** Two XState v5 machines: GifProvider (bag of GIF URLs) and ZeteticTypewriter (main orchestrator). React renders the UI from machine state. Giphy trending API supplies GIFs initially.

**Tech Stack:** Vite, React, TypeScript, XState v5, @xstate/react, Giphy API

---

### Task 1: Scaffold Vite + React + TypeScript project

**Files:**
- Create: `package.json`, `tsconfig.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `vite.config.ts`

**Step 1: Create the Vite project**

Run from `/Users/zhammer/code/me/tze`:
```bash
npm create vite@latest . -- --template react-ts
```
When prompted about existing files, select "Ignore files and continue".

Expected: Vite scaffolds files into the directory.

**Step 2: Install dependencies**

```bash
npm install
npm install xstate @xstate/react
```

**Step 3: Verify dev server starts**

```bash
npm run dev
```

Expected: Dev server starts on localhost, default Vite React page renders.

**Step 4: Clean up scaffolded files**

Remove default Vite content. Replace `src/App.tsx` with:

```tsx
function App() {
  return <div>zetetic typewriter</div>;
}

export default App;
```

Delete `src/App.css` and `src/assets/`. Remove the CSS import from `src/App.tsx`. Keep `src/index.css` but empty it.

**Step 5: Commit**

```bash
git add -A
git commit -m "scaffold vite + react + typescript project"
```

---

### Task 2: Create GIF fetching utility

**Files:**
- Create: `src/gif/fetchGifs.ts`
- Create: `src/gif/fetchGifs.test.ts`

**Step 1: Write the failing test**

```ts
// src/gif/fetchGifs.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchGifs } from "./fetchGifs";

describe("fetchGifs", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns an array of square gif URLs from giphy trending", async () => {
    const mockResponse = {
      data: [
        {
          images: {
            fixed_width_small: { url: "https://giphy.com/gif1.gif" },
          },
        },
        {
          images: {
            fixed_width_small: { url: "https://giphy.com/gif2.gif" },
          },
        },
      ],
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })
    );

    const gifs = await fetchGifs(2);
    expect(gifs).toEqual([
      "https://giphy.com/gif1.gif",
      "https://giphy.com/gif2.gif",
    ]);
    expect(fetch).toHaveBeenCalledOnce();
  });
});
```

**Step 2: Install vitest and run test to verify it fails**

```bash
npm install -D vitest
npx vitest run src/gif/fetchGifs.test.ts
```

Expected: FAIL — module not found.

**Step 3: Write the implementation**

```ts
// src/gif/fetchGifs.ts
const GIPHY_API_KEY = import.meta.env.VITE_GIPHY_API_KEY ?? "";

export async function fetchGifs(limit: number = 50): Promise<string[]> {
  const url = `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=${limit}&rating=g`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Giphy API error: ${response.status}`);
  }

  const json = await response.json();
  return json.data.map(
    (gif: any) => gif.images.fixed_width_small.url as string
  );
}
```

**Step 4: Run tests to verify they pass**

```bash
npx vitest run src/gif/fetchGifs.test.ts
```

Expected: PASS

**Step 5: Add `.env` file with Giphy API key**

Create `.env`:
```
VITE_GIPHY_API_KEY=your_giphy_api_key_here
```

Add `.env` to `.gitignore`.

**Step 6: Commit**

```bash
git add src/gif/ .gitignore
git commit -m "add gif fetching utility"
```

---

### Task 3: Create GifProvider machine

**Files:**
- Create: `src/machines/gifProvider.ts`
- Create: `src/machines/gifProvider.test.ts`

**Step 1: Write the failing test**

```ts
// src/machines/gifProvider.test.ts
import { describe, it, expect } from "vitest";
import { createActor } from "xstate";
import { gifProviderMachine } from "./gifProvider";

describe("gifProviderMachine", () => {
  const testGifs = ["gif1.gif", "gif2.gif", "gif3.gif"];

  it("provides gifs from the bag until empty, then refills", () => {
    const actor = createActor(gifProviderMachine, {
      input: { gifs: testGifs },
    });
    actor.start();

    const drawn: string[] = [];

    // Draw all 3
    for (let i = 0; i < 3; i++) {
      actor.send({ type: "GET_GIF" });
      const snap = actor.getSnapshot();
      const lastGif = snap.context.lastProvided;
      expect(lastGif).toBeTruthy();
      drawn.push(lastGif!);
    }

    // All 3 gifs should have been drawn (in some order)
    expect(drawn.sort()).toEqual(testGifs.slice().sort());

    // Bag should be empty now; next draw should refill
    actor.send({ type: "GET_GIF" });
    const snap = actor.getSnapshot();
    expect(snap.context.lastProvided).toBeTruthy();
    expect(testGifs).toContain(snap.context.lastProvided);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run src/machines/gifProvider.test.ts
```

Expected: FAIL — module not found.

**Step 3: Write the implementation**

```ts
// src/machines/gifProvider.ts
import { setup, assign } from "xstate";

function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export const gifProviderMachine = setup({
  types: {
    context: {} as {
      gifs: string[];
      bag: string[];
      lastProvided: string | null;
    },
    input: {} as { gifs: string[] },
    events: {} as { type: "GET_GIF" },
  },
}).createMachine({
  id: "gifProvider",
  context: ({ input }) => ({
    gifs: input.gifs,
    bag: shuffle(input.gifs),
    lastProvided: null,
  }),
  on: {
    GET_GIF: {
      actions: assign(({ context }) => {
        let bag = context.bag;
        if (bag.length === 0) {
          bag = shuffle(context.gifs);
        }
        const [next, ...rest] = bag;
        return {
          bag: rest,
          lastProvided: next,
        };
      }),
    },
  },
});
```

**Step 4: Run tests to verify they pass**

```bash
npx vitest run src/machines/gifProvider.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/machines/
git commit -m "add gifProvider state machine"
```

---

### Task 4: Create ZeteticTypewriter machine

**Files:**
- Create: `src/machines/typewriter.ts`
- Create: `src/machines/typewriter.test.ts`

**Step 1: Write the failing test**

```ts
// src/machines/typewriter.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createActor } from "xstate";
import { typewriterMachine } from "./typewriter";

describe("typewriterMachine", () => {
  const testGifs = ["gif1.gif", "gif2.gif", "gif3.gif", "gif4.gif", "gif5.gif"];

  it("starts in loading state, transitions to ready when gifs are provided", () => {
    const actor = createActor(typewriterMachine);
    actor.start();
    expect(actor.getSnapshot().value).toBe("loading");

    actor.send({ type: "GIFS_LOADED", gifs: testGifs });
    expect(actor.getSnapshot().value).toBe("ready");
  });

  it("transitions to typing on first keystroke and records the event", () => {
    const actor = createActor(typewriterMachine);
    actor.start();
    actor.send({ type: "GIFS_LOADED", gifs: testGifs });

    actor.send({ type: "KEYSTROKE", letter: "H", timestamp: 1000 });
    const snap = actor.getSnapshot();
    expect(snap.value).toBe("typing");
    expect(snap.context.events).toHaveLength(1);
    expect(snap.context.events[0]).toMatchObject({
      type: "keystroke",
      letter: "H",
      t: 0,
    });
    expect(snap.context.events[0].gifUrl).toBeTruthy();
  });

  it("records backspace events", () => {
    const actor = createActor(typewriterMachine);
    actor.start();
    actor.send({ type: "GIFS_LOADED", gifs: testGifs });
    actor.send({ type: "KEYSTROKE", letter: "H", timestamp: 1000 });
    actor.send({ type: "BACKSPACE", timestamp: 1500 });

    const snap = actor.getSnapshot();
    expect(snap.context.events).toHaveLength(2);
    expect(snap.context.events[1]).toMatchObject({
      type: "backspace",
      t: 500,
    });
  });

  it("derives visible letters from events", () => {
    const actor = createActor(typewriterMachine);
    actor.start();
    actor.send({ type: "GIFS_LOADED", gifs: testGifs });
    actor.send({ type: "KEYSTROKE", letter: "H", timestamp: 1000 });
    actor.send({ type: "KEYSTROKE", letter: "I", timestamp: 1200 });
    actor.send({ type: "BACKSPACE", timestamp: 1400 });

    const snap = actor.getSnapshot();
    const visible = snap.context.visibleLetters;
    expect(visible).toHaveLength(1);
    expect(visible[0].letter).toBe("H");
  });

  it("transitions to saved on SAVE event", () => {
    const actor = createActor(typewriterMachine);
    actor.start();
    actor.send({ type: "GIFS_LOADED", gifs: testGifs });
    actor.send({ type: "KEYSTROKE", letter: "A", timestamp: 1000 });
    actor.send({ type: "SAVE" });

    expect(actor.getSnapshot().value).toBe("saved");
  });

  it("spaces get no gif", () => {
    const actor = createActor(typewriterMachine);
    actor.start();
    actor.send({ type: "GIFS_LOADED", gifs: testGifs });
    actor.send({ type: "KEYSTROKE", letter: " ", timestamp: 1000 });

    const snap = actor.getSnapshot();
    expect(snap.context.events[0].gifUrl).toBeUndefined();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run src/machines/typewriter.test.ts
```

Expected: FAIL — module not found.

**Step 3: Write the implementation**

```ts
// src/machines/typewriter.ts
import { setup, assign } from "xstate";
import { gifProviderMachine } from "./gifProvider";
import { createActor, type ActorRefFrom } from "xstate";

export type TypewriterEvent =
  | { t: number; type: "keystroke"; letter: string; gifUrl?: string }
  | { t: number; type: "backspace" };

export type VisibleLetter = {
  letter: string;
  gifUrl?: string;
};

function deriveVisibleLetters(events: TypewriterEvent[]): VisibleLetter[] {
  const result: VisibleLetter[] = [];
  for (const event of events) {
    if (event.type === "keystroke") {
      result.push({ letter: event.letter, gifUrl: event.gifUrl });
    } else if (event.type === "backspace") {
      result.pop();
    }
  }
  return result;
}

export const typewriterMachine = setup({
  types: {
    context: {} as {
      events: TypewriterEvent[];
      visibleLetters: VisibleLetter[];
      startTime: number | null;
      gifProviderRef: ActorRefFrom<typeof gifProviderMachine> | null;
    },
    events: {} as
      | { type: "GIFS_LOADED"; gifs: string[] }
      | { type: "KEYSTROKE"; letter: string; timestamp: number }
      | { type: "BACKSPACE"; timestamp: number }
      | { type: "SAVE" },
  },
}).createMachine({
  id: "typewriter",
  initial: "loading",
  context: {
    events: [],
    visibleLetters: [],
    startTime: null,
    gifProviderRef: null,
  },
  states: {
    loading: {
      on: {
        GIFS_LOADED: {
          target: "ready",
          actions: assign({
            gifProviderRef: ({ event, spawn }) =>
              spawn(gifProviderMachine, {
                input: { gifs: event.gifs },
                id: "gifProvider",
              }),
          }),
        },
      },
    },
    ready: {
      on: {
        KEYSTROKE: {
          target: "typing",
          actions: assign(({ context, event, spawn }) => {
            const startTime = event.timestamp;
            const gifProviderRef = context.gifProviderRef!;

            let gifUrl: string | undefined;
            if (event.letter !== " ") {
              gifProviderRef.send({ type: "GET_GIF" });
              gifUrl =
                gifProviderRef.getSnapshot().context.lastProvided ?? undefined;
            }

            const newEvent: TypewriterEvent = {
              type: "keystroke",
              letter: event.letter,
              t: 0,
              gifUrl,
            };
            const events = [...context.events, newEvent];

            return {
              startTime,
              events,
              visibleLetters: deriveVisibleLetters(events),
            };
          }),
        },
      },
    },
    typing: {
      on: {
        KEYSTROKE: {
          actions: assign(({ context, event }) => {
            const t = event.timestamp - context.startTime!;
            const gifProviderRef = context.gifProviderRef!;

            let gifUrl: string | undefined;
            if (event.letter !== " ") {
              gifProviderRef.send({ type: "GET_GIF" });
              gifUrl =
                gifProviderRef.getSnapshot().context.lastProvided ?? undefined;
            }

            const newEvent: TypewriterEvent = {
              type: "keystroke",
              letter: event.letter,
              t,
              gifUrl,
            };
            const events = [...context.events, newEvent];

            return {
              events,
              visibleLetters: deriveVisibleLetters(events),
            };
          }),
        },
        BACKSPACE: {
          actions: assign(({ context, event }) => {
            const t = event.timestamp - context.startTime!;
            const newEvent: TypewriterEvent = {
              type: "backspace",
              t,
            };
            const events = [...context.events, newEvent];

            return {
              events,
              visibleLetters: deriveVisibleLetters(events),
            };
          }),
        },
        SAVE: {
          target: "saved",
        },
      },
    },
    saved: {
      type: "final",
    },
  },
});
```

**Step 4: Run tests to verify they pass**

```bash
npx vitest run src/machines/typewriter.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/machines/
git commit -m "add typewriter state machine"
```

---

### Task 5: Build UI — App shell with keyboard listener

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/main.tsx`
- Create: `src/hooks/useTypewriter.ts`

**Step 1: Create the useTypewriter hook**

This hook wraps machine setup and keyboard event handling.

```tsx
// src/hooks/useTypewriter.ts
import { useEffect } from "react";
import { useMachine } from "@xstate/react";
import { typewriterMachine } from "../machines/typewriter";
import { fetchGifs } from "../gif/fetchGifs";

const VALID_KEY_REGEX = /^[a-zA-Z0-9 !@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]$/;

export function useTypewriter() {
  const [snapshot, send] = useMachine(typewriterMachine);

  // Fetch GIFs on mount
  useEffect(() => {
    fetchGifs(50).then((gifs) => {
      send({ type: "GIFS_LOADED", gifs });
    });
  }, [send]);

  // Listen for keystrokes
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (snapshot.value === "saved") return;

      const timestamp = Date.now();

      if (e.key === "Backspace") {
        e.preventDefault();
        send({ type: "BACKSPACE", timestamp });
      } else if (VALID_KEY_REGEX.test(e.key)) {
        e.preventDefault();
        send({ type: "KEYSTROKE", letter: e.key.toUpperCase(), timestamp });
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [snapshot.value, send]);

  return snapshot;
}
```

**Step 2: Update App.tsx**

```tsx
// src/App.tsx
import { useTypewriter } from "./hooks/useTypewriter";

function App() {
  const snapshot = useTypewriter();

  if (snapshot.value === "loading") {
    return <div className="loading">loading...</div>;
  }

  return (
    <div className="app">
      <div className="showcase">
        {/* Will be built in Task 6 */}
      </div>
      <div className="text-line">
        {snapshot.context.visibleLetters.map((vl, i) => (
          <div key={i} className="letter-cell">
            {vl.gifUrl && (
              <img
                className="letter-gif"
                src={vl.gifUrl}
                alt=""
              />
            )}
            <span className="letter">{vl.letter}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
```

**Step 3: Verify in browser**

```bash
npm run dev
```

Open in browser. Type letters — they should appear at the bottom with GIF thumbnails above each one. Backspace should remove the last letter.

**Step 4: Commit**

```bash
git add src/
git commit -m "add app shell with keyboard input and letter rendering"
```

---

### Task 6: Build UI — Showcase area

**Files:**
- Modify: `src/App.tsx`
- Create: `src/components/Showcase.tsx`

**Step 1: Create Showcase component**

The showcase plays the most recent GIF once. We use an `<img>` tag — to get "play once" behavior, we append a cache-busting param so the browser re-fetches the GIF (which plays from the start), and we do NOT set it to loop. When a new GIF arrives, we swap the src. The previous GIF freezes on its last visible frame naturally since it's replaced.

```tsx
// src/components/Showcase.tsx
import { useRef, useEffect } from "react";

interface ShowcaseProps {
  gifUrl: string | null;
}

export function Showcase({ gifUrl }: ShowcaseProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!gifUrl || !canvasRef.current) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    imgRef.current = img;

    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Draw the first frame as a static fallback
      const size = canvas.width;
      ctx.clearRect(0, 0, size, size);
      // Crop to square center
      const cropSize = Math.min(img.width, img.height);
      const sx = (img.width - cropSize) / 2;
      const sy = (img.height - cropSize) / 2;
      ctx.drawImage(img, sx, sy, cropSize, cropSize, 0, 0, size, size);
    };

    img.src = gifUrl;
  }, [gifUrl]);

  return (
    <div className="showcase">
      {gifUrl && (
        <img
          className="showcase-gif"
          src={gifUrl}
          alt=""
          key={gifUrl + Date.now()}
        />
      )}
    </div>
  );
}
```

Note: True "play once" for GIFs in the browser is non-trivial (GIFs loop by default). For the initial version, the showcase GIF will loop. A future improvement can use a library like `libgif-js` or decode frames to canvas for single-play. The `key` prop forces a remount so the GIF restarts from frame 1 on each new letter.

**Step 2: Wire Showcase into App**

Update `src/App.tsx` to track the latest GIF and render Showcase:

```tsx
// src/App.tsx
import { useTypewriter } from "./hooks/useTypewriter";
import { Showcase } from "./components/Showcase";

function App() {
  const snapshot = useTypewriter();

  if (snapshot.value === "loading") {
    return <div className="loading">loading...</div>;
  }

  const { visibleLetters, events } = snapshot.context;
  const lastKeystroke = [...events].reverse().find((e) => e.type === "keystroke");
  const showcaseGif = lastKeystroke?.gifUrl ?? null;

  return (
    <div className="app">
      <Showcase gifUrl={showcaseGif} />
      <div className="text-line">
        {visibleLetters.map((vl, i) => (
          <div key={i} className="letter-cell">
            {vl.gifUrl && (
              <img className="letter-gif" src={vl.gifUrl} alt="" />
            )}
            <span className="letter">{vl.letter}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
```

**Step 3: Verify in browser**

Type letters — the showcase area should display the most recent GIF large.

**Step 4: Commit**

```bash
git add src/
git commit -m "add showcase component"
```

---

### Task 7: Build UI — Styling

**Files:**
- Modify: `src/index.css`

**Step 1: Write the styles**

Reference the design image (`towards zetetic ends.png`) for visual guidance.

```css
/* src/index.css */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #root {
  height: 100%;
  width: 100%;
}

body {
  font-family: "Courier New", Courier, monospace;
  background: white;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-family: "Courier New", Courier, monospace;
  text-transform: uppercase;
  letter-spacing: 0.3em;
  color: #999;
}

.app {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100%;
  padding: 2rem;
  gap: 3rem;
}

/* Showcase */
.showcase {
  width: 300px;
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.showcase-gif {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Text line */
.text-line {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.2em;
  max-width: 80%;
}

.letter-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 1.5em;
}

.letter-gif {
  width: 32px;
  height: 32px;
  object-fit: cover;
}

.letter {
  font-size: 1rem;
  font-family: "Courier New", Courier, monospace;
  text-transform: uppercase;
  letter-spacing: 0.3em;
}
```

**Step 2: Verify in browser**

Type some text. Layout should match the reference: centered showcase image above, spaced monospace letters below with small GIF thumbnails.

**Step 3: Commit**

```bash
git add src/index.css
git commit -m "add styling"
```

---

### Task 8: Add save functionality

**Files:**
- Modify: `src/App.tsx`
- Create: `src/utils/save.ts`

**Step 1: Write the save utility**

```ts
// src/utils/save.ts
import type { TypewriterEvent } from "../machines/typewriter";

export function downloadRecording(events: TypewriterEvent[]) {
  const data = JSON.stringify({ events }, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `zetetic-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
```

**Step 2: Wire save into App**

Add a save button (or Cmd+S / Ctrl+S shortcut) to App.tsx. Update the keyboard handler in `useTypewriter.ts`:

In `src/hooks/useTypewriter.ts`, add to the `handleKeyDown` function:

```ts
if ((e.metaKey || e.ctrlKey) && e.key === "s") {
  e.preventDefault();
  send({ type: "SAVE" });
  return;
}
```

In `src/App.tsx`, import `downloadRecording` and call it when state transitions to `saved`:

```tsx
import { useEffect } from "react";
import { downloadRecording } from "./utils/save";

// Inside App component, add:
useEffect(() => {
  if (snapshot.value === "saved") {
    downloadRecording(snapshot.context.events);
  }
}, [snapshot.value]);
```

**Step 3: Verify in browser**

Type some text, press Cmd+S. A JSON file should download containing the events array with timestamps and GIF URLs.

**Step 4: Commit**

```bash
git add src/
git commit -m "add save recording functionality"
```

---

### Task 9: End-to-end manual verification

**Step 1: Start fresh dev server**

```bash
npm run dev
```

**Step 2: Verify the full flow**

1. Page loads, shows "loading..." briefly
2. GIFs load, page is blank and ready
3. Type letters — each appears as uppercase monospace with a small looping GIF above it
4. Showcase area shows the most recent GIF at large size
5. Backspace removes the last letter and its GIF
6. Spaces create gaps with no GIF
7. Cmd+S saves a JSON file with all events, timestamps, and GIF URLs
8. After save, typing stops (saved state)

**Step 3: Fix any issues found**

**Step 4: Final commit**

```bash
git add -A
git commit -m "zetetic typewriter v0"
```
