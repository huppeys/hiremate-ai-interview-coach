import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://uwzqamnvrgefwvruahrb.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3enFhbW52cmdlZnd2cnVhaHJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyMjYyNjksImV4cCI6MjA5NjgwMjI2OX0.UhRS0Z8ddxdMHytf02SVt9E-OQfTeHI8EdxuyvEiBe0";

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);
