
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase, testSupabaseConnection, isConfigured } from './lib/supabase';
import { authService } from './services/authService';
import { financialService } from './services/financialService';
import { bankAccountsService } from './services/bankAccountsService';
import { transactionsService } from './services/transactionsService';
import { offlineService } from './services/offlineService';
import { ledgerService } from './services/ledgerService';
import { financialEngine } from './services/financialEngine';

import { ConnectionGuard } from './components/ConnectionGuard';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { TransactionList } from './components/TransactionList';
import { TransactionModal } from './components/TransactionModal';
import { BankAccountManager } from './components/BankAccountManager';
import { CategoryManager } from './components/CategoryManager';
import { CreditCardManager } from './components/CreditCardManager';
import { ChatInterface } from './components/ChatInterface';
import { Settings } from './components/Settings';

import { 
  LayoutDashboard, 
  List, 
  Landmark, 
  LogOut, 
  Plus, 
  CreditCard, 
  Tag, 
  MessageSquare, 
  Settings as SettingsIcon,
  PieChart,
  Menu,
  X,
  Sparkles,
  Heart
} from 'lucide-react';
import { Transaction, BankAccount, Category, CreditCard as CreditCardType, ThemeColor, AIRule } from './types';

type AppState = 'BOOTING' | 'READY' | 'OFFLINE_ERROR';
type View = 'dashboard' | 'transactions' | 'accounts' | 'cards' | 'categories' | 'chat' | 'settings';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('BOOTING');
  const [session, setSession] = useState<any>(null);
  const [isDemoMode, setIsDemoMode] = useState(() => !isConfigured || offlineService.get('demo_mode', false));
  const [orgId, setOrgId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<View>(() => offlineService.get('last_view', 'dashboard'));
  const [themeColor, setThemeColor] = useState<ThemeColor>(() => offlineService.get('theme_color', 'indigo'));
  const [userName, setUserName] = useState(() => offlineService.get('user_name', 'Amigo(a)'));
  const [userPhone, setUserPhone] = useState(() => offlineService.get('user_phone', ''));
  const [aiRules, setAiRules] = useState<AIRule[]>(() => offlineService.get('ai_rules', []));
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [transactions, setTransactions] = useState<Transaction[]>(() => offlineService.get('transactions', []));
  const [accounts, setAccounts] = useState<BankAccount[]>(() => offlineService.get('accounts', []));
  const [categories, setCategories] = useState<Category[]>(() => offlineService.get('categories', [
    { id: '1', name: 'Alimentação', type: 'expense' },
    { id: '2', name: 'Moradia', type: 'expense' },
    { id: '3', name: 'Salário', type: 'income' },
    { id: '4', name: 'Lazer', type: 'expense' }
  ]));
  const [cards, setCards] = useState<CreditCardType[]>(() => offlineService.get('cards', []));
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    offlineService.save('transactions', transactions);
    offlineService.save('accounts', accounts);
    offlineService.save('categories', categories);
    offlineService.save('cards', cards);
    offlineService.save('last_view', currentView);
    offlineService.save('theme_color', themeColor);
  }, [transactions, accounts, categories, cards, currentView, themeColor]);

  const fetchData = useCallback(async (id: string) => {
    try {
      const [t, a] = await Promise.all([
        financialService.getTransactions(id),
        financialService.getBankAccounts(id)
      ]);
      if (t.length > 0) setTransactions(t);
      if (a.length > 0) setAccounts(a);
    } catch (e) {
      console.warn('[Ledger] Usando cache local');
    }
  }, []);

  const initialize = useCallback(async (retry = false) => {
    setAppState('BOOTING');
    if (!isConfigured) { setIsDemoMode(true); setAppState('READY'); return; }
    const online = await testSupabaseConnection(3000);
    if (!online && !isDemoMode && !retry) { setAppState('OFFLINE_ERROR'); return; }

    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
      if (currentSession) {
        const id = await authService.ensureUserResources(currentSession.user.id, currentSession.user.email!);
        setOrgId(id);
        await fetchData(id);
        if (currentSession.user.email) setUserName(currentSession.user.email.split('@')[0]);
      }
      setAppState('READY');
    } catch (e) {
      setIsDemoMode(true);
      setAppState('READY');
    }
  }, [isDemoMode, fetchData]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const handleAddTransaction = async (t: Transaction) => {
    const newList = await ledgerService.performTransaction(t, orgId, transactions);
    setTransactions(newList);
  };

  const handleUpdateTransaction = (t: Transaction) => {
    const newList = transactions.map(item => item.id === t.id ? t : item);
    setTransactions(newList);
  }

  const handleToggleStatus = async (id: string) => {
    const updated = transactions.map(t => t.id === id ? { ...t, isPaid: !t.isPaid } : t);
    setTransactions(updated);
    if (orgId) await transactionsService.updateStatus(id, updated.find(x => x.id === id)!.isPaid);
  };

  const accountBalances = useMemo(() => financialEngine.computeAllBalances(accounts, transactions), [accounts, transactions]);

  const accountsWithComputedBalances = useMemo(() => 
    accounts.map(acc => ({ ...acc, currentBalance: accountBalances[acc.id] || 0 })),
    [accounts, accountBalances]
  );

  const handleLogout = async () => {
    if (isConfigured) await authService.signOut();
    setSession(null);
    setOrgId(null);
    window.location.reload();
  };

  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return 'Bom dia';
    if (hours < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  if (appState === 'BOOTING') return <LoadingScreen />;
  if (!session && !isDemoMode) return <Auth onAuthSuccess={(s) => setSession(s)} themeColor={themeColor} />;

  const NavItem = ({ icon: Icon, label, view }: { icon: any, label: string, view: View }) => (
    <button 
      onClick={() => {
        setCurrentView(view);
        if (window.innerWidth < 1024) setIsSidebarOpen(false);
      }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all duration-300 transform active:scale-95 ${
        currentView === view 
          ? `bg-${themeColor}-600 text-white shadow-lg shadow-${themeColor}-600/20` 
          : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
      }`}
    >
      <Icon size={18} />
      <span className="text-sm">{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#0b0e14] overflow-hidden font-sans">
      <ConnectionGuard isOnline={appState === 'READY'} isDemoMode={isDemoMode} onRetry={() => { setIsDemoMode(false); initialize(); }} onContinueOffline={() => setIsDemoMode(true)} />

      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-[#151a21] border-r border-gray-100 dark:border-gray-800 p-6 flex flex-col transition-all duration-500 ease-in-out lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full shadow-none'}`}>
        <div className="mb-10 flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className={`p-2 bg-gradient-to-br from-${themeColor}-500 to-${themeColor}-700 rounded-xl text-white shadow-xl`}><PieChart size={24}/></div>
            <div>
              <span className="font-black text-xl tracking-tight dark:text-white leading-none block">FinAI</span>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1 block">Gestão Inteligente</span>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-gray-400 p-2 hover:bg-gray-100 rounded-full transition"><X size={20} /></button>
        </div>
        <nav className="flex-1 space-y-1">
          <NavItem icon={LayoutDashboard} label="Visão Geral" view="dashboard" />
          <NavItem icon={List} label="Movimentações" view="transactions" />
          <NavItem icon={Landmark} label="Minhas Contas" view="accounts" />
          <NavItem icon={CreditCard} label="Cartões de Crédito" view="cards" />
          <NavItem icon={Tag} label="Categorias" view="categories" />
          <div className="my-6 border-t border-gray-100 dark:border-gray-800 opacity-50 mx-2"></div>
          <NavItem icon={MessageSquare} label="Conversar com IA" view="chat" />
        </nav>
        
        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl mb-4 border border-gray-100 dark:border-gray-800">
           <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Dica do dia</p>
           <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed italic">"O segredo da riqueza é gastar menos do que se ganha."</p>
        </div>

        <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 text-red-500/70 font-bold hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all">
          <LogOut size={18} /> Sair com segurança
        </button>
      </aside>

      <main className="flex-1 overflow-y-auto relative bg-[#f8fafc] dark:bg-[#0b0e14]">
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-[#151a21]/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex justify-between items-center transition-all duration-300">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-400 transition transform active:rotate-180">
              <Menu size={22} />
            </button>
            <div className="hidden sm:block">
              <h2 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em]">{getGreeting()}, <span className={`text-${themeColor}-600 dark:text-${themeColor}-400`}>{userName}</span></h2>
            </div>
          </div>
          <button onClick={() => setIsModalOpen(true)} className={`group relative bg-${themeColor}-600 hover:bg-${themeColor}-700 text-white px-6 py-3 rounded-2xl font-black shadow-xl shadow-${themeColor}-600/20 flex items-center gap-2 transition-all active:scale-95 overflow-hidden`}>
            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out"></div>
            <Plus size={20}/> <span className="hidden sm:inline">Lançamento</span>
          </button>
        </header>

        <div className="p-6 lg:p-10 max-w-7xl mx-auto">
          {currentView === 'dashboard' && <Dashboard transactions={transactions} themeColor={themeColor} categories={categories} />}
          {currentView === 'transactions' && (
            <TransactionList transactions={transactions} categories={categories} accounts={accountsWithComputedBalances} 
              onUpdateTransaction={handleUpdateTransaction} 
              onToggleStatus={handleToggleStatus} />
          )}
          {currentView === 'accounts' && (
            <BankAccountManager accounts={accountsWithComputedBalances} transactions={transactions} 
              onAddAccount={(a) => setAccounts(prev => [...prev, a])} 
              onUpdateAccount={(a) => setAccounts(prev => prev.map(item => item.id === a.id ? a : item))} 
              onDeleteAccount={(id) => setAccounts(prev => prev.filter(a => a.id !== id))} />
          )}
          {currentView === 'cards' && (
            <CreditCardManager 
              cards={cards} 
              transactions={transactions} 
              accounts={accountsWithComputedBalances}
              onAddCard={(c) => setCards(prev => [...prev, c])} 
              onDeleteCard={(id) => setCards(prev => prev.filter(c => c.id !== id))} 
              onAddTransaction={handleAddTransaction}
              onUpdateTransaction={handleUpdateTransaction}
              themeColor={themeColor}
            />
          )}
          {currentView === 'categories' && <CategoryManager categories={categories} onAddCategory={(c) => setCategories(prev => [...prev, c])} onUpdateCategory={(c) => setCategories(prev => prev.map(item => item.id === c.id ? c : item))} onDeleteCategory={(id) => setCategories(prev => prev.filter(c => c.id !== id))} />}
          {currentView === 'chat' && <ChatInterface onAddTransaction={handleAddTransaction} categories={categories} userRules={aiRules} onAddRule={(r) => setAiRules(prev => [...prev, r])} themeColor={themeColor} transactions={transactions} />}
        </div>
      </main>

      <TransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleAddTransaction} categories={categories} accounts={accountsWithComputedBalances} cards={cards} />
    </div>
  );
};

const LoadingScreen = () => {
  const [quoteIdx, setQuoteIdx] = useState(0);
  const quotes = [
    "Preparando sua liberdade financeira...",
    "Sincronizando seus sonhos com a realidade...",
    "Organizando cada centavo para você...",
    "Carregando seu futuro próspero...",
    "Deixando tudo pronto e seguro..."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIdx(prev => (prev + 1) % quotes.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#0b0e14] text-white p-6 relative overflow-hidden">
      {/* Decorative Blur */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-indigo-500/20 rounded-full blur-[120px] animate-pulse"></div>
      
      <div className="relative flex flex-col items-center gap-8 text-center animate-in fade-in duration-1000">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
             <Heart size={24} className="text-indigo-500 animate-pulse" />
          </div>
        </div>
        
        <div className="space-y-3">
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center justify-center gap-2">
            FinAI <Sparkles size={20} className="text-indigo-400" />
          </h2>
          <div className="h-6 flex items-center justify-center">
            <p className="text-sm text-gray-400 animate-in fade-in slide-in-from-bottom-2 duration-700 font-medium" key={quoteIdx}>
              {quotes[quoteIdx]}
            </p>
          </div>
        </div>
        
        <div className="w-48 h-1 bg-gray-800 rounded-full overflow-hidden mt-4">
           <div className="h-full bg-indigo-500 w-1/2 animate-[loading-bar_3s_infinite_ease-in-out]"></div>
        </div>
        <style>{`
          @keyframes loading-bar {
            0% { transform: translateX(-100%); width: 30%; }
            50% { width: 70%; }
            100% { transform: translateX(200%); width: 30%; }
          }
        `}</style>
      </div>
    </div>
  );
};

export default App;
