import { describe, it, expect } from "vitest";
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
    const firstEvent = snap.context.events[0];
    expect(firstEvent.type === "keystroke" && firstEvent.gifUrl).toBeTruthy();
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

  it("spaces get no gif", () => {
    const actor = createActor(typewriterMachine);
    actor.start();
    actor.send({ type: "GIFS_LOADED", gifs: testGifs });
    actor.send({ type: "KEYSTROKE", letter: " ", timestamp: 1000 });

    const snap = actor.getSnapshot();
    const firstEvent = snap.context.events[0];
    expect(firstEvent.type === "keystroke" && firstEvent.gifUrl).toBeFalsy();
  });
});
