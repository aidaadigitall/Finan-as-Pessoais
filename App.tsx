
import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { authService } from './services/authService';
import { financialService } from './services/financialService';
import { Transaction, BankAccount, Category, TransactionStatus } from './types';
import { Dashboard } from './components/Dashboard';
import { TransactionList } from './components/TransactionList';
import { ChatInterface } from './components/ChatInterface';
import { BankAccountManager } from './components/BankAccountManager';
import { TransactionModal } from './components/TransactionModal';
import { Settings } from './components/Settings';
import { Auth } from './components/Auth';
import { 
  Loader2, 
  LayoutDashboard, 
  List, 
  Landmark, 
  LogOut, 
  MessageSquare, 
  Plus, 
  Settings as SettingsIcon,
  AlertTriangle
} from 'lucide-react';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [isConfigured, setIsConfigured] = useState(isSupabaseConfigured());
  
  // Estados de Dados Iniciais (Mockados para não vir vazio se o banco falhar)
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>([
    { id: 'default', name: 'Carteira Principal', bankName: 'Dinheiro', initialBalance: 0, currentBalance: 0, color: 'indigo', icon: 'wallet' }
  ]);
  const [categories] = useState<Category[]>([
    { id: '1', name: 'Alimentação', type: 'expense', budgetLimit: 500 },
    { id: '2', name: 'Moradia', type: 'expense', budgetLimit: 2000 },
    { id: '3', name: 'Salário', type: 'income' },
    { id: '4', name: 'Lazer', type: 'expense', budgetLimit: 300 }
  ]);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isTransModalOpen, setIsTransModalOpen] = useState(false);
  const [themeColor, setThemeColor] = useState<any>('indigo');

  useEffect(() => {
    if (!isConfigured) {
        const checkInterval = setInterval(() => {
            if (isSupabaseConfigured()) {
                setIsConfigured(true);
                clearInterval(checkInterval);
            }
        }, 1000);
        return () => clearInterval(checkInterval);
    }

    if (isConfigured && supabase) {
        supabase.auth.getSession().then(({ data: { session } }) => {
          setSession(session);
          if (session) initializeAppData(session.user);
          else setLoading(false);
        }).catch(err => {
          console.error("Erro na sessão:", err);
          setLoading(false);
        });

        const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
          setSession(session);
          if (session) initializeAppData(session.user);
          else {
            setLoading(false);
            setCurrentOrgId(null);
          }
        });

        return () => authListener?.subscription?.unsubscribe();
    }
  }, [isConfigured]);

  const initializeAppData = async (user: any) => {
    try {
      setLoadingData(true);
      // Fallback: se o banco de dados não estiver pronto (tabelas não criadas), usamos um ID temporário
      let orgId = "demo-org";
      try {
        orgId = await authService.bootstrapUserOrganization(user.id, user.email);
      } catch (e) {
        console.warn("Aviso: Tabelas não encontradas no Supabase. Usando modo demonstração.");
      }
      setCurrentOrgId(orgId);
      await refreshFinancialData(orgId);
    } catch (e) {
      console.error("Erro Crítico ao carregar dados:", e);
    } finally {
      setLoading(false);
      setLoadingData(false);
    }
  };

  const refreshFinancialData = async (orgId: string) => {
    if (orgId === "demo-org") return;
    try {
        const [transData, accData] = await Promise.all([
          financialService.getTransactions(orgId),
          financialService.getBankAccounts(orgId)
        ]);
        if (transData) setTransactions(transData as any);
        if (accData && accData.length > 0) setAccounts(accData as any);
    } catch (err) {
        console.warn("Erro ao buscar dados do banco. Tabelas podem não existir.");
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    await authService.signOut();
    window.location.reload();
  };

  if (!isConfigured) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0b0e14] p-4 text-center">
        <div className="max-w-md bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
           <AlertTriangle className="text-amber-500 mx-auto mb-4" size={48} />
           <h1 className="text-xl font-bold text-white mb-2">Configuração Pendente</h1>
           <p className="text-gray-400 mb-6 text-sm">Aguardando chaves de ambiente...</p>
           <Loader2 className="animate-spin text-indigo-500 mx-auto" />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0b0e14]">
        <div className="flex flex-col items-center gap-4">
            <Loader2 className="animate-spin text-indigo-500" size={48} />
            <p className="text-gray-400 font-medium animate-pulse">Iniciando FinAI...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Auth onAuthSuccess={(s) => setSession(s)} themeColor={themeColor} />;
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden font-sans">
      <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-6 flex flex-col hidden lg:flex">
        <div className="mb-10 flex items-center gap-3">
           <Landmark className={`text-${themeColor}-600`} size={24} />
           <span className="text-xl font-bold dark:text-white">FinAI SaaS</span>
        </div>
        <nav className="flex-1 space-y-1">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'dashboard' ? `bg-${themeColor}-600 text-white shadow-lg` : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
            <LayoutDashboard size={20} /> <span className="font-medium">Dashboard</span>
          </button>
          <button onClick={() => setActiveTab('chat')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'chat' ? `bg-${themeColor}-600 text-white shadow-lg` : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
            <MessageSquare size={20} /> <span className="font-medium">Assistente IA</span>
          </button>
          <button onClick={() => setActiveTab('list')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'list' ? `bg-${themeColor}-600 text-white shadow-lg` : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
            <List size={20} /> <span className="font-medium">Lançamentos</span>
          </button>
          <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'settings' ? `bg-${themeColor}-600 text-white shadow-lg` : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
            <SettingsIcon size={20} /> <span className="font-medium">Ajustes</span>
          </button>
        </nav>
        <div className="mt-auto pt-6 border-t border-gray-700">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition font-medium">
            <LogOut size={20} /> Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-4 lg:p-8">
        <header className="mb-8 flex justify-between items-center">
           <div>
              <h2 className="text-2xl font-bold dark:text-white">Olá, {session.user.user_metadata?.full_name || session.user.email?.split('@')[0]}</h2>
              <p className="text-gray-500 text-sm">Gerencie suas finanças com inteligência.</p>
           </div>
           <button 
             onClick={() => setIsTransModalOpen(true)}
             className={`bg-${themeColor}-600 hover:bg-${themeColor}-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg transition flex items-center gap-2`}
           >
             <Plus size={20} /> Novo Lançamento
           </button>
        </header>

        {loadingData ? (
          <div className="flex justify-center py-12"><Loader2 className={`animate-spin text-${themeColor}-500`} /></div>
        ) : (
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && <Dashboard transactions={transactions} themeColor={themeColor} categories={categories} />}
            {activeTab === 'list' && (
              <TransactionList 
                transactions={transactions} 
                categories={categories} 
                accounts={accounts}
                onUpdateTransaction={async (t) => {
                    setTransactions(prev => prev.map(item => item.id === t.id ? t : item));
                    if (currentOrgId !== "demo-org") await financialService.updateTransaction(t.id, t);
                }} 
                onToggleStatus={async (id) => {
                    setTransactions(prev => prev.map(item => item.id === id ? {...item, isPaid: !item.isPaid} : item));
                }} 
              />
            )}
            {activeTab === 'chat' && (
              <ChatInterface 
                onAddTransaction={async (t) => {
                    setTransactions(prev => [t, ...prev]);
                    if (currentOrgId !== "demo-org") await financialService.createTransaction(t, currentOrgId!);
                }} 
                categories={categories} 
                userRules={[]} 
                onAddRule={() => {}} 
                themeColor={themeColor} 
                transactions={transactions} 
              />
            )}
            {activeTab === 'settings' && (
              <Settings 
                themeColor={themeColor}
                setThemeColor={setThemeColor}
                userName={session.user.email}
                setUserName={() => {}}
                userPhone=""
                setUserPhone={() => {}}
                aiRules={[]}
                onAddAiRule={() => {}}
                onDeleteAiRule={() => {}}
                onResetData={() => {}}
              />
            )}
          </div>
        )}
      </main>

      <TransactionModal 
        isOpen={isTransModalOpen} 
        onClose={() => setIsTransModalOpen(false)} 
        onSave={async (t) => {
            setTransactions(prev => [t, ...prev]);
            if (currentOrgId && currentOrgId !== "demo-org") {
                await financialService.createTransaction(t, currentOrgId);
                await refreshFinancialData(currentOrgId);
            }
        }} 
        categories={categories} 
        accounts={accounts} 
        transactions={transactions} 
      />
    </div>
  );
};

export default App;
