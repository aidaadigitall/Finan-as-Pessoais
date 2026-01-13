import React from 'react';
import { Transaction, TransactionType } from '../types';
import { Calendar, CheckCircle } from 'lucide-react';

interface AccountsReceivableProps {
  transactions: Transaction[];
  onToggleStatus: (id: string) => void;
}

export const AccountsReceivable: React.FC<AccountsReceivableProps> = ({ transactions, onToggleStatus }) => {
  // Filter for Income that are NOT paid (received)
  const receivables = transactions
    .filter(t => t.type === TransactionType.INCOME && !t.isPaid)
    .sort((a, b) => {
        const dateA = a.dueDate ? new Date(a.dueDate).getTime() : new Date(a.date).getTime();
        const dateB = b.dueDate ? new Date(b.dueDate).getTime() : new Date(b.date).getTime();
        return dateA - dateB;
    });

  const totalPending = receivables.reduce((acc, t) => acc + (t.amount || 0), 0);

  return (
    <div className="space-y-6">
       {/* Summary Card */}
       <div className="bg-green-50 border border-green-100 p-6 rounded-2xl flex justify-between items-center">
            <div>
                <h3 className="text-green-800 font-bold text-lg">Total a Receber</h3>
                <p className="text-green-600 text-sm">Receitas previstas pendentes</p>
            </div>
            <div className="text-3xl font-bold text-green-700">
                R$ {totalPending.toFixed(2)}
            </div>
       </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Calendar className="text-green-500" size={20} />
            Contas a Receber
          </h3>
          <span className="bg-gray-100 text-gray-600 text-xs font-semibold px-2.5 py-0.5 rounded">
            {receivables.length} pendentes
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-6 py-3">Previsão</th>
                <th className="px-6 py-3">Descrição</th>
                <th className="px-6 py-3">Categoria</th>
                <th className="px-6 py-3 text-right">Valor</th>
                <th className="px-6 py-3 text-center">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {receivables.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                       {t.dueDate ? new Date(t.dueDate).toLocaleDateString('pt-BR') : new Date(t.date).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {t.description}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                        {t.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-gray-800">
                      R$ {(t.amount || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => onToggleStatus(t.id)}
                        className="text-gray-400 hover:text-green-600 transition-colors flex items-center justify-center w-full gap-1 text-xs font-medium border border-gray-200 rounded py-1 hover:bg-green-50 hover:border-green-200"
                      >
                         <CheckCircle size={14} /> Receber
                      </button>
                    </td>
                  </tr>
              ))}
              {receivables.length === 0 && (
                  <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-gray-400">
                          Nenhuma receita pendente encontrada.
                      </td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};