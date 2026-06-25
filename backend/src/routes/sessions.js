const express = require("express");
const router = express.Router();
const multer = require("multer");

const {
  createSession,
  saveQuestion,
  saveResponse,
} = require("../services/sessionService");

// Multer config: store audio in memory (max 25MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ["audio/webm", "audio/mp4", "audio/mpeg", "audio/wav"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only audio files are allowed"));
    }
  },
});

// POST /api/sessions
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

// POST /api/sessions/:sessionId/questions
router.post("/:sessionId/questions", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { questionText, questionType } = req.body;

    const question = await saveQuestion(sessionId, questionText, questionType);

    res.status(201).json(question);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/sessions/:sessionId/responses
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

// POST /api/sessions/:sessionId/audio
// Receives audio blob from frontend, transcribes via Whisper (OpenAI).
// TODO: Uncomment the Whisper call once OPENAI_API_KEY has credits.
router.post("/:sessionId/audio", upload.single("audio"), async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: "No audio file provided." });
    }

    // TODO: Replace this placeholder with real Whisper transcription:
    //
    // const OpenAI = require("openai");
    // const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    // const file = new File([req.file.buffer], "audio.webm", { type: req.file.mimetype });
    // const transcription = await openai.audio.transcriptions.create({
    //   file,
    //   model: "whisper-1",
    // });
    // const transcript = transcription.text;

    // Placeholder transcript until Whisper is enabled
    const transcript =
      "[Audio received — Whisper transcription pending OpenAI API credits]";

    res.json({
      sessionId,
      transcript,
      message: "Audio received successfully.",
    });
  } catch (error) {
    console.error("Audio upload error:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
