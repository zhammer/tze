import { useEffect, useCallback } from "react";
import { useMachine } from "@xstate/react";
import { useTypewriter } from "./hooks/useTypewriter";
import { Screen } from "./components/Screen";
import { PaletteRing } from "./components/PaletteRing";
import { paletteMachine } from "./machines/palette";
import { fetchGifs } from "./gif/fetchGifs";
import type { VisibleLetter } from "./machines/typewriter";

type WordGroup =
  | { type: "word"; letters: VisibleLetter[] }
  | { type: "space" }
  | { type: "newline" };

function groupIntoWords(letters: VisibleLetter[]): WordGroup[] {
  const groups: WordGroup[] = [];
  let current: VisibleLetter[] = [];
  for (const vl of letters) {
    if (vl.letter === "\n") {
      if (current.length > 0) {
        groups.push({ type: "word", letters: current });
        current = [];
      }
      groups.push({ type: "newline" });
    } else if (vl.letter === " ") {
      if (current.length > 0) {
        groups.push({ type: "word", letters: current });
        current = [];
      }
      groups.push({ type: "space" });
    } else {
      current.push(vl);
    }
  }
  if (current.length > 0) {
    groups.push({ type: "word", letters: current });
  }
  return groups;
}

function App() {
  const { snapshot: twSnapshot, send: twSend } = useTypewriter();
  const [paletteSnapshot, paletteSend] = useMachine(paletteMachine);

  // Load the first palette on mount
  useEffect(() => {
    const firstPalette = paletteSnapshot.context.palettes[0];
    if (firstPalette && twSnapshot.value === "loading") {
      fetchGifs(firstPalette).then((gifs) => {
        twSend({ type: "GIFS_LOADED", gifs });
      });
    }
  }, []);

  // When palette machine finishes loading a new palette, feed GIFs to typewriter
  useEffect(() => {
    const { currentGifs } = paletteSnapshot.context;
    if (currentGifs.length > 0 && paletteSnapshot.value === "showing") {
      twSend({ type: "GIFS_LOADED", gifs: currentGifs });
    }
  }, [paletteSnapshot.value, paletteSnapshot.context.currentGifs]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      paletteSend({ type: "CLICK", x: e.clientX, y: e.clientY });
    },
    [paletteSend]
  );

  if (twSnapshot.value === "loading") {
    return <div className="loading">loading...</div>;
  }

  const { visibleLetters } = twSnapshot.context;
  const lastGifLetter = [...visibleLetters].reverse().find((vl) => vl.gifUrl);
  const screenGif = lastGifLetter?.gifUrl ?? null;
  const gifCount = visibleLetters.filter((vl) => vl.gifUrl).length;
  const groups = groupIntoWords(visibleLetters);
  const ring = paletteSnapshot.context.ring;

  return (
    <div className="app" onClick={handleClick}>
      <Screen gifUrl={screenGif} gifCount={gifCount} />
      <div className="text-line">
        {groups.map((group, gi) => {
          if (group.type === "newline") {
            return <div key={gi} className="line-break" />;
          }
          if (group.type === "space") {
            return <span key={gi} className="word-space" />;
          }
          return (
            <span key={gi} className="word">
              {group.letters.map((vl, li) => (
                <div key={li} className="letter-cell">
                  <div className="letter-gif-slot">
                    {vl.gifUrl && (
                      <img className="letter-gif" src={vl.gifUrl} alt="" />
                    )}
                  </div>
                  <span className="letter">{vl.letter}</span>
                </div>
              ))}
            </span>
          );
        })}
      </div>
      {ring && ring.gifs.length > 0 && (
        <PaletteRing ring={ring} />
      )}
    </div>
  );
}

export default App;
