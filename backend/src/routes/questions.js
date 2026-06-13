const express = require("express");
const router = express.Router();
const { generateQuestions } = require("../services/llmService");

// POST /api/questions/generate
// Body: { interviewType, role, industry, experienceLevel, resumeText?, count? }
router.post("/generate", async (req, res) => {
  try {
    const questions = await generateQuestions(req.body);
    res.json({ questions });
  } catch (err) {
    console.error(err);
    if (err.message === "AI_SERVICE_UNAVAILABLE") {
      return res.status(503).json({ message: "AI service is currently unavailable. Please try again." });
    }
    res.status(500).json({ message: "Something went wrong", error: err.message });
  }
});

module.exports = router;
