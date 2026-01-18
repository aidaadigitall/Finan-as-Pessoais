
import React, { useState } from 'react';
import { CreditCard as CreditCardType, Transaction, TransactionType, TransactionStatus, ThemeColor, BankAccount } from '../types';
import { CreditCard, Plus, Calendar, ShieldCheck, Trash2, CreditCard as CardIcon, Calculator, ChevronRight, AlertCircle, Sparkles, Receipt, CheckCircle2, Search, Eye, Filter, Wallet, ArrowRight } from 'lucide-react';

interface CreditCardManagerProps {
  cards: CreditCardType[];
  transactions: Transaction[];
  accounts: BankAccount[];
  onAddCard: (card: CreditCardType) => void;
  onDeleteCard: (id: string) => void;
  onAddTransaction: (t: Transaction) => void;
  onUpdateTransaction: (t: Transaction) => void;
  themeColor?: ThemeColor;
}

export const CreditCardManager: React.FC<CreditCardManagerProps> = ({ 
  cards, transactions, accounts, onAddCard, onDeleteCard, onAddTransaction, onUpdateTransaction, themeColor = 'indigo' 
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [auditCard, setAuditCard] = useState<CreditCardType | null>(null);
  const [paymentModal, setPaymentModal] = useState<CreditCardType | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [brand, setBrand] = useState<'visa' | 'mastercard' | 'elo' | 'amex'>('visa');
  const [limit, setLimit] = useState('');
  const [closingDay, setClosingDay] = useState('10');
  const [dueDay, setDueDay] = useState('17');
  const [cardColor, setCardColor] = useState('from-gray-800 to-gray-900');

  const getCardSpending = (cardId: string) => {
    return transactions
      .filter(t => t.creditCardId === cardId && t.type === TransactionType.EXPENSE)
      .reduce((acc, t) => acc + t.amount, 0);
  };

  const handlePayInvoice = () => {
    if (!paymentModal || !selectedAccountId) return;
    
    const amount = getCardSpending(paymentModal.id);
    if (amount <= 0) return;

    const paymentTransaction: Transaction = {
      id: 'pay-' + Date.now(),
      date: new Date().toISOString(),
      description: `Pagamento Fatura: ${paymentModal.name}`,
      amount: amount,
      type: TransactionType.EXPENSE,
      category: 'Cartão de Crédito',
      status: TransactionStatus.CONFIRMED,
      isPaid: true,
      source: 'manual',
      accountId: selectedAccountId,
      creditCardId: paymentModal.id // Vincula para saber que limpou este cartão
    };

    onAddTransaction(paymentTransaction);
    setPaymentModal(null);
  };

  const handleAudit = (t: Transaction) => {
    onUpdateTransaction({ ...t, status: TransactionStatus.AUDITED });
  };

  const handleAddCard = () => {
    if (!name || !limit) return;
    onAddCard({
      id: Date.now().toString(),
      name,
      brand,
      limit: parseFloat(limit),
      usedLimit: 0,
      closingDay: parseInt(closingDay),
      dueDay: parseInt(dueDay),
      color: cardColor,
      accountId: ''
    });
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-4">
          <div className={`p-3 bg-${themeColor}-600 rounded-2xl text-white shadow-lg`}>
            <CardIcon size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Cartões de Crédito</h2>
            <p className="text-sm text-gray-500">Gestão de limites, auditoria de faturas e negociações.</p>
          </div>
        </div>
        <button onClick={() => setShowAddModal(true)} className={`bg-${themeColor}-600 hover:bg-${themeColor}-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-bold shadow-lg transition active:scale-95`}>
          <Plus size={18} /> Novo Cartão
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {cards.map(card => {
          const spent = getCardSpending(card.id);
          const percent = Math.min((spent / card.limit) * 100, 100);
          
          return (
            <div key={card.id} className="relative group">
              <div className={`h-56 rounded-[2.5rem] p-8 text-white shadow-2xl flex flex-col justify-between overflow-hidden relative transition-all duration-500 bg-gradient-to-br ${card.color || 'from-gray-800 to-gray-900'}`}>
                <div className="relative z-10 flex justify-between items-start">
                   <div>
                      <p className="text-[10px] uppercase font-black tracking-widest opacity-60">Limite Disponível</p>
                      <h4 className="text-2xl font-black">R$ {(card.limit - spent).toLocaleString('pt-BR')}</h4>
                   </div>
                   <div className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-lg border border-white/20 text-[10px] font-black uppercase tracking-tighter">
                      {card.brand}
                   </div>
                </div>
                <div className="relative z-10 flex justify-between items-end">
                  <div>
                    <p className="font-bold text-sm">{card.name}</p>
                    <p className="text-[10px] font-mono opacity-50 tracking-widest">**** **** **** {card.id.slice(-4)}</p>
                  </div>
                  <div className="w-10 h-7 bg-amber-400/30 rounded-md border border-amber-200/20" />
                </div>
                <div className="absolute -right-10 -bottom-10 opacity-10 rotate-12"><CardIcon size={200}/></div>
              </div>

              <div className="mt-[-40px] mx-6 bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xl border border-gray-100 dark:border-gray-700 space-y-4 z-20 relative">
                 <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest text-gray-400">
                    <span>Fatura Atual</span>
                    <span className={spent > card.limit * 0.8 ? 'text-rose-500' : 'text-gray-700 dark:text-gray-200'}>
                      R$ {spent.toLocaleString('pt-BR')}
                    </span>
                 </div>
                 <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-1000 ${spent > card.limit * 0.8 ? 'bg-rose-500' : `bg-${themeColor}-500`}`} style={{ width: `${percent}%` }} />
                 </div>
                 <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-gray-400 uppercase">
                    <div className="p-2 bg-gray-50 dark:bg-gray-900/50 rounded-lg flex items-center gap-2"><Calendar size={12}/> Vence: {card.dueDay}</div>
                    <div className="p-2 bg-gray-50 dark:bg-gray-900/50 rounded-lg flex items-center gap-2"><ShieldCheck size={12}/> Fecha: {card.closingDay}</div>
                 </div>
                 <div className="flex gap-2">
                    <button onClick={() => setAuditCard(card)} className="flex-1 py-2 rounded-xl border border-gray-100 dark:border-gray-700 text-[10px] font-black uppercase hover:bg-gray-50 dark:hover:bg-gray-900 transition flex items-center justify-center gap-2">
                       <Search size={14}/> Auditar
                    </button>
                    <button onClick={() => { setPaymentModal(card); setSelectedAccountId(accounts[0]?.id || ''); }} className={`flex-1 py-2 bg-${themeColor}-600 text-white rounded-xl text-[10px] font-black uppercase shadow-lg shadow-${themeColor}-600/20 transition active:scale-95 flex items-center justify-center gap-2`}>
                       <Wallet size={14}/> Pagar
                    </button>
                 </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Auditoria de Fatura */}
      {auditCard && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] w-full max-w-2xl shadow-2xl border border-gray-100 dark:border-gray-800 flex flex-col max-h-[85vh]">
             <div className="p-8 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                <div>
                   <h3 className="text-xl font-bold dark:text-white">Auditoria de Fatura</h3>
                   <p className="text-xs text-gray-500">{auditCard.name} • **** {auditCard.id.slice(-4)}</p>
                </div>
                <button onClick={() => setAuditCard(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition"><X size={20}/></button>
             </div>
             <div className="p-6 overflow-y-auto space-y-3">
                {transactions.filter(t => t.creditCardId === auditCard.id).map(t => (
                  <div key={t.id} className="p-4 border border-gray-50 dark:border-gray-800 rounded-2xl flex justify-between items-center group hover:border-indigo-200 dark:hover:border-indigo-900 transition-colors">
                     <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-xl ${t.status === TransactionStatus.AUDITED ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                           <CheckCircle2 size={18}/>
                        </div>
                        <div>
                           <p className="text-sm font-bold dark:text-white">{t.description}</p>
                           <p className="text-[10px] text-gray-400">{new Date(t.date).toLocaleDateString()} • {t.category}</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-4">
                        <span className="font-black text-sm dark:text-white">R$ {t.amount.toFixed(2)}</span>
                        {t.status !== TransactionStatus.AUDITED && (
                          <button onClick={() => handleAudit(t)} className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">Confirmar</button>
                        )}
                     </div>
                  </div>
                ))}
             </div>
          </div>
        </div>
      )}

      {/* Modal Pagamento de Fatura */}
      {paymentModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
           <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl border border-gray-100 dark:border-gray-800">
              <div className="text-center mb-8">
                 <div className={`w-16 h-16 bg-${themeColor}-100 text-${themeColor}-600 rounded-3xl flex items-center justify-center mx-auto mb-4`}>
                    <Receipt size={32}/>
                 </div>
                 <h3 className="text-xl font-bold dark:text-white">Liquidar Fatura</h3>
                 <p className="text-sm text-gray-500">Valor total a ser pago: <span className="font-bold text-gray-800 dark:text-white">R$ {getCardSpending(paymentModal.id).toFixed(2)}</span></p>
              </div>
              <div className="space-y-4">
                 <label className="block">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Conta de Origem</span>
                    <select value={selectedAccountId} onChange={e => setSelectedAccountId(e.target.value)} className="w-full mt-1 p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 dark:text-white border-none outline-none focus:ring-2 focus:ring-indigo-500 font-bold">
                       {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} (R$ {acc.currentBalance.toFixed(2)})</option>)}
                    </select>
                 </label>
                 <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-2xl border border-amber-100 dark:border-amber-900/30 flex gap-3">
                    <AlertCircle className="text-amber-500 shrink-0" size={18}/>
                    <p className="text-[10px] text-amber-800 dark:text-amber-200">Isso criará um lançamento de despesa na sua conta bancária e zerará os gastos no cartão.</p>
                 </div>
              </div>
              <div className="flex gap-4 mt-8">
                 <button onClick={() => setPaymentModal(null)} className="flex-1 py-4 text-gray-500 font-bold">Cancelar</button>
                 <button onClick={handlePayInvoice} className={`flex-1 py-4 bg-${themeColor}-600 text-white rounded-2xl font-bold shadow-lg transition active:scale-95`}>Confirmar Pagamento</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const X = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
);
