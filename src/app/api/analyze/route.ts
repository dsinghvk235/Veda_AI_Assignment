import { NextRequest } from "next/server";
import { z } from "zod";
import { runPipeline } from "@/lib/pipeline";
import type { PipelineStage, ProgressStats } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

const pageSchema = z.object({
  page: z.number(),
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  data: z.string().min(1),
  width: z.number(),
  height: z.number(),
});

const requestSchema = z.object({
  questionFileName: z.string().min(1),
  answerFileName: z.string().min(1),
  questionPages: z.array(pageSchema).min(1).max(8),
  answerPages: z.array(pageSchema).min(1).max(12),
  skipGrading: z.boolean().optional(),
  studentName: z.string().max(80).optional().nullable(),
});

export async function POST(request: NextRequest) {
  const json = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json(
      { error: "Both a question paper and an answer sheet are required (PDF/image pages)." },
      { status: 400 }
    );
  }
  const body = parsed.data;

  if (!process.env.GEMINI_API_KEY) {
    return Response.json(
      {
        error:
          "No AI key is configured. Add GEMINI_API_KEY to .env.local, or use the sample mapping preview.",
      },
      { status: 503 }
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (payload: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      };
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: keepalive\n\n`));
        } catch {
          /* stream already closed */
        }
      }, 8000);

      try {
        const result = await runPipeline({
          questionFileName: body.questionFileName,
          answerFileName: body.answerFileName,
          questionPages: body.questionPages,
          answerPages: body.answerPages,
          skipGrading: body.skipGrading,
          studentName: body.studentName,
          onStage: (stage: PipelineStage, message, progress, stats?: ProgressStats) => {
            send({ type: "progress", stage, message, progress, stats });
          },
        });
        send({ type: "result", result });
      } catch (error) {
        send({
          type: "error",
          error: error instanceof Error ? error.message : "Analysis failed.",
        });
      } finally {
        clearInterval(heartbeat);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
