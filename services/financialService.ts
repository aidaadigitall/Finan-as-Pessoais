
import { supabase } from '../lib/supabase';
import { Transaction, BankAccount, TransactionType, TransactionStatus } from '../types';

export const financialService = {
  async getTransactions(orgId: string): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('organization_id', orgId)
      .order('date', { ascending: false });

    if (error) {
      console.error("[FinancialService] Erro ao buscar transações:", error);
      throw new Error(`Falha ao carregar movimentações: ${error.message}`);
    }

    return (data || []).map(t => ({
      id: t.id,
      date: t.date,
      dueDate: t.due_date,
      description: t.description,
      amount: Number(t.amount),
      type: t.type as TransactionType,
      category: t.category,
      status: t.status as TransactionStatus,
      isPaid: t.is_paid,
      source: t.source,
      accountId: t.account_id,
      destinationAccountId: t.destination_account_id,
      reconciled: t.reconciled
    }));
  },

  async getBankAccounts(orgId: string): Promise<BankAccount[]> {
    const { data, error } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('organization_id', orgId);

    if (error) {
      console.error("[FinancialService] Erro ao buscar contas:", error);
      throw new Error(`Falha ao carregar contas bancárias: ${error.message}`);
    }

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

  async createTransaction(t: Partial<Transaction>, orgId: string): Promise<Transaction> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    const { data, error } = await supabase
      .from('transactions')
      .insert({
        description: t.description,
        amount: t.amount,
        type: t.type,
        category: t.category,
        date: t.date || new Date().toISOString(),
        due_date: t.dueDate,
        is_paid: t.isPaid,
        account_id: t.accountId,
        destination_account_id: t.destinationAccountId,
        organization_id: orgId,
        user_id: user.id,
        source: t.source || 'manual',
        reconciled: t.reconciled || false
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
