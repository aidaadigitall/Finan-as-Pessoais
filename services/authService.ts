import { supabase } from '../lib/supabase'

export async function getCurrentUser() {
  if (!supabase) return null
  const { data } = await supabase.auth.getUser()
  return data.user
}

export async function signIn(email: string, password: string) {
  if (!supabase) throw new Error("Supabase não configurado")
  return supabase.auth.signInWithPassword({ email, password })
}

export async function signUp(email: string, password: string) {
  if (!supabase) throw new Error("Supabase não configurado")
  return supabase.auth.signUp({ email, password })
}

export async function signOut() {
  if (!supabase) throw new Error("Supabase não configurado")
  return supabase.auth.signOut()
}

