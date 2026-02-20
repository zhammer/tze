const allGifModules = import.meta.glob("/public/gifs/**/*.gif");

export function getAvailablePalettes(): string[] {
  const palettes = new Set<string>();
  for (const path of Object.keys(allGifModules)) {
    const match = path.match(/^\/public\/gifs\/([^/]+)\//);
    if (match) palettes.add(match[1]);
  }
  return [...palettes];
}

// Local GIFs organized into palettes (subdirectories of public/gifs/)
export async function fetchGifs(palette: string = "tze"): Promise<string[]> {
  const paths = Object.keys(allGifModules)
    .filter((path) => path.startsWith(`/public/gifs/${palette}/`))
    .map((path) => path.replace(/^\/public/, ""));

  if (paths.length === 0) {
    throw new Error(`No GIFs found in public/gifs/${palette}/`);
  }

  // Preload all GIFs into browser cache
  await Promise.all(
    paths.map(
      (url) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = url;
        })
    )
  );

  return paths;
}
