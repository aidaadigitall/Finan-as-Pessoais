import React, { useState } from 'react';
import { Transaction, TransactionType, Category, RecurrenceFrequency, RecurrenceLabels } from '../types';
import { ArrowUpCircle, ArrowDownCircle, Clock, CheckCircle2, Search, Download, Calendar, Edit2, Save, X, Trash2, Repeat } from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  categories: Category[]; 
  onUpdateTransaction: (transaction: Transaction) => void; 
}

export const TransactionList: React.FC<TransactionListProps> = ({ transactions, categories, onUpdateTransaction }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Transaction>>({});

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

  // Export CSV Logic
  const handleExportCSV = () => {
    const headers = ['ID', 'Data', 'Descrição', 'Categoria', 'Recorrência', 'Tipo', 'Valor', 'Status', 'Pago'];
    const rows = filteredTransactions.map(t => [
      t.id,
      new Date(t.date).toLocaleDateString('pt-BR'),
      `"${t.description}"`, // Quote description to handle commas
      t.category,
      t.recurrence && t.recurrence !== 'none' ? RecurrenceLabels[t.recurrence] : 'Única',
      t.type === TransactionType.INCOME ? 'Receita' : 'Despesa',
      (t.amount || 0).toFixed(2),
      t.status,
      t.isPaid ? 'Sim' : 'Não'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `lancamentos_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Edit Logic
  const startEdit = (t: Transaction) => {
    setEditingId(t.id);
    setEditForm({ ...t, recurrence: t.recurrence || 'none' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = () => {
    if (editingId && editForm) {
        // Merge updates
        const updated = { ...transactions.find(t => t.id === editingId)!, ...editForm };
        onUpdateTransaction(updated);
        setEditingId(null);
        setEditForm({});
    }
  };

  const handleEditChange = (field: keyof Transaction, value: any) => {
      setEditForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      {/* Filters Header */}
      <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
           <h3 className="text-lg font-bold text-gray-800 dark:text-white">Lançamentos Diários</h3>
           <button 
              onClick={handleExportCSV}
              className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-3 py-2 rounded-lg transition"
            >
              <Download size={16} /> Exportar CSV
           </button>
        </div>
        
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Buscar por descrição ou categoria..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-white shadow-sm"
            />
          </div>

          {/* Date Filters */}
          <div className="flex gap-2">
             <div className="relative">
                <input 
                   type="date" 
                   value={startDate}
                   onChange={(e) => setStartDate(e.target.value)}
                   className="pl-3 pr-2 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-900 shadow-sm"
                   title="Data Inicial"
                />
             </div>
             <span className="self-center text-gray-400">-</span>
             <div className="relative">
                <input 
                   type="date" 
                   value={endDate}
                   onChange={(e) => setEndDate(e.target.value)}
                   className="pl-3 pr-2 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-900 shadow-sm"
                   title="Data Final"
                />
             </div>
          </div>
          
          <div className="flex items-center">
             <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-semibold px-2.5 py-2 rounded shrink-0">
               {filteredTransactions.length} registros
             </span>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
          <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase text-gray-500 dark:text-gray-400">
            <tr>
              <th className="px-6 py-3">Data</th>
              <th className="px-6 py-3">Descrição</th>
              <th className="px-6 py-3">Categoria</th>
              <th className="px-6 py-3">Recorrência</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">Valor</th>
              <th className="px-6 py-3 text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map((t) => {
              const isEditing = editingId === t.id;

              return (
                <tr key={t.id} className={`border-b border-gray-50 dark:border-gray-700 transition-colors ${isEditing ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                  {/* Date Column */}
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">
                    {isEditing ? (
                       <input 
                          type="date" 
                          value={editForm.date ? new Date(editForm.date).toISOString().split('T')[0] : ''}
                          onChange={(e) => handleEditChange('date', new Date(e.target.value).toISOString())}
                          className="w-32 p-1 border rounded text-xs bg-white dark:bg-gray-600 dark:text-white"
                       />
                    ) : (
                      <>
                        {new Date(t.date).toLocaleDateString('pt-BR')}
                        <div className="text-[10px] text-gray-400 dark:text-gray-500">
                          {new Date(t.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                      </>
                    )}
                  </td>

                  {/* Description Column */}
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                    {isEditing ? (
                        <input 
                           type="text" 
                           value={editForm.description}
                           onChange={(e) => handleEditChange('description', e.target.value)}
                           className="w-full p-1 border rounded text-sm bg-white dark:bg-gray-600 dark:text-white"
                        />
                    ) : (
                        <div className="flex items-center gap-2">
                            {t.type === TransactionType.INCOME ? (
                                <ArrowUpCircle size={16} className="text-green-500 shrink-0" />
                            ) : (
                                <ArrowDownCircle size={16} className="text-red-500 shrink-0" />
                            )}
                            {t.source === 'whatsapp_ai' && (
                               <span className="text-[10px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-1 rounded">WA</span>
                            )}
                            {t.description}
                        </div>
                    )}
                  </td>

                  {/* Category Column */}
                  <td className="px-6 py-4">
                    {isEditing ? (
                        <select 
                           value={editForm.category}
                           onChange={(e) => handleEditChange('category', e.target.value)}
                           className="w-32 p-1 border rounded text-xs bg-white dark:bg-gray-600 dark:text-white"
                        >
                           {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                    ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                            {t.category}
                        </span>
                    )}
                  </td>

                  {/* Recurrence Column */}
                  <td className="px-6 py-4">
                     {isEditing ? (
                        <select 
                            value={editForm.recurrence || 'none'}
                            onChange={(e) => handleEditChange('recurrence', e.target.value)}
                            className="w-28 p-1 border rounded text-xs bg-white dark:bg-gray-600 dark:text-white"
                        >
                             {Object.entries(RecurrenceLabels).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
                     ) : (
                         t.recurrence && t.recurrence !== 'none' ? (
                            <span className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded">
                                <Repeat size={12} /> {RecurrenceLabels[t.recurrence]}
                            </span>
                         ) : (
                            <span className="text-xs text-gray-400">-</span>
                         )
                     )}
                  </td>

                  {/* Status Column */}
                  <td className="px-6 py-4">
                    {t.isPaid ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                            <CheckCircle2 size={12} /> {t.type === TransactionType.INCOME ? 'Recebido' : 'Pago'}
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">
                            <Clock size={12} /> Pendente
                        </span>
                    )}
                  </td>

                  {/* Amount Column */}
                  <td className="px-6 py-4 text-right">
                     {isEditing ? (
                        <input 
                            type="number"
                            step="0.01"
                            value={editForm.amount}
                            onChange={(e) => handleEditChange('amount', parseFloat(e.target.value))}
                            className="w-24 p-1 border rounded text-right text-sm bg-white dark:bg-gray-600 dark:text-white"
                        />
                     ) : (
                         <span className={`font-bold ${t.type === TransactionType.INCOME ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                           {t.type === TransactionType.INCOME ? '+' : '-'} R$ {(t.amount || 0).toFixed(2)}
                         </span>
                     )}
                  </td>

                  {/* Actions Column */}
                  <td className="px-6 py-4 text-center">
                     {isEditing ? (
                        <div className="flex items-center justify-center gap-2">
                           <button 
                              onClick={saveEdit}
                              className="p-1 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded"
                              title="Salvar"
                           >
                              <Save size={16} />
                           </button>
                           <button 
                              onClick={cancelEdit}
                              className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                              title="Cancelar"
                           >
                              <X size={16} />
                           </button>
                        </div>
                     ) : (
                        <button 
                           onClick={() => startEdit(t)}
                           className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-full transition"
                           title="Editar"
                        >
                           <Edit2 size={16} />
                        </button>
                     )}
                  </td>
                </tr>
              );
            })}
            {filteredTransactions.length === 0 && (
                <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-gray-400 dark:text-gray-500">
                        {searchTerm || startDate || endDate ? 'Nenhum lançamento encontrado com estes filtros.' : 'Nenhuma transação registrada.'}
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};