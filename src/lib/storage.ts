import type { AnalysisResult } from "./types";

const LAST_KEY = "veda:last-analysis";
const LIBRARY_KEY = "veda:library";
const PAPERS_KEY = "veda:papers";

let memoryCache: AnalysisResult | null = null;
const papersMemory = new Map<string, AnalysisResult>();

export type LibraryItem = {
  id: string;
  createdAt: string;
  questionFileName: string;
  answerFileName: string;
  studentName: string | null;
  awardedMarks: number;
  totalMarks: number;
  answered: number;
  totalQuestions: number;
  unmapped: number;
  thumbnail: string | null;
  graded: boolean;
};

export function saveAnalysis(result: AnalysisResult, thumbnail?: string | null) {
  memoryCache = result;
  papersMemory.set(result.id, result);
  if (typeof window === "undefined") return;
  persistPaper(result);
  try {
    sessionStorage.setItem(LAST_KEY, JSON.stringify(result));
  } catch {
    const compact = { ...result, questionPages: [] as AnalysisResult["questionPages"] };
    try {
      sessionStorage.setItem(LAST_KEY, JSON.stringify(compact));
    } catch {
      /* in-memory cache still serves this tab */
    }
  }

  const library = loadLibrarySnapshot().filter((item) => item.id !== result.id);
  const summary: LibraryItem = {
    id: result.id,
    createdAt: result.createdAt,
    questionFileName: result.questionFileName,
    answerFileName: result.answerFileName,
    studentName: result.studentName ?? null,
    awardedMarks: result.awardedMarks,
    totalMarks: result.totalMarks,
    answered: result.items.filter((item) => item.answer).length,
    totalQuestions: result.items.length,
    unmapped: result.unmappedAnswers.length,
    thumbnail: thumbnail ?? library.find((item) => item.id === result.id)?.thumbnail ?? null,
    graded: result.graded !== false,
  };
  try {
    const next = [summary, ...library].slice(0, 12);
    sessionStorage.setItem(LIBRARY_KEY, JSON.stringify(next));
    libraryRaw = JSON.stringify(next);
    libraryCache = next;
  } catch {
    /* ignore quota */
  }
}

function persistPaper(result: AnalysisResult) {
  try {
    const raw = sessionStorage.getItem(PAPERS_KEY);
    const papers = raw ? (JSON.parse(raw) as Record<string, AnalysisResult>) : {};
    papers[result.id] = { ...result, questionPages: [] };
    const ids = Object.keys(papers);
    if (ids.length > 4) {
      for (const id of ids.slice(0, ids.length - 4)) delete papers[id];
    }
    sessionStorage.setItem(PAPERS_KEY, JSON.stringify(papers));
  } catch {
    try {
      sessionStorage.setItem(PAPERS_KEY, JSON.stringify({ [result.id]: { ...result, questionPages: [] } }));
    } catch {
      /* quota */
    }
  }
}

export function loadPaper(id: string): AnalysisResult | null {
  if (papersMemory.has(id)) return papersMemory.get(id) ?? null;
  if (memoryCache?.id === id) return memoryCache;
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(PAPERS_KEY);
    if (!raw) return null;
    const papers = JSON.parse(raw) as Record<string, AnalysisResult>;
    const paper = papers[id] ?? null;
    if (paper) papersMemory.set(id, paper);
    return paper;
  } catch {
    return null;
  }
}

export function openPaper(id: string): AnalysisResult | null {
  const paper = loadPaper(id);
  if (!paper) return null;
  memoryCache = paper;
  try {
    sessionStorage.setItem(LAST_KEY, JSON.stringify(paper));
  } catch {
    /* ignore */
  }
  return paper;
}

export function loadLastAnalysis(): AnalysisResult | null {
  if (memoryCache) return memoryCache;
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(LAST_KEY);
  if (!raw) return null;
  try {
    memoryCache = JSON.parse(raw) as AnalysisResult;
    return memoryCache;
  } catch {
    return null;
  }
}

export function subscribeBrowserStorage(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

const emptyLibrary: LibraryItem[] = [];
let libraryRaw = "__init__";
let libraryCache: LibraryItem[] = emptyLibrary;

export function loadLibrarySnapshot(): LibraryItem[] {
  if (typeof window === "undefined") return emptyLibrary;
  const raw = sessionStorage.getItem(LIBRARY_KEY) ?? "";
  if (raw === libraryRaw) return libraryCache;
  libraryRaw = raw;
  if (!raw) {
    libraryCache = emptyLibrary;
    return libraryCache;
  }
  try {
    libraryCache = JSON.parse(raw) as LibraryItem[];
  } catch {
    libraryCache = emptyLibrary;
  }
  return libraryCache;
}
