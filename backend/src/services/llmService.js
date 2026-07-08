const OpenAI = require("openai");

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

const MODEL = "anthropic/claude-sonnet-4.5";
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

async function callClaude({ system, messages, maxTokens = 2048 }) {
  let lastError;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
const response = await client.chat.completions.create({
  model: MODEL,
  max_tokens: maxTokens,
  messages: [
    { role: "system", content: system },
    ...messages,
  ],
});

const text = response.choices[0]?.message?.content;
if (!text) throw new Error("No text content returned from LLM");
return text;
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

function parseJsonResponse(raw) {
  const cleaned = raw.replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    console.error("Failed to parse LLM JSON response:", cleaned);
    throw new Error("AI_RESPONSE_PARSE_ERROR");
  }
}

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

  const userMessage = `
Create exactly ${count} interview questions.

Session configuration:
- Interview type: ${interviewType}
- Target role: ${role}
- Target industry: ${industry}
- Experience level: ${experienceLevel}
${resumeText ? `- Candidate resume:\n${resumeText}` : ""}

Rules:
- If interviewType is "behavioral", all questions should be behavioral (STAR-friendly).
- If "technical", all questions should test domain knowledge relevant to ${role} in ${industry}.
- If "mixed", split roughly evenly between behavioral and technical.
- Difficulty should match a ${experienceLevel}-level candidate.
- Respond with ONLY the JSON array, nothing else.
`.trim();

  const raw = await callClaude({
    system,
    messages: [{ role: "user", content: userMessage }],
    maxTokens: 2048,
  });

  const questions = parseJsonResponse(raw);

  if (!Array.isArray(questions)) {
    throw new Error("AI_RESPONSE_PARSE_ERROR");
  }

  return questions;
}

async function generateFollowUp(question, answer, context = {}) {
  const { role = "", industry = "" } = context;

  const system = `You are an interviewer deciding whether to ask ONE natural follow-up
question based on a candidate's response. Respond with ONLY valid JSON in this exact shape:
{ "shouldFollowUp": boolean, "followUpQuestion": string | null }

Only ask a follow-up if the answer was vague, lacked detail, or was surface-level.
If the answer was thorough, set shouldFollowUp to false and followUpQuestion to null.`;

  const userMessage = `
Role: ${role}
Industry: ${industry}

Original question: "${question}"
Candidate's answer: "${answer}"

Respond with the JSON object only.
`.trim();

  const raw = await callClaude({
    system,
    messages: [{ role: "user", content: userMessage }],
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
