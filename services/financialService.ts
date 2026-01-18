
import { supabase, isConfigured } from '../lib/supabase';
import { offlineService } from './offlineService';
import { Transaction, BankAccount } from '../types';

export const financialService = {
  async getTransactions(orgId: string): Promise<Transaction[]> {
    if (!isConfigured || !orgId) return offlineService.get('transactions', []);

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('organization_id', orgId)
      .order('date', { ascending: false });

    if (error) {
      console.warn('Usando cache offline para transações');
      return offlineService.get('transactions', []);
    }

    offlineService.save('transactions', data);
    return data;
  },

  async getBankAccounts(orgId: string): Promise<BankAccount[]> {
    if (!isConfigured || !orgId) return offlineService.get('accounts', []);

    const { data, error } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('organization_id', orgId);

    if (error) {
      return offlineService.get('accounts', []);
    }

    offlineService.save('accounts', data);
    return data;
  },

  async syncTransaction(t: Partial<Transaction>, orgId: string) {
    if (!isConfigured) {
      const current = offlineService.get<any[]>('transactions', []);
      const newList = [{ ...t, id: 'temp-' + Date.now() }, ...current];
      offlineService.save('transactions', newList);
      return newList[0];
    }
    
    // Inserção real no Supabase
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('transactions')
      .insert({ ...t, organization_id: orgId, user_id: user?.id })
      .select().single();

    if (error) throw error;
    return data;
  }
};
