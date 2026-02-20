// Eager glob with ?url gives us resolved asset URLs (hashed in production)
const allGifModules = import.meta.glob("/public/gifs/**/*.gif", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

export function getAvailablePalettes(): string[] {
  const palettes = new Set<string>();
  for (const path of Object.keys(allGifModules)) {
    const match = path.match(/^\/public\/gifs\/([^/]+)\//);
    if (match) palettes.add(match[1]);
  }
  // Ensure "tze" is first
  const sorted = [...palettes].sort((a, b) =>
    a === "tze" ? -1 : b === "tze" ? 1 : a.localeCompare(b)
  );
  return sorted;
}

// Local GIFs organized into palettes (subdirectories of public/gifs/)
export async function fetchGifs(palette: string = "tze"): Promise<string[]> {
  const urls = Object.entries(allGifModules)
    .filter(([path]) => path.startsWith(`/public/gifs/${palette}/`))
    .map(([, url]) => url);

  if (urls.length === 0) {
    throw new Error(`No GIFs found in public/gifs/${palette}/`);
  }

  // Preload all GIFs into browser cache
  await Promise.all(
    urls.map(
      (url) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = url;
        })
    )
  );

  return urls;
}
