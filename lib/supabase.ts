import { createClient } from '@supabase/supabase-js';

// Safely access env to prevent crashes if not defined
const env = (import.meta as any).env || {};

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

// Create a single supabase client for interacting with your database
// We only initialize if keys are present to prevent crashes during dev without envs
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
