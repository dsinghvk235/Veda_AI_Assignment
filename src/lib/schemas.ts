const regionSchema = {
  type: "OBJECT",
  properties: {
    page: { type: "INTEGER" },
    ymin: { type: "NUMBER", description: "0-1000" },
    xmin: { type: "NUMBER", description: "0-1000" },
    ymax: { type: "NUMBER", description: "0-1000" },
    xmax: { type: "NUMBER", description: "0-1000" },
  },
  required: ["page", "ymin", "xmin", "ymax", "xmax"],
};

export const questionExtractSchema = {
  type: "OBJECT",
  properties: {
    subject: { type: "STRING" },
    questions: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          number: {
            type: "STRING",
            description: 'Printed number, keep sub-parts distinct e.g. "11(a)"',
          },
          text: { type: "STRING" },
          maxMarks: { type: "NUMBER" },
          type: {
            type: "STRING",
            enum: ["mcq", "short", "long", "true_false", "fill", "other"],
          },
          page: { type: "INTEGER" },
        },
        required: ["number", "text", "maxMarks", "type"],
      },
    },
  },
  required: ["questions"],
};

export const answerExtractSchema = {
  type: "OBJECT",
  properties: {
    answers: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          claimedNumber: {
            type: "STRING",
            description: "Question number the student wrote, empty if unknown",
          },
          text: { type: "STRING" },
          confidence: { type: "NUMBER" },
          regions: { type: "ARRAY", items: regionSchema },
        },
        required: ["text", "confidence", "regions"],
      },
    },
  },
  required: ["answers"],
};

export const semanticMapSchema = {
  type: "OBJECT",
  properties: {
    pairs: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          questionNumber: { type: "STRING" },
          answerIndex: { type: "INTEGER" },
          reason: { type: "STRING" },
        },
        required: ["questionNumber", "answerIndex"],
      },
    },
  },
  required: ["pairs"],
};

export const gradeSchema = {
  type: "OBJECT",
  properties: {
    overallFeedback: { type: "STRING" },
    items: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          number: { type: "STRING" },
          score: { type: "NUMBER" },
          verdict: {
            type: "STRING",
            enum: ["correct", "partial", "incorrect", "unanswered"],
          },
          feedback: { type: "STRING" },
        },
        required: ["number", "score", "verdict", "feedback"],
      },
    },
  },
  required: ["overallFeedback", "items"],
};
