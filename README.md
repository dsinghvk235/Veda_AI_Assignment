# VedaAI — Assessment Extraction & Answer Mapping

Teacher tool for the VedaAI hiring assignment: upload a **question paper** and one **handwritten answer sheet**, extract questions, map answers (including out-of-order and unanswered), highlight the exact region on the sheet, and optionally grade with feedback.

The UI follows the provided Figma **Extraction flow** (upload empty/filled, extracting, mapping).

## Why this stack

| Choice | Why |
| --- | --- |
| **Next.js 16 (App Router) + TypeScript** | Recommended in the brief. One deployable app, API routes for the AI pipeline, no auth/DB ceremony. |
| **React client rasterization (`pdfjs-dist`)** | PDFs/images become page JPEGs in the browser so highlighting is pixel-accurate and Vercel does not need native canvas binaries. |
| **Gemini 3.5 Flash-Lite**, then **3.6 Flash** | Vision + structured JSON. Lite is first because it is faster; 3.6 Flash is the fallback if Lite is unavailable. |
| **In-memory / session storage** | Matches the constraint: no database. Results live in the request stream, then `sessionStorage` for review and library. |

React + Spring Boot would work, but it splits deploy, adds CORS/ops cost, and does not help the scored criteria (extraction accuracy, mapping, highlighting, product feel). Next.js is the better fit for this scope.

## Pipeline

1. **Question extraction** — every question in printed order; sub-parts like `11(a)` / `11(b)` stay distinct; original numbering is preserved.
2. **Answer extraction** — handwritten OCR plus **normalized bounding boxes** (0–1000) per region/page.
3. **Answer mapping**
   - First: canonical number match (`11 (a)`, `11.a`, `Q11a` → `11(a)`). Handles out-of-order answers.
   - Then: semantic match for unlabeled leftovers.
   - Unanswered questions stay unanswered.
   - Extra writing that matches no question is kept as **unmapped**.
4. **Grading / feedback** — marks, correct/partial/incorrect, per-question feedback, overall summary. Teachers can skip scoring and map only.

Clicking a question highlights the mapped region(s). Multi-page answers show every region and jump to the first page. Teachers can attach/detach extra writing, edit marks and feedback locally, and export CSV — no extra model calls.

## Run locally

```bash
cp .env.example .env.local
# set GEMINI_API_KEY from https://aistudio.google.com/apikey
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Without a key you can still click **See a graded example** to walk the mapping interaction (unanswered, out-of-order, multi-page highlight, and an unmapped extra answer).

## Deploy

1. Push this repo to GitHub.
2. Import the project on [Vercel](https://vercel.com).
3. Set `GEMINI_API_KEY` in the project environment variables.
4. Deploy. Submit the live URL + this README as the technical approach.

Hobby plans cap request bodies (~4.5 MB) and function time (60s). The app compresses pages and caps question-paper pages at 8 and answer-sheet pages at 12.

## Assumptions & limitations

- One student script per run (as specified).
- Printed typed papers extract more reliably than heavily stylized handwriting.
- Bounding boxes are model estimates; they are clamped to the page and work best on reasonably straight scans.
- No authentication, no persistent database; refreshing after the tab is closed clears the last mapping.
- The model may refuse or truncate very long scripts; the UI surfaces the error.
- Sample preview is synthetic and is only for UI/flow demonstration.

## What reviewers should try

- Upload both files → **Start mapping** → wait for Extracting…
- Click questions on the left; confirm the orange overlay on the sheet. **J** / **K** move between questions.
- An unanswered question shows no overlay and an Unanswered chip.
- Optional: **Map only — skip scoring**.
- Use **See a graded example** to see unanswered Q2, multi-page Q3, and an unmapped scribble without an API key.
- Open **My Library** to reopen a mapping from this browser session.
