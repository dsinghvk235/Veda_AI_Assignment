import type { AnalysisResult, ProgressEvent } from "./types";

type StreamEvent =
  | ({ type: "progress" } & ProgressEvent)
  | { type: "result"; result: AnalysisResult }
  | { type: "error"; error: string };

export async function analyzeDocuments(
  payload: unknown,
  onProgress: (event: Extract<StreamEvent, { type: "progress" }>) => void
): Promise<AnalysisResult> {
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok || !response.body) {
    const fallback = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(humanizeError((fallback as { error?: string }).error || "Analysis request failed."));
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let result: AnalysisResult | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split("\n\n");
    buffer = chunks.pop() ?? "";

    for (const chunk of chunks) {
      const line = chunk.split("\n").find((entry) => entry.startsWith("data: "));
      if (!line) continue;
      const event = JSON.parse(line.slice(6)) as StreamEvent;
      if (event.type === "progress") onProgress(event);
      if (event.type === "error") throw new Error(humanizeError(event.error));
      if (event.type === "result") result = event.result;
    }
  }

  if (!result) throw new Error("The model finished without returning a result.");
  return result;
}

export function humanizeError(message: string) {
  if (/timed out|too long/i.test(message)) {
    return "The paper took too long to read. Try a shorter PDF or a clearer scan.";
  }
  if (/HTTP2|SSL|fetch failed|session/i.test(message)) {
    return "The connection to the model dropped. Wait a moment and try again.";
  }
  if (/quota|billing|429|rate limit/i.test(message)) {
    return "The model is rate-limited right now. Wait a moment and try again.";
  }
  if (/API_KEY|not set/i.test(message)) {
    return "No AI key is configured. Add GEMINI_API_KEY to .env.local, or preview the sample mapping.";
  }
  return message.replace(/^Gemini:\s*/i, "");
}
