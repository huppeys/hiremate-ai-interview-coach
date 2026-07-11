const OpenAI = require("openai");
const { toFile } = require("openai");

let client = null;
function getClient() {
  if (!client) {
    client = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY || "placeholder",
    });
  }
  return client;
}

const MODEL = "anthropic/claude-sonnet-4.5";
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

async function callClaude({ system, messages, maxTokens = 1500 }) {
  let lastError;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
const response = await getClient().chat.completions.create({
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

function getMockQuestions(interviewType, role, count) {
  const behavioral = [
    { id: "b1", question: "Tell me about a time you faced a difficult challenge at work or school. How did you handle it?", type: "behavioral", difficulty: "medium", tips: "Use the STAR method: Situation, Task, Action, Result." },
    { id: "b2", question: "Describe a situation where you had to work with a difficult team member. What did you do?", type: "behavioral", difficulty: "medium", tips: "Focus on collaboration and communication skills." },
    { id: "b3", question: "Give an example of a goal you set and how you achieved it.", type: "behavioral", difficulty: "easy", tips: "Be specific about the goal and measurable results." },
    { id: "b4", question: "Tell me about a time you failed. What did you learn from it?", type: "behavioral", difficulty: "hard", tips: "Show self-awareness and growth mindset." },
    { id: "b5", question: "Describe a time you had to prioritize multiple tasks under a deadline.", type: "behavioral", difficulty: "medium", tips: "Explain your prioritization framework." },
    { id: "b6", question: "Tell me about a time you showed leadership without formal authority.", type: "behavioral", difficulty: "hard", tips: "Highlight influence, not just position." },
  ];
  const technical = [
    { id: "t1", question: `What are the key principles you follow when designing software systems for a ${role} role?`, type: "technical", difficulty: "medium", tips: "Mention scalability, maintainability, and simplicity." },
    { id: "t2", question: "Explain the difference between REST and GraphQL APIs.", type: "technical", difficulty: "medium", tips: "Cover trade-offs, not just definitions." },
    { id: "t3", question: "How do you approach debugging a production issue with limited logs?", type: "technical", difficulty: "hard", tips: "Walk through a systematic elimination process." },
    { id: "t4", question: "What is the difference between SQL and NoSQL databases? When would you use each?", type: "technical", difficulty: "easy", tips: "Give concrete use-case examples." },
    { id: "t5", question: "How do you ensure code quality in a fast-moving team?", type: "technical", difficulty: "medium", tips: "Cover code review, testing, and CI/CD." },
    { id: "t6", question: "Describe how you would implement authentication in a web application.", type: "technical", difficulty: "medium", tips: "Cover JWT, sessions, and security considerations." },
  ];
  const pool = interviewType === "technical" ? technical
    : interviewType === "behavioral" ? behavioral
    : [...behavioral.slice(0, 5), ...technical.slice(0, 5)];
  return pool.slice(0, Math.min(count, pool.length));
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

  if (!process.env.OPENROUTER_API_KEY) {
    console.warn("OPENROUTER_API_KEY not set — returning mock questions");
    return getMockQuestions(interviewType, role, count);
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
    maxTokens: 1500,
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

async function transcribeAudio(fileBuffer, filename, mimetype) {
  try {
    const file = await toFile(fileBuffer, filename, { type: mimetype });
    const transcription = await getClient().audio.transcriptions.create({
      file,
      model: "openai/whisper-large-v3",
    });
    return transcription.text;
  } catch (err) {
    console.error("Whisper transcription failed:", err.message);
    throw new Error("TRANSCRIPTION_FAILED");
  }
}

module.exports = {
  generateQuestions,
  generateFollowUp,
  transcribeAudio,
};
