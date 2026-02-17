import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchGifs } from "./fetchGifs";

describe("fetchGifs", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "Image",
      class {
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        set src(_: string) {
          setTimeout(() => this.onload?.(), 0);
        }
      }
    );
  });

  it("returns an array of ocean/scenic giphy gif URLs", async () => {
    const gifs = await fetchGifs();
    expect(gifs.length).toBeGreaterThanOrEqual(20);
    gifs.forEach((url) => {
      expect(url).toContain("media.giphy.com/media/");
    });
    expect(new Set(gifs).size).toBe(gifs.length);
  });
});
