// Local GIFs converted from videos in /videos via scripts/convert-videos.sh
export async function fetchGifs(): Promise<string[]> {
  const modules = import.meta.glob("/public/gifs/*.gif");
  const paths = Object.keys(modules).map((path) =>
    path.replace(/^\/public/, "")
  );

  if (paths.length === 0) {
    throw new Error("No GIFs found in public/gifs/");
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
