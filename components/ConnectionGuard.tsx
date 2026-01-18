
import React from 'react';
import { WifiOff, CloudOff, RefreshCw, Database } from 'lucide-react';

interface ConnectionGuardProps {
  isOnline: boolean;
  isDemoMode: boolean;
  onRetry: () => void;
  onContinueOffline: () => void;
  error?: string;
}

export const ConnectionGuard: React.FC<ConnectionGuardProps> = ({ 
  isOnline, isDemoMode, onRetry, onContinueOffline, error 
}) => {
  if (isOnline && !isDemoMode) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] animate-in slide-in-from-right-10">
      {isDemoMode ? (
        <div className="bg-amber-600 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-amber-500/50 backdrop-blur-md">
          <Database size={18} />
          <div className="text-xs">
            <p className="font-bold">Modo Offline Ativo</p>
            <p className="opacity-80">Dados salvos apenas neste navegador.</p>
          </div>
          <button onClick={onRetry} className="ml-2 p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition">
            <RefreshCw size={14} />
          </button>
        </div>
      ) : (
        <div className="bg-[#1c2128] border border-red-500/30 p-6 rounded-[2rem] shadow-2xl max-w-xs space-y-4">
          <div className="flex items-center gap-3 text-red-500">
            <CloudOff size={24} />
            <h4 className="font-bold">Sem conexão cloud</h4>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            {error || "Não conseguimos conectar ao banco de dados Supabase."}
          </p>
          <div className="flex flex-col gap-2">
            <button onClick={onRetry} className="w-full py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2">
              <RefreshCw size={14} /> Tentar Reconectar
            </button>
            <button onClick={onContinueOffline} className="w-full py-2 bg-gray-700 text-gray-200 rounded-xl text-xs font-bold">
              Usar em Modo Local
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
