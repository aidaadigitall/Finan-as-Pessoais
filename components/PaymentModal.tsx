
import React, { useState, useEffect } from 'react';
import { Transaction, BankAccount, TransactionType } from '../types';
import { X, Calendar, DollarSign, Landmark, Paperclip, Save, ArrowRight } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  accounts: BankAccount[];
  onConfirm: (updatedTransaction: Transaction) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen, onClose, transaction, accounts, onConfirm
}) => {
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);

  useEffect(() => {
    if (transaction) {
      setAmount(transaction.amount.toString());
      // Usa a data atual como padrão para o pagamento, ou a data de vencimento se preferir
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setSelectedAccountId(transaction.accountId || (accounts[0]?.id || ''));
      setAttachment(null);
    }
  }, [transaction, accounts, isOpen]);

  if (!isOpen || !transaction) return null;

  const handleSave = () => {
    const finalAmount = parseFloat(amount);
    
    // Simulação de Upload (Em produção, enviaria para o Storage do Supabase)
    const mockAttachmentUrl = attachment ? URL.createObjectURL(attachment) : transaction.attachmentUrl;

    const updatedTransaction: Transaction = {
      ...transaction,
      amount: finalAmount,
      date: new Date(paymentDate).toISOString(), // A data da transação passa a ser a data do pagamento efetivo
      accountId: selectedAccountId,
      isPaid: true,
      attachmentUrl: mockAttachmentUrl
    };

    onConfirm(updatedTransaction);
    onClose();
  };

  const difference = parseFloat(amount) - transaction.amount;
  const isPenalty = difference > 0;
  const isDiscount = difference < 0;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">
            {transaction.type === TransactionType.EXPENSE ? 'Realizar Pagamento' : 'Confirmar Recebimento'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl">
             <p className="text-xs text-gray-500 uppercase font-bold mb-1">Descrição</p>
             <p className="font-bold text-gray-800 dark:text-white">{transaction.description}</p>
             <p className="text-xs text-gray-400 mt-1">Vencimento Original: {transaction.dueDate ? new Date(transaction.dueDate).toLocaleDateString('pt-BR') : 'N/A'}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Data Pagamento</label>
                <div className="relative">
                   <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                   <input 
                      type="date" 
                      value={paymentDate} 
                      onChange={e => setPaymentDate(e.target.value)}
                      className="w-full pl-10 p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                   />
                </div>
             </div>
             <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Valor Final</label>
                <div className="relative">
                   <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                   <input 
                      type="number" 
                      value={amount} 
                      onChange={e => setAmount(e.target.value)}
                      className="w-full pl-10 p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                   />
                </div>
             </div>
          </div>

          {/* Feedback de Juros/Desconto */}
          {difference !== 0 && (
             <div className={`text-xs px-3 py-2 rounded-lg font-medium flex justify-between ${isPenalty ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                <span>{isPenalty ? 'Accréscimo (Juros/Multa):' : 'Desconto:'}</span>
                <span>R$ {Math.abs(difference).toFixed(2)}</span>
             </div>
          )}

          <div className="space-y-1">
             <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Conta de Movimentação</label>
             <div className="relative">
                <Landmark size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                <select 
                   value={selectedAccountId} 
                   onChange={e => setSelectedAccountId(e.target.value)}
                   className="w-full pl-10 p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                >
                   {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} ({acc.bankName})</option>)}
                </select>
             </div>
          </div>

          <div className="space-y-1">
             <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Anexar Comprovante</label>
             <label className="flex items-center gap-3 p-3 border border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                <div className="bg-gray-100 dark:bg-gray-600 p-2 rounded-lg text-gray-500">
                   <Paperclip size={20} />
                </div>
                <div className="flex-1 overflow-hidden">
                   <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                      {attachment ? attachment.name : 'Clique para selecionar arquivo'}
                   </p>
                   <p className="text-[10px] text-gray-400">PDF, JPG ou PNG</p>
                </div>
                <input type="file" className="hidden" accept="image/*,.pdf" onChange={e => setAttachment(e.target.files?.[0] || null)} />
             </label>
          </div>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 flex gap-3 border-t border-gray-100 dark:border-gray-700">
           <button onClick={onClose} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition">
              Cancelar
           </button>
           <button 
              onClick={handleSave}
              className={`flex-1 py-3 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 transition transform active:scale-95 ${transaction.type === TransactionType.EXPENSE ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
           >
              Confirmar <ArrowRight size={18} />
           </button>
        </div>
      </div>
    </div>
  );
};
