
import React, { useState } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, RefreshCw, X, ChevronRight, FileCode } from 'lucide-react';
import { Transaction, BankAccount } from '../types';

interface StatementImporterProps {
  accounts: BankAccount[];
  onImport: (transactions: any[]) => void;
}

export const StatementImporter: React.FC<StatementImporterProps> = ({ accounts, onImport }) => {
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || '');
  const [isUploading, setIsUploading] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [previewData, setPreviewData] = useState<any[]>([]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    // Simula processamento de OFX/PDF/CSV
    setTimeout(() => {
      const mockData = [
        { id: '1', date: '2023-11-20', description: 'POSTO IPIRANGA', amount: 250.00, type: 'expense', category: 'Transporte', status: 'new' },
        { id: '2', date: '2023-11-21', description: 'APPLE SERVICES', amount: 14.90, type: 'expense', category: 'Assinaturas', status: 'match' },
        { id: '3', date: '2023-11-22', description: 'PIX RECEBIDO - ELTON', amount: 1500.00, type: 'income', category: 'Vendas', status: 'new' }
      ];
      setPreviewData(mockData);
      setIsUploading(false);
      setStep(2);
    }, 2000);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center">
        <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <RefreshCw size={18} className="text-indigo-600" /> Conciliador de Extratos
        </h3>
        <div className="flex gap-1">
          <div className={`w-2 h-2 rounded-full ${step === 1 ? 'bg-indigo-600' : 'bg-gray-300'}`}></div>
          <div className={`w-2 h-2 rounded-full ${step === 2 ? 'bg-indigo-600' : 'bg-gray-300'}`}></div>
        </div>
      </div>

      <div className="p-8">
        {step === 1 ? (
          <div className="max-w-md mx-auto space-y-6">
            <div className="space-y-2 text-center">
              <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Upload size={32} />
              </div>
              <h4 className="text-lg font-bold dark:text-white">Importar Novo Arquivo</h4>
              <p className="text-sm text-gray-500">Arraste seu extrato OFX, PDF ou CSV para começar a conciliação automática.</p>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="text-xs font-bold text-gray-400 uppercase mb-1.5 block tracking-widest">Selecionar Conta</span>
                <select 
                  value={selectedAccountId} 
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white"
                >
                  {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} - {acc.bankName}</option>)}
                </select>
              </label>

              <label className="relative block group">
                <div className="w-full h-32 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl flex flex-col items-center justify-center text-gray-400 group-hover:border-indigo-400 transition-all cursor-pointer">
                  {isUploading ? (
                    <div className="flex flex-col items-center gap-2 text-indigo-600">
                      <RefreshCw size={24} className="animate-spin" />
                      <span className="text-xs font-bold uppercase">Lendo Arquivo...</span>
                    </div>
                  ) : (
                    <>
                      <FileCode size={32} className="mb-2" />
                      <span className="text-xs font-bold uppercase tracking-widest">Escolher Arquivo</span>
                    </>
                  )}
                </div>
                <input type="file" className="hidden" accept=".ofx,.pdf,.csv" onChange={handleFile} disabled={isUploading} />
              </label>
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in slide-in-from-right-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">3 Lançamentos Detectados</span>
              <button onClick={() => setStep(1)} className="text-gray-400 hover:text-gray-600 transition"><X size={20} /></button>
            </div>

            <div className="space-y-3">
              {previewData.map(item => (
                <div key={item.id} className="p-4 border border-gray-100 dark:border-gray-700 rounded-2xl flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${item.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                      {item.type === 'income' ? <ChevronRight size={18} className="-rotate-90" /> : <ChevronRight size={18} className="rotate-90" />}
                    </div>
                    <div>
                      <p className="font-bold text-sm dark:text-white uppercase">{item.description}</p>
                      <p className="text-[10px] text-gray-400 font-medium">{new Date(item.date).toLocaleDateString('pt-BR')} • {item.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className={`font-black text-sm ${item.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {item.type === 'income' ? '+' : '-'} R$ {item.amount.toFixed(2)}
                    </span>
                    {item.status === 'match' ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md uppercase">
                        <CheckCircle2 size={10} /> Conciliado
                      </span>
                    ) : (
                      <button className="text-[10px] font-bold text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded-md uppercase border border-indigo-100 transition">
                        Importar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-6 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
               <button onClick={() => setStep(1)} className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-500 font-bold hover:bg-gray-50 transition">Cancelar</button>
               <button className="px-8 py-2.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-lg transition">Processar Tudo</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
