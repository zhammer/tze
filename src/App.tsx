import { useTypewriter } from "./hooks/useTypewriter";
import { Showcase } from "./components/Showcase";

function App() {
  const { snapshot } = useTypewriter();

  if (snapshot.value === "loading") {
    return <div className="loading">loading...</div>;
  }

  const { visibleLetters, events } = snapshot.context;
  const lastKeystroke = [...events].reverse().find((e) => e.type === "keystroke");
  const showcaseGif = lastKeystroke?.gifUrl ?? null;

  return (
    <div className="app">
      <Showcase gifUrl={showcaseGif} />
      <div className="text-line">
        {visibleLetters.map((vl, i) => (
          <div key={i} className="letter-cell">
            {vl.gifUrl && (
              <img className="letter-gif" src={vl.gifUrl} alt="" />
            )}
            <span className="letter">{vl.letter}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
