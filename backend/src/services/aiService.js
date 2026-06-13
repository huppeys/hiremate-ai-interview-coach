// services/aiService.js
//
// AI service layer: wraps llmService for question generation and
// stores generated questions on the session record.
//
// NOTE: Firestore is not yet initialized in this project (no firebase
// config/init exists). Until that setup task is done, sessions are
// stored in-memory here. Replace `sessions` map + helper functions
// with Firestore reads/writes once Firebase Admin is initialized
// (see firebase-admin in package.json).

const { generateQuestions: llmGenerateQuestions } = require("./llmService");

// TEMPORARY in-memory store: { [sessionId]: { config, questions, createdAt } }
const sessions = new Map();

/**
 * Generates interview questions for a session config, validates the
 * result, and stores it against the session ID.
 *
 * @param {string} sessionId
 * @param {Object} config - { interviewType, role, industry, experienceLevel, resumeText?, count? }
 * @returns {Promise<Array>} the generated questions
 */
async function generateQuestions(sessionId, config) {
  const questions = await llmGenerateQuestions(config);

  // Basic validation of each question object's shape
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

  // TODO (Firestore): replace with
  //   await db.collection("sessions").doc(sessionId).update({ questions, config })
  sessions.set(sessionId, { config, questions, createdAt: new Date() });

  return questions;
}

/**
 * Retrieve a stored session (for testing / follow-up flows).
 * TODO (Firestore): replace with a Firestore document read.
 */
function getSession(sessionId) {
  return sessions.get(sessionId) || null;
}

module.exports = {
  generateQuestions,
  getSession,
};
