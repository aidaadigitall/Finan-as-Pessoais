
import React, { useState, useEffect } from 'react';
import { User, Building2, Palette, Brain, Key, Lock, Eye, EyeOff, Upload, Save, Globe, Smartphone, Shield, LogOut, Plus, Trash2, Search, Zap, MessageCircle } from 'lucide-react';
import { SystemSettings, UserProfile, ThemeColor, AIRule, Category, WhatsAppConfig } from '../types';
import { NotificationToast, ToastType } from './NotificationToast';
import { WhatsAppIntegration } from './WhatsAppIntegration';
import { analyzeFinancialInput, getFinancialAdvice } from '../services/geminiService';
import { financialService } from '../services/financialService';
import { Transaction, TransactionStatus } from '../types';

interface SettingsProps {
  settings: SystemSettings;
  onUpdateSettings: (newSettings: SystemSettings) => void;
  userProfile: UserProfile;
  onUpdateProfile: (newProfile: UserProfile) => void;
  userRules?: AIRule[];
  onUpdateRules?: (rules: AIRule[]) => void;
  categories?: Category[];
}

export const Settings: React.FC<SettingsProps> = ({
  settings,
  onUpdateSettings,
  userProfile,
  onUpdateProfile,
  userRules = [],
  onUpdateRules,
  categories = []
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'system' | 'api' | 'ai' | 'whatsapp'>('profile');
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [notification, setNotification] = useState<{ message: string, type: ToastType } | null>(null);

  // Local state
  const [localSettings, setLocalSettings] = useState<SystemSettings>(settings);
  const [localProfile, setLocalProfile] = useState<UserProfile>(userProfile);
  
  // State for AI Rules
  const [newRuleKeyword, setNewRuleKeyword] = useState('');
  const [newRuleCategory, setNewRuleCategory] = useState('');

  // Carregar API Keys do LocalStorage ao montar
  useEffect(() => {
      const savedGeminiKey = localStorage.getItem('finai_api_key_gemini');
      const savedOpenAIKey = localStorage.getItem('finai_api_key_openai');
      
      setLocalSettings(prev => ({
          ...prev,
          apiKeys: { 
              ...prev.apiKeys, 
              gemini: savedGeminiKey || prev.apiKeys.gemini,
              openai: savedOpenAIKey || prev.apiKeys.openai
          }
      }));
  }, []);

  // Update localSettings when props change (e.g. initial load)
  useEffect(() => {
      setLocalSettings(prev => ({...prev, ...settings}));
  }, [settings]);

  const showNotification = (message: string, type: ToastType = 'success') => {
      setNotification({ message, type });
  };

  const handleSaveSystem = () => {
      onUpdateSettings(localSettings);
      
      // Salvar API Keys especificamente no LocalStorage para o Service usar
      if (localSettings.apiKeys.gemini) {
          localStorage.setItem('finai_api_key_gemini', localSettings.apiKeys.gemini);
      }
      if (localSettings.apiKeys.openai) {
          localStorage.setItem('finai_api_key_openai', localSettings.apiKeys.openai);
      }

      showNotification('Configurações salvas e chaves de API atualizadas!');
  };

  const handleSaveWhatsApp = async (newConfig: Partial<WhatsAppConfig>) => {
      const updatedSettings: SystemSettings = {
          ...localSettings,
          whatsapp: {
              ...localSettings.whatsapp,
              ...newConfig
          }
      };
      
      setLocalSettings(updatedSettings);
      // Persiste no banco de dados imediatamente
      onUpdateSettings(updatedSettings);
      showNotification('Configurações do WhatsApp salvas com sucesso!');
  };

  const handleSaveProfile = () => {
      onUpdateProfile(localProfile);
      showNotification('Perfil atualizado com sucesso!');
  };

  const handleAddRule = () => {
      if (!newRuleKeyword || !newRuleCategory || !onUpdateRules) return;
      const updatedRules = [...userRules, { keyword: newRuleKeyword, category: newRuleCategory }];
      onUpdateRules(updatedRules);
      setNewRuleKeyword('');
      setNewRuleCategory('');
      showNotification('Regra de IA adicionada!');
  };

  const handleDeleteRule = (index: number) => {
      if (!onUpdateRules) return;
      const updatedRules = userRules.filter((_, i) => i !== index);
      onUpdateRules(updatedRules);
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

  // --- LOGICA DE SIMULAÇÃO DE WHATSAPP ---
  const handleWhatsAppSimulation = async (message: string) => {
      try {
          // Nota: Em produção real, o webhook receberia o número do telefone e buscaria a Org associada.
          const { data: { user } } = await import('../lib/supabase').then(m => m.supabase.auth.getUser());
          if(!user) throw new Error("Usuário não autenticado.");
          
          // Busca orgId rápida
          const orgId = await import('../services/authService').then(s => s.authService.ensureUserResources(user.id, user.email!));
          const transactions = await financialService.getTransactions(orgId);

          // Primeiro, tentamos analisar como transação
          const result = await analyzeFinancialInput(message, null, categories, userRules);

          if (result.isTransaction && result.transactionDetails) {
              const details = result.transactionDetails;
              const newT: Partial<Transaction> = {
                  description: details.description,
                  amount: details.amount,
                  type: details.type,
                  category: details.category,
                  date: new Date().toISOString(),
                  isPaid: true,
                  status: TransactionStatus.CONFIRMED,
                  source: 'whatsapp_ai',
                  installmentCount: details.installmentCount || undefined
              };
              
              // SALVAMENTO REAL NO BANCO
              await financialService.createTransaction(newT, orgId);
              showNotification(`✅ Lançamento Salvo: ${details.description} - R$ ${details.amount}`);
          } else {
             const advice = await getFinancialAdvice(message, transactions, categories);
             console.log("Resposta IA:", advice);
             showNotification(`🤖 IA Respondeu (ver console)`, 'info');
             return; 
          }
      } catch (e: any) {
          console.error(e);
          showNotification(`Erro na simulação: ${e.message}`, 'error');
          throw e;
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

  const themeColors: { name: ThemeColor, class: string }[] = [
    { name: 'indigo', class: 'bg-indigo-600' },
    { name: 'blue', class: 'bg-blue-600' },
    { name: 'emerald', class: 'bg-emerald-600' },
    { name: 'violet', class: 'bg-violet-600' },
    { name: 'rose', class: 'bg-rose-600' },
  ];

  return (
    <div className="flex flex-col md:flex-row gap-6 h-full relative">
      <NotificationToast 
        isVisible={!!notification}
        message={notification?.message || ''}
        type={notification?.type || 'success'}
        onClose={() => setNotification(null)}
      />

      <div className="w-full md:w-64 shrink-0 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-2 space-y-1 h-fit">
          <TabButton id="profile" icon={User} label="Meu Perfil" />
          <TabButton id="system" icon={Building2} label="Sistema e Marca" />
          <TabButton id="whatsapp" icon={MessageCircle} label="Integração WhatsApp" />
          <TabButton id="api" icon={Key} label="Chaves de API" />
          <TabButton id="ai" icon={Brain} label="Regras de IA" />
      </div>

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
          
          {/* --- WHATSAPP INTEGRATION --- */}
          {activeTab === 'whatsapp' && (
              <WhatsAppIntegration 
                config={localSettings.whatsapp || { status: 'disconnected' }}
                themeColor={settings.themeColor}
                onSaveConfig={handleSaveWhatsApp}
                onDisconnect={() => handleSaveWhatsApp({ status: 'disconnected', apiKey: '', instanceId: '' })}
                onSimulateMessage={handleWhatsAppSimulation}
              />
          )}

          {/* --- API KEYS --- */}
          {activeTab === 'api' && (
             <div className="space-y-6 animate-in fade-in">
                <div>
                  <h3 className="text-xl font-bold dark:text-white">Chaves de API</h3>
                  <p className="text-gray-500 text-sm">Configure sua inteligência artificial preferida.</p>
               </div>

               <div className="space-y-4">
                   {[
                       { key: 'gemini', label: 'Google Gemini', icon: Globe, help: 'Recomendado (Suporte a Áudio Nativo)' },
                       { key: 'openai', label: 'OpenAI (GPT-4)', icon: Brain, help: 'Suporte a Texto e Imagens' },
                   ].map((provider) => (
                       <div key={provider.key} className="space-y-1">
                           <label className="text-xs font-bold text-gray-500 uppercase flex items-center justify-between">
                               <span className="flex items-center gap-2"><provider.icon size={14} /> {provider.label}</span>
                               <span className="text-[10px] text-indigo-500 cursor-pointer hover:underline">{provider.help}</span>
                           </label>
                           <div className="relative">
                               <input 
                                  type={showKey[provider.key] ? 'text' : 'password'}
                                  value={(localSettings.apiKeys as any)[provider.key] || ''}
                                  onChange={(e) => setLocalSettings({
                                      ...localSettings, 
                                      apiKeys: { ...localSettings.apiKeys, [provider.key]: e.target.value }
                                  })}
                                  placeholder={`Cole sua chave aqui...`}
                                  className="w-full p-3 pr-12 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
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

               <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl text-xs text-indigo-800 dark:text-indigo-300 flex items-start gap-2">
                   <Shield size={16} className="shrink-0 mt-0.5" />
                   <p>Suas chaves são salvas apenas no armazenamento local do seu navegador (LocalStorage) e enviadas diretamente para a API do provedor. Elas não passam por nossos servidores.</p>
               </div>

               <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                   <button onClick={handleSaveSystem} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg hover:bg-indigo-700 transition">
                       <Save size={18} /> Salvar Chaves
                   </button>
               </div>
             </div>
          )}

          {/* --- REGRAS DE IA --- */}
          {activeTab === 'ai' && (
              <div className="space-y-8 animate-in fade-in">
                  <div>
                      <h3 className="text-xl font-bold dark:text-white">Regras de Categorização Automática</h3>
                      <p className="text-gray-500 text-sm">Ensine o FinAI a categorizar lançamentos específicos automaticamente.</p>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-700">
                      <h4 className="text-sm font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                          <Zap size={16} className="text-amber-500" /> Nova Regra
                      </h4>
                      <div className="flex flex-col md:flex-row gap-4">
                          <div className="flex-1 space-y-1">
                              <label className="text-[10px] font-bold text-gray-400 uppercase">Se a descrição conter...</label>
                              <div className="relative">
                                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                  <input 
                                      type="text" 
                                      value={newRuleKeyword}
                                      onChange={(e) => setNewRuleKeyword(e.target.value)}
                                      placeholder="Ex: Netflix, Uber, Posto"
                                      className="w-full pl-10 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                  />
                              </div>
                          </div>
                          <div className="flex-1 space-y-1">
                              <label className="text-[10px] font-bold text-gray-400 uppercase">Classificar como...</label>
                              <select 
                                  value={newRuleCategory}
                                  onChange={(e) => setNewRuleCategory(e.target.value)}
                                  className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                              >
                                  <option value="">Selecione uma categoria</option>
                                  {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                              </select>
                          </div>
                          <div className="flex items-end">
                              <button 
                                  onClick={handleAddRule}
                                  disabled={!newRuleKeyword || !newRuleCategory}
                                  className="w-full md:w-auto px-6 py-3 bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition flex items-center justify-center gap-2"
                              >
                                  <Plus size={18} /> Adicionar
                              </button>
                          </div>
                      </div>
                  </div>

                  <div className="space-y-3">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Regras Ativas ({userRules.length})</h4>
                      {userRules.length === 0 ? (
                          <div className="text-center py-10 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl">
                              <Brain size={32} className="mx-auto text-gray-300 mb-2" />
                              <p className="text-gray-400 text-sm">Nenhuma regra definida.</p>
                          </div>
                      ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {userRules.map((rule, idx) => (
                                  <div key={idx} className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl hover:shadow-md transition">
                                      <div>
                                          <p className="text-xs text-gray-400 mb-1">Contém: <strong className="text-gray-700 dark:text-gray-300">"{rule.keyword}"</strong></p>
                                          <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                                              <Zap size={12} fill="currentColor" /> {rule.category}
                                          </p>
                                      </div>
                                      <button 
                                          onClick={() => handleDeleteRule(idx)}
                                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                                      >
                                          <Trash2 size={16} />
                                      </button>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
              </div>
          )}
      </div>
    </div>
  );
};
