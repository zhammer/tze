import type { TypewriterEvent } from "../machines/typewriter";

export function downloadRecording(events: TypewriterEvent[]) {
  const data = JSON.stringify({ events }, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `zetetic-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
