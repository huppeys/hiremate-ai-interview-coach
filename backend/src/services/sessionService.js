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

async function saveQuestion(sessionId, questionText, questionType) {
  const { data, error } = await supabase
    .from("questions")
    .insert([
      {
        session_id: sessionId,
        question_text: questionText,
        question_type: questionType,
      },
    ])
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

module.exports = {
  createSession,
  saveQuestion,
  saveResponse,
};