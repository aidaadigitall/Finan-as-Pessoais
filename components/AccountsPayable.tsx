
import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType, BankAccount, TransactionStatus } from '../types';
import { Calendar, AlertCircle, CheckCircle, TrendingDown, ArrowRight, Plus, Layers, Filter } from 'lucide-react';
import { PaymentModal } from './PaymentModal';

interface AccountsPayableProps {
  transactions: Transaction[];
  accounts?: BankAccount[]; // Adicionado accounts opcional
  onUpdateTransaction?: (t: Transaction) => void; // Adicionado onUpdateTransaction
  onToggleStatus: (id: string) => void; // Mantido para compatibilidade, mas vamos usar onUpdateTransaction preferencialmente
  onOpenTransactionModal: () => void;
}

export const AccountsPayable: React.FC<AccountsPayableProps> = ({ 
  transactions, 
  accounts = [], 
  onUpdateTransaction,
  onToggleStatus, 
  onOpenTransactionModal 
}) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [paymentModalData, setPaymentModalData] = useState<Transaction | null>(null);

  // Filter for Expenses that are NOT paid based on selected Month
  const payables = useMemo(() => {
    return transactions
      .filter(t => {
         const tDate = t.dueDate ? new Date(t.dueDate) : new Date(t.date);
         const tMonth = tDate.toISOString().slice(0, 7);
         
         return t.type === TransactionType.EXPENSE && 
                !t.isPaid && 
                tMonth === selectedMonth;
      })
      .sort((a, b) => {
          const dateA = a.dueDate ? new Date(a.dueDate).getTime() : new Date(a.date).getTime();
          const dateB = b.dueDate ? new Date(b.dueDate).getTime() : new Date(b.date).getTime();
          return dateA - dateB;
      });
  }, [transactions, selectedMonth]);

  const totalPending = payables.reduce((acc, t) => acc + (t.amount || 0), 0);

  const handlePayClick = (t: Transaction) => {
      if (onUpdateTransaction) {
          setPaymentModalData(t);
      } else {
          // Fallback para comportamento antigo se não passar a prop
          onToggleStatus(t.id);
      }
  };

  const confirmPayment = (updatedT: Transaction) => {
      if (onUpdateTransaction) {
          onUpdateTransaction(updatedT);
      }
      setPaymentModalData(null);
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-2 fade-in duration-500">
       {/* Summary Card - RED Theme */}
       <div className="bg-gradient-to-r from-red-500 to-rose-600 text-white p-8 rounded-2xl flex flex-col md:flex-row justify-between items-center shadow-lg shadow-red-100 dark:shadow-none relative overflow-hidden">
            <div className="relative z-10 w-full md:w-auto">
                <div className="flex items-center justify-between md:justify-start gap-4 mb-2">
                    <div className="flex items-center gap-2 bg-white/20 w-fit px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
                        <TrendingDown size={14} /> Saídas Previstas
                    </div>
                    {/* Month Selector inside the card for context */}
                    <input 
                        type="month" 
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="bg-white/20 text-white border-none rounded-lg text-sm px-2 py-1 outline-none focus:ring-2 focus:ring-white/50 cursor-pointer font-bold"
                    />
                </div>
                <h3 className="text-3xl font-bold">R$ {totalPending.toFixed(2)}</h3>
                <p className="text-red-100 text-sm mt-1 opacity-90">Total pendente em {new Date(selectedMonth + '-02').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</p>
            </div>
            
            <AlertCircle className="absolute right-[-10px] bottom-[-20px] opacity-10" size={140} />
            
            <div className="relative z-10 mt-4 md:mt-0 flex gap-4 w-full md:w-auto">
                 <button 
                    onClick={onOpenTransactionModal}
                    className="w-full md:w-auto bg-white text-red-600 px-4 py-3 rounded-xl font-bold hover:bg-gray-100 transition shadow-lg flex items-center justify-center gap-2"
                 >
                    <Plus size={18} /> Nova Despesa
                 </button>
            </div>
       </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-red-50/50 dark:bg-red-900/10">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Calendar className="text-red-500" size={20} />
            Cronograma de Pagamentos
          </h3>
          <div className="text-xs text-gray-500 flex items-center gap-1">
             <Filter size={12}/> Exibindo {new Date(selectedMonth + '-02').toLocaleDateString('pt-BR', { month: 'short' })}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
            <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase text-gray-500 dark:text-gray-400">
              <tr>
                <th className="px-6 py-3">Vencimento</th>
                <th className="px-6 py-3">Descrição</th>
                <th className="px-6 py-3">Categoria</th>
                <th className="px-6 py-3 text-right">Valor</th>
                <th className="px-6 py-3 text-center">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
              {payables.map((t) => {
                 const isOverdue = t.dueDate && new Date(t.dueDate) < new Date() && !t.isPaid;
                 
                 return (
                  <tr key={t.id} className="hover:bg-red-50/30 dark:hover:bg-red-900/10 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {isOverdue && (
                          <span title="Atrasado" className="animate-pulse">
                            <AlertCircle size={16} className="text-red-600" />
                          </span>
                        )}
                        <div className="flex flex-col">
                            <span className={`font-medium ${isOverdue ? 'text-red-600' : 'text-gray-700 dark:text-gray-300'}`}>
                                {t.dueDate ? new Date(t.dueDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : new Date(t.date).toLocaleDateString('pt-BR')}
                            </span>
                            <span className="text-[10px] text-gray-400">
                                {t.dueDate ? new Date(t.dueDate).getFullYear() : ''}
                            </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        {t.description}
                        {t.installmentNumber && (
                           <span className="text-[10px] bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-500 flex items-center gap-1" title="Parcelado">
                              <Layers size={10} /> {t.installmentNumber}/{t.installmentCount}
                           </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                        {t.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-red-600 dark:text-red-400">
                      R$ {(t.amount || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => handlePayClick(t)}
                        className="group-hover:bg-white dark:group-hover:bg-gray-800 text-gray-400 hover:text-green-600 transition-all flex items-center justify-center w-full gap-2 text-xs font-bold border border-transparent hover:border-green-200 hover:shadow-sm rounded-lg py-2 px-3 hover:bg-green-50"
                      >
                         <span className="hidden group-hover:inline">Pagar</span> <ArrowRight size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {payables.length === 0 && (
                  <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-400 dark:text-gray-500">
                          <div className="flex flex-col items-center gap-2">
                             <CheckCircle size={32} className="text-green-500 mb-1" />
                             <p>Tudo pago em {new Date(selectedMonth + '-02').toLocaleDateString('pt-BR', { month: 'long' })}!</p>
                             <button onClick={() => {
                                 const prev = new Date(selectedMonth + '-02');
                                 prev.setMonth(prev.getMonth() + 1);
                                 setSelectedMonth(prev.toISOString().slice(0, 7));
                             }} className="text-indigo-500 text-xs font-bold hover:underline">Ver próximo mês</button>
                          </div>
                      </td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <PaymentModal 
        isOpen={!!paymentModalData}
        transaction={paymentModalData}
        accounts={accounts}
        onClose={() => setPaymentModalData(null)}
        onConfirm={confirmPayment}
      />
    </div>
  );
};
