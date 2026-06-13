// services/llmService.js
//
// FR-08: Generate tailored interview questions using Claude.
// FR-12: Generate a follow-up question based on the candidate's answer.

const Anthropic = require("@anthropic-ai/sdk");

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = "claude-sonnet-4-6";
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

// Wrapper with retry logic for rate limits / transient errors
async function callClaude({ system, messages, maxTokens = 2048 }) {
  let lastError;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: maxTokens,
        system,
        messages,
      });

      const textBlock = response.content.find((b) => b.type === "text");
      if (!textBlock) throw new Error("No text content returned from LLM");
      return textBlock.text;
    } catch (err) {
      lastError = err;
      const status = err?.status;
      const retryable = status === 429 || (status >= 500 && status < 600);

      if (!retryable || attempt === MAX_RETRIES - 1) break;

      const delay = BASE_DELAY_MS * 2 ** attempt;
      await new Promise((res) => setTimeout(res, delay));
    }
  }

  console.error("LLM call failed after retries:", lastError);
  throw new Error("AI_SERVICE_UNAVAILABLE");
}

// Strip markdown fences and parse JSON safely
function parseJsonResponse(raw) {
  const cleaned = raw.replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    console.error("Failed to parse LLM JSON response:", cleaned);
    throw new Error("AI_RESPONSE_PARSE_ERROR");
  }
}

/**
 * FR-08: Generate 8-12 tailored interview questions.
 *
 * @param {Object} config
 * @param {"behavioral"|"technical"|"mixed"} config.interviewType
 * @param {string} config.role
 * @param {string} config.industry
 * @param {"intern"|"entry"|"mid"} config.experienceLevel
 * @param {string} [config.resumeText]
 * @param {number} [config.count=10]
 * @returns {Promise<Array<{id:string, question:string, type:string, difficulty:string, tips:string}>>}
 */
async function generateQuestions(config) {
  const {
    interviewType,
    role,
    industry,
    experienceLevel,
    resumeText,
    count = 10,
  } = config;

  if (count < 8 || count > 12) {
    throw new Error("Question count must be between 8 and 12");
  }

  const system = `You are an expert technical and behavioral interviewer creating
a mock interview question set for a job seeker. Always respond with ONLY valid JSON,
no markdown formatting, no preamble, no explanation outside the JSON.

The JSON must be an array of objects with EXACTLY this shape:
{
  "id": string,
  "question": string,
  "type": "behavioral" | "technical",
  "difficulty": "easy" | "medium" | "hard",
  "tips": string
}`;

  const userPrompt = `
Create exactly ${count} interview questions.

Session configuration:
- Interview type: ${interviewType}
- Target role: ${role}
- Target industry: ${industry}
- Experience level: ${experienceLevel}
${resumeText ? `- Candidate resume (reference specific skills/projects from this where relevant):\n${resumeText}` : ""}

Rules:
- If interviewType is "behavioral", all questions should be behavioral (STAR-friendly).
- If "technical", all questions should test domain knowledge relevant to ${role} in ${industry}.
- If "mixed", split roughly evenly between behavioral and technical.
- Difficulty should match a ${experienceLevel}-level candidate (mostly "easy"/"medium" for intern,
  a mix including some "hard" for mid-level).
- If resume text is provided, at least 2-3 questions should reference specific skills,
  technologies, or projects mentioned in the resume.
- Do not repeat near-duplicate questions.
- Respond with ONLY the JSON array, nothing else.
`.trim();

  const raw = await callClaude({
    system,
    messages: [{ role: "user", content: userPrompt }],
    maxTokens: 2048,
  });

  const questions = parseJsonResponse(raw);

  if (!Array.isArray(questions)) {
    throw new Error("AI_RESPONSE_PARSE_ERROR");
  }

  return questions;
}

/**
 * FR-12: Generate a single follow-up question based on the candidate's
 * previous answer, simulating a real interviewer probing deeper.
 *
 * @param {string} question - the original question text
 * @param {string} answer - the candidate's answer
 * @param {Object} [context] - { role, industry }
 * @returns {Promise<string|null>} follow-up question text, or null if none warranted
 */
async function generateFollowUp(question, answer, context = {}) {
  const { role = "", industry = "" } = context;

  const system = `You are an interviewer deciding whether to ask ONE natural follow-up
question based on a candidate's response. Respond with ONLY valid JSON in this exact shape:
{ "shouldFollowUp": boolean, "followUpQuestion": string | null }

Only ask a follow-up if the answer was vague, lacked detail (e.g. missing concrete
results/metrics, incomplete STAR structure, or surface-level technical depth).
If the answer was already thorough, set shouldFollowUp to false and followUpQuestion to null.`;

  const userPrompt = `
Role: ${role}
Industry: ${industry}

Original question: "${question}"
Candidate's answer: "${answer}"

Respond with the JSON object only.
`.trim();

  const raw = await callClaude({
    system,
    messages: [{ role: "user", content: userPrompt }],
    maxTokens: 256,
  });

  const result = parseJsonResponse(raw);

  if (!result.shouldFollowUp) return null;
  return result.followUpQuestion || null;
}

module.exports = {
  generateQuestions,
  generateFollowUp,
};
