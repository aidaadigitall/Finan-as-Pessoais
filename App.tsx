
import React, { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured, getSupabase } from './lib/supabase';
import { authService } from './services/authService';
import { bankAccountsService } from './services/bankAccountsService';
import { transactionsService } from './services/transactionsService';
import { Transaction, BankAccount, Category, TransactionType } from './types';
import { Dashboard } from './components/Dashboard';
import { TransactionList } from './components/TransactionList';
import { ChatInterface } from './components/ChatInterface';
import { TransactionModal } from './components/TransactionModal';
import { Auth } from './components/Auth';
import { BankAccountManager } from './components/BankAccountManager';
import { LayoutDashboard, List, Landmark, LogOut, MessageSquare, Plus } from 'lucide-react';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
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
      if (!isSupabaseConfigured()) {
        setLoading(false);
        return;
      }

      const client = getSupabase();
      const { data: { session: currentSession } } = await client.auth.getSession();
      setSession(currentSession);
      
      if (currentSession) {
        const id = await authService.bootstrapUserOrganization(currentSession.user.id, currentSession.user.email!);
        setOrgId(id);
        await fetchData(id);
      }
      setLoading(false);
    };
    init();

    if (isSupabaseConfigured()) {
      const { data: { subscription } } = getSupabase().auth.onAuthStateChange(async (_event, session) => {
        setSession(session);
        if (session) {
          const id = await authService.bootstrapUserOrganization(session.user.id, session.user.email!);
          setOrgId(id);
          fetchData(id);
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
    <div className="h-screen flex items-center justify-center bg-gray-900 text-white flex-col gap-4">
      <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="animate-pulse font-medium">Conectando ao Supabase...</p>
    </div>
  );

  if (!session) return <Auth onAuthSuccess={(s) => setSession(s)} themeColor="indigo" />;

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-6 flex flex-col hidden lg:flex">
        <div className="mb-10 flex items-center gap-3">
           <Landmark className="text-indigo-600" />
           <span className="text-xl font-bold dark:text-white">FinAI Cloud</span>
        </div>
        <nav className="flex-1 space-y-1">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}><LayoutDashboard size={20}/> Dashboard</button>
          <button onClick={() => setActiveTab('list')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl ${activeTab === 'list' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}><List size={20}/> Lançamentos</button>
          <button onClick={() => setActiveTab('banks')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl ${activeTab === 'banks' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}><Landmark size={20}/> Contas</button>
        </nav>
        <button onClick={() => authService.signOut()} className="mt-auto flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition font-medium">
          <LogOut size={20} /> Sair
        </button>
      </aside>

      <main className="flex-1 overflow-y-auto p-8">
        <header className="mb-8 flex justify-between items-center">
           <h2 className="text-2xl font-bold dark:text-white">Controle Financeiro</h2>
           <button onClick={() => setIsTransModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition flex items-center gap-2">
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
