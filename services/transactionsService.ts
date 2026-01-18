
import { supabase, isConfigured } from '../lib/supabase';
import { Transaction, TransactionType, TransactionStatus } from '../types';

export const transactionsService = {
  async list(orgId: string): Promise<Transaction[]> {
    if (!isConfigured) return [];
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
      reconciled: t.reconciled
    }));
  },

  async create(t: Partial<Transaction>, orgId: string): Promise<Transaction> {
    if (!isConfigured) throw new Error("Supabase não configurado");
    const { data: { user } } = await supabase.auth.getUser();
    
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
        user_id: user?.id,
        source: t.source || 'manual'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateStatus(id: string, isPaid: boolean) {
    if (!isConfigured) return;
    const { error } = await supabase
      .from('transactions')
      .update({ is_paid: isPaid })
      .eq('id', id);
    if (error) throw error;
  },

  async delete(id: string) {
    if (!isConfigured) return;
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
};