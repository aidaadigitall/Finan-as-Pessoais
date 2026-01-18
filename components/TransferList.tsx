
import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType, BankAccount } from '../types';
import { ArrowRightLeft, Calendar, Search, Trash2, Edit2, ArrowRight, Filter, Plus } from 'lucide-react';

interface TransferListProps {
  transactions: Transaction[];
  accounts: BankAccount[];
  onDeleteTransaction: (id: string) => void;
  onEditTransaction: (t: Transaction) => void;
  onOpenTransactionModal: () => void;
}

export const TransferList: React.FC<TransferListProps> = ({ 
  transactions, 
  accounts, 
  onDeleteTransaction, 
  onEditTransaction,
  onOpenTransactionModal
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  const getAccountName = (id?: string) => accounts.find(a => a.id === id)?.name || 'Conta Desconhecida';

  const transfers = useMemo(() => {
    return transactions
      .filter(t => {
         const tMonth = new Date(t.date).toISOString().slice(0, 7);
         const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase());
         return t.type === TransactionType.TRANSFER && 
                tMonth === selectedMonth &&
                matchesSearch;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, selectedMonth, searchTerm]);

  const totalTransferred = transfers.reduce((acc, t) => acc + (t.amount || 0), 0);

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-2 fade-in duration-500">
       {/* Summary Card - BLUE Theme */}
       <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-8 rounded-2xl flex flex-col md:flex-row justify-between items-center shadow-lg shadow-blue-100 dark:shadow-none relative overflow-hidden">
            <div className="relative z-10 w-full md:w-auto">
                <div className="flex items-center justify-between md:justify-start gap-4 mb-2">
                    <div className="flex items-center gap-2 bg-white/20 w-fit px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
                        <ArrowRightLeft size={14} /> Total Transferido
                    </div>
                    <input 
                        type="month" 
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="bg-white/20 text-white border-none rounded-lg text-sm px-2 py-1 outline-none focus:ring-2 focus:ring-white/50 cursor-pointer font-bold"
                    />
                </div>
                <h3 className="text-3xl font-bold">R$ {totalTransferred.toFixed(2)}</h3>
                <p className="text-blue-100 text-sm mt-1 opacity-90">Movimentações em {new Date(selectedMonth + '-02').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</p>
            </div>
            
            <ArrowRightLeft className="absolute right-[-10px] bottom-[-20px] opacity-10" size={140} />
            
            <div className="relative z-10 mt-4 md:mt-0 flex gap-4 w-full md:w-auto">
                 <button 
                    onClick={onOpenTransactionModal}
                    className="w-full md:w-auto bg-white text-blue-600 px-4 py-3 rounded-xl font-bold hover:bg-gray-100 transition shadow-lg flex items-center justify-center gap-2"
                 >
                    <Plus size={18} /> Nova Transferência
                 </button>
            </div>
       </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col md:flex-row gap-4 justify-between items-center bg-blue-50/50 dark:bg-blue-900/10">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <ArrowRightLeft className="text-blue-500" size={20} />
            Histórico de Transferências
          </h3>
          
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
            <input 
              type="text" 
              placeholder="Buscar transferências..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-white shadow-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
            <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase text-gray-500 dark:text-gray-400">
              <tr>
                <th className="px-6 py-3">Data</th>
                <th className="px-6 py-3">Origem <ArrowRight className="inline mx-1" size={10}/> Destino</th>
                <th className="px-6 py-3">Descrição</th>
                <th className="px-6 py-3 text-right">Valor</th>
                <th className="px-6 py-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
              {transfers.map((t) => (
                  <tr key={t.id} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                       <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-gray-400" />
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                                {new Date(t.date).toLocaleDateString('pt-BR')}
                            </span>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700/50 w-fit px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600">
                         <span className="font-bold text-gray-700 dark:text-gray-300">{getAccountName(t.accountId)}</span>
                         <ArrowRight size={14} className="text-blue-500" />
                         <span className="font-bold text-gray-700 dark:text-gray-300">{getAccountName(t.destinationAccountId)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                        {t.description || 'Transferência entre contas'}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-blue-600 dark:text-blue-400 text-base">
                      R$ {(t.amount || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => onEditTransaction(t)} className="p-2 text-gray-400 hover:text-orange-500 rounded-full hover:bg-orange-50 dark:hover:bg-orange-900/20 transition" title="Editar">
                              <Edit2 size={16} />
                          </button>
                          <button onClick={() => onDeleteTransaction(t.id)} className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition" title="Excluir">
                              <Trash2 size={16} />
                          </button>
                      </div>
                    </td>
                  </tr>
              ))}
              {transfers.length === 0 && (
                  <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-400 dark:text-gray-500">
                          <div className="flex flex-col items-center gap-2">
                             <ArrowRightLeft size={32} className="text-gray-300 mb-1" />
                             <p>Nenhuma transferência encontrada em {new Date(selectedMonth + '-02').toLocaleDateString('pt-BR', { month: 'long' })}.</p>
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
