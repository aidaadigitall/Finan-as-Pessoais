
import { supabase, isConfigured } from '../lib/supabase';
import { offlineService } from './offlineService';
import { Transaction, BankAccount } from '../types';

export const financialService = {
  async getTransactions(orgId: string): Promise<Transaction[]> {
    if (!isConfigured || !orgId) return offlineService.get('transactions', []);

    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('organization_id', orgId)
        .order('date', { ascending: false });

      if (error) throw error;

      offlineService.save('transactions', data);
      return data;
    } catch (e) {
      console.warn('Usando cache offline para transações devido a erro de conexão');
      return offlineService.get('transactions', []);
    }
  },

  async getBankAccounts(orgId: string): Promise<BankAccount[]> {
    if (!isConfigured || !orgId) return offlineService.get('accounts', []);

    try {
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('organization_id', orgId);

      if (error) throw error;

      offlineService.save('accounts', data);
      return data;
    } catch (e) {
      return offlineService.get('accounts', []);
    }
  },

  async syncTransaction(t: Partial<Transaction>, orgId: string): Promise<Transaction> {
    const tempId = t.id || 'temp-' + Date.now();
    const transactionToSave = { ...t, id: tempId } as Transaction;

    // Sempre salvar no offline primeiro para garantir persistência imediata
    const current = offlineService.get<Transaction[]>('transactions', []);
    const alreadyExists = current.find(x => x.id === tempId);
    if (!alreadyExists) {
        offlineService.save('transactions', [transactionToSave, ...current]);
    }

    if (!isConfigured || !orgId) {
      return transactionToSave;
    }
    
    try {
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
            source: t.source || 'manual',
            reconciled: t.reconciled || false
        })
        .select().single();

      if (error) throw error;
      
      // Atualizar o item temporário com o ID real do banco
      const updatedList = offlineService.get<Transaction[]>('transactions', [])
        .map(item => item.id === tempId ? data : item);
      offlineService.save('transactions', updatedList);
      
      return data;
    } catch (error) {
      console.error("Erro ao sincronizar com nuvem, mantendo apenas local:", error);
      return transactionToSave;
    }
  }
};
