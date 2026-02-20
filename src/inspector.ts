import { createBrowserInspector } from "@statelyai/inspect";

const shouldInspect =
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).has("inspect");

const inspector = shouldInspect ? createBrowserInspector() : null;

export const inspect = inspector?.inspect;
