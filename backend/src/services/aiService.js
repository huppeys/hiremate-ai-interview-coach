// services/aiService.js
//
// AI service layer: wraps llmService for question generation and
// stores generated questions in Supabase via sessionService.

const { generateQuestions: llmGenerateQuestions } = require("./llmService");
const { 
  createSession, 
  saveQuestion,
  getSession,
} = require("./sessionService");

/**
 * Generates interview questions for a session config, validates the
 * result, and stores it in Supabase.
 *
 * @param {string} userId
 * @param {Object} config - { interviewType, role, industry, experienceLevel, resumeText?, count? }
 * @returns {Promise<{ sessionId: string, questions: Array }>}
 */
async function generateQuestions(userId, config) {
  const { interviewType, role, industry } = config;

  // Generate questions from LLM
  const questions = await llmGenerateQuestions(config);

  // Validate each question object's shape
  const valid = questions.every(
    (q) =>
      typeof q.id === "string" &&
      typeof q.question === "string" &&
      ["behavioral", "technical"].includes(q.type) &&
      ["easy", "medium", "hard"].includes(q.difficulty) &&
      typeof q.tips === "string"
  );

  if (!valid) {
    throw new Error("AI_RESPONSE_PARSE_ERROR");
  }

  // Create session in Supabase
  const session = await createSession(userId, interviewType, role, industry);

  // Save each question to Supabase
for (const q of questions) {
    await saveQuestion(session.id, q.question, q.type, q.difficulty, q.tips);
  }

  return { sessionId: session.id, questions };
}

module.exports = {
  generateQuestions,
  getSession,
};
