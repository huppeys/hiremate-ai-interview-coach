const express = require("express");
const router = express.Router();

const {
  createSession,
  saveQuestion,
  saveResponse,
} = require("../services/sessionService");

router.post("/", async (req, res) => {
  try {
    const { userId, interviewType, targetRole, industry } = req.body;

    const session = await createSession(
      userId,
      interviewType,
      targetRole,
      industry
    );

    res.status(201).json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/:sessionId/questions", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { questionText, questionType } = req.body;

    const question = await saveQuestion(
      sessionId,
      questionText,
      questionType
    );

    res.status(201).json(question);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/:sessionId/responses", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { questionId, userId, responseText, responseType } = req.body;

    const response = await saveResponse(
      sessionId,
      questionId,
      userId,
      responseText,
      responseType
    );

    res.status(201).json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;