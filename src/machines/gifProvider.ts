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
