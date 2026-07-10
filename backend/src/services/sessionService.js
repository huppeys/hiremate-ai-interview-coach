const supabase = require("./supabase");

async function createSession(userId, interviewType, targetRole, industry) {
  const { data, error } = await supabase
    .from("sessions")
    .insert([
      {
        user_id: userId,
        interview_type: interviewType,
        target_role: targetRole,
        industry: industry,
        score: 0,
      },
    ])
    .select();

  if (error) throw error;

  return data[0];
}

async function saveQuestion(sessionId, questionText, questionType, difficulty = null, tips = null) {
  const row = {
    session_id: sessionId,
    question_text: questionText,
    question_type: questionType,
  };
  if (difficulty !== null) row.difficulty = difficulty;
  if (tips !== null) row.tips = tips;

  const { data, error } = await supabase
    .from("questions")
    .insert([row])
    .select();

  if (error) throw error;

  return data[0];
}

async function saveResponse(
  sessionId,
  questionId,
  userId,
  responseText,
  responseType
) {
  const { data, error } = await supabase
    .from("responses")
    .insert([
      {
        session_id: sessionId,
        question_id: questionId,
        user_id: userId,
        response_text: responseText,
        response_type: responseType,
      },
    ])
    .select();

  if (error) throw error;

  return data[0];
}

async function getSession(sessionId) {

  const { data: sessions, error: sessionError } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", Number(sessionId));

  if (sessionError) throw sessionError;

  if (!sessions || sessions.length === 0) {
    return null;
  }

  const session = sessions[0];

  const { data: questions, error: questionsError } = await supabase
    .from("questions")
    .select("*")
    .eq("session_id", Number(sessionId));

  if (questionsError) throw questionsError;

return {
    ...session,
    questions: questions.map((q) => ({
      id: q.id,
      question: q.question_text,
      type: q.question_type,
      difficulty: q.difficulty,
      tips: q.tips,
    })),
  };
}

module.exports = {
  createSession,
  saveQuestion,
  saveResponse,
  getSession,
};
