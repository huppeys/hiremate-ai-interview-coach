import { supabase } from "./supabase";

export async function addQuestion(
  sessionId,
  questionText,
  questionType
) {
  const { data, error } = await supabase
    .from("questions")
    .insert([
      {
        session_id: sessionId,
        question_text: questionText,
        question_type: questionType
      }
    ])
    .select();

  if (error) throw error;

  return data;
}
