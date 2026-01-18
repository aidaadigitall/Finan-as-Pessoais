
import React, { useState } from 'react';
import { User, Building2, Palette, Brain, Key, Lock, Eye, EyeOff, Upload, Save, Globe, Smartphone, Shield, LogOut } from 'lucide-react';
import { SystemSettings, UserProfile, ThemeColor } from '../types';
import { NotificationToast, ToastType } from './NotificationToast';

interface SettingsProps {
  settings: SystemSettings;
  onUpdateSettings: (newSettings: SystemSettings) => void;
  userProfile: UserProfile;
  onUpdateProfile: (newProfile: UserProfile) => void;
}

export const Settings: React.FC<SettingsProps> = ({
  settings,
  onUpdateSettings,
  userProfile,
  onUpdateProfile
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'system' | 'api' | 'ai'>('profile');
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [notification, setNotification] = useState<{ message: string, type: ToastType } | null>(null);

  // Local state for forms to handle inputs before saving
  const [localSettings, setLocalSettings] = useState<SystemSettings>(settings);
  const [localProfile, setLocalProfile] = useState<UserProfile>(userProfile);

  const themeColors: { name: ThemeColor, class: string }[] = [
    { name: 'indigo', class: 'bg-indigo-600' },
    { name: 'blue', class: 'bg-blue-600' },
    { name: 'emerald', class: 'bg-emerald-600' },
    { name: 'violet', class: 'bg-violet-600' },
    { name: 'rose', class: 'bg-rose-600' },
  ];

  const showNotification = (message: string, type: ToastType = 'success') => {
      setNotification({ message, type });
  };

  const handleSaveSystem = () => {
      onUpdateSettings(localSettings);
      showNotification('Configurações do sistema salvas com sucesso!');
  };

  const handleSaveProfile = () => {
      onUpdateProfile(localProfile);
      showNotification('Perfil atualizado com sucesso!');
  };

  const toggleKeyVisibility = (key: string) => {
      setShowKey(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'internal' | 'login') => {
      const file = e.target.files?.[0];
      if (file) {
          const url = URL.createObjectURL(file);
          setLocalSettings(prev => ({
              ...prev,
              [type === 'internal' ? 'logoUrl' : 'loginLogoUrl']: url
          }));
      }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const url = URL.createObjectURL(file);
          setLocalProfile(prev => ({ ...prev, avatarUrl: url }));
      }
  };

  const TabButton = ({ id, icon: Icon, label }: any) => (
      <button 
        onClick={() => setActiveTab(id)} 
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === id ? `bg-${settings.themeColor}-600 text-white shadow-lg` : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-gray-400'}`}
      >
        <Icon size={18}/> {label}
      </button>
  );

  return (
    <div className="flex flex-col md:flex-row gap-6 h-full relative">
      {/* Toast Notification */}
      <NotificationToast 
        isVisible={!!notification}
        message={notification?.message || ''}
        type={notification?.type || 'success'}
        onClose={() => setNotification(null)}
      />

      {/* Sidebar */}
      <div className="w-full md:w-64 shrink-0 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-2 space-y-1 h-fit">
          <TabButton id="profile" icon={User} label="Meu Perfil" />
          <TabButton id="system" icon={Building2} label="Sistema e Marca" />
          <TabButton id="api" icon={Key} label="Chaves de API" />
          <TabButton id="ai" icon={Brain} label="Regras de IA" />
      </div>

      {/* Content Area */}
      <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
          
          {/* --- PERFIL --- */}
          {activeTab === 'profile' && (
            <div className="space-y-8 animate-in fade-in">
               <div>
                  <h3 className="text-xl font-bold dark:text-white">Perfil do Usuário</h3>
                  <p className="text-gray-500 text-sm">Gerencie suas informações pessoais e de acesso.</p>
               </div>

               <div className="flex items-center gap-6">
                   <div className="relative group">
                       <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden border-4 border-white dark:border-gray-600 shadow-lg">
                           {localProfile.avatarUrl ? (
                               <img src={localProfile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                           ) : (
                               <User size={40} className="text-gray-400" />
                           )}
                       </div>
                       <label className="absolute bottom-0 right-0 p-2 bg-indigo-600 text-white rounded-full cursor-pointer shadow-md hover:bg-indigo-700 transition">
                           <Upload size={14} />
                           <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                       </label>
                   </div>
                   <div>
                       <h4 className="font-bold text-lg dark:text-white">{localProfile.name}</h4>
                       <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-bold uppercase">{localProfile.role}</span>
                   </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-1">
                       <label className="text-xs font-bold text-gray-500 uppercase">Nome Completo</label>
                       <input 
                          type="text" 
                          value={localProfile.name} 
                          onChange={(e) => setLocalProfile({...localProfile, name: e.target.value})}
                          className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                       />
                   </div>
                   <div className="space-y-1">
                       <label className="text-xs font-bold text-gray-500 uppercase">E-mail</label>
                       <input 
                          type="email" 
                          value={localProfile.email} 
                          onChange={(e) => setLocalProfile({...localProfile, email: e.target.value})}
                          className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                       />
                   </div>
               </div>

               <div className="pt-4">
                   <button onClick={handleSaveProfile} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg hover:bg-indigo-700 transition">
                       <Save size={18} /> Salvar Alterações
                   </button>
               </div>
            </div>
          )}

          {/* --- SISTEMA --- */}
          {activeTab === 'system' && (
            <div className="space-y-8 animate-in fade-in">
               <div>
                  <h3 className="text-xl font-bold dark:text-white">Identidade Visual</h3>
                  <p className="text-gray-500 text-sm">Personalize o nome, logos e cores do sistema.</p>
               </div>

               <div className="space-y-1">
                   <label className="text-xs font-bold text-gray-500 uppercase">Nome da Empresa (SaaS)</label>
                   <input 
                      type="text" 
                      value={localSettings.companyName}
                      onChange={(e) => setLocalSettings({...localSettings, companyName: e.target.value})}
                      className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-lg"
                   />
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-2">
                       <label className="text-xs font-bold text-gray-500 uppercase">Logo do Painel (Interno)</label>
                       <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-6 flex flex-col items-center justify-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition">
                           {localSettings.logoUrl ? (
                               <img src={localSettings.logoUrl} alt="Logo Interno" className="h-12 object-contain" />
                           ) : (
                               <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400"><Upload size={20}/></div>
                           )}
                           <label className="cursor-pointer text-sm text-indigo-600 font-bold hover:underline">
                               Carregar Imagem
                               <input type="file" className="hidden" accept="image/*" onChange={(e) => handleLogoUpload(e, 'internal')} />
                           </label>
                       </div>
                   </div>
                   
                   <div className="space-y-2">
                       <label className="text-xs font-bold text-gray-500 uppercase">Logo de Login (Externo)</label>
                       <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-6 flex flex-col items-center justify-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition bg-gray-900">
                           {localSettings.loginLogoUrl ? (
                               <img src={localSettings.loginLogoUrl} alt="Logo Login" className="h-12 object-contain" />
                           ) : (
                               <div className="h-12 w-12 bg-gray-800 rounded-lg flex items-center justify-center text-gray-500"><Upload size={20}/></div>
                           )}
                           <label className="cursor-pointer text-sm text-indigo-400 font-bold hover:underline">
                               Carregar Imagem
                               <input type="file" className="hidden" accept="image/*" onChange={(e) => handleLogoUpload(e, 'login')} />
                           </label>
                       </div>
                   </div>
               </div>

               <div className="space-y-2">
                   <label className="text-xs font-bold text-gray-500 uppercase">Cor Principal</label>
                   <div className="flex gap-4">
                        {themeColors.map(c => (
                        <button 
                            key={c.name}
                            onClick={() => setLocalSettings({...localSettings, themeColor: c.name})}
                            className={`w-12 h-12 rounded-2xl ${c.class} transition-all transform hover:scale-110 flex items-center justify-center text-white ${localSettings.themeColor === c.name ? 'ring-4 ring-offset-2 ring-gray-300 dark:ring-gray-600 scale-110' : ''}`}
                        >
                            {localSettings.themeColor === c.name && <Globe size={20}/>}
                        </button>
                        ))}
                   </div>
               </div>

               <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                   <button onClick={handleSaveSystem} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg hover:bg-indigo-700 transition">
                       <Save size={18} /> Salvar Configurações
                   </button>
               </div>
            </div>
          )}

          {/* --- API KEYS --- */}
          {activeTab === 'api' && (
             <div className="space-y-6 animate-in fade-in">
                <div>
                  <h3 className="text-xl font-bold dark:text-white">Chaves de API</h3>
                  <p className="text-gray-500 text-sm">Configure as integrações com Inteligência Artificial e outros serviços.</p>
               </div>

               <div className="space-y-4">
                   {[
                       { key: 'openai', label: 'OpenAI (GPT-4)', icon: Brain },
                       { key: 'gemini', label: 'Google Gemini', icon: Globe },
                       { key: 'anthropic', label: 'Anthropic Claude', icon: Brain },
                       { key: 'copilot', label: 'Microsoft Copilot', icon: Shield },
                       { key: 'grok', label: 'xAI Grok', icon: Smartphone },
                       { key: 'deepseek', label: 'DeepSeek', icon: Brain }
                   ].map((provider) => (
                       <div key={provider.key} className="space-y-1">
                           <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                               <provider.icon size={14} /> {provider.label}
                           </label>
                           <div className="relative">
                               <input 
                                  type={showKey[provider.key] ? 'text' : 'password'}
                                  value={(localSettings.apiKeys as any)[provider.key] || ''}
                                  onChange={(e) => setLocalSettings({
                                      ...localSettings, 
                                      apiKeys: { ...localSettings.apiKeys, [provider.key]: e.target.value }
                                  })}
                                  placeholder={`sk-...`}
                                  className="w-full p-3 pr-12 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                               />
                               <button 
                                 onClick={() => toggleKeyVisibility(provider.key)}
                                 className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                               >
                                   {showKey[provider.key] ? <EyeOff size={18}/> : <Eye size={18}/>}
                               </button>
                           </div>
                       </div>
                   ))}
               </div>

               <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                   <button onClick={handleSaveSystem} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg hover:bg-indigo-700 transition">
                       <Save size={18} /> Atualizar Chaves
                   </button>
               </div>
             </div>
          )}

          {activeTab === 'ai' && (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
                  <Brain size={48} className="mb-4 opacity-20" />
                  <h3 className="text-lg font-bold">Regras de Categorização</h3>
                  <p className="text-sm">Configuração de regras automáticas em breve.</p>
              </div>
          )}
      </div>
    </div>
  );
};
