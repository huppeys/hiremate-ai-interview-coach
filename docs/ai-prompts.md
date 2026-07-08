# HireMate AI Prompt Documentation

This document describes the prompt engineering strategy used in HireMate's
AI interview question generation and follow-up system.

---

## 1. Question Generation (FR-08)

### Location
`backend/src/services/llmService.js` → `generateQuestions(config)`

### System Prompt
The system prompt instructs the LLM to act as an expert interviewer and
return ONLY a valid JSON array. No markdown, no preamble.

Each question object must follow this schema:
```json
{
  "id": "string",
  "question": "string",
  "type": "behavioral" | "technical",
  "difficulty": "easy" | "medium" | "hard",
  "tips": "string"
}
```

### User Prompt Template
Variables injected at runtime:
- `interviewType` — behavioral / technical / mixed
- `role` — e.g. "Software Engineer Intern"
- `industry` — e.g. "Technology"
- `experienceLevel` — intern / entry / mid
- `resumeText` (optional) — extracted resume text
- `count` — number of questions (8-12, default 10)

### Distribution Rules
- behavioral only → all STAR-friendly questions
- technical only → domain knowledge for the given role/industry
- mixed → roughly even split between behavioral and technical
- Difficulty calibrated to experience level:
  - intern → mostly easy/medium
  - entry → even split easy/medium
  - mid → mix including some hard
- If resume text provided → at least 2-3 questions reference specific
  skills, technologies, or projects from the resume

### Retry Logic
- Max 3 attempts with exponential backoff
- Retries on HTTP 429 (rate limit) and 5xx server errors
- Delays: 1s → 2s → 4s
- Throws `AI_SERVICE_UNAVAILABLE` after all retries exhausted

### Response Validation
Each returned question is validated to have:
- id (string)
- question (string)
- type (behavioral | technical)
- difficulty (easy | medium | hard)
- tips (string)

---

## 2. Follow-Up Question Generation (FR-12)

### Location
`backend/src/services/llmService.js` → `generateFollowUp(question, answer, context)`

### System Prompt
The system prompt instructs the LLM to decide whether ONE natural
follow-up question is warranted based on the candidate's response.

Returns ONLY valid JSON:
```json
{
  "shouldFollowUp": boolean,
  "followUpQuestion": string | null
}
```

### Trigger Logic
A follow-up is generated ONLY when the answer is:
- Vague or lacking concrete details
- Missing results/metrics in a behavioral answer
- Incomplete STAR structure
- Surface-level technical depth

If the answer is already thorough → `shouldFollowUp: false`

### Cap
Maximum 1 follow-up question per interview question.

### Context Variables
- `role` — candidate's target role
- `industry` — target industry
- `question` — the original interview question
- `answer` — the candidate's response

---

## 3. Response Analysis and Feedback (FR-15/16/17)

### Location
`backend/src/services/llmService.js` → `analyzeResponse(question, answer, context)`

### System Prompt
Scores the candidate's answer on a 0-10 scale across four dimensions.

Returns ONLY valid JSON:
```json
{
  "contentScore": number,
  "starScore": number,
  "clarityScore": number,
  "confidenceScore": number,
  "fillerWords": [{ "word": string, "count": number }],
  "tip": "string"
}
```

### Scoring Dimensions
- **contentScore** — relevance and quality of answer content
- **starScore** — how well the STAR method was used
- **clarityScore** — clarity and structure of communication
- **confidenceScore** — confidence markers in the response

### Filler Word Detection
Detects: "um", "uh", "like", "you know", "kind of", "basically"

### Tip
One specific, actionable improvement suggestion (1-2 sentences).

---

## 4. Model Configuration

| Setting | Value |
|---------|-------|
| Model | claude-sonnet-4-6 |
| Max Tokens (questions) | 2048 |
| Max Tokens (follow-up) | 256 |
| Max Tokens (analysis) | 512 |
| Max Retries | 3 |
| Base Retry Delay | 1000ms |

---

## 5. Environment Variables Required
Add to `backend/.env` (never commit this file).

- `OPENROUTER_API_KEY` — API key from OpenRouter (openrouter.ai), used to call Claude models for question generation and follow-up questions
- `PORT` — port the backend server runs on (default: 5000)
- `OPENAI_API_KEY` — (pending) API key for OpenAI Whisper, needed for audio transcription in interview sessions — not yet active, currently commented out in sessions.js

