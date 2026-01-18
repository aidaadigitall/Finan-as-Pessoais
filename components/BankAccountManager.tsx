
import React, { useState, useMemo } from 'react';
import { BankAccount, Transaction } from '../types';
import { Landmark, Plus, Trash2, Edit2, CheckCircle2 } from 'lucide-react';
import { financialEngine } from '../services/financialEngine';

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
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [name, setName] = useState('');
  const [bankName, setBankName] = useState('');
  const [initialBalance, setInitialBalance] = useState('');
  const [color, setColor] = useState('indigo');

  // Cálculo de saldos em tempo real usando o motor
  const accountBalances = useMemo(() => {
    return financialEngine.computeAllBalances(accounts, transactions);
  }, [accounts, transactions]);

  const handleSave = () => {
    if (!name || !bankName) return;

    const accountData: BankAccount = {
      id: editingId || 'temp-' + Date.now(),
      name,
      bankName,
      initialBalance: parseFloat(initialBalance) || 0,
      currentBalance: 0, // Campo ignorado, saldo é calculado
      color,
      icon: 'landmark'
    };

    if (editingId) onUpdateAccount(accountData);
    else onAddAccount(accountData);
    
    setShowModal(false);
  };

  const colors = [
    { name: 'indigo', class: 'bg-indigo-600' },
    { name: 'blue', class: 'bg-blue-600' },
    { name: 'emerald', class: 'bg-emerald-600' },
    { name: 'violet', class: 'bg-violet-600' },
    { name: 'rose', class: 'bg-rose-600' },
  ];

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
           <div>
               <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                   <Landmark className="text-indigo-600" /> Minhas Contas
               </h2>
               <p className="text-sm text-gray-500 mt-1">Saldos calculados automaticamente via ledger.</p>
           </div>
           <button onClick={() => { setEditingId(null); setName(''); setBankName(''); setInitialBalance(''); setShowModal(true); }} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition shadow-lg shadow-indigo-200 dark:shadow-none">
               <Plus size={18} /> Nova Conta
           </button>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {accounts.map(account => {
             const balance = accountBalances[account.id] || 0;
             const colorClass = colors.find(c => c.name === account.color)?.class || 'bg-indigo-600';
             
             return (
               <div key={account.id} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 relative group overflow-hidden">
                   <div className="relative z-10">
                       <div className="flex justify-between items-start mb-4">
                           <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${colorClass} shadow-inner`}>
                               <Landmark size={24} />
                           </div>
                           <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                               <button onClick={() => { setEditingId(account.id); setName(account.name); setBankName(account.bankName); setInitialBalance(account.initialBalance.toString()); setColor(account.color); setShowModal(true); }} className="p-1.5 text-gray-400 hover:text-indigo-600 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                   <Edit2 size={14} />
                               </button>
                               <button onClick={() => onDeleteAccount(account.id)} className="p-1.5 text-gray-400 hover:text-red-600 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                   <Trash2 size={14} />
                               </button>
                           </div>
                       </div>

                       <h3 className="font-bold text-gray-800 dark:text-white text-lg">{account.name}</h3>
                       <p className="text-sm text-gray-500 mb-6">{account.bankName}</p>

                       <div className="mb-4">
                           <span className="text-[10px] text-gray-400 uppercase tracking-widest font-black">Saldo Projetado</span>
                           <p className={`text-2xl font-black ${balance >= 0 ? 'text-gray-900 dark:text-white' : 'text-red-500'}`}>
                               R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                           </p>
                       </div>

                       <div className="flex items-center justify-between text-[10px] border-t border-gray-100 dark:border-gray-700 pt-4 uppercase font-bold text-gray-400">
                           <div className="flex items-center gap-1">
                               <CheckCircle2 size={12} className="text-emerald-500" />
                               <span>Consistente</span>
                           </div>
                           <span>Ledger Ativo</span>
                       </div>
                   </div>
               </div>
             );
           })}
       </div>

       {showModal && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
               <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-8 shadow-2xl border border-white/10">
                   <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6">Configuração de Conta</h3>
                   <div className="space-y-4">
                       <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nome (ex: Nubank)" className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" />
                       <input type="text" value={bankName} onChange={e => setBankName(e.target.value)} placeholder="Instituição (ex: Nubank S.A.)" className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" />
                       <input type="number" value={initialBalance} onChange={e => setInitialBalance(e.target.value)} placeholder="Saldo Inicial R$ 0.00" className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 font-bold" />
                       <div className="flex gap-3 pt-2">
                           {colors.map(c => (
                               <button key={c.name} onClick={() => setColor(c.name)} className={`w-8 h-8 rounded-full ${c.class} ${color === c.name ? 'ring-4 ring-offset-2 ring-indigo-500' : ''}`} />
                           ))}
                       </div>
                   </div>
                   <div className="flex gap-3 mt-8">
                       <button onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-xl text-gray-500 font-bold">Cancelar</button>
                       <button onClick={handleSave} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none">Salvar Conta</button>
                   </div>
               </div>
           </div>
       )}
    </div>
  );
};
