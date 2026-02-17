interface ShowcaseProps {
  gifUrl: string | null;
}

export function Showcase({ gifUrl }: ShowcaseProps) {
  return (
    <div className="showcase">
      {gifUrl && (
        <img
          className="showcase-gif"
          src={gifUrl}
          alt=""
          key={gifUrl + Date.now()}
        />
      )}
    </div>
  );
}
