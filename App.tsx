
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { isSupabaseConfigured, getSupabase } from './lib/supabase';
import { authService } from './services/authService';
import { bankAccountsService } from './services/bankAccountsService';
import { transactionsService } from './services/transactionsService';
import { Transaction, BankAccount, TransactionType } from './types';
import { Dashboard } from './components/Dashboard';
import { TransactionList } from './components/TransactionList';
import { TransactionModal } from './components/TransactionModal';
import { Auth } from './components/Auth';
import { BankAccountManager } from './components/BankAccountManager';
import { LayoutDashboard, List, Landmark, LogOut, Plus, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';

type AppState = 'initializing' | 'authenticated' | 'unauthenticated' | 'error';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>('initializing');
  const [session, setSession] = useState<any>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isTransModalOpen, setIsTransModalOpen] = useState(false);

  const initTimeout = useRef<any>(null);

  const categories = [
    { id: '1', name: 'Alimentação', type: 'expense' },
    { id: '2', name: 'Moradia', type: 'expense' },
    { id: '3', name: 'Salário', type: 'income' },
    { id: '4', name: 'Lazer', type: 'expense' },
    { id: '5', name: 'Investimentos', type: 'both' }
  ];

  const fetchData = useCallback(async (currentOrgId: string) => {
    try {
      const [accs, trans] = await Promise.all([
        bankAccountsService.list(currentOrgId),
        transactionsService.list(currentOrgId)
      ]);
      setAccounts(accs);
      setTransactions(trans);
    } catch (e: any) {
      console.error("Erro ao sincronizar dados:", e);
    }
  }, []);

  const bootstrap = useCallback(async (currentSession: any) => {
    try {
      const id = await authService.ensureUserResources(
        currentSession.user.id, 
        currentSession.user.email!
      );
      setOrgId(id);
      await fetchData(id);
      setState('authenticated');
    } catch (err: any) {
      console.error("Bootstrap error:", err);
      setErrorMsg("Não foi possível carregar sua organização.");
      setState('error');
    }
  }, [fetchData]);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setState('error');
      setErrorMsg("Configuração do Supabase ausente (VITE_SUPABASE_URL / ANON_KEY).");
      return;
    }

    // Timeout de segurança: 10 segundos
    initTimeout.current = setTimeout(() => {
      if (state === 'initializing') {
        setState('error');
        setErrorMsg("O servidor demorou muito para responder. Verifique sua conexão.");
      }
    }, 10000);

    const checkSession = async () => {
      try {
        const session = await authService.getUserSession();
        setSession(session);
        if (session) {
          await bootstrap(session);
        } else {
          setState('unauthenticated');
        }
      } catch (err) {
        setState('unauthenticated');
      } finally {
        if (initTimeout.current) clearTimeout(initTimeout.current);
      }
    };

    checkSession();

    const { data: { subscription } } = getSupabase().auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession);
      if (newSession) {
        await bootstrap(newSession);
      } else {
        setState('unauthenticated');
      }
    });

    return () => {
      subscription.unsubscribe();
      if (initTimeout.current) clearTimeout(initTimeout.current);
    };
  }, [bootstrap]);

  const accountsWithBalances = accounts.map(acc => {
    const income = transactions
      .filter(t => t.accountId === acc.id && t.type === TransactionType.INCOME && t.isPaid)
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = transactions
      .filter(t => t.accountId === acc.id && t.type === TransactionType.EXPENSE && t.isPaid)
      .reduce((sum, t) => sum + t.amount, 0);
    const transfersIn = transactions
      .filter(t => t.destinationAccountId === acc.id && t.type === TransactionType.TRANSFER && t.isPaid)
      .reduce((sum, t) => sum + t.amount, 0);
    const transfersOut = transactions
      .filter(t => t.accountId === acc.id && t.type === TransactionType.TRANSFER && t.isPaid)
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      ...acc,
      currentBalance: acc.initialBalance + income - expense + transfersIn - transfersOut
    };
  });

  const handleAddTransaction = async (t: Partial<Transaction>) => {
    if (!orgId) return;
    await transactionsService.create(t, orgId);
    await fetchData(orgId);
  };

  const handleToggleStatus = async (id: string) => {
    const trans = transactions.find(t => t.id === id);
    if (!trans || !orgId) return;
    await transactionsService.updateStatus(id, !trans.isPaid);
    await fetchData(orgId);
  };

  const handleAddAccount = async (acc: Partial<BankAccount>) => {
    if (!orgId) return;
    await bankAccountsService.create(acc, orgId);
    await fetchData(orgId);
  };

  if (state === 'initializing') return (
    <div className="h-screen flex items-center justify-center bg-[#0b141a] text-white flex-col gap-6">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-indigo-500/20 rounded-full"></div>
        <div className="absolute top-0 w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold tracking-tight">FinAI Cloud</h2>
        <p className="animate-pulse text-sm text-gray-400">Autenticando sessão segura...</p>
      </div>
    </div>
  );

  if (state === 'error') return (
    <div className="h-screen flex items-center justify-center bg-[#0b141a] text-white p-6">
      <div className="max-w-md w-full bg-[#1c2128] border border-red-500/20 p-10 rounded-[2.5rem] text-center shadow-2xl space-y-8">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto ring-4 ring-red-500/5">
          <AlertCircle size={40} className="text-red-500" />
        </div>
        <div className="space-y-3">
          <h2 className="text-2xl font-bold">Falha na Conexão</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            {errorMsg || "Ocorreu um erro inesperado ao conectar com o banco de dados."}
          </p>
        </div>
        <button 
          onClick={() => window.location.reload()} 
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 rounded-2xl transition-all font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
        >
          <RefreshCw size={18} /> Tentar Novamente
        </button>
      </div>
    </div>
  );

  if (state === 'unauthenticated') return <Auth onAuthSuccess={(s) => setSession(s)} themeColor="indigo" />;

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className="w-72 bg-white dark:bg-[#1c2128] border-r border-gray-200 dark:border-gray-800 p-8 flex flex-col hidden lg:flex">
        <div className="mb-12 flex items-center gap-4">
           <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-600/30">
              <Landmark size={24} />
           </div>
           <div>
             <span className="text-xl font-black dark:text-white block leading-none">FinAI</span>
             <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">SaaS Edition</span>
           </div>
        </div>
        
        <nav className="flex-1 space-y-2">
          <NavItem icon={<LayoutDashboard size={20}/>} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <NavItem icon={<List size={20}/>} label="Extrato" active={activeTab === 'list'} onClick={() => setActiveTab('list')} />
          <NavItem icon={<Landmark size={20}/>} label="Contas" active={activeTab === 'banks'} onClick={() => setActiveTab('banks')} />
        </nav>

        <div className="mt-auto pt-8 border-t border-gray-100 dark:border-gray-800">
          <button onClick={() => authService.signOut()} className="w-full flex items-center gap-4 px-5 py-4 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-2xl transition-all font-bold">
            <LogOut size={20} /> Sair do Sistema
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-6 lg:p-12">
        <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
           <div>
             <h2 className="text-3xl font-black dark:text-white tracking-tight">Finanças Inteligentes</h2>
             <p className="text-gray-500 font-medium">Controle multi-empresa unificado</p>
           </div>
           <button onClick={() => setIsTransModalOpen(true)} className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-black shadow-2xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-3 active:scale-95">
             <Plus size={22} /> Novo Lançamento
           </button>
        </header>

        <div className="max-w-7xl mx-auto space-y-12">
          {activeTab === 'dashboard' && <Dashboard transactions={transactions} themeColor="indigo" categories={categories as any} />}
          {activeTab === 'list' && (
            <div className="animate-in fade-in slide-in-from-bottom-4">
              <TransactionList 
                transactions={transactions} 
                categories={categories as any} 
                accounts={accountsWithBalances} 
                onUpdateTransaction={() => {}} 
                onToggleStatus={handleToggleStatus} 
              />
            </div>
          )}
          {activeTab === 'banks' && (
            <div className="animate-in fade-in slide-in-from-bottom-4">
              <BankAccountManager 
                accounts={accountsWithBalances} 
                transactions={transactions} 
                onAddAccount={handleAddAccount} 
                onUpdateAccount={() => {}} 
                onDeleteAccount={async (id) => { 
                  await bankAccountsService.delete(id); 
                  if(orgId) fetchData(orgId); 
                }} 
              />
            </div>
          )}
        </div>
      </main>

      <TransactionModal 
        isOpen={isTransModalOpen} 
        onClose={() => setIsTransModalOpen(false)} 
        onSave={handleAddTransaction} 
        categories={categories as any} 
        accounts={accountsWithBalances} 
        transactions={transactions} 
      />
    </div>
  );
};

const NavItem = ({ icon, label, active, onClick }: any) => (
  <button 
    onClick={onClick} 
    className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold ${
      active 
        ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 translate-x-1' 
        : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
    }`}
  >
    {icon} {label}
  </button>
);

export default App;
