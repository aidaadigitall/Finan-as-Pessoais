
import React, { useState, useEffect, useCallback } from 'react';
import { supabase, testSupabaseConnection, isConfigured } from './lib/supabase';
import { authService } from './services/authService';
import { financialService } from './services/financialService';
import { ConnectionGuard } from './components/ConnectionGuard';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { TransactionList } from './components/TransactionList';
import { TransactionModal } from './components/TransactionModal';
import { LayoutDashboard, List, Landmark, LogOut, Plus, Loader2 } from 'lucide-react';
import { Transaction, BankAccount } from './types';

type AppState = 'BOOTING' | 'AUTH_CHECK' | 'READY' | 'OFFLINE_ERROR';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('BOOTING');
  const [session, setSession] = useState<any>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [orgId, setOrgId] = useState<string | null>(null);
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadData = useCallback(async (id: string) => {
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
    
    // 1. Validar Configuração
    if (!isConfigured && !retry) {
      setAppState('OFFLINE_ERROR');
      return;
    }

    // 2. Testar Conexão com Timeout
    const online = await testSupabaseConnection(6000);
    
    if (!online && !isDemoMode) {
      setAppState('OFFLINE_ERROR');
      return;
    }

    // 3. Checar Sessão
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
      
      if (currentSession) {
        const id = await authService.ensureUserResources(currentSession.user.id, currentSession.user.email!);
        setOrgId(id);
        await loadData(id);
      }
      setAppState('READY');
    } catch (e) {
      console.warn('Erro na autenticação, entrando em modo limitado');
      setAppState('READY');
    }
  }, [isDemoMode, loadData]);

  useEffect(() => {
    initialize();

    const { data: { subscription } } = supabase?.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) initialize();
    }) || { data: { subscription: { unsubscribe: () => {} } } };

    return () => subscription.unsubscribe();
  }, [initialize]);

  if (appState === 'BOOTING') {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#0b141a] text-white gap-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-indigo-500/20 rounded-full"></div>
          <div className="absolute top-0 w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold">FinAI</h2>
          <p className="text-sm text-gray-500 animate-pulse">Estabelecendo conexão segura...</p>
        </div>
      </div>
    );
  }

  if (appState === 'OFFLINE_ERROR' && !isDemoMode) {
    return (
      <ConnectionGuard 
        isOnline={false} 
        isDemoMode={false} 
        onRetry={() => initialize(true)} 
        onContinueOffline={() => {
          setIsDemoMode(true);
          setAppState('READY');
        }}
        error={!isConfigured ? "Variáveis de ambiente VITE_SUPABASE_* não detectadas." : undefined}
      />
    );
  }

  if (!session && !isDemoMode) {
    return <Auth onAuthSuccess={(s) => setSession(s)} themeColor="indigo" />;
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <ConnectionGuard 
        isOnline={appState === 'READY'} 
        isDemoMode={isDemoMode} 
        onRetry={() => {
          setIsDemoMode(false);
          initialize();
        }}
        onContinueOffline={() => setIsDemoMode(true)}
      />

      {/* Sidebar Simples */}
      <aside className="w-64 bg-white dark:bg-[#1c2128] border-r border-gray-200 dark:border-gray-800 p-6 hidden lg:flex flex-col">
        <div className="mb-8 flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-lg text-white"><Landmark size={20}/></div>
          <span className="font-black text-xl tracking-tight dark:text-white">FinAI</span>
        </div>
        <nav className="flex-1 space-y-1">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-100'}`}>
            <LayoutDashboard size={18}/> Dashboard
          </button>
          <button onClick={() => setActiveTab('list')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition ${activeTab === 'list' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-100'}`}>
            <List size={18}/> Extrato
          </button>
        </nav>
        <button onClick={() => authService.signOut()} className="mt-auto flex items-center gap-3 px-4 py-3 text-red-500 font-bold hover:bg-red-50 rounded-xl transition">
          <LogOut size={18}/> Sair
        </button>
      </aside>

      <main className="flex-1 overflow-y-auto p-6 md:p-10">
        <header className="flex justify-between items-center mb-10">
          <h1 className="text-2xl font-black dark:text-white">Financeiro</h1>
          <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-black shadow-lg shadow-indigo-600/20 hover:scale-105 active:scale-95 transition">
            <Plus size={20}/> Novo Lançamento
          </button>
        </header>

        {activeTab === 'dashboard' && <Dashboard transactions={transactions} themeColor="indigo" categories={[]} />}
        {activeTab === 'list' && <TransactionList transactions={transactions} categories={[]} accounts={accounts} onUpdateTransaction={() => {}} onToggleStatus={() => {}} />}
      </main>

      <TransactionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={async (t) => {
          if (orgId) {
            await financialService.syncTransaction(t, orgId);
            loadData(orgId);
          }
        }} 
        categories={[]} accounts={accounts} transactions={transactions} 
      />
    </div>
  );
};

export default App;
