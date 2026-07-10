const request = require("supertest");

// Mock the LLM service BEFORE requiring the app, so no real OpenRouter
// API calls (and no credits) are used during automated tests.
jest.mock("../src/services/llmService");

// Require the app FIRST — this is what loads the .env file, and it must
// happen before llmService.js tries to read process.env.OPENROUTER_API_KEY.
const app = require("../src/index");

const { generateQuestions, generateFollowUp } = require("../src/services/llmService");
const {
  MOCK_QUESTIONS,
  MOCK_FOLLOW_UP,
  MOCK_NO_FOLLOW_UP,
} = require("../src/mocks/mockLLMResponse");

async function getAuthToken() {
  const email = `questions${Date.now()}@example.com`;
  const password = "Password123";

  await request(app).post("/api/auth/register").send({
    name: "Questions Test User",
    email,
    password,
  });

  const res = await request(app).post("/api/auth/login").send({
    email,
    password,
  });

  return res.body.accessToken;
}

describe("Questions API (mocked LLM)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("POST /api/questions/generate returns mocked questions and saves a session", async () => {
    generateQuestions.mockResolvedValue(MOCK_QUESTIONS);

    const token = await getAuthToken();

    const res = await request(app)
      .post("/api/questions/generate")
      .set("Authorization", `Bearer ${token}`)
      .send({
        interviewType: "behavioral",
        role: "Software Engineer",
        industry: "Technology",
        experienceLevel: "entry",
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.questions.sessionId).toBeDefined();
    expect(res.body.questions.questions).toHaveLength(MOCK_QUESTIONS.length);
    expect(res.body.questions.questions[0].question).toBe(
      MOCK_QUESTIONS[0].question
    );
    expect(generateQuestions).toHaveBeenCalledTimes(1);
  });

  test("POST /api/questions/generate requires authentication", async () => {
    generateQuestions.mockResolvedValue(MOCK_QUESTIONS);

    const res = await request(app).post("/api/questions/generate").send({
      interviewType: "behavioral",
      role: "Software Engineer",
      industry: "Technology",
      experienceLevel: "entry",
    });

    expect(res.statusCode).toBe(401);
    expect(generateQuestions).not.toHaveBeenCalled();
  });

  test("POST /api/questions/follow-up returns a follow-up for a vague answer", async () => {
    generateFollowUp.mockResolvedValue(MOCK_FOLLOW_UP);

    const res = await request(app).post("/api/questions/follow-up").send({
      question: "Tell me about a time you faced a difficult bug.",
      answer: "I fixed a bug once.",
      role: "Software Engineer",
      industry: "Technology",
    });

expect(res.statusCode).toBe(200);
    expect(res.body.followUpQuestion).toBe(MOCK_FOLLOW_UP);
  });

  test("POST /api/questions/follow-up returns null for a thorough answer", async () => {
    generateFollowUp.mockResolvedValue(MOCK_NO_FOLLOW_UP);

    const res = await request(app).post("/api/questions/follow-up").send({
      question: "Tell me about a time you faced a difficult bug.",
      answer:
        "At my last internship, our checkout page was silently failing for about 5% of users...",
      role: "Software Engineer",
      industry: "Technology",
    });

expect(res.statusCode).toBe(200);
    expect(res.body.followUpQuestion).toBeNull();
  });
});
