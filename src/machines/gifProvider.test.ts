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
