import React, { useState, useEffect } from 'react';
import { Transaction, TransactionType, TransactionStatus, Category, BankAccount } from '../types';
import { X, ArrowUpCircle, ArrowDownCircle, ArrowRightLeft, Calendar, DollarSign, Tag, Landmark, Save, Target } from 'lucide-react';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Transaction) => void;
  categories: Category[];
  accounts: BankAccount[];
  transactions: Transaction[]; // Needed for budget calc
}

export const TransactionModal: React.FC<TransactionModalProps> = ({ 
  isOpen, onClose, onSave, categories, accounts, transactions 
}) => {
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [destinationAccountId, setDestinationAccountId] = useState('');
  const [isPaid, setIsPaid] = useState(true);

  // Reset form when opening
  useEffect(() => {
    if (isOpen) {
      setType(TransactionType.EXPENSE);
      setDescription('');
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      setCategoryId('');
      setAccountId(accounts[0]?.id || '');
      setDestinationAccountId('');
      setIsPaid(true);
    }
  }, [isOpen, accounts]);

  // Calculate Budget Progress for selected category
  const getBudgetInfo = () => {
      if (type !== TransactionType.EXPENSE || !categoryId) return null;
      
      const category = categories.find(c => c.name === categoryId); // ID is Name in this app architecture for simplicity, though ideally should be ID
      if (!category || !category.budgetLimit) return null;

      const now = new Date();
      const spentThisMonth = transactions
        .filter(t => 
            t.type === TransactionType.EXPENSE && 
            t.category === categoryId && 
            t.isPaid &&
            new Date(t.date).getMonth() === now.getMonth() &&
            new Date(t.date).getFullYear() === now.getFullYear()
        )
        .reduce((sum, t) => sum + t.amount, 0);

      const percent = Math.min((spentThisMonth / category.budgetLimit) * 100, 100);
      const remaining = category.budgetLimit - spentThisMonth;
      
      return { limit: category.budgetLimit, spent: spentThisMonth, percent, remaining };
  };

  const budgetInfo = getBudgetInfo();

  const handleSave = () => {
      if (!description || !amount || !accountId) return;
      if (type !== TransactionType.TRANSFER && !categoryId) return;
      if (type === TransactionType.TRANSFER && !destinationAccountId) return;

      const newTransaction: Transaction = {
          id: Date.now().toString(),
          date: new Date(date).toISOString(),
          dueDate: !isPaid ? new Date(date).toISOString() : undefined,
          description,
          amount: parseFloat(amount),
          type,
          category: type === TransactionType.TRANSFER ? 'Transferência' : categoryId,
          status: TransactionStatus.CONFIRMED,
          isPaid,
          source: 'manual',
          accountId,
          destinationAccountId: type === TransactionType.TRANSFER ? destinationAccountId : undefined,
          reconciled: false
      };

      onSave(newTransaction);
      onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
        <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
                <h2 className="text-lg font-bold text-gray-800 dark:text-white">Novo Lançamento</h2>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                    <X size={24} />
                </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto custom-scrollbar">
                
                {/* Type Selector */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                    <button 
                        onClick={() => setType(TransactionType.INCOME)}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border transition ${type === TransactionType.INCOME ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400' : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                    >
                        <ArrowUpCircle size={20} className="mb-1" />
                        <span className="text-xs font-bold">Receita</span>
                    </button>
                    <button 
                        onClick={() => setType(TransactionType.EXPENSE)}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border transition ${type === TransactionType.EXPENSE ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400' : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                    >
                        <ArrowDownCircle size={20} className="mb-1" />
                        <span className="text-xs font-bold">Despesa</span>
                    </button>
                    <button 
                        onClick={() => setType(TransactionType.TRANSFER)}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border transition ${type === TransactionType.TRANSFER ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400' : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                    >
                        <ArrowRightLeft size={20} className="mb-1" />
                        <span className="text-xs font-bold">Transferência</span>
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Amount & Date Row */}
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Valor</label>
                            <div className="relative">
                                <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input 
                                    type="number" 
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full pl-9 p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-lg"
                                    autoFocus
                                />
                            </div>
                        </div>
                        <div className="flex-1">
                             <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Data</label>
                             <div className="relative">
                                 <input 
                                     type="date" 
                                     value={date}
                                     onChange={e => setDate(e.target.value)}
                                     className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                                 />
                             </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Descrição</label>
                        <input 
                            type="text" 
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder={type === TransactionType.TRANSFER ? "Ex: Transferência para Poupança" : "Ex: Compras Supermercado"}
                            className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    {/* Account Selection */}
                    {type === TransactionType.TRANSFER ? (
                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Origem (Sai)</label>
                                <div className="relative">
                                    <Landmark size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <select 
                                        value={accountId}
                                        onChange={e => setAccountId(e.target.value)}
                                        className="w-full pl-9 p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                                    >
                                        <option value="" disabled>Selecione</option>
                                        {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                                    </select>
                                </div>
                             </div>
                             <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Destino (Entra)</label>
                                <div className="relative">
                                    <Landmark size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <select 
                                        value={destinationAccountId}
                                        onChange={e => setDestinationAccountId(e.target.value)}
                                        className="w-full pl-9 p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                                    >
                                        <option value="" disabled>Selecione</option>
                                        {accounts.filter(a => a.id !== accountId).map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                                    </select>
                                </div>
                             </div>
                        </div>
                    ) : (
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Conta Bancária</label>
                            <div className="relative">
                                <Landmark size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <select 
                                    value={accountId}
                                    onChange={e => setAccountId(e.target.value)}
                                    className="w-full pl-9 p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                                >
                                    <option value="" disabled>Selecione a conta</option>
                                    {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Category Selection (Not for transfers) */}
                    {type !== TransactionType.TRANSFER && (
                        <div>
                             <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Categoria</label>
                             <div className="relative">
                                <Tag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <select 
                                    value={categoryId}
                                    onChange={e => setCategoryId(e.target.value)}
                                    className="w-full pl-9 p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                                >
                                    <option value="" disabled>Selecione a categoria</option>
                                    {categories
                                        .filter(c => c.type === type || c.type === 'both')
                                        .map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)
                                    }
                                </select>
                             </div>

                             {/* Budget Visualizer inside Form */}
                             {budgetInfo && (
                                 <div className="mt-2 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700 animate-in fade-in">
                                     <div className="flex justify-between items-center mb-1">
                                         <span className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                                             <Target size={12} /> Meta de {categoryId}
                                         </span>
                                         <span className="text-[10px] text-gray-500">Restam R$ {budgetInfo.remaining.toFixed(2)}</span>
                                     </div>
                                     <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                         <div 
                                            className={`h-2 rounded-full transition-all duration-500 ${budgetInfo.percent > 90 ? 'bg-red-500' : budgetInfo.percent > 75 ? 'bg-orange-500' : 'bg-emerald-500'}`}
                                            style={{ width: `${budgetInfo.percent}%` }}
                                         ></div>
                                     </div>
                                     <div className="flex justify-between mt-1 text-[10px] text-gray-400">
                                         <span>Gasto: R$ {budgetInfo.spent.toFixed(0)}</span>
                                         <span>Limite: R$ {budgetInfo.limit.toFixed(0)}</span>
                                     </div>
                                 </div>
                             )}
                        </div>
                    )}

                    {/* Paid/Pending Toggle (Not for transfers) */}
                    {type !== TransactionType.TRANSFER && (
                        <div className="flex items-center gap-3 pt-2">
                            <label className="flex items-center cursor-pointer relative">
                                <input type="checkbox" checked={isPaid} onChange={() => setIsPaid(!isPaid)} className="sr-only peer" />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                                <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">
                                    {isPaid ? (type === TransactionType.INCOME ? 'Recebido' : 'Pago') : 'Pendente / Agendado'}
                                </span>
                            </label>
                        </div>
                    )}

                </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex gap-3">
                <button onClick={onClose} className="flex-1 py-3 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition font-medium">Cancelar</button>
                <button 
                    onClick={handleSave}
                    disabled={!amount || !description || !accountId}
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    <Save size={18} /> Salvar Lançamento
                </button>
            </div>

        </div>
    </div>
  );
};
