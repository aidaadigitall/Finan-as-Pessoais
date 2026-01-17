import { supabase } from '../lib/supabase'
import { getCurrentUser } from './authService'

export async function fetchProfile() {
  if (!supabase) return null

  const user = await getCurrentUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) return null
  return data
}

