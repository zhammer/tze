export async function fetchGifs(limit: number = 30): Promise<string[]> {
  const urls = Array.from(
    { length: limit },
    (_, i) => `https://cataas.com/cat/gif?type=square&_=${Date.now()}-${i}`
  );

  // Preload all GIFs into browser cache so they display instantly when typing
  await Promise.all(
    urls.map(
      (url) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => resolve(); // don't block on failures
          img.src = url;
        })
    )
  );

  return urls;
}
