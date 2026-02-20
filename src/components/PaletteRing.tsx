import type { PaletteRing as PaletteRingData } from "../machines/palette";

interface PaletteRingProps {
  ring: PaletteRingData;
}

export function PaletteRing({ ring }: PaletteRingProps) {
  const { gifs, x, y } = ring;

  if (gifs.length === 0) return null;

  const count = gifs.length;

  return (
    <div
      className="palette-ring"
      key={ring.palette}
      style={{ left: x, top: y }}
    >
      <div className="palette-ring-orbit">
        {gifs.map((gif, i) => {
          const angle = (360 / count) * i;
          return (
            <div
              key={gif}
              className="palette-ring-thumb"
              style={{
                "--angle": `${angle}deg`,
                "--i": i,
              } as React.CSSProperties}
            >
              <img src={gif} alt="" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
