
import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { authService } from './services/authService';
import { financialService } from './services/financialService';
import { Transaction, BankAccount, ThemeColor, Category, TransactionStatus, AIRule } from './types';
import { Dashboard } from './components/Dashboard';
import { TransactionList } from './components/TransactionList';
import { ChatInterface } from './components/ChatInterface';
import { BankAccountManager } from './components/BankAccountManager';
import { CategoryManager } from './components/CategoryManager';
import { TransactionModal } from './components/TransactionModal';
import { Loader2, LayoutDashboard, List, Landmark, LogOut, MessageSquare, Tag, Plus, Settings as SettingsIcon } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [org, setOrg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [categories, setCategories] = useState<Category[]>([
    { id: '1', name: 'Alimentação', type: 'expense', budgetLimit: 500 },
    { id: '2', name: 'Moradia', type: 'expense', budgetLimit: 2000 },
    { id: '3', name: 'Salário', type: 'income' },
    { id: '4', name: 'Lazer', type: 'expense', budgetLimit: 300 }
  ]);
  const [aiRules, setAiRules] = useState<AIRule[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isTransModalOpen, setIsTransModalOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) loadOrgData(session.user.id);
      else setLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) loadOrgData(session.user.id);
      else setLoading(false);
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  const loadOrgData = async (userId: string) => {
    try {
      const { data: members } = await supabase
        .from('organization_members')
        .select('organization_id, organizations(*)')
        .eq('user_id', userId)
        .limit(1);

      if (members && members.length > 0) {
        const organization = members[0].organizations;
        setOrg(organization);
        
        const [transData, accData] = await Promise.all([
          financialService.getTransactions(organization.id),
          financialService.getBankAccounts(organization.id)
        ]);
        
        setTransactions(transData as any || []);
        setAccounts(accData as any || []);
      }
    } catch (e) {
      console.error("Erro ao carregar dados:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async (newTransaction: Transaction) => {
    setTransactions(prev => [newTransaction, ...prev]);
    // Em um sistema real, aqui persistiríamos no Supabase via financialService
  };

  const handleUpdateTransaction = (updated: Transaction) => {
    setTransactions(prev => prev.map(t => t.id === updated.id ? updated : t));
  };

  const handleToggleStatus = (id: string) => {
    setTransactions(prev => prev.map(t => 
      t.id === id ? { ...t, isPaid: !t.isPaid } : t
    ));
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <Loader2 className="animate-spin text-indigo-500 mx-auto mb-4" size={48} />
          <p className="text-gray-400">Carregando seu ecossistema financeiro...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0f172a] p-4">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-700">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl mx-auto mb-6 flex items-center justify-center text-white shadow-lg">
            <Landmark size={32} />
          </div>
          <h1 className="text-2xl font-bold mb-2 text-center text-gray-900 dark:text-white">FinAI SaaS</h1>
          <p className="text-gray-500 text-center mb-8">Gestão Inteligente Multi-empresa</p>
          <button 
            onClick={() => authService.signIn('demo@finai.com', 'password123')}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition shadow-md active:scale-[0.98]"
          >
            Acessar com Conta Demo
          </button>
          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700 text-center">
             <p className="text-xs text-gray-400">Powered by Gemini AI & Supabase</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-6 flex flex-col hidden lg:flex">
        <div className="mb-10 flex items-center gap-3">
           <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-indigo-200 shadow-lg">
              <Landmark size={20} />
           </div>
           <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">FinAI</span>
        </div>
        
        <nav className="flex-1 space-y-1">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 dark:shadow-none' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
            <LayoutDashboard size={20} /> <span className="font-medium">Dashboard</span>
          </button>
          <button onClick={() => setActiveTab('chat')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'chat' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 dark:shadow-none' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
            <MessageSquare size={20} /> <span className="font-medium">Assistente IA</span>
          </button>
          <button onClick={() => setActiveTab('list')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'list' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 dark:shadow-none' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
            <List size={20} /> <span className="font-medium">Lançamentos</span>
          </button>
          <button onClick={() => setActiveTab('accounts')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'accounts' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 dark:shadow-none' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
            <Landmark size={20} /> <span className="font-medium">Contas e Cartões</span>
          </button>
          <button onClick={() => setActiveTab('categories')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'categories' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 dark:shadow-none' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
            <Tag size={20} /> <span className="font-medium">Categorias</span>
          </button>
        </nav>

        <div className="mt-auto pt-6 border-t border-gray-100 dark:border-gray-700">
          <button onClick={() => authService.signOut()} className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors font-medium">
            <LogOut size={20} /> Sair do Sistema
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 lg:p-8 bg-gray-50 dark:bg-gray-900">
        <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
           <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Olá, {user.email?.split('@')[0]}</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Organização: <span className="font-semibold text-indigo-600">{org?.name || 'Carregando...'}</span></p>
           </div>
           <button 
             onClick={() => setIsTransModalOpen(true)}
             className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-100 dark:shadow-none transition flex items-center gap-2 active:scale-95"
           >
             <Plus size={20} /> Novo Lançamento
           </button>
        </header>

        {activeTab === 'dashboard' && <Dashboard transactions={transactions} themeColor="indigo" categories={categories} />}
        {activeTab === 'chat' && (
          <ChatInterface 
            onAddTransaction={handleAddTransaction} 
            categories={categories} 
            userRules={aiRules} 
            onAddRule={(r) => setAiRules(p => [...p, r])} 
            themeColor="indigo" 
            transactions={transactions} 
          />
        )}
        {activeTab === 'list' && (
          <TransactionList 
            transactions={transactions} 
            categories={categories} 
            accounts={accounts} 
            onUpdateTransaction={handleUpdateTransaction} 
            onToggleStatus={handleToggleStatus} 
          />
        )}
        {activeTab === 'accounts' && (
          <BankAccountManager 
            accounts={accounts} 
            transactions={transactions} 
            onAddAccount={(a) => setAccounts(p => [...p, a])} 
            onUpdateAccount={(a) => setAccounts(p => p.map(acc => acc.id === a.id ? a : acc))} 
            onDeleteAccount={(id) => setAccounts(p => p.filter(acc => acc.id !== id))} 
          />
        )}
        {activeTab === 'categories' && (
          <CategoryManager 
            categories={categories} 
            onAddCategory={(c) => setCategories(p => [...p, c])} 
            onUpdateCategory={(c) => setCategories(p => p.map(cat => cat.id === c.id ? c : cat))} 
            onDeleteCategory={(id) => setCategories(p => p.filter(cat => cat.id !== id))} 
          />
        )}
      </main>

      {/* Transaction Modal */}
      <TransactionModal 
        isOpen={isTransModalOpen} 
        onClose={() => setIsTransModalOpen(false)} 
        onSave={handleAddTransaction} 
        categories={categories} 
        accounts={accounts} 
        transactions={transactions} 
      />
    </div>
  );
};

export default App;
