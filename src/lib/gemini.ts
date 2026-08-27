import { Agent, fetch as undiciFetch } from "undici";

type SchemaObject = Record<string, unknown>;

const GEMINI_MODELS = ["gemini-3.5-flash-lite", "gemini-3.6-flash"];

const TEXT_TIMEOUT_MS = 30_000;
const VISION_TIMEOUT_MS = 120_000;

function parseJson<T>(raw: string): T {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("Model did not return JSON.");
  }
  return JSON.parse(cleaned.slice(start, end + 1)) as T;
}

function extractGeminiText(payload: unknown): string {
  const data = payload as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    error?: { message?: string };
  };
  if (data.error?.message) throw new Error(data.error.message);
  return (data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "").trim();
}

function describeError(error: unknown): string {
  if (!(error instanceof Error)) return String(error);
  if (error.name === "TimeoutError" || error.name === "AbortError" || /timeout|aborted/i.test(error.message)) {
    return "request timed out";
  }
  const cause = (error as Error & { cause?: { code?: string; message?: string } }).cause;
  const extra = [cause?.code, cause?.message].filter(Boolean).join(" ");
  if (error.message === "fetch failed" && extra) return `fetch failed (${extra})`;
  return extra && !error.message.includes(extra) ? `${error.message} (${extra})` : error.message;
}

function isConnectionError(message: string) {
  return /HTTP2_INVALID_SESSION|session has been destroyed|BAD_RECORD_MAC|ECONNRESET|EPIPE|UND_ERR|SSL|fetch failed/i.test(
    message
  );
}

async function postGemini(url: string, body: string, timeoutMs: number) {
  const agent = new Agent({
    connect: { timeout: 20_000 },
    headersTimeout: timeoutMs,
    bodyTimeout: timeoutMs,
    keepAliveTimeout: 1,
    keepAliveMaxTimeout: 1,
    connections: 1,
  });

  try {
    const response = await undiciFetch(url, {
      method: "POST",
      dispatcher: agent,
      headers: { "Content-Type": "application/json", Connection: "close" },
      body,
      signal: AbortSignal.timeout(timeoutMs),
    });
    const json = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    return { ok: response.ok, status: response.status, json };
  } finally {
    await agent.close().catch(() => undefined);
  }
}

async function generateWithGemini<T>(args: {
  prompt: string;
  images: Array<{ mimeType: string; data: string }>;
  schema: SchemaObject;
  temperature?: number;
}): Promise<T> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set.");

  const parts = [
    ...args.images.map((image) => ({
      inlineData: { mimeType: image.mimeType, data: image.data },
    })),
    { text: args.prompt },
  ];
  const timeoutMs = args.images.length ? VISION_TIMEOUT_MS : TEXT_TIMEOUT_MS;
  const temperature = args.temperature ?? 0.1;
  let lastError: Error | null = null;

  for (const model of GEMINI_MODELS) {
    let thinking: "minimal" | "off" = "minimal";
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const generationConfig: Record<string, unknown> = {
        temperature,
        responseMimeType: "application/json",
        responseSchema: args.schema,
        maxOutputTokens: 8192,
      };
      if (thinking === "minimal") {
        generationConfig.thinkingConfig = { thinkingLevel: "minimal" };
      }

      try {
        const { ok, status, json } = await postGemini(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
          JSON.stringify({
            contents: [{ role: "user", parts }],
            generationConfig,
          }),
          timeoutMs
        );
        if (!ok) {
          const message =
            (json as { error?: { message?: string } }).error?.message ?? `Gemini HTTP ${status}`;
          lastError = new Error(message);
          if (/thinking/i.test(message) && thinking === "minimal") {
            thinking = "off";
            continue;
          }
          if (status === 429 && attempt < 2) {
            await new Promise((resolve) => setTimeout(resolve, 1200 * (attempt + 1)));
            continue;
          }
          if (status === 404 || /not found|no longer available|not supported/i.test(message)) {
            break;
          }
          throw lastError;
        }

        return parseJson<T>(extractGeminiText(json));
      } catch (error) {
        lastError = new Error(describeError(error));
        if (/thinking/i.test(lastError.message) && thinking === "minimal") {
          thinking = "off";
          continue;
        }
        if (lastError.message === "request timed out") {
          break;
        }
        if (isConnectionError(lastError.message) && attempt < 2) {
          await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
          continue;
        }
        if (/429|rate limit/i.test(lastError.message) && attempt < 2) {
          await new Promise((resolve) => setTimeout(resolve, 1200 * (attempt + 1)));
          continue;
        }
        break;
      }
    }
  }

  throw lastError ?? new Error("No Gemini model was available.");
}

export async function generateJson<T>(args: {
  prompt: string;
  images: Array<{ mimeType: string; data: string }>;
  schema: SchemaObject;
  temperature?: number;
}): Promise<T> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set in .env.local.");
  }

  try {
    return await generateWithGemini<T>(args);
  } catch (error) {
    const message = describeError(error);
    if (message === "request timed out") {
      throw new Error(
        "The model took too long on these pages. Try a shorter PDF (2–4 pages) or clearer scans."
      );
    }
    throw new Error(`Gemini: ${message}`);
  }
}
