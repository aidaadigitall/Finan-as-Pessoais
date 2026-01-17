import { supabase } from '../lib/supabase'
import { BankAccount } from '../types'
import { getCurrentUser } from './authService'

export async function fetchBankAccounts(): Promise<BankAccount[]> {
  if (!supabase) return []

  const user = await getCurrentUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('bank_accounts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data || []
}

export async function createBankAccount(acc: BankAccount) {
  if (!supabase) throw new Error("Supabase não configurado")

  const user = await getCurrentUser()
  if (!user) throw new Error("Usuário não autenticado")

  const { data, error } = await supabase
    .from('bank_accounts')
    .insert([{ ...acc, user_id: user.id }])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateBankAccount(id: string, acc: BankAccount) {
  if (!supabase) throw new Error("Supabase não configurado")

  const { data, error } = await supabase
    .from('bank_accounts')
    .update(acc)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteBankAccount(id: string) {
  if (!supabase) throw new Error("Supabase não configurado")

  const { error } = await supabase
    .from('bank_accounts')
    .delete()
    .eq('id', id)

  if (error) throw error
}

