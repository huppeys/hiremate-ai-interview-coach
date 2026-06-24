const express = require("express");
const router = express.Router();
const { generateQuestions, getSession } = require("../services/aiService");
const { generateFollowUp } = require("../services/llmService");

// POST /api/questions/generate
// Body: { sessionId, interviewType, role, industry, experienceLevel, resumeText?, count? }
router.post("/generate", async (req, res) => {
  try {
    const { sessionId, ...config } = req.body;

    if (!sessionId) {
      return res.status(400).json({ message: "sessionId is required" });
    }

    const questions = await generateQuestions(sessionId, config);
    res.json({ questions });
  } catch (err) {
    console.error(err);
    if (err.message === "AI_SERVICE_UNAVAILABLE") {
      return res.status(503).json({ message: "AI service is currently unavailable. Please try again." });
    }
    if (err.message === "AI_RESPONSE_PARSE_ERROR") {
      return res.status(502).json({ message: "AI returned an invalid response. Please try again." });
    }
    res.status(500).json({ message: "Something went wrong", error: err.message });
  }
});

// GET /api/questions/session/:sessionId
// For testing: view the stored session + questions
router.get("/session/:sessionId", async (req, res) => {
  const session = await getSession(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ message: "Session not found" });
  }
  res.json(session);
});

// POST /api/questions/follow-up
// Body: { question, answer, role?, industry? }
router.post("/follow-up", async (req, res) => {
  try {
    const { question, answer, role, industry } = req.body;
    const followUp = await generateFollowUp(question, answer, { role, industry });
    res.json({ followUpQuestion: followUp });
  } catch (err) {
    console.error(err);
    if (err.message === "AI_SERVICE_UNAVAILABLE") {
      return res.status(503).json({ message: "AI service is currently unavailable. Please try again." });
    }
    res.status(500).json({ message: "Something went wrong", error: err.message });
  }
});

module.exports = router;
