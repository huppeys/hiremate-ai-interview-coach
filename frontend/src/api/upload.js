import { supabase } from "./supabase";

export async function uploadResume(file, userId) {
  const filePath = `${userId}/${file.name}`;

  const { data, error } = await supabase.storage
    .from("resumes")
    .upload(filePath, file);

  if (error) throw error;

  return data;
}
