import { useTypewriter } from "./hooks/useTypewriter";

function App() {
  const { snapshot } = useTypewriter();

  if (snapshot.value === "loading") {
    return <div className="loading">loading...</div>;
  }

  return (
    <div className="app">
      <div className="showcase">
        {/* Showcase built in Task 6 */}
      </div>
      <div className="text-line">
        {snapshot.context.visibleLetters.map((vl, i) => (
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
