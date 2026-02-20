import { useEffect } from "react";
import { useTypewriter } from "./hooks/useTypewriter";
import { Screen } from "./components/Screen";
import { downloadRecording } from "./utils/save";
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
  const lastGifKeystroke = [...events].reverse().find((e) => e.type === "keystroke" && e.gifUrl);
  const screenGif = lastGifKeystroke?.gifUrl ?? null;
  const gifCount = events.filter((e) => e.type === "keystroke" && e.gifUrl).length;
  const groups = groupIntoWords(visibleLetters);

  return (
    <div className="app">
      <Screen key={gifCount} gifUrl={screenGif} />
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
    </div>
  );
}

export default App;
