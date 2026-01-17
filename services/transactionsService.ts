import { supabase } from '../lib/supabase'
import { Transaction } from '../types'
import { getCurrentUser } from './authService'

export async function fetchTransactions(): Promise<Transaction[]> {
  if (!supabase) return []

  const user = await getCurrentUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })

  if (error) throw error
  return data || []
}

export async function createTransaction(tx: Transaction) {
  if (!supabase) throw new Error("Supabase não configurado")

  const user = await getCurrentUser()
  if (!user) throw new Error("Usuário não autenticado")

  const { data, error } = await supabase
    .from('transactions')
    .insert([{ ...tx, user_id: user.id }])
    .select()
    .single()

  if (error) throw error
  return data
}

