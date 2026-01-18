
import React, { useState, useRef } from 'react';
import { User, Building2, Users, Palette, Brain, CreditCard, Shield, Save, Plus, Trash2, Mail, Check, X, Upload, Smartphone, ArrowRight, Lightbulb, Globe, Fingerprint, Camera } from 'lucide-react';
import { ThemeColor, AIRule } from '../types';

interface SettingsProps {
  themeColor: ThemeColor;
  setThemeColor: (color: ThemeColor) => void;
  userName: string;
  setUserName: (name: string) => void;
  userPhone: string;
  setUserPhone: (phone: string) => void;
  aiRules: AIRule[];
  onAddAiRule: (rule: AIRule) => void;
  onDeleteAiRule: (index: number) => void;
  onResetData: () => void;
}

export const Settings: React.FC<SettingsProps> = ({
  themeColor,
  setThemeColor,
  userName,
  userPhone,
  aiRules
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'organization' | 'appearance' | 'ai'>('appearance');

  const themeColors: { name: ThemeColor, class: string }[] = [
    { name: 'indigo', class: 'bg-indigo-600' },
    { name: 'blue', class: 'bg-blue-600' },
    { name: 'emerald', class: 'bg-emerald-600' },
    { name: 'violet', class: 'bg-violet-600' },
    { name: 'rose', class: 'bg-rose-600' },
  ];

  return (
    <div className="flex flex-col md:flex-row gap-6 h-full">
      <div className="w-full md:w-64 shrink-0 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-2 space-y-1">
          <button onClick={() => setActiveTab('appearance')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'appearance' ? `bg-${themeColor}-600 text-white shadow-lg` : 'text-gray-500 hover:bg-gray-50'}`}>
            <Palette size={18}/> Aparência
          </button>
          <button onClick={() => setActiveTab('profile')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'profile' ? `bg-${themeColor}-600 text-white shadow-lg` : 'text-gray-500 hover:bg-gray-50'}`}>
            <User size={18}/> Perfil
          </button>
          <button onClick={() => setActiveTab('ai')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'ai' ? `bg-${themeColor}-600 text-white shadow-lg` : 'text-gray-500 hover:bg-gray-50'}`}>
            <Brain size={18}/> Regras de IA
          </button>
      </div>

      <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
          {activeTab === 'appearance' && (
            <div className="space-y-6 animate-in fade-in">
              <div>
                <h3 className="text-xl font-bold dark:text-white">Personalização do SaaS</h3>
                <p className="text-gray-500 text-sm">Escolha a cor predominante da interface.</p>
              </div>
              <div className="flex gap-4">
                {themeColors.map(c => (
                  <button 
                    key={c.name}
                    onClick={() => setThemeColor(c.name)}
                    className={`w-12 h-12 rounded-2xl ${c.class} transition-all transform hover:scale-110 flex items-center justify-center text-white ${themeColor === c.name ? 'ring-4 ring-offset-2 ring-indigo-500 scale-110' : ''}`}
                  >
                    {themeColor === c.name && <Check size={20}/>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="space-y-6 animate-in fade-in">
               <div className="flex items-center gap-4">
                 <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-400">
                    <User size={40}/>
                 </div>
                 <div>
                   <h3 className="text-lg font-bold dark:text-white">{userName}</h3>
                   <p className="text-sm text-gray-500">Usuário do SaaS</p>
                 </div>
               </div>
            </div>
          )}
      </div>
    </div>
  );
};
