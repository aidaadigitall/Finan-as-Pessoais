
import { getSupabase, isSupabaseConfigured } from '../lib/supabase';
import { BankAccount } from '../types';

export const bankAccountsService = {
  async list(orgId: string): Promise<BankAccount[]> {
    if (!isSupabaseConfigured()) return [];
    const { data, error } = await getSupabase()
      .from('bank_accounts')
      .select('*')
      .eq('organization_id', orgId);
    
    if (error) throw error;
    
    return (data || []).map(acc => ({
      id: acc.id,
      name: acc.name,
      bankName: acc.bank_name,
      initialBalance: Number(acc.initial_balance),
      currentBalance: Number(acc.current_balance),
      color: acc.color,
      icon: acc.icon || 'landmark'
    }));
  },

  async create(account: Partial<BankAccount>, orgId: string): Promise<BankAccount> {
    if (!isSupabaseConfigured()) throw new Error("Supabase não configurado");
    const { data, error } = await getSupabase()
      .from('bank_accounts')
      .insert({
        name: account.name,
        bank_name: account.bankName,
        initial_balance: account.initialBalance,
        color: account.color,
        organization_id: orgId
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    if (!isSupabaseConfigured()) return;
    const { error } = await getSupabase()
      .from('bank_accounts')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
};
