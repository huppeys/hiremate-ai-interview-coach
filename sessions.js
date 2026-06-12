import { supabase } from "./supabase";

export async function createSession(userId, interviewType, targetRole, industry) {
  const { data, error } = await supabase
    .from("sessions")
    .insert([
      {
        user_id: userId,
        interview_type: interviewType,
        target_role: targetRole,
        industry: industry,
        score: 0
      }
    ])
    .select();

  if (error) {
    throw error;
  }

  return data;
}