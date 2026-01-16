import React from 'react';
import { Transaction, TransactionType } from '../types';
import { Calendar, CheckCircle, TrendingUp, Wallet, ArrowDown, Plus } from 'lucide-react';

interface AccountsReceivableProps {
  transactions: Transaction[];
  onToggleStatus: (id: string) => void;
  onOpenTransactionModal: () => void;
}

export const AccountsReceivable: React.FC<AccountsReceivableProps> = ({ transactions, onToggleStatus, onOpenTransactionModal }) => {
  // Filter for Income that are NOT paid (received)
  const receivables = transactions
    .filter(t => t.type === TransactionType.INCOME && !t.isPaid)
    .sort((a, b) => {
        const dateA = a.dueDate ? new Date(a.dueDate).getTime() : new Date(a.date).getTime();
        const dateB = b.dueDate ? new Date(b.dueDate).getTime() : new Date(b.date).getTime();
        return dateA - dateB;
    });

  const totalPending = receivables.reduce((acc, t) => acc + (t.amount || 0), 0);

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-2 fade-in duration-500">
       {/* Summary Card - GREEN Theme */}
       <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-8 rounded-2xl flex flex-col md:flex-row justify-between items-center shadow-lg shadow-emerald-100 dark:shadow-none relative overflow-hidden">
            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2 bg-white/20 w-fit px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
                     <TrendingUp size={14} /> Entradas Previstas
                </div>
                <h3 className="text-3xl font-bold">R$ {totalPending.toFixed(2)}</h3>
                <p className="text-emerald-100 text-sm mt-1 opacity-90">Valores pendentes de recebimento</p>
            </div>

             {/* Decorative Background Icon */}
             <Wallet className="absolute right-[-10px] bottom-[-20px] opacity-10" size={140} />
            
             <div className="relative z-10 mt-4 md:mt-0 flex gap-4">
                 <button 
                    onClick={onOpenTransactionModal}
                    className="bg-white text-emerald-600 px-4 py-3 rounded-xl font-bold hover:bg-gray-100 transition shadow-lg flex items-center gap-2"
                 >
                    <Plus size={18} /> Nova Receita
                 </button>
            </div>
       </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-emerald-50/50 dark:bg-emerald-900/10">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Calendar className="text-emerald-500" size={20} />
            Agenda de Recebimentos
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
            <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase text-gray-500 dark:text-gray-400">
              <tr>
                <th className="px-6 py-3">Previsão</th>
                <th className="px-6 py-3">Descrição</th>
                <th className="px-6 py-3">Categoria</th>
                <th className="px-6 py-3 text-right">Valor</th>
                <th className="px-6 py-3 text-center">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
              {receivables.map((t) => (
                  <tr key={t.id} className="hover:bg-emerald-50/30 dark:hover:bg-emerald-900/10 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                       <div className="flex flex-col">
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                                {t.dueDate ? new Date(t.dueDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : new Date(t.date).toLocaleDateString('pt-BR')}
                            </span>
                            <span className="text-[10px] text-gray-400">
                                {t.dueDate ? new Date(t.dueDate).getFullYear() : ''}
                            </span>
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
                    <td className="px-6 py-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      R$ {(t.amount || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => onToggleStatus(t.id)}
                        className="group-hover:bg-white dark:group-hover:bg-gray-800 text-gray-400 hover:text-emerald-600 transition-all flex items-center justify-center w-full gap-2 text-xs font-bold border border-transparent hover:border-emerald-200 hover:shadow-sm rounded-lg py-2 px-3 hover:bg-emerald-50"
                      >
                         <span className="hidden group-hover:inline">Receber</span> <ArrowDown size={14} />
                      </button>
                    </td>
                  </tr>
              ))}
              {receivables.length === 0 && (
                  <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-400 dark:text-gray-500">
                          <div className="flex flex-col items-center gap-2">
                             <CheckCircle size={32} className="text-gray-300 mb-1" />
                             <p>Nenhuma receita pendente encontrada.</p>
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