
import { supabase } from '../lib/supabase';
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
    // Produção Real: Busca simultânea e tipada
    const [transactionsRes, accountsRes] = await Promise.all([
      supabase
        .from('transactions')
        .select('*')
        .eq('organization_id', orgId),
      supabase
        .from('bank_accounts')
        .select('*')
        .eq('organization_id', orgId)
    ]);

    if (transactionsRes.error) throw new Error(`Erro transações: ${transactionsRes.error.message}`);
    if (accountsRes.error) throw new Error(`Erro contas: ${accountsRes.error.message}`);

    const transactions = transactionsRes.data as any[];
    const accounts = accountsRes.data as any[];

    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    
    // Filtros de Período
    const periodTransactions = transactions.filter(t => {
      const tDate = new Date(t.date).getTime();
      return tDate >= start && tDate <= end;
    });

    // KPIs de Fluxo
    const periodIncome = periodTransactions
      .filter(t => t.type === 'income' && t.is_paid)
      .reduce((acc, t) => acc + Number(t.amount), 0);

    const periodExpense = periodTransactions
      .filter(t => t.type === 'expense' && t.is_paid)
      .reduce((acc, t) => acc + Number(t.amount), 0);

    const accountsPayable = transactions
      .filter(t => t.type === 'expense' && !t.is_paid)
      .reduce((acc, t) => acc + Number(t.amount), 0);

    const accountsReceivable = transactions
      .filter(t => t.type === 'income' && !t.is_paid)
      .reduce((acc, t) => acc + Number(t.amount), 0);

    const netProfit = periodIncome - periodExpense;
    const profitMargin = periodIncome > 0 ? (netProfit / periodIncome) * 100 : 0;

    // Saldo Consolidado: Initial + Transações Pagas
    let totalBalance = accounts.reduce((acc, curr) => acc + Number(curr.initial_balance || 0), 0);
    transactions.filter(t => t.is_paid).forEach(t => {
      const amt = Number(t.amount);
      if (t.type === 'income') totalBalance += amt;
      if (t.type === 'expense') totalBalance -= amt;
    });

    const metrics: DashboardMetrics = {
      totalBalance,
      periodIncome,
      periodExpense,
      netProfit,
      profitMargin,
      burnRate: netProfit < 0 ? Math.abs(netProfit) / 1 : 0, // Burn rate simplificado por mês
      accountsPayable,
      accountsReceivable,
      revenueGrowth: 0
    };

    const dre: DREItem[] = [
      { label: 'Receita Bruta', value: periodIncome, type: 'positive' },
      { label: 'Despesas Operacionais', value: periodExpense, type: 'negative' },
      { label: 'Resultado Líquido', value: netProfit, type: netProfit >= 0 ? 'positive' : 'negative' }
    ];

    return { metrics, dre, transactions: periodTransactions };
  }
};
