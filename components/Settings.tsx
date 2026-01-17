import React, { useState } from 'react';
import { User, Building2, Users, Palette, Brain, CreditCard, Shield, Save, Plus, Trash2, Mail, Check, X, Upload, Smartphone, ArrowRight, Lightbulb } from 'lucide-react';
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

// Extensive Color Palette
const ALL_THEME_COLORS = [
    'slate', 'gray', 'zinc', 'neutral', 'stone',
    'red', 'orange', 'amber', 'yellow', 'lime',
    'green', 'emerald', 'teal', 'cyan', 'sky',
    'blue', 'indigo', 'violet', 'purple', 'fuchsia',
    'pink', 'rose'
];

// Mock Data Types for UI
interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  status: 'active' | 'pending';
  lastAccess?: string;
}

interface Organization {
  name: string;
  cnpj: string;
  domain: string;
  plan: 'free' | 'starter' | 'pro' | 'enterprise';
}

export const Settings: React.FC<SettingsProps> = ({
  themeColor,
  setThemeColor,
  userName,
  setUserName,
  userPhone,
  setUserPhone,
  aiRules,
  onAddAiRule,
  onDeleteAiRule,
  onResetData
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'organization' | 'team' | 'appearance' | 'ai' | 'billing'>('organization');

  // Local State for Mock Features
  const [org, setOrg] = useState<Organization>({
    name: 'Minha Empresa SaaS',
    cnpj: '00.000.000/0001-91',
    domain: 'minhaempresa.finai.com',
    plan: 'pro'
  });

  const [team, setTeam] = useState<TeamMember[]>([
    { id: '1', name: userName, email: 'admin@empresa.com', role: 'owner', status: 'active', lastAccess: 'Agora' },
    { id: '2', name: 'Financeiro', email: 'fin@empresa.com', role: 'editor', status: 'active', lastAccess: '2h atrás' },
    { id: '3', name: 'Auditor Externo', email: 'auditor@firma.com', role: 'viewer', status: 'pending' },
  ]);

  const [inviteEmail, setInviteEmail] = useState('');
  const [newRuleKeyword, setNewRuleKeyword] = useState('');
  const [newRuleCategory, setNewRuleCategory] = useState('');

  // --- Handlers ---

  const handleInviteUser = () => {
    if (!inviteEmail) return;
    const newMember: TeamMember = {
        id: Date.now().toString(),
        name: 'Convidado',
        email: inviteEmail,
        role: 'viewer',
        status: 'pending'
    };
    setTeam([...team, newMember]);
    setInviteEmail('');
  };

  const handleRemoveUser = (id: string) => {
    if (confirm('Remover este usuário da organização?')) {
        setTeam(team.filter(u => u.id !== id));
    }
  };

  const handleAddRule = () => {
      if (newRuleKeyword && newRuleCategory) {
          onAddAiRule({ keyword: newRuleKeyword, category: newRuleCategory });
          setNewRuleKeyword('');
          setNewRuleCategory('');
      }
  };

  const fillExampleRule = () => {
      setNewRuleKeyword('Posto Ipiranga');
      setNewRuleCategory('Combustível');
  };

  // --- Components ---

  const getThemeText = () => `text-${themeColor}-600`;
  const getThemeBg = () => `bg-${themeColor}-600`;

  const tabs = [
      { id: 'organization', label: 'Organização', icon: Building2 },
      { id: 'team', label: 'Usuários e Permissões', icon: Users },
      { id: 'profile', label: 'Meu Perfil', icon: User },
      { id: 'appearance', label: 'Personalização', icon: Palette },
      { id: 'ai', label: 'Regras da IA', icon: Brain },
      { id: 'billing', label: 'Planos e Fatura', icon: CreditCard },
  ];

  return (
    <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-140px)]">
      
      {/* Sidebar Navigation */}
      <div className="w-full md:w-64 shrink-0 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <h2 className="font-bold text-gray-700 dark:text-gray-200 text-sm uppercase tracking-wider">Configurações</h2>
          </div>
          <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
              {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                        activeTab === tab.id
                        ? `${getThemeBg()} text-white shadow-md`
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                    }`}
                  >
                      <tab.icon size={18} />
                      {tab.label}
                  </button>
              ))}
          </nav>
      </div>

      {/* Content Area */}
      <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-y-auto p-6 md:p-8 custom-scrollbar relative">
          
          {/* Organization Tab */}
          {activeTab === 'organization' && (
              <div className="space-y-8 animate-in fade-in">
                  <div>
                      <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">Dados da Organização</h3>
                      <p className="text-gray-500 text-sm">Gerencie a identidade da sua empresa no sistema.</p>
                  </div>

                  <div className="flex items-center gap-6">
                      <div className="w-24 h-24 rounded-2xl bg-gray-100 dark:bg-gray-700 border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 transition">
                          <Upload size={24} />
                          <span className="text-[10px] mt-2">Upload Logo</span>
                      </div>
                      <div className="flex-1 space-y-4">
                          <div>
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Nome da Empresa</label>
                              <input type="text" value={org.name} onChange={e => setOrg({...org, name: e.target.value})} className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">CNPJ</label>
                                  <input type="text" value={org.cnpj} onChange={e => setOrg({...org, cnpj: e.target.value})} className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
                              </div>
                              <div>
                                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Domínio Personalizado</label>
                                  <div className="flex">
                                      <input type="text" value={org.domain.split('.')[0]} readOnly className="flex-1 p-2.5 rounded-l-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-500 outline-none" />
                                      <span className="p-2.5 bg-gray-100 dark:bg-gray-700 border border-l-0 border-gray-200 dark:border-gray-600 rounded-r-lg text-gray-500 text-sm flex items-center">.finai.com</span>
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
                  
                  <div className="pt-6 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                      <button className={`px-6 py-2.5 ${getThemeBg()} text-white rounded-lg hover:opacity-90 transition flex items-center gap-2 font-medium`}>
                          <Save size={18} /> Salvar Alterações
                      </button>
                  </div>
              </div>
          )}

          {/* Team Tab */}
          {activeTab === 'team' && (
              <div className="space-y-8 animate-in fade-in">
                  <div className="flex justify-between items-start">
                      <div>
                          <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">Equipe e Permissões</h3>
                          <p className="text-gray-500 text-sm">Gerencie quem tem acesso ao sistema financeiro.</p>
                      </div>
                      <div className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-full text-xs font-bold border border-indigo-100 dark:border-indigo-800">
                          {team.length} / 5 Usuários (Plano Pro)
                      </div>
                  </div>

                  {/* Invite Box */}
                  <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700 flex gap-3 items-end">
                      <div className="flex-1">
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Convidar por E-mail</label>
                          <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                              <input 
                                  type="email" 
                                  value={inviteEmail}
                                  onChange={e => setInviteEmail(e.target.value)}
                                  placeholder="colega@empresa.com" 
                                  className="w-full pl-9 p-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" 
                              />
                          </div>
                      </div>
                      <button 
                          onClick={handleInviteUser}
                          disabled={!inviteEmail}
                          className={`px-4 py-2.5 ${getThemeBg()} text-white rounded-lg hover:opacity-90 transition flex items-center gap-2 font-medium disabled:opacity-50 h-[42px]`}
                      >
                          <Plus size={18} /> Convidar
                      </button>
                  </div>

                  {/* Users List */}
                  <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                      <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
                          <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase font-semibold text-gray-500 dark:text-gray-400">
                              <tr>
                                  <th className="px-6 py-4">Usuário</th>
                                  <th className="px-6 py-4">Cargo</th>
                                  <th className="px-6 py-4">Status</th>
                                  <th className="px-6 py-4 text-right">Ações</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800">
                              {team.map(member => (
                                  <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                                      <td className="px-6 py-4">
                                          <div className="flex items-center gap-3">
                                              <div className={`w-8 h-8 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center font-bold text-gray-600 dark:text-gray-300 text-xs`}>
                                                  {member.name.substring(0,2).toUpperCase()}
                                              </div>
                                              <div>
                                                  <p className="font-medium text-gray-900 dark:text-white">{member.name}</p>
                                                  <p className="text-xs text-gray-500">{member.email}</p>
                                              </div>
                                          </div>
                                      </td>
                                      <td className="px-6 py-4">
                                          <select 
                                              defaultValue={member.role}
                                              className="bg-transparent border-none text-sm font-medium focus:ring-0 cursor-pointer"
                                              disabled={member.role === 'owner'}
                                          >
                                              <option value="owner">Dono</option>
                                              <option value="admin">Administrador</option>
                                              <option value="editor">Editor</option>
                                              <option value="viewer">Visualizador</option>
                                          </select>
                                      </td>
                                      <td className="px-6 py-4">
                                          {member.status === 'active' ? (
                                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                                  <Check size={12} /> Ativo
                                              </span>
                                          ) : (
                                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                                                  Pendente
                                              </span>
                                          )}
                                      </td>
                                      <td className="px-6 py-4 text-right">
                                          {member.role !== 'owner' && (
                                              <button onClick={() => handleRemoveUser(member.id)} className="text-gray-400 hover:text-red-500 transition">
                                                  <Trash2 size={16} />
                                              </button>
                                          )}
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
              <div className="space-y-8 animate-in fade-in">
                   <div>
                      <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">Seu Perfil</h3>
                      <p className="text-gray-500 text-sm">Informações pessoais e de contato.</p>
                  </div>
                  <div className="max-w-md space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Nome Completo</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} className="w-full pl-10 p-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Telefone (WhatsApp)</label>
                            <div className="relative">
                                <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input type="text" value={userPhone} onChange={(e) => setUserPhone(e.target.value)} className="w-full pl-10 p-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                            </div>
                        </div>
                        
                        <div className="pt-4">
                            <h4 className="font-bold text-sm text-gray-700 dark:text-gray-300 mb-2">Segurança</h4>
                            <button className="w-full border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center justify-center gap-2">
                                <Shield size={16} /> Alterar Senha
                            </button>
                        </div>
                  </div>
              </div>
          )}

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
              <div className="space-y-8 animate-in fade-in">
                  <div>
                      <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">Personalização</h3>
                      <p className="text-gray-500 text-sm">Defina a aparência do sistema para sua equipe.</p>
                  </div>

                  <div>
                       <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Cor de Destaque (Branding)</label>
                       <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                          {ALL_THEME_COLORS.map((c) => (
                              <button 
                                key={c} 
                                onClick={() => setThemeColor(c as ThemeColor)} 
                                className={`
                                    h-12 w-full rounded-full bg-${c}-600 flex items-center justify-center text-white transition-all shadow-sm
                                    ${themeColor === c ? 'ring-4 ring-offset-2 ring-gray-300 dark:ring-gray-600 scale-110 shadow-lg' : 'hover:scale-105 opacity-80 hover:opacity-100'}
                                `}
                                title={c.charAt(0).toUpperCase() + c.slice(1)}
                              >
                                  {themeColor === c && <Check size={18} />}
                              </button>
                          ))}
                       </div>
                  </div>
              </div>
          )}

          {/* AI Rules Tab (Improved Dynamic Layout) */}
          {activeTab === 'ai' && (
              <div className="space-y-8 animate-in fade-in">
                  <div>
                      <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">Inteligência Artificial</h3>
                      <p className="text-gray-500 text-sm">Ensine a IA a categorizar seus lançamentos automaticamente.</p>
                  </div>

                  <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                      <div className="flex justify-between items-center mb-4">
                          <h4 className="font-bold text-gray-800 dark:text-white flex items-center gap-2 text-sm uppercase tracking-wider">
                              <Plus size={16} className={`text-${themeColor}-600`} /> Adicionar Nova Regra
                          </h4>
                          <button 
                              onClick={fillExampleRule}
                              className={`text-xs flex items-center gap-1 text-${themeColor}-600 hover:text-${themeColor}-700 hover:underline transition font-medium`}
                          >
                              <Lightbulb size={14} /> Exemplo Prático
                          </button>
                      </div>
                      <div className="flex flex-col md:flex-row gap-4 items-center bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl">
                          <div className="flex-1 w-full">
                              <span className="text-xs font-bold text-gray-500 mb-1 block uppercase">SE a descrição conter:</span>
                              <input type="text" value={newRuleKeyword} onChange={e => setNewRuleKeyword(e.target.value)} placeholder="Ex: 'Uber', 'Netflix'" className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 font-medium" />
                          </div>
                          <ArrowRight size={24} className="text-gray-300 hidden md:block" />
                          <div className="flex-1 w-full">
                              <span className="text-xs font-bold text-gray-500 mb-1 block uppercase">ENTÃO classifique como:</span>
                              <input type="text" value={newRuleCategory} onChange={e => setNewRuleCategory(e.target.value)} placeholder="Ex: 'Transporte', 'Lazer'" className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 font-medium" />
                          </div>
                          <button onClick={handleAddRule} disabled={!newRuleKeyword || !newRuleCategory} className={`w-full md:w-auto px-6 py-3 ${getThemeBg()} text-white rounded-lg hover:opacity-90 disabled:opacity-50 mt-4 md:mt-auto font-bold shadow-md transition-transform active:scale-95`}>
                              Salvar Regra
                          </button>
                      </div>
                  </div>

                  <div className="space-y-3">
                      <h4 className="font-bold text-gray-700 dark:text-gray-300 text-sm">Regras Ativas ({aiRules.length})</h4>
                      {aiRules.length === 0 ? (
                          <div className="text-center py-10 bg-gray-50 dark:bg-gray-900/30 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                              <Brain size={48} className="text-gray-300 mx-auto mb-3" />
                              <p className="text-gray-500">Nenhuma regra aprendida ainda.</p>
                          </div>
                      ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {aiRules.map((r, i) => (
                                <div key={i} className="flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 bg-${themeColor}-50 dark:bg-${themeColor}-900/20 rounded-lg text-${themeColor}-600`}>
                                            <Brain size={16} />
                                        </div>
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className="font-bold text-gray-800 dark:text-white">"{r.keyword}"</span>
                                                <ArrowRight size={14} className="text-gray-400" />
                                                <span className={`px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-xs font-medium text-gray-600 dark:text-gray-300`}>{r.category}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={() => onDeleteAiRule(i)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"><Trash2 size={16} /></button>
                                </div>
                            ))}
                          </div>
                      )}
                  </div>

                  <div className="pt-6 border-t border-gray-100 dark:border-gray-700">
                      <h4 className="font-bold text-red-600 mb-2 flex items-center gap-2"><Shield size={16}/> Zona de Perigo</h4>
                      <p className="text-xs text-gray-500 mb-3">Ações irreversíveis que afetam toda a organização.</p>
                      <button onClick={onResetData} className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 text-sm font-medium">
                          Resetar Todos os Dados
                      </button>
                  </div>
              </div>
          )}

          {/* Billing Tab */}
          {activeTab === 'billing' && (
               <div className="space-y-8 animate-in fade-in">
                   <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-2xl p-8 relative overflow-hidden shadow-xl">
                       <div className="relative z-10">
                           <div className="flex justify-between items-start">
                               <div>
                                   <p className="text-gray-400 text-sm uppercase tracking-widest font-semibold mb-1">Plano Atual</p>
                                   <h3 className="text-4xl font-bold">Pro Plan</h3>
                                   <p className="text-gray-300 mt-2">Renova em 12/12/2025</p>
                               </div>
                               <span className="bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-sm font-bold border border-white/10">
                                   Ativo
                               </span>
                           </div>
                           <div className="mt-8 flex gap-4">
                               <button className="bg-white text-gray-900 px-6 py-2.5 rounded-lg font-bold hover:bg-gray-100 transition">Gerenciar Assinatura</button>
                               <button className="text-white hover:text-gray-200 px-4 py-2.5 font-medium">Ver Faturas</button>
                           </div>
                       </div>
                       <CreditCard className="absolute right-[-20px] bottom-[-40px] opacity-10" size={240} />
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                       <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 opacity-60">
                           <h4 className="font-bold text-gray-800 dark:text-white">Starter</h4>
                           <p className="text-2xl font-bold mt-2">R$ 0<span className="text-sm font-normal text-gray-500">/mês</span></p>
                           <ul className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                               <li>• 1 Usuário</li>
                               <li>• 50 Lançamentos/mês</li>
                               <li>• Sem IA</li>
                           </ul>
                       </div>
                       <div className={`p-6 rounded-xl border-2 border-${themeColor}-500 bg-white dark:bg-gray-800 relative shadow-lg`}>
                           <div className={`absolute top-0 right-0 bg-${themeColor}-500 text-white text-xs px-2 py-1 rounded-bl-lg font-bold`}>SEU PLANO</div>
                           <h4 className="font-bold text-gray-800 dark:text-white">Pro</h4>
                           <p className="text-2xl font-bold mt-2">R$ 49<span className="text-sm font-normal text-gray-500">/mês</span></p>
                           <ul className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                               <li>• 5 Usuários</li>
                               <li>• Lançamentos Ilimitados</li>
                               <li>• IA Gemini Avançada</li>
                               <li>• Integração WhatsApp</li>
                           </ul>
                       </div>
                       <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                           <h4 className="font-bold text-gray-800 dark:text-white">Enterprise</h4>
                           <p className="text-2xl font-bold mt-2">Sob Consulta</p>
                           <ul className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                               <li>• Usuários Ilimitados</li>
                               <li>• API Dedicada</li>
                               <li>• Suporte Prioritário</li>
                               <li>• SSO / SAML</li>
                           </ul>
                           <button className={`w-full mt-6 py-2 rounded-lg border border-${themeColor}-600 text-${themeColor}-600 font-medium hover:bg-${themeColor}-50`}>Falar com Vendas</button>
                       </div>
                   </div>
               </div>
          )}

      </div>
    </div>
  );
};