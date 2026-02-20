import { useEffect, useRef, useCallback } from "react";
import { useMachine } from "@xstate/react";
import { typewriterMachine } from "../machines/typewriter";
import { downloadRecording } from "../utils/save";

const VALID_KEY_REGEX = /^[a-zA-Z0-9 !@#$%^&*()_+=[\]{};':"\\|,.<>/?-]$/;

// Sentinel character kept in the hidden input so that mobile backspace
// always produces a deleteContentBackward inputType event.
const SENTINEL = "\u200B";

export function useTypewriter() {
  const [snapshot, send] = useMachine(typewriterMachine);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep snapshot values in refs so the input handler doesn't need them
  // as effect dependencies (avoids re-binding on every keystroke).
  const snapshotRef = useRef(snapshot);
  useEffect(() => {
    snapshotRef.current = snapshot;
  });

  // Physical keyboard: keep existing keydown handler for desktop.
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ignore events that originate from the hidden input — those are
      // handled by the input event listener instead.
      if (e.target === inputRef.current) return;

      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        downloadRecording(snapshotRef.current.context.events);
        return;
      }

      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (snapshotRef.current.value === "done") return;

      const timestamp = Date.now();

      if (e.key === "Backspace") {
        e.preventDefault();
        send({ type: "BACKSPACE", timestamp });
      } else if (e.key === "Enter") {
        e.preventDefault();
        send({ type: "KEYSTROKE", letter: "\n", timestamp });
      } else if (VALID_KEY_REGEX.test(e.key)) {
        e.preventDefault();
        send({ type: "KEYSTROKE", letter: e.key.toUpperCase(), timestamp });
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [send]);

  // Mobile keyboard: capture input via beforeinput/input on the hidden element.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;

    // Reset the input to just the sentinel.
    el.value = SENTINEL;

    function handleBeforeInput(e: InputEvent) {
      if (snapshotRef.current.value === "done") return;
      const timestamp = Date.now();

      if (e.inputType === "deleteContentBackward") {
        e.preventDefault();
        send({ type: "BACKSPACE", timestamp });
        // Restore sentinel so future backspaces still fire.
        if (el) el.value = SENTINEL;
        return;
      }

      if (e.inputType === "insertLineBreak" || e.inputType === "insertParagraph") {
        e.preventDefault();
        send({ type: "KEYSTROKE", letter: "\n", timestamp });
        if (el) el.value = SENTINEL;
        return;
      }

      if (e.inputType === "insertText" && e.data) {
        e.preventDefault();
        for (const char of e.data) {
          if (VALID_KEY_REGEX.test(char)) {
            send({ type: "KEYSTROKE", letter: char.toUpperCase(), timestamp });
          }
        }
        if (el) el.value = SENTINEL;
        return;
      }
    }

    // Fallback: if beforeinput doesn't fully cover (some older browsers),
    // use the input event to catch anything that slipped through.
    function handleInput() {
      if (!el) return;
      // After every input event, reset to sentinel to keep things clean.
      el.value = SENTINEL;
    }

    function handleKeyDown(e: KeyboardEvent) {
      // Cmd/Ctrl+S save shortcut from hidden input.
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        downloadRecording(snapshotRef.current.context.events);
        return;
      }

      // For physical keyboards typing into the hidden input, let
      // beforeinput handle the actual character — but we still need to
      // handle Backspace/Enter for desktop browsers that focus this element.
      if (snapshotRef.current.value === "done") return;
      const timestamp = Date.now();

      if (e.key === "Backspace") {
        e.preventDefault();
        send({ type: "BACKSPACE", timestamp });
        if (el) el.value = SENTINEL;
      } else if (e.key === "Enter") {
        e.preventDefault();
        send({ type: "KEYSTROKE", letter: "\n", timestamp });
        if (el) el.value = SENTINEL;
      } else if (VALID_KEY_REGEX.test(e.key)) {
        e.preventDefault();
        send({ type: "KEYSTROKE", letter: e.key.toUpperCase(), timestamp });
        if (el) el.value = SENTINEL;
      }
    }

    el.addEventListener("beforeinput", handleBeforeInput);
    el.addEventListener("input", handleInput);
    el.addEventListener("keydown", handleKeyDown);
    return () => {
      el.removeEventListener("beforeinput", handleBeforeInput);
      el.removeEventListener("input", handleInput);
      el.removeEventListener("keydown", handleKeyDown);
    };
  }, [send]);

  // Re-focus the hidden input whenever the user taps the page.
  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  return { snapshot, send, inputRef, focusInput };
}
