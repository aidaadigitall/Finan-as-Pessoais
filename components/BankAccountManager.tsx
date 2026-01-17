
import React, { useState } from 'react';
import { BankAccount, Transaction } from '../types';
import { Landmark, Plus, Trash2, Edit2, CheckCircle2, FileText, Upload, RefreshCw, X } from 'lucide-react';

interface BankAccountManagerProps {
  accounts: BankAccount[];
  transactions: Transaction[];
  onAddAccount: (account: BankAccount) => void;
  onUpdateAccount: (account: BankAccount) => void;
  onDeleteAccount: (id: string) => void;
}

export const BankAccountManager: React.FC<BankAccountManagerProps> = ({ 
  accounts, 
  transactions,
  onAddAccount, 
  onUpdateAccount, 
  onDeleteAccount 
}) => {
  const [showModal, setShowModal] = useState(false);
  const [showReconcileModal, setShowReconcileModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Reconcile State
  const [reconcileAccount, setReconcileAccount] = useState<BankAccount | null>(null);
  const [reconcileFile, setReconcileFile] = useState<File | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [reconcileStep, setReconcileStep] = useState<1 | 2>(1);
  const [reconcileMatches, setReconcileMatches] = useState<any[]>([]);
  
  // Form State
  const [name, setName] = useState('');
  const [bankName, setBankName] = useState('');
  const [initialBalance, setInitialBalance] = useState('');
  const [color, setColor] = useState('blue');

  const openModal = (account?: BankAccount) => {
    if (account) {
      setEditingId(account.id);
      setName(account.name);
      setBankName(account.bankName);
      setInitialBalance(account.initialBalance.toString());
      setColor(account.color);
    } else {
      setEditingId(null);
      setName('');
      setBankName('');
      setInitialBalance('');
      setColor('blue');
    }
    setShowModal(true);
  };

  const handleSave = () => {
    if (!name || !bankName) return;

    const accountData: BankAccount = {
      id: editingId || Date.now().toString(),
      name,
      bankName,
      initialBalance: parseFloat(initialBalance) || 0,
      currentBalance: parseFloat(initialBalance) || 0,
      color,
      icon: 'landmark'
    };

    if (editingId) {
      onUpdateAccount(accountData);
    } else {
      onAddAccount(accountData);
    }
    setShowModal(false);
  };

  const getAccountStats = (accountId: string) => {
     const accTransactions = transactions.filter(t => 
         (t.accountId === accountId || t.destinationAccountId === accountId) && t.isPaid
     );
     const reconciledCount = accTransactions.filter(t => t.reconciled).length;
     const pendingCount = accTransactions.filter(t => !t.reconciled).length;
     return { reconciledCount, pendingCount };
  };

  const colors = [
    { name: 'blue', class: 'bg-blue-600' },
    { name: 'emerald', class: 'bg-emerald-600' },
    { name: 'violet', class: 'bg-violet-600' },
    { name: 'orange', class: 'bg-orange-600' },
    { name: 'gray', class: 'bg-gray-800' },
  ];

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
           <div>
               <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                   <Landmark className="text-indigo-600 dark:text-indigo-400" />
                   Minhas Contas
               </h2>
               <p className="text-sm text-gray-500 mt-1">Gerencie saldos e conciliação bancária.</p>
           </div>
           <button 
              onClick={() => openModal()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition"
           >
               <Plus size={18} /> Nova Conta
           </button>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {accounts.map(account => {
             const stats = getAccountStats(account.id);
             const colorClass = colors.find(c => c.name === account.color)?.class || 'bg-blue-600';
             return (
               <div key={account.id} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 relative group overflow-hidden">
                   <div className={`absolute top-0 right-0 w-24 h-24 bg-${account.color}-500 opacity-5 rounded-bl-full -mr-4 -mt-4`}></div>
                   
                   <div className="relative z-10">
                       <div className="flex justify-between items-start mb-4">
                           <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${colorClass}`}>
                               <Landmark size={24} />
                           </div>
                           <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                               <button onClick={() => openModal(account)} className="p-1.5 text-gray-400 hover:text-indigo-600 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm">
                                   <Edit2 size={14} />
                               </button>
                               <button onClick={() => onDeleteAccount(account.id)} className="p-1.5 text-gray-400 hover:text-red-600 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm">
                                   <Trash2 size={14} />
                               </button>
                           </div>
                       </div>

                       <h3 className="font-bold text-gray-800 dark:text-white text-lg">{account.name}</h3>
                       <p className="text-sm text-gray-500 mb-6">{account.bankName}</p>

                       <div className="mb-4">
                           <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Saldo Atual</span>
                           <p className={`text-2xl font-bold ${account.currentBalance >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-red-500'}`}>
                               R$ {account.currentBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                           </p>
                       </div>

                       <div className="flex items-center justify-between text-xs border-t border-gray-100 dark:border-gray-700 pt-4">
                           <div className="flex items-center gap-1 text-gray-500">
                               <CheckCircle2 size={14} className="opacity-50" />
                               <span>{stats.pendingCount} Pendentes</span>
                           </div>
                           <button onClick={() => {}} className="text-indigo-600 font-bold hover:underline">Ações</button>
                       </div>
                   </div>
               </div>
             );
           })}

           <button 
              onClick={() => openModal()}
              className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-6 flex flex-col items-center justify-center text-gray-400 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition group h-full min-h-[220px]"
           >
               <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-2">
                   <Plus size={24} />
               </div>
               <span className="font-medium">Nova Conta</span>
           </button>
       </div>

       {showModal && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
               <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
                   <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6">
                       {editingId ? 'Editar Conta' : 'Nova Conta Bancária'}
                   </h3>
                   <div className="space-y-4">
                       <div>
                           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome da Conta</label>
                           <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Principal" className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 dark:text-white outline-none" />
                       </div>
                       <div>
                           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Banco</label>
                           <input type="text" value={bankName} onChange={e => setBankName(e.target.value)} placeholder="Ex: Itaú" className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 dark:text-white outline-none" />
                       </div>
                       <div>
                           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Saldo Inicial (R$)</label>
                           <input type="number" value={initialBalance} onChange={e => setInitialBalance(e.target.value)} placeholder="0.00" className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 dark:text-white outline-none" />
                       </div>
                       <div>
                           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Cor</label>
                           <div className="flex gap-3">
                               {colors.map(c => (
                                   <button key={c.name} onClick={() => setColor(c.name)} className={`w-8 h-8 rounded-full ${c.class} ${color === c.name ? 'ring-4 ring-indigo-200' : ''}`} />
                               ))}
                           </div>
                       </div>
                   </div>
                   <div className="flex gap-3 mt-8">
                       <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300">Cancelar</button>
                       <button onClick={handleSave} className="flex-1 py-2.5 rounded-lg bg-indigo-600 text-white font-medium">Salvar</button>
                   </div>
               </div>
           </div>
       )}
    </div>
  );
};
