
import { supabase } from '../lib/supabase';
import { Transaction, BankAccount } from '../types';

export const financialService = {
  async getTransactions(orgId: string) {
    const { data, error } = await supabase
      .from('transactions')
      .select('*, account:bank_accounts(*), category:categories(*)')
      .eq('organization_id', orgId)
      .order('date', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async createTransaction(transaction: Partial<Transaction>, orgId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    const { data, error } = await supabase
      .from('transactions')
      .insert({ 
        description: transaction.description,
        amount: transaction.amount,
        type: transaction.type,
        category: transaction.category,
        date: transaction.date || new Date().toISOString(),
        is_paid: transaction.isPaid,
        account_id: transaction.accountId,
        organization_id: orgId,
        user_id: user.id 
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Added missing updateTransaction method
  async updateTransaction(id: string, updates: Partial<Transaction>) {
    const { data, error } = await supabase
      .from('transactions')
      .update({
        description: updates.description,
        amount: updates.amount,
        is_paid: updates.isPaid,
        category: updates.category,
        reconciled: updates.reconciled
      })
      .eq('id', id)
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
  },

  // Added missing createBankAccount method
  async createBankAccount(account: Partial<BankAccount>, orgId: string) {
    const { data, error } = await supabase
      .from('bank_accounts')
      .insert({
        name: account.name,
        bank_name: account.bankName,
        initial_balance: account.initialBalance,
        current_balance: account.initialBalance,
        color: account.color,
        organization_id: orgId
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};