import { supabase } from "./supabase";

export async function addResponse(
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
        response_type: responseType
      }
    ])
    .select();

  if (error) throw error;

  return data;
}
