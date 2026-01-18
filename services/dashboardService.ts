
import { supabase } from '../lib/supabase';
import { Transaction, BankAccount, TransactionType, TransactionStatus } from '../types';

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
    // Busca transações do período e todas as contas para saldo global
    const [transactionsRes, accountsRes] = await Promise.all([
      supabase
        .from('transactions')
        .select('*')
        .eq('organization_id', orgId)
        .gte('date', startDate)
        .lte('date', endDate),
      supabase
        .from('bank_accounts')
        .select('*')
        .eq('organization_id', orgId)
    ]);

    if (transactionsRes.error) throw transactionsRes.error;
    if (accountsRes.error) throw accountsRes.error;

    const transactions = transactionsRes.data as Transaction[];
    const accounts = accountsRes.data as BankAccount[];

    // Cálculos de KPIs
    const periodIncome = transactions
      .filter(t => t.type === TransactionType.INCOME && t.isPaid)
      .reduce((acc, t) => acc + Number(t.amount), 0);

    const periodExpense = transactions
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

    // Burn Rate (Média de gastos diários no período se negativo)
    const days = Math.max(1, (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
    const burnRate = netProfit < 0 ? Math.abs(netProfit) / (days / 30) : 0;

    // Saldo Total (Independente do filtro de data)
    // Nota: Em um sistema real, buscaríamos o saldo histórico no ponto inicial.
    // Aqui calculamos saldo inicial + todas as transações pagas até hoje.
    const allTransactionsRes = await supabase
      .from('transactions')
      .select('amount, type, is_paid, account_id, destination_account_id')
      .eq('organization_id', orgId)
      .eq('is_paid', true);
    
    const allTransactions = allTransactionsRes.data || [];
    
    let totalBalance = accounts.reduce((acc, curr) => acc + Number(curr.initialBalance || 0), 0);
    allTransactions.forEach(t => {
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
      burnRate,
      accountsPayable,
      accountsReceivable,
      revenueGrowth: 0 // Requeriria comparação com período anterior
    };

    // Estrutura DRE Simplificada
    const dre: DREItem[] = [
      { label: 'Receita Bruta', value: periodIncome, type: 'positive' },
      { label: 'Custos Operacionais', value: periodExpense * 0.6, type: 'negative' }, // Mock de proporção para exemplo visual
      { label: 'EBITDA', value: periodIncome - (periodExpense * 0.8), type: 'neutral' },
      { label: 'Lucro Líquido', value: netProfit, type: netProfit >= 0 ? 'positive' : 'negative' }
    ];

    return { metrics, dre, transactions };
  }
};
