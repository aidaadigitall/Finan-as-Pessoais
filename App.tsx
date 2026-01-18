
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
import { WhatsAppIntegration } from './components/WhatsAppIntegration';
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
  Smartphone,
  PieChart
} from 'lucide-react';
import { Transaction, BankAccount, Category, CreditCard as CreditCardType, ThemeColor } from './types';

type AppState = 'BOOTING' | 'READY' | 'OFFLINE_ERROR';
type View = 'dashboard' | 'transactions' | 'accounts' | 'cards' | 'categories' | 'chat' | 'whatsapp' | 'settings';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('BOOTING');
  const [session, setSession] = useState<any>(null);
  const [isDemoMode, setIsDemoMode] = useState(() => !isConfigured || offlineService.get('demo_mode', false));
  const [orgId, setOrgId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<View>(() => offlineService.get('last_view', 'dashboard'));
  const [themeColor, setThemeColor] = useState<ThemeColor>(() => offlineService.get('theme_color', 'indigo'));

  const [transactions, setTransactions] = useState<Transaction[]>(() => offlineService.get('transactions', []));
  const [accounts, setAccounts] = useState<BankAccount[]>(() => offlineService.get('accounts', []));
  const [categories, setCategories] = useState<Category[]>(() => offlineService.get('categories', [
    { id: '1', name: 'Alimentação', type: 'expense' },
    { id: '2', name: 'Moradia', type: 'expense' },
    { id: '3', name: 'Salário', type: 'income' },
    { id: '4', name: 'Transporte', type: 'expense' }
  ]));
  const [cards, setCards] = useState<CreditCardType[]>(() => offlineService.get('cards', []));
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Persistence logic (Offline First)
  useEffect(() => {
    offlineService.save('transactions', transactions);
    offlineService.save('accounts', accounts);
    offlineService.save('categories', categories);
    offlineService.save('last_view', currentView);
  }, [transactions, accounts, categories, currentView]);

  const fetchData = useCallback(async (id: string) => {
    try {
      const [t, a] = await Promise.all([
        financialService.getTransactions(id),
        financialService.getBankAccounts(id)
      ]);
      if (t.length > 0) setTransactions(t);
      if (a.length > 0) setAccounts(a);
    } catch (e) {
      console.warn('[Ledger] Usando cache local:', e);
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

  // LEDGER HANDLERS - CORE ENGINE ENTRY POINTS
  const handleAddTransaction = async (t: Transaction) => {
    const newList = await ledgerService.performTransaction(t, orgId, transactions);
    setTransactions(newList);
  };

  const handleToggleStatus = async (id: string) => {
    const updated = transactions.map(t => t.id === id ? { ...t, isPaid: !t.isPaid } : t);
    setTransactions(updated);
    if (orgId) await transactionsService.updateStatus(id, updated.find(x => x.id === id)!.isPaid);
  };

  const accountBalances = useMemo(() => financialEngine.computeAllBalances(accounts, transactions), [accounts, transactions]);

  // Inject updated balances into accounts for child components compatibility
  const accountsWithComputedBalances = useMemo(() => 
    accounts.map(acc => ({ ...acc, currentBalance: accountBalances[acc.id] || 0 })),
    [accounts, accountBalances]
  );

  if (appState === 'BOOTING') return <LoadingScreen />;
  if (!session && !isDemoMode) return <Auth onAuthSuccess={(s) => setSession(s)} themeColor={themeColor} />;

  const NavItem = ({ icon: Icon, label, view }: { icon: any, label: string, view: View }) => (
    <button 
      onClick={() => setCurrentView(view)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all duration-200 ${
        currentView === view 
          ? `bg-${themeColor}-600 text-white shadow-lg shadow-${themeColor}-600/20 translate-x-1` 
          : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
      }`}
    >
      <Icon size={20} />
      <span className="text-sm">{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden font-sans">
      <ConnectionGuard isOnline={appState === 'READY'} isDemoMode={isDemoMode} onRetry={() => { setIsDemoMode(false); initialize(); }} onContinueOffline={() => setIsDemoMode(true)} />

      <aside className="w-72 bg-white dark:bg-[#1c2128] border-r border-gray-200 dark:border-gray-800 p-6 hidden lg:flex flex-col z-40">
        <div className="mb-10 flex items-center gap-3 px-2">
          <div className={`p-2 bg-${themeColor}-600 rounded-xl text-white shadow-lg`}><PieChart size={24}/></div>
          <div className="flex flex-col text-left">
            <span className="font-black text-xl tracking-tight dark:text-white leading-none">FinAI</span>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Ledger Console</span>
          </div>
        </div>
        <nav className="flex-1 space-y-1">
          <NavItem icon={LayoutDashboard} label="Dashboard" view="dashboard" />
          <NavItem icon={List} label="Extrato Ledger" view="transactions" />
          <NavItem icon={Landmark} label="Contas (Real)" view="accounts" />
          <NavItem icon={CreditCard} label="Crédito" view="cards" />
          <NavItem icon={Tag} label="Categorias" view="categories" />
          <div className="my-4 border-t border-gray-100 dark:border-gray-800 mx-2"></div>
          <NavItem icon={MessageSquare} label="Auditore AI" view="chat" />
          <NavItem icon={SettingsIcon} label="Configurações" view="settings" />
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto relative bg-[#f8fafc] dark:bg-[#0b0e14]">
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-[#1c2128]/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-8 py-4 flex justify-between items-center">
          <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest">{currentView}</h2>
          <button onClick={() => setIsModalOpen(true)} className={`bg-${themeColor}-600 hover:bg-${themeColor}-700 text-white px-5 py-2.5 rounded-xl font-black shadow-lg shadow-${themeColor}-600/20 flex items-center gap-2 transition-all active:scale-95`}>
            <Plus size={20}/> Novo Lançamento
          </button>
        </header>

        <div className="p-8 lg:p-12 max-w-7xl mx-auto">
          {currentView === 'dashboard' && <Dashboard transactions={transactions} themeColor={themeColor} categories={categories} />}
          {currentView === 'transactions' && (
            <TransactionList transactions={transactions} categories={categories} accounts={accountsWithComputedBalances} 
              onUpdateTransaction={async (t) => {
                const newList = await ledgerService.performTransaction(t, orgId, transactions);
                setTransactions(newList);
              }} 
              onToggleStatus={handleToggleStatus} />
          )}
          {currentView === 'accounts' && (
            <BankAccountManager accounts={accountsWithComputedBalances} transactions={transactions} 
              onAddAccount={async (a) => {
                setAccounts(prev => [...prev, a]);
                if(orgId) await bankAccountsService.create(a, orgId);
              }} 
              onUpdateAccount={(a) => setAccounts(prev => prev.map(item => item.id === a.id ? a : item))} 
              onDeleteAccount={async (id) => {
                setAccounts(prev => prev.filter(a => a.id !== id));
                if(orgId) await bankAccountsService.delete(id);
              }} />
          )}
          {/* Outras views continuam iguais, apenas consumindo accountsWithComputedBalances se necessário */}
        </div>
      </main>

      <TransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleAddTransaction} 
        categories={categories} accounts={accountsWithComputedBalances} transactions={transactions} />
    </div>
  );
};

const LoadingScreen = () => (
  <div className="h-screen flex flex-col items-center justify-center bg-[#0b141a] text-white gap-6">
    <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
    <div className="text-center">
      <h2 className="text-xl font-bold text-indigo-400">Ledger Engine</h2>
      <p className="text-sm text-gray-500">Reconstruindo consistência financeira...</p>
    </div>
  </div>
);

export default App;
