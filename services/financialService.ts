
import { supabase } from '../lib/supabase';
import { Transaction, BankAccount, Category, TransactionType, TransactionStatus } from '../types';

export const financialService = {
  async getTransactions(orgId: string): Promise<Transaction[]> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('organization_id', orgId)
        .order('date', { ascending: false });

      if (error) throw error;
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
        creditCardId: t.credit_card_id,
        reconciled: t.reconciled
      }));
    } catch (e) {
      console.error("Erro ao carregar transações:", e);
      return [];
    }
  },

  async getBankAccounts(orgId: string): Promise<BankAccount[]> {
    try {
      const { data, error } = await supabase
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
    } catch (e) {
      console.error("Erro ao carregar contas:", e);
      return [];
    }
  },

  async getCategories(orgId: string): Promise<Category[]> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('organization_id', orgId);
      
      if (error) throw error;
      return (data || []).map(c => ({
        id: c.id,
        name: c.name,
        type: c.type,
        parentId: c.parent_id,
        budgetLimit: c.budget_limit
      }));
    } catch (e) {
      console.error("Erro ao carregar categorias:", e);
      return [];
    }
  },

  async createTransaction(t: Partial<Transaction>, orgId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Não autenticado");

    const { error } = await supabase.from('transactions').insert({
      description: t.description,
      amount: t.amount,
      type: t.type,
      category: t.category,
      date: t.date || new Date().toISOString(),
      due_date: t.dueDate,
      is_paid: t.isPaid,
      account_id: t.accountId,
      destination_account_id: t.destinationAccountId,
      credit_card_id: t.creditCardId,
      organization_id: orgId,
      user_id: user.id,
      source: t.source || 'manual'
    });
    if (error) throw error;
  },

  async createBankAccount(acc: Partial<BankAccount>, orgId: string): Promise<void> {
    const { error } = await supabase.from('bank_accounts').insert({
      name: acc.name,
      bank_name: acc.bankName,
      initial_balance: acc.initialBalance,
      color: acc.color,
      organization_id: orgId,
      current_balance: acc.initialBalance
    });
    if (error) throw error;
  },

  async createCategory(cat: Partial<Category>, orgId: string): Promise<void> {
    const { error } = await supabase.from('categories').insert({
      name: cat.name,
      type: cat.type,
      parent_id: cat.parentId,
      budget_limit: cat.budgetLimit,
      organization_id: orgId
    });
    if (error) throw error;
  }
};
