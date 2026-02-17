const GIPHY_API_KEY = import.meta.env.VITE_GIPHY_API_KEY ?? "";

export async function fetchGifs(limit: number = 50): Promise<string[]> {
  const url = `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=${limit}&rating=g`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Giphy API error: ${response.status}`);
  }

  const json = await response.json();
  return json.data.map(
    (gif: any) => gif.images.fixed_width_small.url as string
  );
}
