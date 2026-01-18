
import { Transaction, BankAccount, TransactionType } from '../types';

export const financialEngine = {
  /**
   * Calcula o saldo atual de uma conta específica baseada em suas transações confirmadas.
   */
  calculateAccountBalance(account: BankAccount, transactions: Transaction[]): number {
    const accountTransactions = transactions.filter(
      t => (t.accountId === account.id || t.destinationAccountId === account.id) && t.isPaid
    );

    const netChange = accountTransactions.reduce((acc, t) => {
      const amount = Number(t.amount) || 0;
      
      // Se for transferência
      if (t.type === TransactionType.TRANSFER) {
        if (t.accountId === account.id) return acc - amount; // Saindo da conta
        if (t.destinationAccountId === account.id) return acc + amount; // Entrando na conta
      }
      
      // Receitas e Despesas normais
      if (t.type === TransactionType.INCOME) return acc + amount;
      if (t.type === TransactionType.EXPENSE) return acc - amount;
      
      return acc;
    }, 0);

    return (Number(account.initialBalance) || 0) + netChange;
  },

  /**
   * Calcula os saldos de todas as contas e retorna um mapa de ID -> Saldo.
   */
  computeAllBalances(accounts: BankAccount[], transactions: Transaction[]): Record<string, number> {
    const balances: Record<string, number> = {};
    accounts.forEach(acc => {
      balances[acc.id] = this.calculateAccountBalance(acc, transactions);
    });
    return balances;
  },

  /**
   * Retorna o saldo global consolidado de todas as contas.
   */
  calculateGlobalBalance(accounts: BankAccount[], transactions: Transaction[]): number {
    const balances = this.computeAllBalances(accounts, transactions);
    // Fix: Explicitly type the accumulator in reduce to avoid 'unknown' errors
    return Object.values(balances).reduce((sum: number, b: number) => sum + b, 0);
  }
};