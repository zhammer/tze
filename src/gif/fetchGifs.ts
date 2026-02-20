// Local GIFs organized into palettes (subdirectories of public/gifs/)
export async function fetchGifs(palette: string = "tze"): Promise<string[]> {
  const modules = import.meta.glob("/public/gifs/**/*.gif");
  const paths = Object.keys(modules)
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
