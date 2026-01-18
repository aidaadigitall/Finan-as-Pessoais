
import React, { useState, useEffect, useMemo } from 'react';
import { Transaction, TransactionType, TransactionStatus, Category, BankAccount, CreditCard } from '../types';
import { X, ArrowUpCircle, ArrowDownCircle, ArrowRightLeft, DollarSign, Tag, Landmark, Save, CreditCard as CardIcon } from 'lucide-react';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Transaction) => void;
  categories: Category[];
  accounts: BankAccount[];
  cards: CreditCard[];
}

export const TransactionModal: React.FC<TransactionModalProps> = ({ 
  isOpen, onClose, onSave, categories, accounts, cards 
}) => {
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [creditCardId, setCreditCardId] = useState('');
  const [destinationAccountId, setDestinationAccountId] = useState('');
  const [isPaid, setIsPaid] = useState(true);
  const [originType, setOriginType] = useState<'account' | 'card'>('account');

  useEffect(() => {
    if (isOpen) {
      setType(TransactionType.EXPENSE);
      setDescription('');
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      setCategoryId('');
      setAccountId(accounts[0]?.id || '');
      setCreditCardId('');
      setOriginType('account');
      setIsPaid(true);
    }
  }, [isOpen, accounts]);

  // Organiza categorias hierarquicamente para o select
  const organizedCategories = useMemo(() => {
    const filtered = categories.filter(c => c.type === type || c.type === 'both');
    const parents = filtered.filter(c => !c.parentId);
    const subs = filtered.filter(c => !!c.parentId);
    
    const result: { id: string, name: string, isSub: boolean }[] = [];
    parents.forEach(p => {
        result.push({ id: p.id, name: p.name, isSub: false });
        subs.filter(s => s.parentId === p.id).forEach(s => {
            // Fixed: Removed fullName property which was not in the type definition
            result.push({ id: s.id, name: `↳ ${s.name}`, isSub: true });
        });
    });
    return result;
  }, [categories, type]);

  const handleSave = () => {
      if (!description || !amount) return;
      
      // Encontra o nome real da categoria (removendo a seta se for sub)
      const selectedCat = categories.find(c => c.id === categoryId);

      const newTransaction: Transaction = {
          id: 'temp-' + Date.now(),
          date: new Date(date).toISOString(),
          description,
          amount: parseFloat(amount),
          type,
          category: type === TransactionType.TRANSFER ? 'Transferência' : (selectedCat?.name || 'Outros'),
          status: TransactionStatus.CONFIRMED,
          isPaid: originType === 'card' ? true : isPaid,
          source: 'manual',
          accountId: originType === 'account' ? accountId : undefined,
          creditCardId: originType === 'card' ? creditCardId : undefined,
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
                        <button key={t} onClick={() => { setType(t); if(t !== TransactionType.EXPENSE) setOriginType('account'); }} className={`flex-1 py-3 rounded-2xl text-xs font-bold border transition-all ${type === t ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-gray-50 dark:bg-gray-900 border-transparent text-gray-500'}`}>
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
                        <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 dark:text-white outline-none font-bold">
                            <option value="">Categoria</option>
                            {organizedCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    {type === TransactionType.EXPENSE && (
                       <div className="flex gap-2 bg-gray-50 dark:bg-gray-900 p-1 rounded-2xl">
                          <button onClick={() => setOriginType('account')} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition ${originType === 'account' ? 'bg-white dark:bg-gray-700 shadow-sm text-indigo-600' : 'text-gray-400'}`}><Landmark size={14}/> Conta</button>
                          <button onClick={() => setOriginType('card')} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition ${originType === 'card' ? 'bg-white dark:bg-gray-700 shadow-sm text-indigo-600' : 'text-gray-400'}`}><CardIcon size={14}/> Cartão</button>
                       </div>
                    )}

                    {originType === 'account' ? (
                       <select value={accountId} onChange={e => setAccountId(e.target.value)} className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 dark:text-white outline-none font-bold">
                           <option value="">Selecione a Conta</option>
                           {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                       </select>
                    ) : (
                       <select value={creditCardId} onChange={e => setCreditCardId(e.target.value)} className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 dark:text-white outline-none font-bold">
                           <option value="">Selecione o Cartão</option>
                           {cards.map(card => <option key={card.id} value={card.id}>{card.name}</option>)}
                       </select>
                    )}

                    {type === TransactionType.TRANSFER && (
                        <select value={destinationAccountId} onChange={e => setDestinationAccountId(e.target.value)} className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 dark:text-white outline-none font-bold">
                            <option value="">Conta de Destino</option>
                            {accounts.filter(a => a.id !== accountId).map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                        </select>
                    )}

                    {originType === 'account' && (
                       <label className="flex items-center gap-3 cursor-pointer">
                           <input type="checkbox" checked={isPaid} onChange={() => setIsPaid(!isPaid)} className="w-5 h-5 rounded-lg border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                           <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Efetivado (Pago/Recebido)</span>
                       </label>
                    )}
                </div>
            </div>

            <div className="p-8 bg-gray-50 dark:bg-gray-900/50 flex gap-4">
                <button onClick={onClose} className="flex-1 py-4 text-gray-500 font-bold">Descartar</button>
                <button onClick={handleSave} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg">Salvar Lançamento</button>
            </div>
        </div>
    </div>
  );
};