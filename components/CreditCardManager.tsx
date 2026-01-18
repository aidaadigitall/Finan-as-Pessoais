
import React, { useState } from 'react';
import { CreditCard as CreditCardType, Transaction, TransactionType, ThemeColor } from '../types';
import { CreditCard, Plus, Calendar, ShieldCheck, TrendingDown, Trash2, CreditCard as CardIcon, Calculator, ChevronRight, AlertCircle, Sparkles, Receipt, Percent } from 'lucide-react';

interface CreditCardManagerProps {
  cards: CreditCardType[];
  transactions: Transaction[];
  onAddCard: (card: CreditCardType) => void;
  onDeleteCard: (id: string) => void;
  themeColor?: ThemeColor;
}

export const CreditCardManager: React.FC<CreditCardManagerProps> = ({ cards, transactions, onAddCard, onDeleteCard, themeColor = 'indigo' }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showNegotiationModal, setShowNegotiationModal] = useState<CreditCardType | null>(null);
  const [negotiationStep, setNegotiationStep] = useState<1 | 2>(1);
  
  // Form State
  const [name, setName] = useState('');
  const [brand, setBrand] = useState<'visa' | 'mastercard' | 'elo' | 'amex'>('visa');
  const [limit, setLimit] = useState('');
  const [closingDay, setClosingDay] = useState('10');
  const [dueDay, setDueDay] = useState('17');
  const [cardColor, setCardColor] = useState('from-gray-800 to-gray-900');

  const getCardTransactions = (cardId: string) => {
    return transactions.filter(t => t.creditCardId === cardId);
  };

  const getCardSpending = (cardId: string) => {
    return getCardTransactions(cardId)
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((acc, t) => acc + t.amount, 0);
  };

  const handleAddCard = () => {
    if (!name || !limit) return;
    const newCard: CreditCardType = {
      id: Date.now().toString(),
      name,
      brand,
      limit: parseFloat(limit),
      usedLimit: 0,
      closingDay: parseInt(closingDay),
      dueDay: parseInt(dueDay),
      color: cardColor,
      accountId: '' // Associar futuramente
    };
    onAddCard(newCard);
    setShowAddModal(false);
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setLimit('');
  };

  const colors = [
    { name: 'Onyx', value: 'from-gray-800 to-gray-900' },
    { name: 'Indigo', value: 'from-indigo-600 to-blue-700' },
    { name: 'Emerald', value: 'from-emerald-600 to-teal-700' },
    { name: 'Rose', value: 'from-rose-600 to-pink-700' },
    { name: 'Violet', value: 'from-violet-600 to-purple-700' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <CardIcon className={`text-${themeColor}-600`} /> Cartões de Crédito
          </h2>
          <p className="text-sm text-gray-500">Gerencie seus limites e negocie faturas acumuladas.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className={`bg-${themeColor}-600 hover:bg-${themeColor}-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-bold shadow-lg shadow-${themeColor}-600/20 transition active:scale-95`}
        >
          <Plus size={18} /> Novo Cartão
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {cards.map(card => {
          const spent = getCardSpending(card.id);
          const percent = Math.min((spent / card.limit) * 100, 100);
          const isCritical = percent > 85;

          return (
            <div key={card.id} className="flex flex-col group animate-in slide-in-from-bottom-4">
              {/* Virtual Card UI */}
              <div className={`h-52 rounded-[2.5rem] p-8 text-white shadow-2xl flex flex-col justify-between overflow-hidden relative transition-transform duration-500 hover:scale-[1.02] bg-gradient-to-br ${card.color || 'from-gray-800 to-gray-900'}`}>
                <div className="flex justify-between items-start relative z-10">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-black tracking-[0.25em] opacity-60 mb-1">Limite Disponível</span>
                    <span className="text-2xl font-black">R$ {(card.limit - spent).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-[10px] font-black uppercase tracking-widest">
                    {card.brand}
                  </div>
                </div>

                <div className="relative z-10 flex justify-between items-end">
                  <div>
                    <p className="text-sm font-bold tracking-wide mb-1">{card.name}</p>
                    <p className="text-[10px] opacity-50 font-mono tracking-[0.3em]">**** **** **** {card.id.slice(-4)}</p>
                  </div>
                  <div className="w-12 h-8 bg-amber-400/20 rounded-md border border-amber-400/30 flex items-center justify-center">
                    <div className="w-8 h-5 bg-gradient-to-r from-amber-400 to-amber-200 rounded-sm opacity-80" />
                  </div>
                </div>

                {/* Decorative chips/circles */}
                <div className="absolute right-[-30px] top-[-30px] w-64 h-64 bg-white/5 rounded-full blur-3xl" />
                <CreditCard className="absolute right-[-20px] bottom-[-20px] opacity-10 rotate-12" size={180} />
              </div>

              {/* Status & Actions Overlay */}
              <div className="mt-[-30px] mx-6 bg-white dark:bg-[#1c2128] rounded-3xl p-6 shadow-xl border border-gray-100 dark:border-gray-800 space-y-4 z-20">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Fatura Atual</span>
                  <span className={`text-sm font-black ${isCritical ? 'text-rose-500' : 'text-gray-700 dark:text-gray-200'}`}>
                    R$ {spent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                
                <div className="relative h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className={`absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ${isCritical ? 'bg-rose-500' : `bg-${themeColor}-500`}`} 
                    style={{ width: `${percent}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tight">
                  <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900/50 p-2 rounded-lg">
                    <Calendar size={14} className="text-indigo-400" /> Fechamento: {card.closingDay}
                  </div>
                  <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900/50 p-2 rounded-lg">
                    <ShieldCheck size={14} className="text-emerald-500" /> Vencimento: {card.dueDay}
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <button 
                    onClick={() => setShowNegotiationModal(card)}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition"
                  >
                    <Calculator size={14} /> Negociar
                  </button>
                  <button 
                    onClick={() => onDeleteCard(card.id)}
                    className="p-2.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {cards.length === 0 && (
          <div className="col-span-full py-20 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-[3rem] flex flex-col items-center justify-center text-gray-400 bg-white/50 dark:bg-gray-800/20">
            <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
              <CreditCard size={48} className="opacity-40" />
            </div>
            <p className="font-bold text-lg">Nenhum cartão ativo</p>
            <p className="text-sm opacity-60">Adicione seu primeiro cartão para começar o controle.</p>
          </div>
        )}
      </div>

      {/* Negotiation Modal */}
      {showNegotiationModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-[#1c2128] rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800 flex flex-col">
            <div className={`p-8 bg-gradient-to-r from-${themeColor}-600 to-indigo-700 text-white`}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-2 bg-white/20 w-fit px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                    <Sparkles size={12} /> Auditore AI Negotiation
                  </div>
                  <h3 className="text-2xl font-black">Negociação de Fatura</h3>
                  <p className="text-white/70 text-sm mt-1">Simulando as melhores condições para o {showNegotiationModal.name}</p>
                </div>
                <button onClick={() => { setShowNegotiationModal(null); setNegotiationStep(1); }} className="p-2 bg-white/10 rounded-full hover:bg-white/20"><X size={24}/></button>
              </div>
            </div>

            <div className="p-8 space-y-6">
              {negotiationStep === 1 ? (
                <div className="space-y-6 animate-in slide-in-from-right-4">
                  <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800 p-4 rounded-2xl flex gap-3 items-start">
                    <AlertCircle className="text-amber-500 shrink-0" size={20} />
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      O Auditore AI analisou seu histórico. Identificamos que você pode parcelar esta fatura com taxas 25% menores que o rotativo padrão do banco.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border border-gray-100 dark:border-gray-800 rounded-2xl bg-gray-50 dark:bg-gray-900/50">
                      <span className="text-[10px] font-black text-gray-400 uppercase">Dívida Atual</span>
                      <p className="text-xl font-black text-gray-800 dark:text-white">R$ {getCardSpending(showNegotiationModal.id).toFixed(2)}</p>
                    </div>
                    <div className="p-4 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl bg-indigo-50 dark:bg-indigo-900/10">
                      <span className="text-[10px] font-black text-indigo-400 uppercase">Sugestão de Entrada</span>
                      <p className="text-xl font-black text-indigo-600 dark:text-indigo-400">R$ {(getCardSpending(showNegotiationModal.id) * 0.2).toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Propostas Auditore</h4>
                    <button onClick={() => setNegotiationStep(2)} className="w-full p-4 rounded-2xl border-2 border-transparent hover:border-indigo-500 bg-gray-50 dark:bg-gray-900 flex justify-between items-center group transition-all">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-white dark:bg-gray-800 rounded-xl text-indigo-600 shadow-sm"><Receipt size={20}/></div>
                        <div className="text-left">
                          <p className="font-bold text-gray-800 dark:text-white">Parcelamento 12x</p>
                          <p className="text-xs text-gray-500">Juros de 1.9% ao mês</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-indigo-600">12x R$ {(getCardSpending(showNegotiationModal.id) * 1.15 / 12).toFixed(2)}</span>
                        <ChevronRight size={20} className="text-gray-300 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </button>
                    
                    <button onClick={() => setNegotiationStep(2)} className="w-full p-4 rounded-2xl border-2 border-transparent hover:border-emerald-500 bg-gray-50 dark:bg-gray-900 flex justify-between items-center group transition-all">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-white dark:bg-gray-800 rounded-xl text-emerald-600 shadow-sm"><Percent size={20}/></div>
                        <div className="text-left">
                          <p className="font-bold text-gray-800 dark:text-white">Pagamento à Vista</p>
                          <p className="text-xs text-gray-500">Desconto de 15% nos juros</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-emerald-600">R$ {(getCardSpending(showNegotiationModal.id) * 0.95).toFixed(2)}</span>
                        <ChevronRight size={20} className="text-gray-300 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 animate-in zoom-in-95">
                  <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 size={40} />
                  </div>
                  <h4 className="text-2xl font-black text-gray-800 dark:text-white mb-2">Simulação Concluída!</h4>
                  <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-8">
                    Esta é uma projeção gerada pelo Auditore AI. Para oficializar, utilize os canais oficiais do seu banco com os argumentos que preparamos para você.
                  </p>
                  <button onClick={() => { setShowNegotiationModal(null); setNegotiationStep(1); }} className={`w-full py-4 bg-${themeColor}-600 text-white rounded-2xl font-bold shadow-lg shadow-${themeColor}-600/20`}>
                    Entendido, fechar simulação
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-[#1c2128] rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl border border-white/10">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6">Novo Cartão de Crédito</h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Identificação</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  placeholder="Ex: Nubank Platinum" 
                  className="w-full p-3 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 font-bold" 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Bandeira</label>
                  <select 
                    value={brand} 
                    onChange={e => setBrand(e.target.value as any)} 
                    className="w-full p-3 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 dark:text-white outline-none font-bold"
                  >
                    <option value="visa">Visa</option>
                    <option value="mastercard">Mastercard</option>
                    <option value="elo">Elo</option>
                    <option value="amex">Amex</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Limite Total</label>
                  <input 
                    type="number" 
                    value={limit} 
                    onChange={e => setLimit(e.target.value)} 
                    placeholder="R$ 0,00" 
                    className="w-full p-3 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 font-bold" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Dia Fechamento</label>
                  <input 
                    type="number" 
                    value={closingDay} 
                    onChange={e => setClosingDay(e.target.value)} 
                    className="w-full p-3 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 dark:text-white outline-none font-bold" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Dia Vencimento</label>
                  <input 
                    type="number" 
                    value={dueDay} 
                    onChange={e => setDueDay(e.target.value)} 
                    className="w-full p-3 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 dark:text-white outline-none font-bold" 
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Design do Cartão</label>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {colors.map(c => (
                    <button 
                      key={c.name} 
                      onClick={() => setCardColor(c.value)} 
                      className={`w-10 h-10 rounded-full shrink-0 bg-gradient-to-br ${c.value} ${cardColor === c.value ? 'ring-4 ring-offset-2 ring-indigo-500 scale-110 shadow-lg' : 'opacity-70 hover:opacity-100'} transition-all`} 
                      title={c.name}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button onClick={() => setShowAddModal(false)} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition">Cancelar</button>
              <button onClick={handleAddCard} className={`flex-1 py-3 bg-${themeColor}-600 text-white rounded-2xl font-bold shadow-lg shadow-${themeColor}-600/20 active:scale-95 transition`}>Criar Cartão</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const X = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

const CheckCircle2 = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);
