import { useEffect } from "react";
import { useMachine } from "@xstate/react";
import { typewriterMachine } from "../machines/typewriter";
import { fetchGifs } from "../gif/fetchGifs";
import { downloadRecording } from "../utils/save";

const VALID_KEY_REGEX = /^[a-zA-Z0-9 !@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]$/;

export function useTypewriter() {
  const [snapshot, send] = useMachine(typewriterMachine);

  // Fetch GIFs on mount
  useEffect(() => {
    fetchGifs().then((gifs) => {
      send({ type: "GIFS_LOADED", gifs });
    });
  }, [send]);

  // Listen for keystrokes
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        downloadRecording(snapshot.context.events);
        return;
      }

      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (snapshot.value === "saved" || snapshot.value === "done") return;

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
  }, [snapshot.value, send]);

  return { snapshot, send };
}
