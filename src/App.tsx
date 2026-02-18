import { useEffect } from "react";
import { useTypewriter } from "./hooks/useTypewriter";
import { Showcase } from "./components/Showcase";
import { downloadRecording } from "./utils/save";
import type { VisibleLetter } from "./machines/typewriter";

function groupIntoWords(letters: VisibleLetter[]): VisibleLetter[][] {
  const words: VisibleLetter[][] = [];
  let current: VisibleLetter[] = [];
  for (const vl of letters) {
    if (vl.letter === " ") {
      if (current.length > 0) {
        words.push(current);
        current = [];
      }
      words.push([vl]);
    } else {
      current.push(vl);
    }
  }
  if (current.length > 0) {
    words.push(current);
  }
  return words;
}

function App() {
  const { snapshot } = useTypewriter();

  useEffect(() => {
    if (snapshot.value === "saved") {
      downloadRecording(snapshot.context.events);
    }
  }, [snapshot.value]);

  if (snapshot.value === "loading") {
    return <div className="loading">loading...</div>;
  }

  const { visibleLetters, events } = snapshot.context;
  const lastKeystroke = [...events].reverse().find((e) => e.type === "keystroke");
  const showcaseGif = lastKeystroke?.gifUrl ?? null;
  const words = groupIntoWords(visibleLetters);

  return (
    <div className="app">
      <Showcase gifUrl={showcaseGif} />
      <div className="text-line">
        {words.map((word, wi) => (
          <span key={wi} className={word.length === 1 && word[0].letter === " " ? "word-space" : "word"}>
            {word.map((vl, li) => (
              <div key={li} className="letter-cell">
                {vl.gifUrl && (
                  <img className="letter-gif" src={vl.gifUrl} alt="" />
                )}
                <span className="letter">{vl.letter === " " ? "\u00A0" : vl.letter}</span>
              </div>
            ))}
          </span>
        ))}
      </div>
    </div>
  );
}

export default App;
