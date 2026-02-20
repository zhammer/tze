import { setup, assign, type ActorRefFrom } from "xstate";
import { gifProviderMachine } from "./gifProvider";

export type TypewriterEvent =
  | { t: number; type: "keystroke"; letter: string; gifUrl?: string }
  | { t: number; type: "backspace" };

export type VisibleLetter = {
  letter: string;
  gifUrl?: string;
};

type GifProviderRef = ActorRefFrom<typeof gifProviderMachine>;

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
      gifProviderRef: GifProviderRef | null;
      gifProviders: Record<string, GifProviderRef>;
    },
    events: {} as
      | { type: "GIFS_LOADED"; gifs: string[]; palette: string }
      | { type: "KEYSTROKE"; letter: string; timestamp: number }
      | { type: "BACKSPACE"; timestamp: number }
  },
  actors: {
    gifProvider: gifProviderMachine,
  },
}).createMachine({
  id: "typewriter",
  initial: "loading",
  context: {
    events: [],
    visibleLetters: [],
    startTime: null,
    gifProviderRef: null,
    gifProviders: {},
  },
  states: {
    loading: {
      on: {
        GIFS_LOADED: {
          target: "ready",
          actions: assign(({ context, event, spawn }) => {
            const ref = spawn("gifProvider", {
              input: { gifs: event.gifs },
              id: `gifProvider-${event.palette}`,
            });
            return {
              gifProviderRef: ref,
              gifProviders: { ...context.gifProviders, [event.palette]: ref },
            };
          }),
        },
      },
    },
    ready: {
      on: {
        GIFS_LOADED: {
          actions: assign(({ context, event, spawn }) => {
            const existing = context.gifProviders[event.palette];
            if (existing) {
              return { gifProviderRef: existing };
            }
            const ref = spawn("gifProvider", {
              input: { gifs: event.gifs },
              id: `gifProvider-${event.palette}`,
            });
            return {
              gifProviderRef: ref,
              gifProviders: { ...context.gifProviders, [event.palette]: ref },
            };
          }),
        },
        KEYSTROKE: {
          target: "typing",
          actions: assign(({ context, event }) => {
            const startTime = event.timestamp;
            const gifProviderRef = context.gifProviderRef!;

            let gifUrl: string | undefined;
            if (/^[A-Z0-9]$/i.test(event.letter)) {
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
        GIFS_LOADED: {
          actions: assign(({ context, event, spawn }) => {
            const existing = context.gifProviders[event.palette];
            if (existing) {
              return { gifProviderRef: existing };
            }
            const ref = spawn("gifProvider", {
              input: { gifs: event.gifs },
              id: `gifProvider-${event.palette}`,
            });
            return {
              gifProviderRef: ref,
              gifProviders: { ...context.gifProviders, [event.palette]: ref },
            };
          }),
        },
        KEYSTROKE: [
          {
            guard: ({ context, event }) => {
              const vl = context.visibleLetters;
              return event.letter === "\n" && vl.length > 0 && vl[vl.length - 1].letter === "\n";
            },
            target: "done",
            actions: assign(({ context }) => {
              // Remove the trailing newline before finishing
              const visibleLetters = context.visibleLetters.slice(0, -1);
              return { visibleLetters };
            }),
          },
          {
          actions: assign(({ context, event }) => {
            const t = event.timestamp - context.startTime!;
            const gifProviderRef = context.gifProviderRef!;

            let gifUrl: string | undefined;
            if (/^[A-Z0-9]$/i.test(event.letter)) {
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
        }],
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
      },
    },
    done: {
      type: "final",
    },
  },
});
