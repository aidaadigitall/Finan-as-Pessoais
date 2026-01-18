
import React, { useState, useEffect, useCallback } from 'react';
import { supabase, testSupabaseConnection, isConfigured } from './lib/supabase';
import { authService } from './services/authService';
import { financialService } from './services/financialService';
import { bankAccountsService } from './services/bankAccountsService';
import { transactionsService } from './services/transactionsService';

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
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [themeColor, setThemeColor] = useState<ThemeColor>('indigo');

  // Centralized State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [categories, setCategories] = useState<Category[]>([
    { id: '1', name: 'Alimentação', type: 'expense' },
    { id: '2', name: 'Moradia', type: 'expense' },
    { id: '3', name: 'Salário', type: 'income' },
    { id: '4', name: 'Transporte', type: 'expense' }
  ]);
  const [cards, setCards] = useState<CreditCardType[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = useCallback(async (id: string) => {
    try {
      const [t, a] = await Promise.all([
        financialService.getTransactions(id),
        financialService.getBankAccounts(id)
      ]);
      setTransactions(t);
      setAccounts(a);
    } catch (e) {
      console.error('Falha ao carregar dados:', e);
    }
  }, []);

  const initialize = useCallback(async (retry = false) => {
    setAppState('BOOTING');
    const online = await testSupabaseConnection(5000);
    
    if (!online && !isDemoMode && !retry) {
      setAppState('OFFLINE_ERROR');
      return;
    }

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
      setAppState('READY');
    }
  }, [isDemoMode, fetchData]);

  useEffect(() => {
    initialize();
    const { data: { subscription } } = supabase?.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) initialize();
    }) || { data: { subscription: { unsubscribe: () => {} } } };
    return () => subscription.unsubscribe();
  }, [initialize]);

  const handleAddTransaction = async (t: Transaction) => {
    if (orgId) {
      await financialService.syncTransaction(t, orgId);
      await fetchData(orgId);
    } else {
      setTransactions([t, ...transactions]);
    }
  };

  const handleToggleStatus = async (id: string) => {
    const t = transactions.find(x => x.id === id);
    if (!t) return;
    await transactionsService.updateStatus(id, !t.isPaid);
    if (orgId) fetchData(orgId);
  };

  if (appState === 'BOOTING') return <LoadingScreen />;

  if (appState === 'OFFLINE_ERROR' && !isDemoMode) {
    return <ConnectionGuard isOnline={false} isDemoMode={false} onRetry={() => initialize(true)} onContinueOffline={() => { setIsDemoMode(true); setAppState('READY'); }} />;
  }

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

      {/* Sidebar Principal */}
      <aside className="w-72 bg-white dark:bg-[#1c2128] border-r border-gray-200 dark:border-gray-800 p-6 hidden lg:flex flex-col z-40">
        <div className="mb-10 flex items-center gap-3 px-2">
          <div className={`p-2 bg-${themeColor}-600 rounded-xl text-white shadow-lg`}><PieChart size={24}/></div>
          <div className="flex flex-col">
            <span className="font-black text-xl tracking-tight dark:text-white leading-none">FinAI</span>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">SaaS Control</span>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          <NavItem icon={LayoutDashboard} label="Dashboard" view="dashboard" />
          <NavItem icon={List} label="Extrato Completo" view="transactions" />
          <NavItem icon={Landmark} label="Contas Bancárias" view="accounts" />
          <NavItem icon={CreditCard} label="Cartões de Crédito" view="cards" />
          <NavItem icon={Tag} label="Categorias" view="categories" />
          <div className="my-4 border-t border-gray-100 dark:border-gray-800 mx-2"></div>
          <NavItem icon={MessageSquare} label="Auditore AI" view="chat" />
          <NavItem icon={Smartphone} label="WhatsApp SaaS" view="whatsapp" />
          <NavItem icon={SettingsIcon} label="Configurações" view="settings" />
        </nav>

        <div className="mt-auto pt-6 border-t border-gray-100 dark:border-gray-800">
           <button 
            onClick={() => authService.signOut()} 
            className="w-full flex items-center gap-3 px-4 py-3 text-red-500 font-bold hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors"
           >
            <LogOut size={20}/> Sair do SaaS
          </button>
        </div>
      </aside>

      {/* Área de Conteúdo */}
      <main className="flex-1 overflow-y-auto relative bg-[#f8fafc] dark:bg-[#0b0e14]">
        {/* Top Header Floating */}
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-[#1c2128]/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-8 py-4 flex justify-between items-center">
          <div className="lg:hidden flex items-center gap-3">
             <div className={`p-1.5 bg-${themeColor}-600 rounded-lg text-white`}><PieChart size={18}/></div>
             <span className="font-bold text-lg dark:text-white">FinAI</span>
          </div>
          <div className="hidden lg:block">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">{currentView}</h2>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)} 
            className={`bg-${themeColor}-600 hover:bg-${themeColor}-700 text-white px-5 py-2.5 rounded-xl font-black shadow-lg shadow-${themeColor}-600/20 flex items-center gap-2 transition-all active:scale-95`}
          >
            <Plus size={20}/> Novo Lançamento
          </button>
        </header>

        <div className="p-8 lg:p-12 max-w-7xl mx-auto">
          {currentView === 'dashboard' && <Dashboard transactions={transactions} themeColor={themeColor} categories={categories} />}
          {currentView === 'transactions' && (
            <TransactionList 
              transactions={transactions} 
              categories={categories} 
              accounts={accounts} 
              onUpdateTransaction={async (t) => {
                if(orgId) { await transactionsService.create(t, orgId); fetchData(orgId); }
              }} 
              onToggleStatus={handleToggleStatus} 
            />
          )}
          {currentView === 'accounts' && (
            <BankAccountManager 
              accounts={accounts} 
              transactions={transactions} 
              onAddAccount={async (a) => { if(orgId) { await bankAccountsService.create(a, orgId); fetchData(orgId); }}} 
              onUpdateAccount={() => {}} 
              onDeleteAccount={async (id) => { await bankAccountsService.delete(id); if(orgId) fetchData(orgId); }} 
            />
          )}
          {currentView === 'cards' && (
             <CreditCardManager 
              cards={cards} 
              transactions={transactions} 
              onAddCard={(c) => setCards([...cards, c])} 
              onDeleteCard={(id) => setCards(cards.filter(x => x.id !== id))} 
             />
          )}
          {currentView === 'categories' && (
            <CategoryManager 
              categories={categories} 
              onAddCategory={(c) => setCategories([...categories, c])} 
              onUpdateCategory={(c) => setCategories(categories.map(x => x.id === c.id ? c : x))} 
              onDeleteCategory={(id) => setCategories(categories.filter(x => x.id !== id))} 
            />
          )}
          {currentView === 'chat' && (
            <ChatInterface 
              transactions={transactions} 
              categories={categories} 
              onAddTransaction={handleAddTransaction} 
              userRules={[]} 
              onAddRule={() => {}} 
              themeColor={themeColor} 
            />
          )}
          {currentView === 'whatsapp' && (
            <WhatsAppIntegration 
              config={{ status: 'disconnected', phoneNumber: null, instanceId: null }} 
              onConnect={() => {}} 
              onDisconnect={() => {}} 
              onSimulateMessage={async (msg) => { console.log(msg) }} 
              themeColor={themeColor} 
            />
          )}
          {currentView === 'settings' && (
            <Settings 
              themeColor={themeColor} 
              setThemeColor={setThemeColor} 
              userName={session?.user?.email?.split('@')[0] || 'Usuário'} 
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
      </main>

      <TransactionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={async (t) => {
          if (orgId) {
            await financialService.syncTransaction(t, orgId);
            await fetchData(orgId);
          } else {
            setTransactions([t, ...transactions]);
          }
        }} 
        categories={categories} 
        accounts={accounts} 
        transactions={transactions} 
      />
    </div>
  );
};

const LoadingScreen = () => (
  <div className="h-screen flex flex-col items-center justify-center bg-[#0b141a] text-white gap-6">
    <div className="relative">
      <div className="w-16 h-16 border-4 border-indigo-500/20 rounded-full"></div>
      <div className="absolute top-0 w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
    <div className="text-center">
      <h2 className="text-xl font-bold tracking-tighter">FinAI Cloud</h2>
      <p className="text-sm text-gray-500 animate-pulse">Orquestrando seu ecossistema financeiro...</p>
    </div>
  </div>
);

export default App;
