import type { AnalysisResult, PageImage } from "./types";

function placeholderPage(page: number, label: string, lines: string[]): PageImage {
  const canvas = document.createElement("canvas");
  canvas.width = 900;
  canvas.height = 1200;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.fillStyle = "#f6f3ee";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#fff";
  ctx.fillRect(48, 48, 804, 1104);
  ctx.strokeStyle = "#e7e1d8";
  ctx.strokeRect(48.5, 48.5, 803, 1103);
  ctx.fillStyle = "#111";
  ctx.font = "600 28px system-ui";
  ctx.fillText(label, 80, 110);
  ctx.font = "18px system-ui";
  ctx.fillStyle = "#444";
  lines.forEach((line, index) => ctx.fillText(line, 80, 170 + index * 36));
  const [, data] = canvas.toDataURL("image/jpeg", 0.85).split(",");
  return { page, mimeType: "image/jpeg", data, width: canvas.width, height: canvas.height };
}

export function buildSampleResult(): AnalysisResult {
  const answerPages = [
    placeholderPage(1, "Answer sheet · page 1", [
      "Q1. Artery / Aorta carries blood away from the heart.",
      "Q3. Haemoglobin binds oxygen in RBCs and transports",
      "it from lungs to tissues. It also carries some CO2.",
      "",
      "(Question 2 is left blank on purpose.)",
      "Extra note: I revised the nephron diagram last night.",
    ]),
    placeholderPage(2, "Answer sheet · page 2", [
      "Q3 continued: Iron in heme is essential for this binding.",
    ]),
  ];

  return {
    id: "sample",
    createdAt: new Date().toISOString(),
    questionFileName: "Class_10_physio_unit_test.pdf",
    answerFileName: "student_1_answer_sheet.pdf",
    subject: "Physiology",
    studentName: "Sample student",
    graded: true,
    totalMarks: 10,
    awardedMarks: 6,
    overallFeedback:
      "The student answered two of three questions, including one written out of order. Q2 was left blank. Q3 continues onto the next page.",
    items: [
      {
        question: {
          id: "q-1",
          number: "1",
          text: "Which blood vessel carries blood away from the heart?",
          maxMarks: 2,
          type: "short",
        },
        answer: {
          id: "a-1",
          claimedNumber: "1",
          text: "Artery / Aorta carries blood away from the heart.",
          confidence: 0.92,
          regions: [{ page: 1, ymin: 120, xmin: 70, ymax: 210, xmax: 900 }],
        },
        method: "number",
        score: 2,
        verdict: "correct",
        feedback: "Correct. Arteries, specifically the aorta, carry blood away from the heart.",
      },
      {
        question: {
          id: "q-2",
          number: "2",
          text: "Which part of the kidney regulates blood pressure?",
          maxMarks: 3,
          type: "short",
        },
        answer: null,
        method: "none",
        score: 0,
        verdict: "unanswered",
        feedback: "No matching answer was found on the sheet.",
      },
      {
        question: {
          id: "q-3",
          number: "3",
          text: "Explain the role of hemoglobin in our body.",
          maxMarks: 5,
          type: "long",
        },
        answer: {
          id: "a-2",
          claimedNumber: "3",
          text: "Haemoglobin binds oxygen in RBCs and transports it from lungs to tissues. It also carries some CO2. Iron in heme is essential for this binding.",
          confidence: 0.88,
          regions: [
            { page: 1, ymin: 220, xmin: 70, ymax: 390, xmax: 920 },
            { page: 2, ymin: 110, xmin: 70, ymax: 200, xmax: 900 },
          ],
        },
        method: "number",
        score: 4,
        verdict: "partial",
        feedback: "Strong explanation of oxygen transport. Mention of CO2 and iron is good; juxtamedullary detail is missing.",
      },
    ],
    unmappedAnswers: [
      {
        id: "a-3",
        claimedNumber: null,
        text: "I revised the nephron diagram last night.",
        confidence: 0.7,
        regions: [{ page: 1, ymin: 430, xmin: 70, ymax: 510, xmax: 880 }],
      },
    ],
    answerPages,
    questionPages: [],
  };
}
