
import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType, Category, RecurrenceFrequency, RecurrenceLabels, BankAccount } from '../types';
import { ArrowUpCircle, ArrowDownCircle, Clock, CheckCircle2, Search, Download, Calendar, Edit2, Save, X, Trash2, Repeat, Eye, Info, ArrowRightLeft, Landmark, FileSpreadsheet, FileText, Bot, User, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { exportToPDF, exportToExcel } from '../services/exportService';

interface TransactionListProps {
  transactions: Transaction[];
  categories: Category[];
  accounts?: BankAccount[]; 
  onUpdateTransaction: (transaction: Transaction) => void;
  onToggleStatus: (id: string) => void;
  onEditTransaction: (transaction: Transaction) => void; // Nova Prop
}

type SortConfig = {
    key: keyof Transaction | 'accountName';
    direction: 'asc' | 'desc';
} | null;

export const TransactionList: React.FC<TransactionListProps> = ({ transactions, categories, accounts = [], onUpdateTransaction, onToggleStatus, onEditTransaction }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [detailsModalId, setDetailsModalId] = useState<string | null>(null);

  const getAccountName = (id?: string) => accounts.find(a => a.id === id)?.name || 'Conta Padrão';

  // 1. Filter logic
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            t.category.toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchesDate = true;
      if (startDate) {
          matchesDate = matchesDate && new Date(t.date) >= new Date(startDate);
      }
      if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          matchesDate = matchesDate && new Date(t.date) <= end;
      }

      return matchesSearch && matchesDate;
    });
  }, [transactions, searchTerm, startDate, endDate]);

  // 2. Sorting Logic
  const sortedTransactions = useMemo(() => {
    let sortableItems = [...filteredTransactions];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aValue: any = a[sortConfig.key as keyof Transaction];
        let bValue: any = b[sortConfig.key as keyof Transaction];

        if (sortConfig.key === 'accountName') {
            aValue = getAccountName(a.accountId);
            bValue = getAccountName(b.accountId);
        } else if (sortConfig.key === 'date') {
            aValue = new Date(a.date).getTime();
            bValue = new Date(b.date).getTime();
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    } else {
        sortableItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    return sortableItems;
  }, [filteredTransactions, sortConfig, accounts]);

  const requestSort = (key: keyof Transaction | 'accountName') => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof Transaction | 'accountName') => {
      if (!sortConfig || sortConfig.key !== key) return <ArrowUpDown size={12} className="text-gray-300" />;
      if (sortConfig.direction === 'asc') return <ArrowUp size={12} className="text-indigo-600" />;
      return <ArrowDown size={12} className="text-indigo-600" />;
  };

  const handleExportPDF = () => {
      exportToPDF(sortedTransactions, accounts, { 
          fileName: `lancamentos_finai_${new Date().toISOString().slice(0,10)}.pdf`,
          companyName: 'FinAI Ledger' 
      });
  };

  const handleExportExcel = () => {
      exportToExcel(sortedTransactions, accounts, `lancamentos_finai_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const openDetails = (id: string) => {
      setDetailsModalId(id);
  }

  const closeDetails = () => {
      setDetailsModalId(null);
  }
  
  const handleReconcile = (t: Transaction) => {
      onUpdateTransaction({ ...t, reconciled: !t.reconciled });
  };

  const selectedTransaction = transactions.find(t => t.id === detailsModalId);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
           <h3 className="text-lg font-bold text-gray-800 dark:text-white">Lançamentos</h3>
           <div className="flex gap-2">
                <button onClick={handleExportPDF} className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 px-3 py-2 rounded-lg transition">
                    <FileText size={16} /> PDF
                </button>
                <button onClick={handleExportExcel} className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 px-3 py-2 rounded-lg transition">
                    <FileSpreadsheet size={16} /> Excel
                </button>
           </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Buscar por descrição..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-white shadow-sm"
            />
          </div>

          <div className="flex gap-2">
             <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="pl-3 pr-2 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900 shadow-sm dark:text-white" />
             <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="pl-3 pr-2 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900 shadow-sm dark:text-white" />
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
          <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase text-gray-500 dark:text-gray-400 select-none">
            <tr>
              <th className="px-6 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" onClick={() => requestSort('date')}>
                 <div className="flex items-center gap-1">DATA {getSortIcon('date')}</div>
              </th>
              <th className="px-6 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" onClick={() => requestSort('description')}>
                 <div className="flex items-center gap-1">DESCRIÇÃO {getSortIcon('description')}</div>
              </th>
              <th className="px-6 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" onClick={() => requestSort('accountName')}>
                 <div className="flex items-center gap-1">CONTA {getSortIcon('accountName')}</div>
              </th>
              <th className="px-6 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" onClick={() => requestSort('category')}>
                  <div className="flex items-center gap-1">CATEGORIA {getSortIcon('category')}</div>
              </th>
              <th className="px-6 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" onClick={() => requestSort('amount')}>
                 <div className="flex items-center gap-1">VALOR {getSortIcon('amount')}</div>
              </th>
              <th className="px-6 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" onClick={() => requestSort('isPaid')}>
                 <div className="flex items-center gap-1">STATUS {getSortIcon('isPaid')}</div>
              </th>
              <th className="px-6 py-3 text-center">Conciliar</th>
              <th className="px-6 py-3 text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {sortedTransactions.map((t) => (
                <tr key={t.id} className="border-b border-gray-50 dark:border-gray-700 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">
                    {new Date(t.date).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                    <div className="flex items-center gap-2">
                        {t.type === TransactionType.INCOME && <ArrowUpCircle size={16} className="text-green-500 shrink-0" />}
                        {t.type === TransactionType.EXPENSE && <ArrowDownCircle size={16} className="text-red-500 shrink-0" />}
                        {t.type === TransactionType.TRANSFER && <ArrowRightLeft size={16} className="text-blue-500 shrink-0" />}
                        {t.description}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs">
                      <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                          <Landmark size={12} />
                          {getAccountName(t.accountId)}
                          {t.type === TransactionType.TRANSFER && (
                              <><ArrowRightLeft size={10} className="mx-1"/>{getAccountName(t.destinationAccountId)}</>
                          )}
                      </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                        {t.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold">
                     <span className={`${t.type === TransactionType.INCOME ? 'text-green-600' : t.type === TransactionType.EXPENSE ? 'text-red-600' : 'text-blue-600'}`}>
                       {t.type === TransactionType.EXPENSE ? '-' : ''} R$ {(t.amount || 0).toFixed(2)}
                     </span>
                  </td>
                  <td className="px-6 py-4">
                     {t.isPaid ? (
                        <span className="text-green-600 text-xs font-semibold flex items-center gap-1"><CheckCircle2 size={12}/> {t.type === TransactionType.INCOME ? 'Recebido' : 'Pago'}</span>
                     ) : (
                        <span className="text-yellow-600 text-xs font-semibold flex items-center gap-1"><Clock size={12}/> Pendente</span>
                     )}
                  </td>
                  <td className="px-6 py-4 text-center">
                      <input 
                        type="checkbox" 
                        checked={t.reconciled || false} 
                        onChange={() => handleReconcile(t)}
                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
                        title="Conciliar Extrato"
                      />
                  </td>
                  <td className="px-6 py-4 text-center">
                     <div className="flex items-center justify-center gap-2">
                        <button onClick={() => openDetails(t.id)} className="p-2 text-gray-400 hover:text-indigo-600 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition" title="Ver Detalhes">
                            <Eye size={16} />
                        </button>
                        <button onClick={() => onEditTransaction(t)} className="p-2 text-gray-400 hover:text-orange-500 rounded-full hover:bg-orange-50 dark:hover:bg-orange-900/20 transition" title="Editar">
                            <Edit2 size={16} />
                        </button>
                        <button onClick={() => onToggleStatus(t.id)} className={`p-2 rounded-full transition hover:bg-gray-100 dark:hover:bg-gray-700 ${t.isPaid ? 'text-green-600' : 'text-gray-400 hover:text-green-600'}`} title={t.isPaid ? "Marcar como pendente" : "Marcar como pago"}>
                           <CheckCircle2 size={16} />
                        </button>
                     </div>
                  </td>
                </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedTransaction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700 flex flex-col max-h-[90vh]">
                  <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
                      <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                          <Info size={18} className="text-indigo-500"/> Detalhes do Lançamento
                      </h3>
                      <button onClick={closeDetails} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition">
                          <X size={20} />
                      </button>
                  </div>

                  <div className="p-6 overflow-y-auto custom-scrollbar space-y-5">
                      <div className="flex justify-between items-center">
                          <div>
                              <p className="text-xs text-gray-500 uppercase font-bold mb-1">Valor</p>
                              <p className={`text-2xl font-bold ${selectedTransaction.type === 'income' ? 'text-emerald-600' : selectedTransaction.type === 'expense' ? 'text-red-600' : 'text-blue-600'}`}>
                                  R$ {selectedTransaction.amount.toFixed(2)}
                              </p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${
                              selectedTransaction.type === 'income' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                              selectedTransaction.type === 'expense' ? 'bg-red-50 text-red-700 border-red-100' : 
                              'bg-blue-50 text-blue-700 border-blue-100'
                          }`}>
                              {selectedTransaction.type === 'income' ? 'Receita' : selectedTransaction.type === 'expense' ? 'Despesa' : 'Transferência'}
                          </span>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                           <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700">
                               <p className="text-xs text-gray-400 uppercase font-bold mb-1">Descrição</p>
                               <p className="font-medium text-gray-800 dark:text-gray-200">{selectedTransaction.description}</p>
                           </div>
                      </div>
                  </div>
                  
                  <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex gap-3">
                       <button onClick={closeDetails} className="flex-1 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition font-medium">
                           Fechar
                       </button>
                       <button onClick={() => { closeDetails(); onEditTransaction(selectedTransaction); }} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium flex items-center justify-center gap-2">
                           <Edit2 size={16} /> Editar
                       </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
