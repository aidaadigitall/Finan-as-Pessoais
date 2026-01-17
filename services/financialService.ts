import { supabase } from '../lib/supabase';
import { Transaction, BankAccount } from '../types';

export const financialService = {
  async getTransactions(orgId: string) {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('organization_id', orgId)
      .order('date', { ascending: false });
    if (error) throw error;
    return data;
  },

  async createTransaction(transaction: Partial<Transaction>, orgId: string) {
    const { data, error } = await supabase
      .from('transactions')
      .insert({ ...transaction, organization_id: orgId })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getBankAccounts(orgId: string) {
    const { data, error } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('organization_id', orgId);
    if (error) throw error;
    return data;
  }
};
