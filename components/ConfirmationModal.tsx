
import React from 'react';
import { AlertTriangle, Trash2, X, Check } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger'
}) => {
  if (!isOpen) return null;

  const isDanger = variant === 'danger';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1c2128] rounded-[2rem] w-full max-w-sm shadow-2xl border border-white/20 dark:border-gray-700 transform transition-all animate-in zoom-in-95 duration-200 overflow-hidden">
        
        {/* Header Visual */}
        <div className={`h-24 ${isDanger ? 'bg-rose-50 dark:bg-rose-900/20' : 'bg-amber-50 dark:bg-amber-900/20'} flex items-center justify-center relative`}>
           <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg ${isDanger ? 'bg-white text-rose-500' : 'bg-white text-amber-500'}`}>
              {isDanger ? <Trash2 size={32} /> : <AlertTriangle size={32} />}
           </div>
           <button 
             onClick={onClose}
             className="absolute top-4 right-4 p-2 bg-white/50 hover:bg-white rounded-full text-gray-500 transition-colors"
           >
             <X size={16} />
           </button>
        </div>

        {/* Content */}
        <div className="p-6 text-center space-y-3">
          <h3 className="text-xl font-black text-gray-800 dark:text-white leading-tight">
            {title}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            {description}
          </p>
        </div>

        {/* Actions */}
        <div className="p-6 pt-0 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition focus:scale-95"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 py-3.5 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 transition transform active:scale-95 hover:opacity-90 ${
              isDanger ? 'bg-rose-600 shadow-rose-500/30' : 'bg-amber-600 shadow-amber-500/30'
            }`}
          >
            {isDanger && <Trash2 size={16} />}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
