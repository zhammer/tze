import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchGifs } from "./fetchGifs";

describe("fetchGifs", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns an array of square gif URLs from giphy trending", async () => {
    const mockResponse = {
      data: [
        {
          images: {
            fixed_width_small: { url: "https://giphy.com/gif1.gif" },
          },
        },
        {
          images: {
            fixed_width_small: { url: "https://giphy.com/gif2.gif" },
          },
        },
      ],
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })
    );

    const gifs = await fetchGifs(2);
    expect(gifs).toEqual([
      "https://giphy.com/gif1.gif",
      "https://giphy.com/gif2.gif",
    ]);
    expect(fetch).toHaveBeenCalledOnce();
  });
});
