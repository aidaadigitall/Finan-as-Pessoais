
import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { authService } from './services/authService';
import { financialService } from './services/financialService';
import { Transaction, BankAccount, Category } from './types';
import { Dashboard } from './components/Dashboard';
import { TransactionList } from './components/TransactionList';
import { ChatInterface } from './components/ChatInterface';
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
  Settings as SettingsIcon
} from 'lucide-react';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
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
    const init = async () => {
      try {
        if (isSupabaseConfigured() && supabase) {
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          if (currentSession) {
            setSession(currentSession);
            try {
              const orgId = await authService.bootstrapUserOrganization(currentSession.user.id, currentSession.user.email);
              const [transData, accData] = await Promise.all([
                financialService.getTransactions(orgId),
                financialService.getBankAccounts(orgId)
              ]);
              if (transData) setTransactions(transData);
              if (accData) setAccounts(accData);
            } catch (e) {
              console.error("Erro ao carregar dados organizacionais.");
            }
          }
        }
      } catch (err) {
        console.error("Erro na inicialização do App.");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const handleLogout = async () => {
    if (supabase) await authService.signOut();
    setSession(null);
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0b0e14]">
        <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center animate-bounce shadow-2xl shadow-indigo-500/20">
                <Landmark className="text-white" size={32} />
            </div>
            <p className="text-gray-400 font-medium animate-pulse">Sincronizando com Supabase...</p>
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
           <div className={`p-2 bg-${themeColor}-600 rounded-lg text-white`}>
             <Landmark size={20} />
           </div>
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
        <div className="mt-auto pt-6 border-t border-gray-100 dark:border-gray-700">
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

        <div className="max-w-7xl mx-auto">
          {activeTab === 'dashboard' && <Dashboard transactions={transactions} themeColor={themeColor} categories={categories} />}
          {activeTab === 'list' && (
            <TransactionList 
              transactions={transactions} 
              categories={categories} 
              accounts={accounts}
              onUpdateTransaction={(t) => setTransactions(prev => prev.map(item => item.id === t.id ? t : item))} 
              onToggleStatus={(id) => setTransactions(prev => prev.map(item => item.id === id ? {...item, isPaid: !item.isPaid} : item))} 
            />
          )}
          {activeTab === 'chat' && (
            <ChatInterface 
              onAddTransaction={(t) => setTransactions(prev => [t, ...prev])} 
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
              onResetData={() => setTransactions([])}
            />
          )}
        </div>
      </main>

      <TransactionModal 
        isOpen={isTransModalOpen} 
        onClose={() => setIsTransModalOpen(false)} 
        onSave={(t) => setTransactions(prev => [t, ...prev])} 
        categories={categories} 
        accounts={accounts} 
        transactions={transactions} 
      />
    </div>
  );
};

export default App;
