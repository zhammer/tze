import { setup, assign, fromPromise } from "xstate";
import { fetchGifs, getAvailablePalettes } from "../gif/fetchGifs";

export interface PaletteRing {
  palette: string;
  gifs: string[];
  x: number;
  y: number;
}

const loadPalette = fromPromise(
  async ({ input }: { input: { palette: string } }) => {
    const gifs = await fetchGifs(input.palette);
    return gifs;
  }
);

export const paletteMachine = setup({
  types: {
    context: {} as {
      palettes: string[];
      currentIndex: number;
      ring: PaletteRing | null;
      currentGifs: string[];
    },
    events: {} as
      | { type: "CLICK"; x: number; y: number }
      | { type: "PALETTE_LOADED"; gifs: string[] },
  },
  actors: {
    loadPalette,
  },
}).createMachine({
  id: "palette",
  initial: "idle",
  context: () => {
    const palettes = getAvailablePalettes();
    return {
      palettes,
      currentIndex: 0,
      ring: null,
      currentGifs: [],
    };
  },
  states: {
    idle: {
      on: {
        CLICK: {
          target: "loading",
          actions: assign(({ context, event }) => {
            const nextIndex =
              (context.currentIndex + 1) % context.palettes.length;
            return {
              currentIndex: nextIndex,
              ring: {
                palette: context.palettes[nextIndex],
                gifs: [],
                x: event.x,
                y: event.y,
              },
            };
          }),
        },
      },
    },
    loading: {
      invoke: {
        src: "loadPalette",
        input: ({ context }) => ({
          palette: context.palettes[context.currentIndex],
        }),
        onDone: {
          target: "showing",
          actions: assign(({ context, event }) => ({
            currentGifs: event.output,
            ring: context.ring
              ? { ...context.ring, gifs: event.output }
              : null,
          })),
        },
        onError: {
          target: "idle",
        },
      },
    },
    showing: {
      on: {
        CLICK: {
          target: "loading",
          actions: assign(({ context, event }) => {
            const nextIndex =
              (context.currentIndex + 1) % context.palettes.length;
            return {
              currentIndex: nextIndex,
              ring: {
                palette: context.palettes[nextIndex],
                gifs: [],
                x: event.x,
                y: event.y,
              },
            };
          }),
        },
      },
    },
  },
});
