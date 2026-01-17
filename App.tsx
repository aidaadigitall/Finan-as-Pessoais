
import React, { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured, getSupabase } from './lib/supabase';
import { authService } from './services/authService';
import { bankAccountsService } from './services/bankAccountsService';
import { transactionsService } from './services/transactionsService';
import { Transaction, BankAccount, Category, TransactionType } from './types';
import { Dashboard } from './components/Dashboard';
import { TransactionList } from './components/TransactionList';
import { TransactionModal } from './components/TransactionModal';
import { Auth } from './components/Auth';
import { BankAccountManager } from './components/BankAccountManager';
import { LayoutDashboard, List, Landmark, LogOut, Plus, AlertCircle, RefreshCw } from 'lucide-react';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [supabaseError, setSupabaseError] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isTransModalOpen, setIsTransModalOpen] = useState(false);

  const categories: Category[] = [
    { id: '1', name: 'Alimentação', type: 'expense' },
    { id: '2', name: 'Moradia', type: 'expense' },
    { id: '3', name: 'Salário', type: 'income' },
    { id: '4', name: 'Lazer', type: 'expense' }
  ];

  const fetchData = useCallback(async (currentOrgId: string) => {
    if (!isSupabaseConfigured()) return;
    try {
      const [accs, trans] = await Promise.all([
        bankAccountsService.list(currentOrgId),
        transactionsService.list(currentOrgId)
      ]);
      setAccounts(accs);
      setTransactions(trans);
    } catch (e) {
      console.error("Erro ao sincronizar com Supabase:", e);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        if (!isSupabaseConfigured()) {
          setSupabaseError(true);
          setLoading(false);
          return;
        }

        const client = getSupabase();
        const { data: { session: currentSession }, error: sessionError } = await client.auth.getSession();
        
        if (sessionError) throw sessionError;
        
        setSession(currentSession);
        
        if (currentSession) {
          const id = await authService.bootstrapUserOrganization(currentSession.user.id, currentSession.user.email!);
          setOrgId(id);
          await fetchData(id);
        }
      } catch (err) {
        console.error("Erro na inicialização do App:", err);
        setSupabaseError(true);
      } finally {
        setLoading(false);
      }
    };

    init();

    if (isSupabaseConfigured()) {
      const { data: { subscription } } = getSupabase().auth.onAuthStateChange(async (_event, session) => {
        setSession(session);
        if (session) {
          try {
            const id = await authService.bootstrapUserOrganization(session.user.id, session.user.email!);
            setOrgId(id);
            fetchData(id);
          } catch (e) {
            console.error("Erro no fluxo de autenticação:", e);
          }
        }
      });
      return () => subscription.unsubscribe();
    }
  }, [fetchData]);

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

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#0b141a] text-white flex-col gap-4">
      <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="animate-pulse font-medium text-gray-400">Conectando ao Supabase...</p>
    </div>
  );

  if (supabaseError && !session) return (
    <div className="h-screen flex items-center justify-center bg-[#0b141a] text-white p-6">
      <div className="max-w-md w-full bg-[#202c33] border border-red-900/30 p-8 rounded-3xl text-center shadow-2xl space-y-6">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle size={40} className="text-red-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Erro de Configuração</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            Não foi possível detectar as chaves de API. Se você está em produção, verifique se o build contém as variáveis <code className="text-indigo-400">VITE_SUPABASE_URL</code>.
          </p>
        </div>
        <div className="pt-4 space-y-3">
          <button 
            onClick={() => window.location.reload()} 
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 rounded-2xl transition font-bold flex items-center justify-center gap-2"
          >
            <RefreshCw size={18} /> Tentar Novamente
          </button>
          <p className="text-[10px] text-gray-500">Dica: Verifique o console do navegador para mais detalhes.</p>
        </div>
      </div>
    </div>
  );

  if (!session) return <Auth onAuthSuccess={(s) => setSession(s)} themeColor="indigo" />;

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-6 flex flex-col hidden lg:flex shadow-sm">
        <div className="mb-10 flex items-center gap-3">
           <div className="p-2 bg-indigo-600 rounded-lg text-white">
              <Landmark size={20} />
           </div>
           <span className="text-xl font-bold dark:text-white">FinAI Cloud</span>
        </div>
        <nav className="flex-1 space-y-1">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}><LayoutDashboard size={20}/> Dashboard</button>
          <button onClick={() => setActiveTab('list')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'list' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}><List size={20}/> Lançamentos</button>
          <button onClick={() => setActiveTab('banks')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'banks' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}><Landmark size={20}/> Contas</button>
        </nav>
        <button onClick={() => authService.signOut()} className="mt-auto flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition font-medium">
          <LogOut size={20} /> Sair
        </button>
      </aside>

      <main className="flex-1 overflow-y-auto p-4 lg:p-8">
        <header className="mb-8 flex justify-between items-center">
           <div>
             <h2 className="text-2xl font-bold dark:text-white">Sistema Financeiro</h2>
             <p className="text-sm text-gray-500">Gestão multi-empresa inteligente</p>
           </div>
           <button onClick={() => setIsTransModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold shadow-xl shadow-indigo-500/20 transition flex items-center gap-2">
             <Plus size={20} /> Novo Lançamento
           </button>
        </header>

        {activeTab === 'dashboard' && <Dashboard transactions={transactions} themeColor="indigo" categories={categories} />}
        {activeTab === 'list' && <TransactionList transactions={transactions} categories={categories} accounts={accountsWithBalances} onUpdateTransaction={() => {}} onToggleStatus={handleToggleStatus} />}
        {activeTab === 'banks' && <BankAccountManager accounts={accountsWithBalances} transactions={transactions} onAddAccount={handleAddAccount} onUpdateAccount={() => {}} onDeleteAccount={async (id) => { await bankAccountsService.delete(id); if(orgId) fetchData(orgId); }} />}
      </main>

      <TransactionModal isOpen={isTransModalOpen} onClose={() => setIsTransModalOpen(false)} onSave={handleAddTransaction} categories={categories} accounts={accountsWithBalances} transactions={transactions} />
    </div>
  );
};

export default App;
