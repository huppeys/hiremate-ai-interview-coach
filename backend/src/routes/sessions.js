/*
 * Sessions Routes — /api/sessions
 *
 * POST   /config                    Create a new session with validation + optional resume PDF
 * GET    /:sessionId                Get session details + all responses
 * POST   /:sessionId/responses      Submit an answer to a question
 * PATCH  /:sessionId/pause          Pause an active session
 * PATCH  /:sessionId/abandon        Abandon a session (marks partial=true)
 * POST   /:sessionId/questions      Save a question to a session
 * POST   /:sessionId/audio          Receive audio blob for Whisper transcription
 */
const express = require("express");
const router = express.Router();
const multer = require("multer");
const { body, validationResult } = require("express-validator");
const { v4: uuidv4 } = require("uuid");
const authMiddleware = require("../middleware/authMiddleware");
const { extractResumeText } = require("../services/resumeService");
const supabase = require("../services/supabase");

const {
  createSession,
  saveQuestion,
  saveResponse,
} = require("../services/sessionService");

const configValidation = [
  body("interviewType")
    .isIn(["behavioral", "technical", "mixed"])
    .withMessage('interviewType must be "behavioral", "technical", or "mixed"'),
  body("targetRole")
    .trim()
    .notEmpty()
    .withMessage("targetRole is required"),
  body("industry")
    .trim()
    .notEmpty()
    .withMessage("industry is required"),
  body("experienceLevel")
    .isIn(["intern", "entry", "mid", "senior"])
    .withMessage('experienceLevel must be "intern", "entry", "mid", or "senior"'),
];

// Multer config for resume PDF uploads (max 5MB, PDF only)
const resumeUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed for resume upload"));
    }
  },
});

// POST /api/sessions/config
router.post("/config", authMiddleware, resumeUpload.single("resume"), configValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const sessionId = uuidv4();
  const resumeText = req.file ? await extractResumeText(req.file.buffer) : "";
  const { interviewType, targetRole, industry, experienceLevel } = req.body;

  const { error } = await supabase.from("sessions").insert([{
    session_id:       sessionId,
    user_id:          req.user.id,
    interview_type:   interviewType,
    target_role:      targetRole,
    industry:         industry,
    experience_level: experienceLevel,
    resume_text:      resumeText,
    status:           "configuring",
    questions:        [],
    created_at:       new Date().toISOString(),
  }]);

  if (error) {
    console.error("Supabase insert error:", error.message);
    return res.status(500).json({ message: "Failed to create session", error: error.message });
  }

  res.status(201).json({ sessionId });
});

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
const responseValidation = [
  body("questionId").trim().notEmpty().withMessage("questionId is required"),
  body("responseText")
    .trim()
    .notEmpty().withMessage("responseText is required")
    .isLength({ min: 10 }).withMessage("responseText must be at least 10 characters"),
  body("audioUrl").optional({ nullable: true }).isString(),
];

router.post("/:sessionId/responses", authMiddleware, responseValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { sessionId } = req.params;
    const { questionId, responseText, audioUrl = null } = req.body;

    // Check session exists
    const { data: sessions, error: sessionError } = await supabase
      .from("sessions")
      .select("*")
      .eq("session_id", sessionId);

    if (sessionError) throw sessionError;
    if (!sessions || sessions.length === 0) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Save response
    const responseId = uuidv4();
    const { error: insertError } = await supabase.from("responses").insert([{
      response_id:   responseId,
      session_id:    sessionId,
      question_id:   questionId,
      response_text: responseText,
      audio_url:     audioUrl,
      submitted_at:  new Date().toISOString(),
    }]);

    if (insertError) throw insertError;

    // Update session status to "in-progress" if currently "configuring" or "ready"
    const currentStatus = sessions[0].status;
    if (currentStatus === "configuring" || currentStatus === "ready") {
      await supabase
        .from("sessions")
        .update({ status: "in-progress" })
        .eq("session_id", sessionId);
    }

    res.status(201).json({ responseId });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong", error: error.message });
  }
});

// GET /api/sessions/:sessionId
router.get("/:sessionId", authMiddleware, async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Fetch session
    const { data: sessions, error: sessionError } = await supabase
      .from("sessions")
      .select("*")
      .eq("session_id", sessionId);

    if (sessionError) throw sessionError;
    if (!sessions || sessions.length === 0) {
      return res.status(404).json({ message: "Session not found" });
    }

    const session = sessions[0];

    if (session.user_id !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Fetch responses sorted by submitted_at ascending
    const { data: responses, error: responsesError } = await supabase
      .from("responses")
      .select("*")
      .eq("session_id", sessionId)
      .order("submitted_at", { ascending: true });

    if (responsesError) throw responsesError;

    res.status(200).json({ session, responses: responses || [] });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong", error: error.message });
  }
});

// PATCH /api/sessions/:sessionId/pause
router.patch("/:sessionId/pause", authMiddleware, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const { data: sessions, error: fetchError } = await supabase
      .from("sessions")
      .select("*")
      .eq("session_id", sessionId);

    if (fetchError) throw fetchError;
    if (!sessions || sessions.length === 0) {
      return res.status(404).json({ message: "Session not found" });
    }

    if (sessions[0].user_id !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    const { error: updateError } = await supabase
      .from("sessions")
      .update({ status: "paused", paused_at: new Date().toISOString() })
      .eq("session_id", sessionId);

    if (updateError) throw updateError;

    res.status(200).json({ message: "Session paused" });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong", error: error.message });
  }
});

// PATCH /api/sessions/:sessionId/abandon
router.patch("/:sessionId/abandon", authMiddleware, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const { data: sessions, error: fetchError } = await supabase
      .from("sessions")
      .select("*")
      .eq("session_id", sessionId);

    if (fetchError) throw fetchError;
    if (!sessions || sessions.length === 0) {
      return res.status(404).json({ message: "Session not found" });
    }

    if (sessions[0].user_id !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    const { error: updateError } = await supabase
      .from("sessions")
      .update({
        status:       "abandoned",
        partial:      true,
        abandoned_at: new Date().toISOString(),
      })
      .eq("session_id", sessionId);

    if (updateError) throw updateError;

    res.status(200).json({ message: "Session abandoned" });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong", error: error.message });
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
