
import React, { useState, useEffect, useCallback } from 'react';
import { supabase, supabaseHealthCheck, isConfigured } from './lib/supabase';
import { authService } from './services/authService';
import { financialService } from './services/financialService';

import { ExecutiveDashboard } from './components/ExecutiveDashboard';
import { Dashboard } from './components/Dashboard';
import { TransactionList } from './components/TransactionList';
import { TransactionModal } from './components/TransactionModal';
import { BankAccountManager } from './components/BankAccountManager';
import { CategoryManager } from './components/CategoryManager';
import { CreditCardManager } from './components/CreditCardManager';
import { ChatInterface } from './components/ChatInterface';
import { Auth } from './components/Auth';

import { 
  LayoutDashboard, List, Landmark, LogOut, Plus, 
  CreditCard, Tag, MessageSquare, Menu, Loader2, AlertTriangle, RefreshCw, Briefcase
} from 'lucide-react';
import { Transaction, BankAccount, Category, ThemeColor } from './types';

type AppState = 'BOOTING' | 'AUTH_REQUIRED' | 'LOADING_DATA' | 'READY' | 'CRITICAL_ERROR';
type View = 'executive' | 'dashboard' | 'transactions' | 'accounts' | 'cards' | 'categories' | 'chat';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('BOOTING');
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<View>('executive');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadData = useCallback(async (id: string) => {
    try {
      const [t, a, c] = await Promise.all([
        financialService.getTransactions(id),
        financialService.getBankAccounts(id),
        financialService.getCategories(id)
      ]);
      setTransactions(t);
      setAccounts(a);
      setCategories(c);
      setAppState('READY');
    } catch (e: any) {
      setErrorDetails(e.message);
      setAppState('CRITICAL_ERROR');
    }
  }, []);

  const initialize = useCallback(async () => {
    if (!isConfigured) {
      setAppState('CRITICAL_ERROR');
      setErrorDetails("Configuração do Supabase pendente.");
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setAppState('AUTH_REQUIRED');
      return;
    }

    setAppState('LOADING_DATA');
    try {
      const id = await authService.ensureUserResources(session.user.id, session.user.email!);
      setOrgId(id);
      await loadData(id);
    } catch (e: any) {
      setAppState('CRITICAL_ERROR');
      setErrorDetails(e.message);
    }
  }, [loadData]);

  useEffect(() => {
    initialize();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) initialize();
      if (event === 'SIGNED_OUT') setAppState('AUTH_REQUIRED');
    });
    return () => subscription.unsubscribe();
  }, [initialize]);

  // Funções de Ação com Persistência Real
  const handleAddAccount = async (acc: BankAccount) => {
    if (!orgId) return;
    try {
      await financialService.createBankAccount(acc, orgId);
      await loadData(orgId);
    } catch (e: any) { alert("Erro ao criar conta: " + e.message); }
  };

  const handleSaveTransaction = async (t: Transaction) => {
    if (!orgId) return;
    try {
      await financialService.createTransaction(t, orgId);
      await loadData(orgId);
    } catch (e: any) { alert("Erro ao salvar: " + e.message); }
  };

  const handleAddCategory = async (cat: Category) => {
    if (!orgId) return;
    try {
      await financialService.createCategory(cat, orgId);
      await loadData(orgId);
    } catch (e: any) { alert("Erro ao criar categoria: " + e.message); }
  };

  if (appState === 'BOOTING' || appState === 'LOADING_DATA') return <Loading message="Sincronizando com a nuvem..." />;
  if (appState === 'CRITICAL_ERROR') return <ErrorScreen error={errorDetails} onRetry={initialize} />;
  if (appState === 'AUTH_REQUIRED') return <Auth onAuthSuccess={initialize} themeColor="indigo" />;

  const handleLogout = async () => {
    await authService.signOut();
  };

  const NavItem = ({ icon: Icon, label, view }: any) => (
    <button 
      onClick={() => { setCurrentView(view); if (window.innerWidth < 1024) setIsSidebarOpen(false); }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${currentView === view ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
    >
      <Icon size={18} /> <span className="text-sm">{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#0b0e14] overflow-hidden">
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-[#151a21] border-r border-gray-100 dark:border-gray-800 p-6 flex flex-col transition-transform lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="mb-10 flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-xl"><LayoutDashboard size={24}/></div>
          <span className="font-black text-xl tracking-tight dark:text-white">FinAI <span className="text-[10px] bg-indigo-500 text-white px-2 py-0.5 rounded ml-1">PRO</span></span>
        </div>
        <nav className="flex-1 space-y-1">
          <NavItem icon={Briefcase} label="Cockpit Executivo" view="executive" />
          <NavItem icon={LayoutDashboard} label="Análise Operacional" view="dashboard" />
          <NavItem icon={List} label="Movimentações" view="transactions" />
          <NavItem icon={Landmark} label="Minhas Contas" view="accounts" />
          <NavItem icon={CreditCard} label="Cartões de Crédito" view="cards" />
          <NavItem icon={Tag} label="Categorias" view="categories" />
          <div className="my-6 border-t border-gray-100 dark:border-gray-800 opacity-30"></div>
          <NavItem icon={MessageSquare} label="Assistente IA" view="chat" />
        </nav>
        <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 text-red-500 font-bold hover:bg-red-50 rounded-xl transition-all"><LogOut size={18} /> Encerrar Sessão</button>
      </aside>

      <main className="flex-1 overflow-y-auto bg-[#f8fafc] dark:bg-[#0b0e14]">
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-[#151a21]/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex justify-between items-center">
          <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-gray-500"><Menu size={22} /></button>
          <div className="flex-1 px-4"><span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"/> Produção Online</span></div>
          <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-black shadow-xl flex items-center gap-2 transition-all active:scale-95">
            <Plus size={20}/> Novo Lançamento
          </button>
        </header>

        <div className="p-6 lg:p-10 max-w-7xl mx-auto">
          {currentView === 'executive' && <ExecutiveDashboard orgId={orgId || ''} themeColor="indigo" />}
          {currentView === 'dashboard' && <Dashboard transactions={transactions} themeColor="indigo" categories={categories} />}
          {currentView === 'transactions' && <TransactionList transactions={transactions} categories={categories} accounts={accounts} onUpdateTransaction={()=>{}} onToggleStatus={()=>{}} />}
          {currentView === 'accounts' && <BankAccountManager accounts={accounts} transactions={transactions} onAddAccount={handleAddAccount} onUpdateAccount={()=>{}} onDeleteAccount={()=>{}} />}
          {currentView === 'categories' && <CategoryManager categories={categories} onAddCategory={handleAddCategory} onUpdateCategory={()=>{}} onDeleteCategory={()=>{}} />}
          {currentView === 'chat' && <ChatInterface onAddTransaction={handleSaveTransaction} categories={categories} userRules={[]} onAddRule={()=>{}} themeColor="indigo" transactions={transactions} />}
        </div>
      </main>
      <TransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveTransaction} categories={categories} accounts={accounts} cards={[]} />
    </div>
  );
};

const Loading = ({ message }: any) => (
  <div className="h-screen flex flex-col items-center justify-center bg-[#0b0e14] text-white">
    <Loader2 size={48} className="text-indigo-500 animate-spin mb-4" />
    <p className="text-[10px] font-black tracking-widest uppercase text-gray-500">{message}</p>
  </div>
);

const ErrorScreen = ({ error, onRetry }: any) => (
  <div className="h-screen flex items-center justify-center bg-[#0b0e14] p-6">
    <div className="max-w-md w-full bg-[#151a21] rounded-[2.5rem] p-10 border border-red-500/30 text-center">
      <div className="w-20 h-20 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500 shadow-2xl shadow-red-500/20">
        <AlertTriangle size={40} />
      </div>
      <h2 className="text-2xl font-black text-white mb-2">Erro Crítico</h2>
      <p className="text-sm text-gray-400 mb-8 leading-relaxed">{error || "Falha na comunicação com o servidor."}</p>
      <button onClick={onRetry} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black shadow-xl flex items-center justify-center gap-3 transition-all"><RefreshCw size={20} /> Tentar Novamente</button>
    </div>
  </div>
);

export default App;
