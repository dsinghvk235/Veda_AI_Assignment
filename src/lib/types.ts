export type PageImage = {
  page: number;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  data: string;
  width: number;
  height: number;
};

export type Region = {
  page: number;
  ymin: number;
  xmin: number;
  ymax: number;
  xmax: number;
};

export type QuestionType =
  | "mcq"
  | "short"
  | "long"
  | "true_false"
  | "fill"
  | "other";

export type Question = {
  id: string;
  number: string;
  text: string;
  maxMarks: number;
  type: QuestionType;
  page?: number;
};

export type ExtractedAnswer = {
  id: string;
  claimedNumber: string | null;
  text: string;
  confidence: number;
  regions: Region[];
};

export type MappingMethod = "number" | "semantic" | "manual" | "none";

export type Verdict = "correct" | "partial" | "incorrect" | "unanswered";

export type MappedItem = {
  question: Question;
  answer: ExtractedAnswer | null;
  method: MappingMethod;
  score: number;
  verdict: Verdict;
  feedback: string;
};

export type AnalysisResult = {
  id: string;
  createdAt: string;
  questionFileName: string;
  answerFileName: string;
  studentName?: string | null;
  subject: string | null;
  totalMarks: number;
  awardedMarks: number;
  overallFeedback: string;
  graded?: boolean;
  items: MappedItem[];
  unmappedAnswers: ExtractedAnswer[];
  answerPages: PageImage[];
  questionPages: PageImage[];
};

export type PipelineStage =
  | "rasterize"
  | "questions"
  | "answers"
  | "mapping"
  | "grading"
  | "done"
  | "error";

export type ProgressStats = {
  questions?: number;
  answers?: number;
  mapped?: number;
  unanswered?: number;
  extra?: number;
};

export type ProgressEvent = {
  stage: PipelineStage;
  message: string;
  progress: number;
  stats?: ProgressStats;
};
