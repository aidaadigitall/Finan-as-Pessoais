
import React, { useState, useMemo } from 'react';
import { CreditCard as CreditCardType, Transaction, TransactionType, TransactionStatus, ThemeColor, BankAccount } from '../types';
import { 
  CreditCard as CardIcon, Plus, Calendar, ShieldCheck, Trash2, Edit2,
  Receipt, CheckCircle2, Search, Wallet, X, Info, ShieldAlert, 
  CheckCircle, HelpCircle, RefreshCw, TrendingDown, AlertTriangle, Landmark 
} from 'lucide-react';

interface CreditCardManagerProps {
  cards: CreditCardType[];
  transactions: Transaction[];
  accounts: BankAccount[];
  onAddCard: (card: CreditCardType) => void;
  onDeleteCard: (id: string) => void;
  onAddTransaction: (t: Transaction) => void;
  onUpdateTransaction: (t: Transaction) => void;
  onUpdateCard?: (card: CreditCardType) => void;
  themeColor?: ThemeColor;
}

export const CreditCardManager: React.FC<CreditCardManagerProps> = ({ 
  cards, transactions, accounts, onAddCard, onDeleteCard, onAddTransaction, onUpdateTransaction, onUpdateCard, themeColor = 'indigo' 
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCardType | null>(null);
  const [auditCard, setAuditCard] = useState<CreditCardType | null>(null);
  const [paymentModal, setPaymentModal] = useState<CreditCardType | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [brand, setBrand] = useState<'visa' | 'mastercard' | 'elo' | 'amex'>('visa');
  const [limit, setLimit] = useState('');
  const [closingDay, setClosingDay] = useState('10');
  const [dueDay, setDueDay] = useState('17');
  const [cardAccountId, setCardAccountId] = useState('');

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
      creditCardId: paymentModal.id 
    };

    onAddTransaction(paymentTransaction);
    setPaymentModal(null);
  };

  const updateTransactionStatus = (t: Transaction, status: TransactionStatus) => {
    onUpdateTransaction({ ...t, status });
  };

  const openEditModal = (card: CreditCardType) => {
    setEditingCard(card);
    setName(card.name);
    setBrand(card.brand);
    setLimit(card.limit.toString());
    setClosingDay(card.closingDay.toString());
    setDueDay(card.dueDay.toString());
    setCardAccountId(card.accountId || '');
    setShowAddModal(true);
  };

  const handleSaveCard = () => {
    if (!name || !limit) return;
    
    const cardData: CreditCardType = {
      id: editingCard ? editingCard.id : Date.now().toString(),
      name,
      brand,
      limit: parseFloat(limit),
      usedLimit: 0,
      closingDay: parseInt(closingDay),
      dueDay: parseInt(dueDay),
      color: editingCard ? editingCard.color : 'from-indigo-600 to-blue-700',
      accountId: cardAccountId
    };

    if (editingCard) {
      onUpdateCard?.(cardData);
    } else {
      onAddCard(cardData);
    }

    setShowAddModal(false);
    setEditingCard(null);
    setName('');
    setLimit('');
    setCardAccountId('');
  };

  const auditStats = useMemo(() => {
    if (!auditCard) return { total: 0, audited: 0, pending: 0, rejected: 0, count: 0, auditedCount: 0 };
    const items = transactions.filter(t => t.creditCardId === auditCard.id);
    const auditedItems = items.filter(i => i.status === TransactionStatus.AUDITED);
    const rejectedItems = items.filter(i => i.status === TransactionStatus.REJECTED);
    
    return {
      total: items.reduce((acc, i) => acc + i.amount, 0),
      audited: auditedItems.reduce((acc, i) => acc + i.amount, 0),
      pending: items.filter(i => i.status !== TransactionStatus.AUDITED && i.status !== TransactionStatus.REJECTED).reduce((acc, i) => acc + i.amount, 0),
      rejected: rejectedItems.reduce((acc, i) => acc + i.amount, 0),
      count: items.length,
      auditedCount: auditedItems.length
    };
  }, [auditCard, transactions]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-4">
          <div className={`p-3 bg-${themeColor}-600 rounded-2xl text-white shadow-lg`}>
            <CardIcon size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Cartões de Crédito</h2>
            <p className="text-sm text-gray-500">Controle faturas, audite gastos e gerencie seus limites.</p>
          </div>
        </div>
        <button onClick={() => { setEditingCard(null); setName(''); setLimit(''); setCardAccountId(''); setShowAddModal(true); }} className={`bg-${themeColor}-600 hover:bg-${themeColor}-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-bold shadow-lg transition active:scale-95`}>
          <Plus size={18} /> Novo Cartão
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {cards.map(card => {
          const spent = getCardSpending(card.id);
          const percent = Math.min((spent / card.limit) * 100, 100);
          
          return (
            <div key={card.id} className="relative group">
              <div className={`h-56 rounded-[2.5rem] p-8 text-white shadow-2xl flex flex-col justify-between overflow-hidden relative transition-all duration-500 bg-gradient-to-br from-gray-800 to-gray-900`}>
                <div className="relative z-10 flex justify-between items-start">
                   <div>
                      <p className="text-[10px] uppercase font-black tracking-widest opacity-60">Limite Disponível</p>
                      <h4 className="text-2xl font-black">R$ {(card.limit - spent).toLocaleString('pt-BR')}</h4>
                   </div>
                   <div className="flex gap-2">
                      <button onClick={() => openEditModal(card)} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => onDeleteCard(card.id)} className="p-2 bg-white/10 hover:bg-red-500/50 rounded-lg transition">
                        <Trash2 size={16} />
                      </button>
                   </div>
                </div>
                <div className="relative z-10 flex justify-between items-end">
                  <div>
                    <p className="font-bold text-sm">{card.name}</p>
                    <p className="text-[10px] font-mono opacity-50 tracking-widest">**** **** **** {card.id.slice(-4)}</p>
                  </div>
                  <div className="w-10 h-7 bg-amber-400/30 rounded-md border border-amber-200/20 shadow-inner" />
                </div>
                <div className="absolute -right-10 -bottom-10 opacity-10 rotate-12"><CardIcon size={200}/></div>
              </div>

              <div className="mt-[-40px] mx-6 bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xl border border-gray-100 dark:border-gray-700 space-y-4 z-20 relative">
                 <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest text-gray-400">
                    <span>Gasto Fatura</span>
                    <span className={spent > card.limit * 0.8 ? 'text-rose-500 font-black' : 'text-gray-700 dark:text-gray-200'}>
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
                    <button onClick={() => setAuditCard(card)} className="flex-1 py-2.5 rounded-xl border border-gray-100 dark:border-gray-700 text-[10px] font-black uppercase hover:bg-gray-50 dark:hover:bg-gray-900 transition flex items-center justify-center gap-2 shadow-sm">
                       <Search size={14}/> Auditar
                    </button>
                    <button onClick={() => { setPaymentModal(card); setSelectedAccountId(accounts[0]?.id || ''); }} className={`flex-1 py-2.5 bg-${themeColor}-600 text-white rounded-xl text-[10px] font-black uppercase shadow-lg shadow-${themeColor}-600/20 transition active:scale-95 flex items-center justify-center gap-2`}>
                       <Wallet size={14}/> Pagar
                    </button>
                 </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL ADICIONAR / EDITAR CARTÃO */}
      {(showAddModal || editingCard) && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-[#1c2128] rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl border border-white/10 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6">
              {editingCard ? 'Editar Cartão' : 'Novo Cartão de Crédito'}
            </h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Identificação</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Nubank Elite" className="w-full p-3.5 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 font-bold" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Bandeira</label>
                  <select value={brand} onChange={e => setBrand(e.target.value as any)} className="w-full p-3.5 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 dark:text-white outline-none font-bold">
                    <option value="visa">Visa</option>
                    <option value="mastercard">Mastercard</option>
                    <option value="elo">Elo</option>
                    <option value="amex">Amex</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Limite R$</label>
                  <input type="number" value={limit} onChange={e => setLimit(e.target.value)} placeholder="0.00" className="w-full p-3.5 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 font-bold" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Dia Fechamento</label>
                  <input type="number" value={closingDay} onChange={e => setClosingDay(e.target.value)} className="w-full p-3.5 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 dark:text-white outline-none font-bold" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Dia Vencimento</label>
                  <input type="number" value={dueDay} onChange={e => setDueDay(e.target.value)} className="w-full p-3.5 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 dark:text-white outline-none font-bold" />
                </div>
              </div>
              
              <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1"><Landmark size={10}/> Conta para Pagamento (Opcional)</label>
                  <select value={cardAccountId} onChange={e => setCardAccountId(e.target.value)} className="w-full p-3.5 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 dark:text-white outline-none font-bold">
                      <option value="">Nenhuma conta vinculada</option>
                      {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} ({acc.bankName})</option>)}
                  </select>
              </div>

            </div>
            <div className="flex gap-4 mt-8">
              <button onClick={() => { setShowAddModal(false); setEditingCard(null); }} className="flex-1 py-3.5 text-gray-500 font-bold">Cancelar</button>
              <button onClick={handleSaveCard} className={`flex-1 py-3.5 bg-${themeColor}-600 text-white rounded-2xl font-black uppercase tracking-wider text-xs shadow-lg shadow-${themeColor}-600/20 active:scale-95 transition`}>
                {editingCard ? 'Salvar Alterações' : 'Ativar Cartão'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE AUDITORIA (mantido igual) */}
      {auditCard && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1c2128] rounded-[2.5rem] w-full max-w-3xl shadow-2xl border border-gray-100 dark:border-gray-800 flex flex-col max-h-[90vh] overflow-hidden">
             
             {/* Header de Auditoria Avançada */}
             <div className="p-8 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/20">
                <div className="flex justify-between items-start mb-6">
                    <div>
                       <div className="flex items-center gap-2 mb-1">
                          <ShieldCheck className="text-emerald-500" size={20} />
                          <h3 className="text-xl font-black dark:text-white uppercase tracking-tight">Painel de Auditoria</h3>
                       </div>
                       <p className="text-xs text-gray-500">{auditCard.name} • **** {auditCard.id.slice(-4)}</p>
                    </div>
                    <button onClick={() => setAuditCard(null)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition text-gray-400"><X size={24}/></button>
                </div>

                {/* Resumo de Métricas de Conferência */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm">
                        <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Total Fatura</p>
                        <p className="text-base font-black dark:text-white">R$ {auditStats.total.toFixed(2)}</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20">
                        <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase mb-1">Conferido</p>
                        <p className="text-base font-black text-emerald-600 dark:text-emerald-400">R$ {auditStats.audited.toFixed(2)}</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20">
                        <p className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase mb-1">Faltam</p>
                        <p className="text-base font-black text-amber-600 dark:text-amber-400">R$ {auditStats.pending.toFixed(2)}</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/20">
                        <p className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase mb-1">Contestado</p>
                        <p className="text-base font-black text-rose-600 dark:text-rose-400">R$ {auditStats.rejected.toFixed(2)}</p>
                    </div>
                </div>
                
                {/* Barra de Progresso de Auditoria */}
                <div className="mt-6">
                    <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex shadow-inner">
                        <div className="h-full bg-emerald-500 transition-all duration-700 ease-out" style={{ width: `${(auditStats.audited / (auditStats.total || 1)) * 100}%` }} />
                        <div className="h-full bg-rose-500 transition-all duration-700 ease-out" style={{ width: `${(auditStats.rejected / (auditStats.total || 1)) * 100}%` }} />
                    </div>
                    <div className="mt-2 flex justify-between items-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        <span>Auditoria: {auditStats.auditedCount} de {auditStats.count} itens</span>
                        <span className="text-emerald-600">{Math.round((auditStats.audited / (auditStats.total || 1)) * 100)}% CONCLUÍDO</span>
                    </div>
                </div>
             </div>

             <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar bg-white dark:bg-gray-900">
                {transactions.filter(t => t.creditCardId === auditCard.id).length === 0 ? (
                  <div className="py-20 text-center text-gray-400">
                     <HelpCircle size={48} className="mx-auto mb-4 opacity-20" />
                     <p className="font-bold">Nenhum gasto registrado neste cartão.</p>
                  </div>
                ) : transactions.filter(t => t.creditCardId === auditCard.id).map(t => (
                  <div key={t.id} className={`p-5 rounded-[2rem] border transition-all duration-300 flex flex-col md:flex-row justify-between items-center gap-4 ${
                    t.status === TransactionStatus.AUDITED ? 'bg-emerald-50/30 border-emerald-100 dark:bg-emerald-900/5 dark:border-emerald-900/20' : 
                    t.status === TransactionStatus.REJECTED ? 'bg-rose-50/30 border-rose-100 dark:bg-rose-900/5 dark:border-rose-900/20' : 
                    'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-800'
                  }`}>
                     <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className={`p-3 rounded-2xl flex items-center justify-center transition-colors ${
                           t.status === TransactionStatus.AUDITED ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40' : 
                           t.status === TransactionStatus.REJECTED ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/40' : 
                           'bg-gray-100 text-gray-400 dark:bg-gray-700'
                        }`}>
                           {t.status === TransactionStatus.AUDITED ? <CheckCircle size={22}/> : 
                            t.status === TransactionStatus.REJECTED ? <ShieldAlert size={22}/> : 
                            <HelpCircle size={22}/>}
                        </div>
                        <div>
                           <p className="font-bold text-gray-800 dark:text-white leading-tight">{t.description}</p>
                           <p className="text-[10px] text-gray-400 uppercase font-black tracking-wider mt-1">
                             {new Date(t.date).toLocaleDateString('pt-BR')} • {t.category}
                           </p>
                        </div>
                     </div>
                     
                     <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                        <span className="text-lg font-black dark:text-white">R$ {t.amount.toFixed(2)}</span>
                        
                        <div className="flex gap-2">
                            {t.status !== TransactionStatus.AUDITED && (
                               <button 
                                 onClick={() => updateTransactionStatus(t, TransactionStatus.AUDITED)}
                                 className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase hover:bg-emerald-700 transition shadow-lg shadow-emerald-600/20 active:scale-95"
                               >
                                  Conferir
                               </button>
                            )}
                            {t.status !== TransactionStatus.REJECTED && (
                               <button 
                                 onClick={() => updateTransactionStatus(t, TransactionStatus.REJECTED)}
                                 className="px-5 py-2.5 border border-rose-200 text-rose-500 rounded-xl text-[10px] font-black uppercase hover:bg-rose-50 dark:hover:bg-rose-900/20 transition active:scale-95"
                               >
                                  Contestar
                               </button>
                            )}
                            {(t.status === TransactionStatus.AUDITED || t.status === TransactionStatus.REJECTED) && (
                               <button 
                                 onClick={() => updateTransactionStatus(t, TransactionStatus.PENDING_AUDIT)}
                                 className="p-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                                 title="Zerar Status"
                               >
                                  <RefreshCw size={18} />
                               </button>
                            )}
                        </div>
                     </div>
                  </div>
                ))}
             </div>
             
             <div className="p-6 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3 text-xs text-gray-500">
                    <Info size={16} className="text-indigo-500" />
                    <span>Conferir itens ajuda a validar seu limite real disponível.</span>
                </div>
                <button onClick={() => setAuditCard(null)} className={`w-full md:w-auto px-10 py-3.5 bg-${themeColor}-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-${themeColor}-600/20 active:scale-95 transition-all`}>
                  Fechar Auditoria
                </button>
             </div>
          </div>
        </div>
      )}

      {/* MODAL PAGAMENTO (mantido igual) */}
      {paymentModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
           <div className="bg-white dark:bg-[#1c2128] rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl border border-gray-100 dark:border-gray-800">
              <div className="text-center mb-8">
                 <div className={`w-16 h-16 bg-${themeColor}-100 text-${themeColor}-600 rounded-3xl flex items-center justify-center mx-auto mb-4`}>
                    <Receipt size={32}/>
                 </div>
                 <h3 className="text-xl font-bold dark:text-white">Liquidar Fatura</h3>
                 <p className="text-sm text-gray-500">Montante total: <span className="font-bold text-gray-800 dark:text-white">R$ {getCardSpending(paymentModal.id).toFixed(2)}</span></p>
              </div>
              <div className="space-y-4">
                 <label className="block">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Conta de Débito</span>
                    <select value={selectedAccountId} onChange={e => setSelectedAccountId(e.target.value)} className="w-full mt-1 p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 dark:text-white border-none outline-none focus:ring-2 focus:ring-indigo-500 font-bold">
                       <option value="">Escolha uma conta...</option>
                       {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} (R$ {acc.currentBalance.toFixed(2)})</option>)}
                    </select>
                 </label>
              </div>
              <div className="flex gap-4 mt-8">
                 <button onClick={() => setPaymentModal(null)} className="flex-1 py-4 text-gray-500 font-bold">Voltar</button>
                 <button onClick={handlePayInvoice} className={`flex-1 py-4 bg-${themeColor}-600 text-white rounded-2xl font-bold shadow-lg transition active:scale-95`}>Confirmar Pagamento</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
