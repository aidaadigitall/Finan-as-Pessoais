
import React, { useState, useEffect } from 'react';
import { Transaction, TransactionType, TransactionStatus, Category, BankAccount } from '../types';
import { X, ArrowUpCircle, ArrowDownCircle, ArrowRightLeft, DollarSign, Tag, Landmark, Save } from 'lucide-react';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Transaction) => void;
  categories: Category[];
  accounts: BankAccount[];
  transactions: Transaction[]; 
}

export const TransactionModal: React.FC<TransactionModalProps> = ({ 
  isOpen, onClose, onSave, categories, accounts 
}) => {
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [destinationAccountId, setDestinationAccountId] = useState('');
  const [isPaid, setIsPaid] = useState(true);

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

  const handleSave = () => {
      if (!description || !amount || !accountId) return;
      if (type !== TransactionType.TRANSFER && !categoryId) return;

      const newTransaction: Transaction = {
          id: 'temp-' + Date.now(),
          date: new Date(date).toISOString(),
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
        <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Novo Lançamento</h2>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>

            <div className="p-8 overflow-y-auto space-y-6">
                <div className="flex gap-2">
                    {[TransactionType.INCOME, TransactionType.EXPENSE, TransactionType.TRANSFER].map(t => (
                        <button key={t} onClick={() => setType(t)} className={`flex-1 py-3 rounded-2xl text-xs font-bold border transition-all ${type === t ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none' : 'bg-gray-50 dark:bg-gray-900 border-transparent text-gray-500'}`}>
                            {t === 'income' ? 'Receita' : t === 'expense' ? 'Despesa' : 'Transf.'}
                        </button>
                    ))}
                </div>

                <div className="space-y-4">
                    <div className="relative">
                        <DollarSign size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="w-full pl-12 p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 dark:text-white text-2xl font-black outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>

                    <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Descrição" className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 font-bold" />

                    <div className="grid grid-cols-2 gap-4">
                        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 dark:text-white outline-none" />
                        <select value={accountId} onChange={e => setAccountId(e.target.value)} className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 dark:text-white outline-none font-bold">
                            <option value="">Selecione a Conta</option>
                            {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                        </select>
                    </div>

                    {type === TransactionType.TRANSFER && (
                        <select value={destinationAccountId} onChange={e => setDestinationAccountId(e.target.value)} className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 dark:text-white outline-none font-bold">
                            <option value="">Conta de Destino</option>
                            {accounts.filter(a => a.id !== accountId).map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                        </select>
                    )}

                    {type !== TransactionType.TRANSFER && (
                        <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 dark:text-white outline-none font-bold">
                            <option value="">Categoria</option>
                            {categories.filter(c => c.type === type || c.type === 'both').map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                    )}

                    <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" checked={isPaid} onChange={() => setIsPaid(!isPaid)} className="w-5 h-5 rounded-lg border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Lançamento Efetivado (Pago/Recebido)</span>
                    </label>
                </div>
            </div>

            <div className="p-8 bg-gray-50 dark:bg-gray-900/50 flex gap-4">
                <button onClick={onClose} className="flex-1 py-4 text-gray-500 font-bold">Descartar</button>
                <button onClick={handleSave} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none">Salvar Lançamento</button>
            </div>
        </div>
    </div>
  );
};
