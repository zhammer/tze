import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchGifs } from "./fetchGifs";

describe("fetchGifs", () => {
  beforeEach(() => {
    // Stub Image for Node environment
    vi.stubGlobal(
      "Image",
      class {
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        set src(_: string) {
          // Simulate immediate load
          setTimeout(() => this.onload?.(), 0);
        }
      }
    );
  });

  it("returns an array of unique cataas gif URLs", async () => {
    const gifs = await fetchGifs(5);
    expect(gifs).toHaveLength(5);
    gifs.forEach((url) => {
      expect(url).toContain("cataas.com/cat/gif");
    });
    expect(new Set(gifs).size).toBe(5);
  });
});
