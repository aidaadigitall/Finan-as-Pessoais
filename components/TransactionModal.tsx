
import React, { useState, useEffect, useMemo } from 'react';
import { Transaction, TransactionType, TransactionStatus, Category, BankAccount, CreditCard } from '../types';
import { X, ArrowUpCircle, ArrowDownCircle, ArrowRightLeft, DollarSign, Tag, Landmark, Save, CreditCard as CardIcon, CalendarClock, Layers } from 'lucide-react';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Transaction) => void;
  categories: Category[];
  accounts: BankAccount[];
  cards: CreditCard[];
  transactionToEdit?: Transaction | null; // Nova prop para edição
}

export const TransactionModal: React.FC<TransactionModalProps> = ({ 
  isOpen, onClose, onSave, categories, accounts, cards, transactionToEdit 
}) => {
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [creditCardId, setCreditCardId] = useState('');
  const [destinationAccountId, setDestinationAccountId] = useState('');
  const [isPaid, setIsPaid] = useState(true);
  const [originType, setOriginType] = useState<'account' | 'card'>('account');
  
  // Parcelamento
  const [isInstallment, setIsInstallment] = useState(false);
  const [installmentCount, setInstallmentCount] = useState<number>(2);

  useEffect(() => {
    if (isOpen) {
      if (transactionToEdit) {
        // Modo Edição: Popula os campos
        setType(transactionToEdit.type);
        setDescription(transactionToEdit.description);
        setAmount(transactionToEdit.amount.toString());
        setDate(new Date(transactionToEdit.date).toISOString().split('T')[0]);
        setDueDate(transactionToEdit.dueDate ? new Date(transactionToEdit.dueDate).toISOString().split('T')[0] : '');
        
        // Tenta encontrar ID da categoria pelo nome se categoryId estiver vazio
        const foundCat = categories.find(c => c.id === transactionToEdit.categoryId || c.name === transactionToEdit.category);
        setCategoryId(foundCat ? foundCat.id : '');
        
        setAccountId(transactionToEdit.accountId || '');
        setCreditCardId(transactionToEdit.creditCardId || '');
        setDestinationAccountId(transactionToEdit.destinationAccountId || '');
        
        setOriginType(transactionToEdit.creditCardId ? 'card' : 'account');
        setIsPaid(transactionToEdit.isPaid);
        setIsInstallment(!!transactionToEdit.installmentId); // Se tem ID de parcelamento, mostra como parcelado (visual apenas)
        setInstallmentCount(transactionToEdit.installmentCount || 2);
      } else {
        // Modo Novo Lançamento: Reseta
        setType(TransactionType.EXPENSE);
        setDescription('');
        setAmount('');
        setDate(new Date().toISOString().split('T')[0]);
        setDueDate('');
        setCategoryId('');
        setAccountId(accounts.length > 0 ? accounts[0].id : '');
        setCreditCardId('');
        setOriginType('account');
        setIsPaid(true);
        setIsInstallment(false);
        setInstallmentCount(2);
      }
    }
  }, [isOpen, transactionToEdit, accounts, categories]);

  const organizedCategories = useMemo(() => {
    const filtered = categories.filter(c => c.type === type || c.type === 'both');
    const parents = filtered.filter(c => !c.parentId);
    const subs = filtered.filter(c => !!c.parentId);
    
    const result: { id: string, name: string, isSub: boolean }[] = [];
    parents.forEach(p => {
        result.push({ id: p.id, name: p.name, isSub: false });
        subs.filter(s => s.parentId === p.id).forEach(s => {
            result.push({ id: s.id, name: `↳ ${s.name}`, isSub: true });
        });
    });
    return result;
  }, [categories, type]);

  const handleSave = () => {
      if (!description || !amount) return;
      
      const selectedCat = categories.find(c => c.id === categoryId);
      const parsedAmount = parseFloat(amount);

      const validAccount = accounts.find(a => a.id === accountId);
      const validCard = cards.find(c => c.id === creditCardId);
      const validDestAccount = accounts.find(a => a.id === destinationAccountId);

      const finalAccountId = originType === 'account' && validAccount ? validAccount.id : undefined;
      const finalCardId = originType === 'card' && validCard ? validCard.id : undefined;
      const finalDestId = type === TransactionType.TRANSFER && validDestAccount ? validDestAccount.id : undefined;

      const newTransaction: Transaction = {
          id: transactionToEdit ? transactionToEdit.id : 'temp-' + Date.now(), // Mantém ID se editando
          date: new Date(date).toISOString(),
          dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
          description,
          amount: parsedAmount,
          type,
          category: type === TransactionType.TRANSFER ? 'Transferência' : (selectedCat?.name || 'Outros'),
          categoryId: selectedCat?.id, // Importante salvar o ID da categoria
          status: TransactionStatus.CONFIRMED,
          isPaid: originType === 'card' ? true : isPaid,
          source: transactionToEdit ? transactionToEdit.source : 'manual',
          accountId: finalAccountId,
          creditCardId: finalCardId,
          destinationAccountId: finalDestId,
          reconciled: transactionToEdit ? transactionToEdit.reconciled : false,
          installmentCount: isInstallment ? installmentCount : undefined,
          installmentId: transactionToEdit ? transactionToEdit.installmentId : undefined // Mantém vínculo de parcela se existir
      };

      onSave(newTransaction);
      onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
        <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                  {transactionToEdit ? 'Editar Lançamento' : 'Novo Lançamento'}
                </h2>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>

            <div className="p-8 overflow-y-auto space-y-6 custom-scrollbar">
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
                        {isInstallment && amount && (
                            <p className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-bold">
                                Total: R$ {(parseFloat(amount) * installmentCount).toFixed(2)}
                            </p>
                        )}
                    </div>

                    <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Descrição" className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 font-bold" />

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                           <label className="text-[10px] font-bold text-gray-400 uppercase ml-2">Data Lançamento</label>
                           <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 dark:text-white outline-none font-medium" />
                        </div>
                        <div className="space-y-1">
                           <label className="text-[10px] font-bold text-gray-400 uppercase ml-2">Data de Vencimento</label>
                           <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 dark:text-white outline-none font-medium text-gray-500" />
                        </div>
                    </div>
                    
                    <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 dark:text-white outline-none font-bold">
                        <option value="">Categoria</option>
                        {organizedCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>

                    {/* Área de Parcelamento (Desativada em Edição para Simplificar) */}
                    {type !== TransactionType.TRANSFER && !transactionToEdit && (
                        <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-4">
                            <label className="flex items-center justify-between cursor-pointer">
                                <div className="flex items-center gap-2">
                                    <Layers size={18} className="text-indigo-500"/>
                                    <span className="font-bold text-gray-700 dark:text-gray-300 text-sm">Parcelamento?</span>
                                </div>
                                <div className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${isInstallment ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-700'}`}>
                                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${isInstallment ? 'translate-x-6' : ''}`} />
                                    <input type="checkbox" checked={isInstallment} onChange={() => setIsInstallment(!isInstallment)} className="hidden" />
                                </div>
                            </label>
                            
                            {isInstallment && (
                                <div className="flex items-center gap-4 animate-in slide-in-from-top-2">
                                    <div className="flex-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Qtde. Parcelas</label>
                                        <input 
                                          type="number" 
                                          min="2" 
                                          max="60" 
                                          value={installmentCount} 
                                          onChange={(e) => setInstallmentCount(parseInt(e.target.value))}
                                          className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white text-center font-bold"
                                        />
                                    </div>
                                    <div className="flex-1 pt-4 text-xs text-gray-500 text-center">
                                        <p>Valor por mês:</p>
                                        <p className="font-bold text-indigo-600">R$ {amount ? parseFloat(amount).toFixed(2) : '0.00'}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

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
                       <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition">
                           <div className={`w-5 h-5 rounded border flex items-center justify-center ${isPaid ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'}`}>
                                {isPaid && <div className="w-2 h-2 bg-white rounded-full" />}
                           </div>
                           <input type="checkbox" checked={isPaid} onChange={() => setIsPaid(!isPaid)} className="hidden" />
                           <div>
                               <span className="text-sm font-bold text-gray-700 dark:text-gray-300 block">{type === TransactionType.INCOME ? 'Recebido' : 'Pago'}</span>
                               <span className="text-sm text-gray-400 block">{type === TransactionType.INCOME ? 'O valor já entrou na conta?' : 'O valor já saiu da conta?'}</span>
                           </div>
                       </label>
                    )}
                </div>
            </div>

            <div className="p-8 bg-gray-50 dark:bg-gray-900/50 flex gap-4 border-t border-gray-100 dark:border-gray-800">
                <button onClick={onClose} className="flex-1 py-4 text-gray-500 font-bold hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition">Descartar</button>
                <button onClick={handleSave} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg hover:bg-indigo-700 transition transform active:scale-95 flex items-center justify-center gap-2">
                    <Save size={18} /> {transactionToEdit ? 'Salvar Alterações' : 'Salvar Lançamento'}
                </button>
            </div>
        </div>
    </div>
  );
};
