import { useTypewriter } from "./hooks/useTypewriter";
import { Screen } from "./components/Screen";
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

  if (snapshot.value === "loading") {
    return <div className="loading">loading...</div>;
  }

  const { visibleLetters } = snapshot.context;
  const lastGifLetter = [...visibleLetters].reverse().find((vl) => vl.gifUrl);
  const screenGif = lastGifLetter?.gifUrl ?? null;
  const gifCount = visibleLetters.filter((vl) => vl.gifUrl).length;
  const groups = groupIntoWords(visibleLetters);

  return (
    <div className="app">
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
    </div>
  );
}

export default App;
