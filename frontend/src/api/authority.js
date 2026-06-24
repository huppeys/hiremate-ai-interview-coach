import { supabase } from "./supabase";

export async function register(email, password) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password
  });

  if (error) throw error;

  return data;
}

export async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) throw error;

  return data;
}

export async function logout() {
  const { error } = await supabase.auth.signOut();

  if (error) throw error;
}

export async function resetPassword(email) {
  const { error } =
    await supabase.auth.resetPasswordForEmail(email);

  if (error) throw error;
}
