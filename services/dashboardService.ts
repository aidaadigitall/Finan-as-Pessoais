
import { supabase, isConfigured } from '../lib/supabase';
import { offlineService } from './offlineService';
import { Transaction, BankAccount, TransactionType } from '../types';

export interface DashboardMetrics {
  totalBalance: number;
  periodIncome: number;
  periodExpense: number;
  netProfit: number;
  profitMargin: number;
  burnRate: number;
  accountsPayable: number;
  accountsReceivable: number;
  revenueGrowth: number;
}

export interface DREItem {
  label: string;
  value: number;
  percent?: number;
  type: 'positive' | 'negative' | 'neutral';
}

export const dashboardService = {
  async getExecutiveDashboard(orgId: string, startDate: string, endDate: string) {
    let transactions: Transaction[] = [];
    let accounts: BankAccount[] = [];

    // Tenta buscar do Supabase se estiver configurado
    if (isConfigured && orgId && !orgId.startsWith('temp') && !orgId.includes('demo')) {
      try {
        // Timeout de 3 segundos para não travar a UI se a rede estiver lenta
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const [transactionsRes, accountsRes] = await Promise.all([
          supabase
            .from('transactions')
            .select('*')
            .eq('organization_id', orgId)
            .order('date', { ascending: false })
            .abortSignal(controller.signal),
          supabase
            .from('bank_accounts')
            .select('*')
            .eq('organization_id', orgId)
            .abortSignal(controller.signal)
        ]);

        clearTimeout(timeoutId);

        if (transactionsRes.data) transactions = transactionsRes.data;
        if (accountsRes.data) accounts = accountsRes.data;
        
        // Se retornar vazio do banco, tenta pegar o que está no cache local (sync)
        if (transactions.length === 0) transactions = offlineService.get<Transaction[]>('transactions', []);
        if (accounts.length === 0) accounts = offlineService.get<BankAccount[]>('accounts', []);

      } catch (e) {
        console.warn("Dashboard usando fallback offline imediato");
        transactions = offlineService.get<Transaction[]>('transactions', []);
        accounts = offlineService.get<BankAccount[]>('accounts', []);
      }
    } else {
      // Força uso de dados locais imediatamente
      transactions = offlineService.get<Transaction[]>('transactions', []);
      accounts = offlineService.get<BankAccount[]>('accounts', []);
    }

    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    
    const periodTransactions = transactions.filter(t => {
      const tDate = new Date(t.date).getTime();
      return tDate >= start && tDate <= end;
    });

    const periodIncome = periodTransactions
      .filter(t => t.type === TransactionType.INCOME && t.isPaid)
      .reduce((acc, t) => acc + Number(t.amount), 0);

    const periodExpense = periodTransactions
      .filter(t => t.type === TransactionType.EXPENSE && t.isPaid)
      .reduce((acc, t) => acc + Number(t.amount), 0);

    const accountsPayable = transactions
      .filter(t => t.type === TransactionType.EXPENSE && !t.isPaid)
      .reduce((acc, t) => acc + Number(t.amount), 0);

    const accountsReceivable = transactions
      .filter(t => t.type === TransactionType.INCOME && !t.isPaid)
      .reduce((acc, t) => acc + Number(t.amount), 0);

    const netProfit = periodIncome - periodExpense;
    const profitMargin = periodIncome > 0 ? (netProfit / periodIncome) * 100 : 0;
    const days = Math.max(1, (end - start) / (1000 * 60 * 60 * 24));
    const burnRate = netProfit < 0 ? Math.abs(netProfit) / (days / 30) : 0;

    let totalBalance = accounts.reduce((acc, curr) => acc + Number(curr.initialBalance || 0), 0);
    transactions.filter(t => t.isPaid).forEach(t => {
      const amt = Number(t.amount);
      if (t.type === TransactionType.INCOME) totalBalance += amt;
      if (t.type === TransactionType.EXPENSE) totalBalance -= amt;
    });

    const metrics: DashboardMetrics = {
      totalBalance,
      periodIncome,
      periodExpense,
      netProfit,
      profitMargin,
      burnRate,
      accountsPayable,
      accountsReceivable,
      revenueGrowth: 0
    };

    const dre: DREItem[] = [
      { label: 'Receita Bruta', value: periodIncome, type: 'positive' },
      { label: 'Custos Variáveis', value: periodExpense * 0.4, type: 'negative' },
      { label: 'Margem de Contribuição', value: periodIncome - (periodExpense * 0.4), type: 'neutral' },
      { label: 'Lucro Líquido', value: netProfit, type: netProfit >= 0 ? 'positive' : 'negative' }
    ];

    return { metrics, dre, transactions: periodTransactions };
  }
};
