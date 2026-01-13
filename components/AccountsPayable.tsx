import React from 'react';
import { Transaction, TransactionType } from '../types';
import { Calendar, AlertCircle, CheckCircle, TrendingDown, ArrowRight } from 'lucide-react';

interface AccountsPayableProps {
  transactions: Transaction[];
  onToggleStatus: (id: string) => void;
}

export const AccountsPayable: React.FC<AccountsPayableProps> = ({ transactions, onToggleStatus }) => {
  // Filter for Expenses that are NOT paid
  const payables = transactions
    .filter(t => t.type === TransactionType.EXPENSE && !t.isPaid)
    .sort((a, b) => {
        // Sort by Due Date (closest first)
        const dateA = a.dueDate ? new Date(a.dueDate).getTime() : new Date(a.date).getTime();
        const dateB = b.dueDate ? new Date(b.dueDate).getTime() : new Date(b.date).getTime();
        return dateA - dateB;
    });

  const totalPending = payables.reduce((acc, t) => acc + (t.amount || 0), 0);

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-2 fade-in duration-500">
       {/* Summary Card - RED Theme */}
       <div className="bg-gradient-to-r from-red-500 to-rose-600 text-white p-8 rounded-2xl flex flex-col md:flex-row justify-between items-center shadow-lg shadow-red-100 dark:shadow-none relative overflow-hidden">
            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2 bg-white/20 w-fit px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
                     <TrendingDown size={14} /> Saídas Previstas
                </div>
                <h3 className="text-3xl font-bold">R$ {totalPending.toFixed(2)}</h3>
                <p className="text-red-100 text-sm mt-1 opacity-90">Total acumulado em contas pendentes</p>
            </div>
            
            {/* Decorative Background Icon */}
            <AlertCircle className="absolute right-[-10px] bottom-[-20px] opacity-10" size={140} />
            
            <div className="relative z-10 mt-4 md:mt-0 flex gap-4">
                 <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 text-center min-w-[100px]">
                      <span className="block text-2xl font-bold">{payables.length}</span>
                      <span className="text-xs text-red-100">Contas</span>
                 </div>
            </div>
       </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-red-50/50 dark:bg-red-900/10">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Calendar className="text-red-500" size={20} />
            Cronograma de Pagamentos
          </h3>
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
                      {t.description}
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
                        onClick={() => onToggleStatus(t.id)}
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
                             <p>Tudo em dia! Nenhuma conta pendente.</p>
                          </div>
                      </td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};