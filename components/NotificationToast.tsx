
import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface NotificationToastProps {
  message: string;
  type: ToastType;
  isVisible: boolean;
  onClose: () => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ message, type, isVisible, onClose }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const styles = {
    success: 'bg-white dark:bg-[#1c2128] border-l-4 border-emerald-500 text-emerald-900 dark:text-white',
    error: 'bg-white dark:bg-[#1c2128] border-l-4 border-rose-500 text-rose-900 dark:text-white',
    info: 'bg-white dark:bg-[#1c2128] border-l-4 border-blue-500 text-blue-900 dark:text-white'
  };

  const icons = {
    success: <CheckCircle2 className="text-emerald-500 shrink-0" size={24} />,
    error: <AlertCircle className="text-rose-500 shrink-0" size={24} />,
    info: <Info className="text-blue-500 shrink-0" size={24} />
  };

  const titles = {
    success: 'Sucesso!',
    error: 'Atenção',
    info: 'Informação'
  };

  return (
    <div className="fixed top-6 right-6 z-[100] animate-in slide-in-from-right-10 fade-in duration-300">
      <div className={`flex items-start gap-4 px-6 py-4 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-y border-r border-gray-100 dark:border-gray-700 min-w-[320px] max-w-md ${styles[type]}`}>
        <div className="mt-0.5">{icons[type]}</div>
        <div className="flex-1">
          <h4 className="text-sm font-bold mb-0.5">{titles[type]}</h4>
          <p className="text-sm opacity-90 leading-snug">{message}</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition -mr-2 -mt-1 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10">
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
