import { useRef } from "react";

interface ScreenProps {
  gifUrl: string | null;
  gifCount: number;
}

export function Screen({ gifUrl, gifCount }: ScreenProps) {
  const prevRef = useRef<{ url: string; count: number } | null>(null);

  const prev = prevRef.current;
  if (!gifUrl) {
    prevRef.current = null;
  } else if (!prev || prev.count !== gifCount) {
    prevRef.current = { url: gifUrl, count: gifCount };
  }

  // Show previous + current so there's no blank frame during transition
  const layers: { url: string; key: number }[] = [];
  if (prev && gifUrl && prev.count !== gifCount && prev.url !== gifUrl) {
    layers.push({ url: prev.url, key: prev.count });
  }
  if (gifUrl) {
    layers.push({ url: gifUrl, key: gifCount });
  }

  return (
    <div className="screen">
      {layers.map((layer) => (
        <img className="screen-gif" src={layer.url} alt="" key={layer.key} />
      ))}
    </div>
  );
}
