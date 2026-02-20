interface ScreenProps {
  gifUrl: string | null;
}

export function Screen({ gifUrl }: ScreenProps) {
  return (
    <div className="screen">
      {gifUrl && (
        <img className="screen-gif" src={gifUrl} alt="" />
      )}
    </div>
  );
}
