// Curated ocean/sunset/scenic GIFs from Giphy (public media URLs, no key needed)
const OCEAN_GIFS = [
  "ZFECyR7nxRzIuoysMZ",
  "ToXKNQZXzu6dHD0nAJ",
  "1JsSOW3M1y8xefYZAD",
  "FgJ6FbfJGwztK",
  "A1xoTo7Tnt6djulUMr",
  "tMM0V0ySApEyZRLQhk",
  "cmhIggx11YJNC14dH6",
  "2mhkwykeGYQXY63CPx",
  "qRO510UMw6fNm",
  "DScvxRbnVt0pEljRPi",
  "7Spn4psPPu6LC",
  "dP8DxhD9ekk1i",
  "SoDd3yWRAQUoulUNO0",
  "xMsQnNEcEB91FSwslE",
  "6yQq08riFOmeYkW3Xg",
  "64hmq9TSgOv3VJl9tk",
  "13nXJ5b7jn23ba",
  "xgjwA996AY0jhDzZYJ",
  "l9TsFmdP8l5QBGfgKH",
  "7L3uuTQRstqL0RP6h3",
  "pzNx2T4lqXqIw3nnO8",
  "HGvjR72DXRHWw",
  "bgv4OvHBEbBQc",
  "ajEzg2TpZfnLdA1BBn",
  "nlOKVAhVazSMzLvtIj",
  "3oz8xur099boo4N9aU",
  "11i4hptC71c90c",
  "PhS7xRCMCIpBTvEmWs",
  "Fbox1ygIqnga5dLinz",
  "798oH0WDEQnicM4857",
].map((id) => `https://media.giphy.com/media/${id}/giphy.gif`);

export async function fetchGifs(): Promise<string[]> {
  // Preload all GIFs into browser cache so they display instantly when typing
  await Promise.all(
    OCEAN_GIFS.map(
      (url) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = url;
        })
    )
  );

  return OCEAN_GIFS;
}
