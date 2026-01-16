import React, { useState } from 'react';
import { Transaction, TransactionType, Category, RecurrenceFrequency, RecurrenceLabels, BankAccount } from '../types';
import { ArrowUpCircle, ArrowDownCircle, Clock, CheckCircle2, Search, Download, Calendar, Edit2, Save, X, Trash2, Repeat, Eye, Info, ArrowRightLeft, Landmark, FileSpreadsheet, FileText } from 'lucide-react';
import { exportToPDF, exportToExcel } from '../services/exportService';

interface TransactionListProps {
  transactions: Transaction[];
  categories: Category[];
  accounts?: BankAccount[]; 
  onUpdateTransaction: (transaction: Transaction) => void;
  onToggleStatus: (id: string) => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({ transactions, categories, accounts = [], onUpdateTransaction, onToggleStatus }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Transaction>>({});
  
  // Expand details state
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  // 1. Sort by date desc
  const sorted = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // 2. Filter logic
  const filteredTransactions = sorted.filter(t => {
    const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesDate = true;
    if (startDate) {
        matchesDate = matchesDate && new Date(t.date) >= new Date(startDate);
    }
    if (endDate) {
        // Set end date to end of day
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        matchesDate = matchesDate && new Date(t.date) <= end;
    }

    return matchesSearch && matchesDate;
  });

  // Export CSV/Excel/PDF Handlers
  const handleExportPDF = () => {
      exportToPDF(filteredTransactions, accounts, { 
          fileName: `extrato_finai_${new Date().toISOString().slice(0,10)}.pdf`,
          companyName: 'Minha Empresa SaaS' 
      });
  };

  const handleExportExcel = () => {
      exportToExcel(filteredTransactions, accounts, `extrato_finai_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  // Edit Logic
  const startEdit = (t: Transaction) => {
    setEditingId(t.id);
    setEditForm({ ...t, recurrence: t.recurrence || 'none' });
    setExpandedRowId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = () => {
    if (editingId && editForm) {
        const updated = { ...transactions.find(t => t.id === editingId)!, ...editForm };
        onUpdateTransaction(updated);
        setEditingId(null);
        setEditForm({});
    }
  };

  const handleEditChange = (field: keyof Transaction, value: any) => {
      setEditForm(prev => ({ ...prev, [field]: value }));
  };
  
  const toggleDetails = (id: string) => {
      setExpandedRowId(prev => prev === id ? null : id);
  }
  
  const handleReconcile = (t: Transaction) => {
      onUpdateTransaction({ ...t, reconciled: !t.reconciled });
  };

  const getAccountName = (id?: string) => accounts.find(a => a.id === id)?.name || 'Conta Padrão';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      {/* Filters Header */}
      <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
           <h3 className="text-lg font-bold text-gray-800 dark:text-white">Lançamentos Diários</h3>
           <div className="flex gap-2">
                <button 
                    onClick={handleExportPDF}
                    className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 px-3 py-2 rounded-lg transition"
                >
                    <FileText size={16} /> PDF
                </button>
                <button 
                    onClick={handleExportExcel}
                    className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 px-3 py-2 rounded-lg transition"
                >
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
             <input 
                   type="date" 
                   value={startDate}
                   onChange={(e) => setStartDate(e.target.value)}
                   className="pl-3 pr-2 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900 shadow-sm dark:text-white"
             />
             <input 
                   type="date" 
                   value={endDate}
                   onChange={(e) => setEndDate(e.target.value)}
                   className="pl-3 pr-2 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900 shadow-sm dark:text-white"
             />
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
          <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase text-gray-500 dark:text-gray-400">
            <tr>
              <th className="px-6 py-3">Data</th>
              <th className="px-6 py-3">Descrição</th>
              <th className="px-6 py-3">Conta</th>
              <th className="px-6 py-3">Categoria</th>
              <th className="px-6 py-3">Valor</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-center">Conciliar</th>
              <th className="px-6 py-3 text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map((t) => {
              const isEditing = editingId === t.id;
              const isExpanded = expandedRowId === t.id;

              return (
                <React.Fragment key={t.id}>
                <tr className={`border-b border-gray-50 dark:border-gray-700 transition-colors ${isEditing || isExpanded ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                  {/* Date */}
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">
                    {new Date(t.date).toLocaleDateString('pt-BR')}
                  </td>

                  {/* Description */}
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                    <div className="flex items-center gap-2">
                        {t.type === TransactionType.INCOME && <ArrowUpCircle size={16} className="text-green-500 shrink-0" />}
                        {t.type === TransactionType.EXPENSE && <ArrowDownCircle size={16} className="text-red-500 shrink-0" />}
                        {t.type === TransactionType.TRANSFER && <ArrowRightLeft size={16} className="text-blue-500 shrink-0" />}
                        {t.description}
                    </div>
                  </td>

                  {/* Account */}
                  <td className="px-6 py-4 text-xs">
                      <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                          <Landmark size={12} />
                          {getAccountName(t.accountId)}
                          {t.type === TransactionType.TRANSFER && (
                              <>
                                <ArrowRightLeft size={10} className="mx-1"/>
                                {getAccountName(t.destinationAccountId)}
                              </>
                          )}
                      </div>
                  </td>

                  {/* Category */}
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                        {t.category}
                    </span>
                  </td>

                  {/* Amount */}
                  <td className="px-6 py-4 font-bold">
                     <span className={`${t.type === TransactionType.INCOME ? 'text-green-600' : t.type === TransactionType.EXPENSE ? 'text-red-600' : 'text-blue-600'}`}>
                       {t.type === TransactionType.EXPENSE ? '-' : ''} R$ {(t.amount || 0).toFixed(2)}
                     </span>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                     {t.isPaid ? (
                        <span className="text-green-600 text-xs font-semibold flex items-center gap-1"><CheckCircle2 size={12}/> {t.type === TransactionType.INCOME ? 'Recebido' : 'Pago'}</span>
                     ) : (
                        <span className="text-yellow-600 text-xs font-semibold flex items-center gap-1"><Clock size={12}/> Pendente</span>
                     )}
                  </td>

                  {/* Reconcile Checkbox */}
                  <td className="px-6 py-4 text-center">
                      <input 
                        type="checkbox" 
                        checked={t.reconciled || false} 
                        onChange={() => handleReconcile(t)}
                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
                        title="Conciliar Extrato"
                      />
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 text-center">
                     <div className="flex items-center justify-center gap-2">
                        <button onClick={() => toggleDetails(t.id)} className="p-2 text-gray-400 hover:text-indigo-600 rounded-full">
                            <Eye size={16} />
                        </button>
                        <button onClick={() => onToggleStatus(t.id)} className={`p-2 rounded-full ${t.isPaid ? 'text-green-600' : 'text-gray-400 hover:text-green-600'}`}>
                           <CheckCircle2 size={16} />
                        </button>
                     </div>
                  </td>
                </tr>
                {isExpanded && (
                    <tr className="bg-gray-50 dark:bg-gray-700/30">
                        <td colSpan={8} className="px-6 py-4">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                 <div>
                                     <p className="text-xs font-bold uppercase mb-1">Detalhes</p>
                                     <p>Fonte: {t.source === 'whatsapp_ai' ? 'IA' : 'Manual'}</p>
                                     <p>Vencimento: {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '-'}</p>
                                 </div>
                                 {t.originalInput && (
                                     <div>
                                         <p className="text-xs font-bold uppercase mb-1">Input Original</p>
                                         <p className="italic">"{t.originalInput}"</p>
                                     </div>
                                 )}
                             </div>
                        </td>
                    </tr>
                )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};