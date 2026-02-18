import { setup, assign, type ActorRefFrom } from "xstate";
import { gifProviderMachine } from "./gifProvider";

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
        KEYSTROKE: {
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
