
import React, { useState } from 'react';
import { CreditCard as CreditCardType, Transaction, TransactionType } from '../types';
import { CreditCard, Plus, Calendar, ShieldCheck, TrendingDown, MoreVertical, Trash2 } from 'lucide-react';

interface CreditCardManagerProps {
  cards: CreditCardType[];
  transactions: Transaction[];
  onAddCard: (card: CreditCardType) => void;
  onDeleteCard: (id: string) => void;
}

export const CreditCardManager: React.FC<CreditCardManagerProps> = ({ cards, transactions, onAddCard, onDeleteCard }) => {
  const [showAddModal, setShowAddModal] = useState(false);

  const getCardSpending = (cardId: string) => {
    return transactions
      .filter(t => t.creditCardId === cardId && t.type === TransactionType.EXPENSE)
      .reduce((acc, t) => acc + t.amount, 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <CreditCard className="text-indigo-600" /> Cartões de Crédito
          </h2>
          <p className="text-sm text-gray-500">Controle faturas, limites e datas de fechamento.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold shadow-lg transition"
        >
          <Plus size={18} /> Novo Cartão
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map(card => {
          const spent = getCardSpending(card.id);
          const percent = Math.min((spent / card.limit) * 100, 100);

          return (
            <div key={card.id} className="relative group">
              <div className={`h-48 rounded-[2rem] p-6 text-white shadow-xl flex flex-col justify-between overflow-hidden bg-gradient-to-br ${card.color || 'from-gray-800 to-gray-900'}`}>
                <div className="flex justify-between items-start relative z-10">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold tracking-[0.2em] opacity-70">Limite Disponível</span>
                    <span className="text-xl font-bold">R$ {(card.limit - spent).toFixed(2)}</span>
                  </div>
                  <div className="bg-white/20 p-2 rounded-lg backdrop-blur-md uppercase text-[10px] font-black">
                    {card.brand}
                  </div>
                </div>

                <div className="relative z-10">
                  <p className="text-sm font-medium mb-1">{card.name}</p>
                  <p className="text-xs opacity-60 font-mono tracking-widest">**** **** **** 8842</p>
                </div>

                <div className="absolute right-[-20px] bottom-[-20px] opacity-10">
                  <CreditCard size={140} />
                </div>
              </div>

              {/* Stats Card Below */}
              <div className="mt-[-20px] mx-4 bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg border border-gray-100 dark:border-gray-700 space-y-3">
                <div className="flex justify-between items-center text-xs font-bold text-gray-400 uppercase">
                  <span>Fatura Atual</span>
                  <span className="text-rose-500">R$ {spent.toFixed(2)}</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${percent > 80 ? 'bg-rose-500' : 'bg-indigo-500'}`} style={{ width: `${percent}%` }}></div>
                </div>
                <div className="flex justify-between text-[10px] font-medium text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar size={12} /> Fecha dia {card.closingDay}
                  </div>
                  <div className="flex items-center gap-1">
                    <ShieldCheck size={12} className="text-emerald-500" /> Vence dia {card.dueDay}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {cards.length === 0 && (
          <div className="col-span-full py-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-[2rem] flex flex-col items-center justify-center text-gray-400">
            <CreditCard size={48} className="mb-2 opacity-20" />
            <p className="font-medium">Nenhum cartão cadastrado.</p>
          </div>
        )}
      </div>
    </div>
  );
};
