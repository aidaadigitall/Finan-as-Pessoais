
import { Transaction, BankAccount } from '../types';
import { financialService } from './financialService';
import { transactionsService } from './transactionsService';
import { offlineService } from './offlineService';

export const ledgerService = {
  /**
   * Executa um novo lançamento garantindo persistência e trigger de recálculo.
   */
  async performTransaction(
    transaction: Transaction, 
    orgId: string | null,
    currentTransactions: Transaction[]
  ): Promise<Transaction[]> {
    console.log(`[Ledger] Processando lançamento: ${transaction.description}`);
    
    const updatedTransactions = [transaction, ...currentTransactions];
    
    // Persistência Offline Imediata
    offlineService.save('transactions', updatedTransactions);

    // Sincronização Cloud (Background)
    if (orgId) {
      // Fixed: syncTransaction does not exist on financialService, using createTransaction
      financialService.createTransaction(transaction, orgId).catch(err => {
        console.error("[Ledger] Erro na sincronização cloud:", err);
      });
    }

    return updatedTransactions;
  },

  /**
   * Remove uma transação e atualiza o estado.
   */
  async deleteTransaction(
    id: string, 
    currentTransactions: Transaction[]
  ): Promise<Transaction[]> {
    const filtered = currentTransactions.filter(t => t.id !== id);
    offlineService.save('transactions', filtered);
    
    // Tenta deletar no cloud se for um ID real
    if (!id.startsWith('temp-')) {
        transactionsService.delete(id).catch(console.error);
    }
    
    return filtered;
  }
};
