import React, { useState } from 'react';
import { BankAccount, Transaction, TransactionType } from '../types';
import { Landmark, Plus, CreditCard, Wallet, MoreVertical, Trash2, Edit2, TrendingUp, TrendingDown, CheckCircle2, FileText, Upload, RefreshCw, X } from 'lucide-react';

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
      currentBalance: parseFloat(initialBalance) || 0, // Recalculated by App.tsx logic usually, but init here
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

  // Calculate stats per account based on transactions
  const getAccountStats = (accountId: string) => {
     const accTransactions = transactions.filter(t => 
         (t.accountId === accountId || t.destinationAccountId === accountId) && t.isPaid
     );
     
     const reconciledCount = accTransactions.filter(t => t.reconciled).length;
     const pendingCount = accTransactions.filter(t => !t.reconciled).length;
     
     return { reconciledCount, pendingCount };
  };

  // --- Reconciliation Logic ---
  const startReconciliation = (account: BankAccount) => {
      setReconcileAccount(account);
      setReconcileStep(1);
      setReconcileFile(null);
      setShowReconcileModal(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.[0]) {
          setReconcileFile(e.target.files[0]);
          setIsProcessingFile(true);
          
          // Simulate Processing
          setTimeout(() => {
              setIsProcessingFile(false);
              setReconcileStep(2);
              // Mock Matches
              setReconcileMatches([
                  { id: 1, date: '2023-10-25', desc: 'SUPERMERCADO', amount: -150.00, status: 'match', systemDesc: 'Compras Mercado' },
                  { id: 2, date: '2023-10-26', desc: 'POSTO GASOLINA', amount: -200.00, status: 'missing', systemDesc: null },
                  { id: 3, date: '2023-10-27', desc: 'PIX RECEBIDO', amount: 500.00, status: 'match', systemDesc: 'Pagamento Cliente A' },
              ]);
          }, 2000);
      }
  };

  const colors = [
    { name: 'blue', class: 'bg-blue-600' },
    { name: 'green', class: 'bg-emerald-600' },
    { name: 'purple', class: 'bg-violet-600' },
    { name: 'orange', class: 'bg-orange-600' },
    { name: 'black', class: 'bg-gray-800' },
  ];

  return (
    <div className="space-y-6">
       {/* Header Actions */}
       <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
           <div>
               <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                   <Landmark className="text-indigo-600 dark:text-indigo-400" />
                   Minhas Contas
               </h2>
               <p className="text-sm text-gray-500 mt-1">Gerencie saldos, extratos e conciliação bancária.</p>
           </div>
           <button 
              onClick={() => openModal()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition"
           >
               <Plus size={18} /> Nova Conta
           </button>
       </div>

       {/* Accounts Grid */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {accounts.map(account => {
             const stats = getAccountStats(account.id);
             return (
               <div key={account.id} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 relative group overflow-hidden">
                   {/* Background Decor */}
                   <div className={`absolute top-0 right-0 w-24 h-24 bg-${account.color}-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110`}></div>
                   
                   <div className="relative z-10">
                       <div className="flex justify-between items-start mb-4">
                           <div className={`w-12 h-12 rounded-xl bg-${account.color}-100 dark:bg-${account.color}-900/30 text-${account.color}-600 dark:text-${account.color}-400 flex items-center justify-center`}>
                               <Landmark size={24} />
                           </div>
                           <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                               <button onClick={() => openModal(account)} className="p-1.5 text-gray-400 hover:text-indigo-600 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
                                   <Edit2 size={14} />
                               </button>
                               <button onClick={() => onDeleteAccount(account.id)} className="p-1.5 text-gray-400 hover:text-red-600 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
                                   <Trash2 size={14} />
                               </button>
                           </div>
                       </div>

                       <h3 className="font-bold text-gray-800 dark:text-white text-lg">{account.name}</h3>
                       <p className="text-sm text-gray-500 mb-6">{account.bankName}</p>

                       <div className="mb-4">
                           <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Saldo Atual</span>
                           <p className={`text-2xl font-bold ${account.currentBalance >= 0 ? 'text-gray-900 dark:text-white' : 'text-red-500'}`}>
                               R$ {account.currentBalance.toFixed(2)}
                           </p>
                       </div>

                       <div className="flex items-center justify-between text-xs border-t border-gray-100 dark:border-gray-700 pt-4">
                           <div className="flex items-center gap-1 text-orange-500" title="Transações Pendentes de Conciliação">
                               <CheckCircle2 size={14} className="opacity-50" />
                               <span>{stats.pendingCount} Pendentes</span>
                           </div>
                           <button 
                                onClick={() => startReconciliation(account)}
                                className="text-indigo-600 font-bold hover:underline flex items-center gap-1"
                           >
                               <RefreshCw size={12} /> Conciliar
                           </button>
                       </div>
                   </div>
               </div>
             );
           })}

           {/* Add New Placeholder */}
           <button 
              onClick={() => openModal()}
              className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-6 flex flex-col items-center justify-center text-gray-400 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition group h-full min-h-[240px]"
           >
               <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 group-hover:bg-white dark:group-hover:bg-gray-700 flex items-center justify-center mb-4 transition-colors">
                   <Plus size={32} />
               </div>
               <span className="font-medium">Adicionar Conta Bancária</span>
           </button>
       </div>

       {/* Edit Modal */}
       {showModal && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
               <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95">
                   <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6">
                       {editingId ? 'Editar Conta' : 'Nova Conta Bancária'}
                   </h3>

                   <div className="space-y-4">
                       <div>
                           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome da Conta</label>
                           <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Conta Corrente Principal" className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
                       </div>
                       
                       <div>
                           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Instituição Financeira</label>
                           <input type="text" value={bankName} onChange={e => setBankName(e.target.value)} placeholder="Ex: Nubank, Itaú" className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
                       </div>

                       <div>
                           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Saldo Inicial (R$)</label>
                           <input type="number" value={initialBalance} onChange={e => setInitialBalance(e.target.value)} placeholder="0.00" className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
                       </div>

                       <div>
                           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Cor de Identificação</label>
                           <div className="flex gap-3">
                               {colors.map(c => (
                                   <button 
                                      key={c.name}
                                      onClick={() => setColor(c.name)}
                                      className={`w-8 h-8 rounded-full ${c.class} ${color === c.name ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-gray-600' : ''}`}
                                   />
                               ))}
                           </div>
                       </div>
                   </div>

                   <div className="flex gap-3 mt-8">
                       <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition">Cancelar</button>
                       <button onClick={handleSave} className="flex-1 py-2.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition">Salvar</button>
                   </div>
               </div>
           </div>
       )}

       {/* Reconciliation Modal */}
       {showReconcileModal && reconcileAccount && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
               <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl animate-in zoom-in-95 overflow-hidden flex flex-col max-h-[90vh]">
                   <div className="flex justify-between items-center mb-6 border-b border-gray-100 dark:border-gray-700 pb-4">
                       <div>
                           <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                               <RefreshCw className="text-indigo-500" /> Conciliação Bancária
                           </h3>
                           <p className="text-sm text-gray-500">Conta: <strong>{reconcileAccount.name}</strong></p>
                       </div>
                       <button onClick={() => setShowReconcileModal(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
                   </div>

                   <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                       {reconcileStep === 1 && (
                           <div className="text-center py-10 space-y-6">
                               <div className="mx-auto w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center text-indigo-500">
                                   <Upload size={32} />
                               </div>
                               <div>
                                   <p className="font-medium text-gray-800 dark:text-white mb-2">Importar Extrato Bancário</p>
                                   <p className="text-sm text-gray-500 mb-6">Suporta arquivos .OFX, .PDF, .CSV ou .XLSX</p>
                                   
                                   {isProcessingFile ? (
                                       <div className="flex flex-col items-center gap-2 text-indigo-600">
                                           <RefreshCw size={24} className="animate-spin" />
                                           <span className="text-sm font-medium">Processando arquivo...</span>
                                       </div>
                                   ) : (
                                       <label className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition inline-flex items-center gap-2">
                                           <input type="file" className="hidden" accept=".ofx,.csv,.pdf,.xlsx" onChange={handleFileUpload} />
                                           Selecionar Arquivo
                                       </label>
                                   )}
                               </div>
                           </div>
                       )}

                       {reconcileStep === 2 && (
                           <div className="space-y-4">
                               <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800 flex justify-between items-center">
                                   <div className="flex items-center gap-3">
                                       <FileText className="text-indigo-600" size={24} />
                                       <div>
                                           <p className="font-bold text-indigo-900 dark:text-indigo-200">{reconcileFile?.name}</p>
                                           <p className="text-xs text-indigo-700 dark:text-indigo-400">Processado com sucesso</p>
                                       </div>
                                   </div>
                                   <span className="bg-white dark:bg-gray-800 text-indigo-600 text-xs font-bold px-2 py-1 rounded border border-indigo-200 dark:border-indigo-700">3 Lançamentos</span>
                               </div>

                               <table className="w-full text-sm text-left">
                                   <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-900/50">
                                       <tr>
                                           <th className="px-4 py-3">Data</th>
                                           <th className="px-4 py-3">Descrição Extrato</th>
                                           <th className="px-4 py-3">Valor</th>
                                           <th className="px-4 py-3">Status</th>
                                           <th className="px-4 py-3">Ação</th>
                                       </tr>
                                   </thead>
                                   <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                       {reconcileMatches.map((match) => (
                                           <tr key={match.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                               <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{new Date(match.date).toLocaleDateString('pt-BR')}</td>
                                               <td className="px-4 py-3 font-medium text-gray-800 dark:text-white">
                                                   {match.desc}
                                                   {match.systemDesc && <div className="text-xs text-indigo-500">Sistema: {match.systemDesc}</div>}
                                               </td>
                                               <td className={`px-4 py-3 font-bold ${match.amount < 0 ? 'text-red-500' : 'text-green-500'}`}>
                                                   R$ {match.amount.toFixed(2)}
                                               </td>
                                               <td className="px-4 py-3">
                                                   {match.status === 'match' ? (
                                                       <span className="inline-flex items-center gap-1 text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded-full"><CheckCircle2 size={12}/> Conciliado</span>
                                                   ) : (
                                                       <span className="inline-flex items-center gap-1 text-orange-500 text-xs font-bold bg-orange-50 px-2 py-1 rounded-full"><TrendingUp size={12}/> Novo</span>
                                                   )}
                                               </td>
                                               <td className="px-4 py-3">
                                                   {match.status === 'match' ? (
                                                       <button className="text-gray-400 cursor-not-allowed"><CheckCircle2 size={18}/></button>
                                                   ) : (
                                                        <button className="text-indigo-600 hover:underline text-xs font-bold">+ Lançar</button>
                                                   )}
                                               </td>
                                           </tr>
                                       ))}
                                   </tbody>
                               </table>
                           </div>
                       )}
                   </div>
                   
                   {reconcileStep === 2 && (
                       <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                           <button onClick={() => setShowReconcileModal(false)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold transition">Concluir Conciliação</button>
                       </div>
                   )}
               </div>
           </div>
       )}
    </div>
  );
};