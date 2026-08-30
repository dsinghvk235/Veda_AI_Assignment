import type { AnalysisResult, PageImage } from "./types";

function placeholderPage(
  page: number,
  title: string,
  blocks: Array<{ heading: string; lines: string[] }>
): PageImage {
  const canvas = document.createElement("canvas");
  canvas.width = 900;
  canvas.height = 1200;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");

  ctx.fillStyle = "#f4efe8";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#fffdf8";
  ctx.fillRect(48, 48, 804, 1104);
  ctx.strokeStyle = "#e4ddd2";
  ctx.strokeRect(48.5, 48.5, 803, 1103);

  ctx.strokeStyle = "#f0e6d8";
  for (let y = 160; y < 1120; y += 36) {
    ctx.beginPath();
    ctx.moveTo(80, y);
    ctx.lineTo(820, y);
    ctx.stroke();
  }

  ctx.fillStyle = "#111";
  ctx.font = "600 26px Georgia, serif";
  ctx.fillText(title, 80, 110);

  let y = 200;
  for (const block of blocks) {
    ctx.fillStyle = "#c45a32";
    ctx.font = "italic 20px Georgia, serif";
    ctx.fillText(block.heading, 88, y);
    y += 40;
    ctx.fillStyle = "#2a2a2a";
    ctx.font = "italic 22px Georgia, serif";
    for (const line of block.lines) {
      ctx.fillText(line, 96, y);
      y += 36;
    }
    y += 28;
  }

  const [, data] = canvas.toDataURL("image/jpeg", 0.85).split(",");
  return { page, mimeType: "image/jpeg", data, width: canvas.width, height: canvas.height };
}

export function buildSampleResult(): AnalysisResult {
  const answerPages = [
    placeholderPage(1, "Answer sheet · page 1", [
      {
        heading: "(unnumbered, written first)",
        lines: [
          "Haemoglobin binds oxygen in RBCs and carries it",
          "from the lungs to the tissues. It also takes some CO2.",
        ],
      },
      {
        heading: "Q1.",
        lines: ["Artery / Aorta carries blood away from the heart."],
      },
      {
        heading: "11 (a)",
        lines: ["Nephron — the functional unit of the kidney."],
      },
      {
        heading: "Q2.",
        lines: ["Heart is the largest organ."],
      },
      {
        heading: "Extra note",
        lines: ["I revised the loop of Henle diagram last night."],
      },
    ]),
    placeholderPage(2, "Answer sheet · page 2", [
      {
        heading: "(continued, still no number)",
        lines: ["Iron in heme is essential for this oxygen binding."],
      },
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
    totalMarks: 14,
    awardedMarks: 8,
    overallFeedback:
      "Q1 and Q11(a) are correct. Q2 is incorrect. Q11(b) was left blank. The hemoglobin answer was written first, with no question number, and continues onto page 2.",
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
          regions: [{ page: 1, ymin: 270, xmin: 70, ymax: 355, xmax: 910 }],
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
          text: "Name the largest organ in the human body.",
          maxMarks: 2,
          type: "short",
        },
        answer: {
          id: "a-5",
          claimedNumber: "2",
          text: "Heart is the largest organ.",
          confidence: 0.88,
          regions: [{ page: 1, ymin: 455, xmin: 70, ymax: 535, xmax: 910 }],
        },
        method: "number",
        score: 0,
        verdict: "incorrect",
        feedback: "Incorrect. The skin is the largest organ; the heart is the largest muscle, not the largest organ.",
      },
      {
        question: {
          id: "q-2a",
          number: "11(a)",
          text: "Name the functional unit of the kidney.",
          maxMarks: 2,
          type: "short",
        },
        answer: {
          id: "a-2",
          claimedNumber: "11(a)",
          text: "Nephron — the functional unit of the kidney.",
          confidence: 0.9,
          regions: [{ page: 1, ymin: 360, xmin: 70, ymax: 445, xmax: 910 }],
        },
        method: "number",
        score: 2,
        verdict: "correct",
        feedback: "Correct. The nephron is the functional unit of the kidney.",
      },
      {
        question: {
          id: "q-3",
          number: "11(b)",
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
          id: "q-4",
          number: "3",
          text: "Explain the role of hemoglobin in our body.",
          maxMarks: 5,
          type: "long",
        },
        answer: {
          id: "a-3",
          claimedNumber: null,
          text: "Haemoglobin binds oxygen in RBCs and carries it from the lungs to the tissues. It also takes some CO2. Iron in heme is essential for this oxygen binding.",
          confidence: 0.86,
          regions: [
            { page: 1, ymin: 145, xmin: 70, ymax: 265, xmax: 920 },
            { page: 2, ymin: 145, xmin: 70, ymax: 260, xmax: 900 },
          ],
        },
        method: "semantic",
        score: 4,
        verdict: "partial",
        feedback:
          "Strong explanation of oxygen transport. Written out of order with no question number, so it was matched by meaning. Iron mention is good; juxtaglomerular detail is missing.",
      },
    ],
    unmappedAnswers: [
      {
        id: "a-4",
        claimedNumber: null,
        text: "I revised the loop of Henle diagram last night.",
        confidence: 0.7,
        regions: [{ page: 1, ymin: 545, xmin: 70, ymax: 635, xmax: 880 }],
      },
    ],
    answerPages,
    questionPages: [],
  };
}
