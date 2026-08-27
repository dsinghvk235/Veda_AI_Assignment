import type { PageImage } from "./types";

const MAX_WIDTH = 900;
const JPEG_QUALITY = 0.45;
export const MAX_FILE_BYTES = 20 * 1024 * 1024;
export const MAX_QUESTION_PAGES = 8;
export const MAX_ANSWER_PAGES = 12;

export function pageThumbSrc(page: PageImage, maxEdge = 140): Promise<string> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      const scale = Math.min(1, maxEdge / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve("");
        return;
      }
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.55));
    };
    image.onerror = () => resolve("");
    image.src = `data:${page.mimeType};base64,${page.data}`;
  });
}

function loadImage(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image file."));
    };
    image.src = url;
  });
}

function canvasToPage(canvas: HTMLCanvasElement, page: number): PageImage {
  const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  const [, data] = dataUrl.split(",");
  return {
    page,
    mimeType: "image/jpeg",
    data,
    width: canvas.width,
    height: canvas.height,
  };
}

function drawToCanvas(source: CanvasImageSource, width: number, height: number) {
  const scale = Math.min(1, MAX_WIDTH / width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available in this browser.");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

async function rasterizePdf(file: File, maxPages: number): Promise<PageImage[]> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const pageCount = Math.min(pdf.numPages, maxPages);
  const pages: PageImage[] = [];

  for (let index = 1; index <= pageCount; index += 1) {
    const page = await pdf.getPage(index);
    const viewport = page.getViewport({ scale: 1.15 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas is not available in this browser.");
    await page.render({ canvas, canvasContext: ctx, viewport }).promise;
    const fitted = drawToCanvas(canvas, canvas.width, canvas.height);
    pages.push(canvasToPage(fitted, index));
  }

  return pages;
}

async function rasterizeImage(file: File, page = 1): Promise<PageImage> {
  const image = await loadImage(file);
  const canvas = drawToCanvas(image, image.naturalWidth || image.width, image.naturalHeight || image.height);
  return canvasToPage(canvas, page);
}

export async function rasterizeFile(file: File, kind: "question" | "answer"): Promise<PageImage[]> {
  const maxPages = kind === "question" ? MAX_QUESTION_PAGES : MAX_ANSWER_PAGES;
  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
    return rasterizePdf(file, maxPages);
  }
  if (!file.type.startsWith("image/")) {
    throw new Error("Please upload a PDF or an image (JPG, PNG, WEBP).");
  }
  return [await rasterizeImage(file)];
}

export function isAllowedFile(file: File) {
  const name = file.name.toLowerCase();
  return (
    file.type === "application/pdf" ||
    name.endsWith(".pdf") ||
    file.type.startsWith("image/") ||
    /\.(png|jpe?g|webp|gif|heic)$/i.test(name)
  );
}
