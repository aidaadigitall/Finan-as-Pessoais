
import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { authService } from './services/authService';
import { financialService } from './services/financialService';
import { Transaction, BankAccount, Category, CreditCard as CreditCardType, TransactionType } from './types';
import { Dashboard } from './components/Dashboard';
import { TransactionList } from './components/TransactionList';
import { ChatInterface } from './components/ChatInterface';
import { TransactionModal } from './components/TransactionModal';
import { Settings } from './components/Settings';
import { Auth } from './components/Auth';
import { AccountsPayable } from './components/AccountsPayable';
import { AccountsReceivable } from './components/AccountsReceivable';
import { BankAccountManager } from './components/BankAccountManager';
import { CreditCardManager } from './components/CreditCardManager';
import { StatementImporter } from './components/StatementImporter';
import { 
  LayoutDashboard, 
  List, 
  Landmark, 
  LogOut, 
  MessageSquare, 
  Plus, 
  Settings as SettingsIcon,
  CalendarArrowDown,
  CalendarArrowUp,
  CreditCard,
  RefreshCw
} from 'lucide-react';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCardType[]>([]);
  const [categories] = useState<Category[]>([
    { id: '1', name: 'Alimentação', type: 'expense', budgetLimit: 500 },
    { id: '2', name: 'Moradia', type: 'expense', budgetLimit: 2000 },
    { id: '3', name: 'Salário', type: 'income' },
    { id: '4', name: 'Lazer', type: 'expense', budgetLimit: 300 }
  ]);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isTransModalOpen, setIsTransModalOpen] = useState(false);
  const [themeColor, setThemeColor] = useState<any>('indigo');

  // Load from LocalStorage on mount
  useEffect(() => {
    const savedTransactions = localStorage.getItem('finai_transactions');
    const savedAccounts = localStorage.getItem('finai_accounts');
    if (savedTransactions) setTransactions(JSON.parse(savedTransactions));
    if (savedAccounts) setAccounts(JSON.parse(savedAccounts));
  }, []);

  // Save to LocalStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('finai_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('finai_accounts', JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    const initSession = async () => {
      if (!isSupabaseConfigured()) {
        setLoading(false);
        // Simulate local session for demo
        setSession({ user: { email: 'admin@escsistemas.com', user_metadata: { full_name: 'Admin' } } });
        return;
      }
      const { data: { session: currentSession } } = await supabase!.auth.getSession();
      setSession(currentSession);
      if (currentSession) await loadUserData(currentSession);
      const { data: { subscription } } = supabase!.auth.onAuthStateChange(async (_event, session) => {
        setSession(session);
        if (session) await loadUserData(session);
        setLoading(false);
      });
      setLoading(false);
      return () => subscription.unsubscribe();
    };
    initSession();
  }, []);

  const loadUserData = async (currentSession: any) => {
    try {
      const orgId = await authService.bootstrapUserOrganization(currentSession.user.id, currentSession.user.email);
      const [transData, accData] = await Promise.all([
        financialService.getTransactions(orgId),
        financialService.getBankAccounts(orgId)
      ]);
      if (transData && transData.length > 0) setTransactions(transData);
      if (accData && accData.length > 0) setAccounts(accData);
    } catch (e) {
      console.error("Erro ao carregar dados remotos:", e);
    }
  };

  // Recalculate Current Balances for UI
  const accountsWithBalances = accounts.map(acc => {
    const totalIncome = transactions
      .filter(t => t.accountId === acc.id && t.type === TransactionType.INCOME && t.isPaid)
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions
      .filter(t => t.accountId === acc.id && t.type === TransactionType.EXPENSE && t.isPaid)
      .reduce((sum, t) => sum + t.amount, 0);
    return {
      ...acc,
      currentBalance: acc.initialBalance + totalIncome - totalExpense
    };
  });

  const handleLogout = async () => {
    if (isSupabaseConfigured()) await authService.signOut();
    setSession(null);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0b0e14]">
        <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center animate-bounce shadow-2xl">
                <Landmark className="text-white" size={32} />
            </div>
            <p className="text-gray-400 font-medium animate-pulse">Carregando Finanças...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Auth onAuthSuccess={(s) => setSession(s)} themeColor={themeColor} />;
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'chat', label: 'Assistente IA', icon: MessageSquare },
    { id: 'list', label: 'Lançamentos', icon: List },
    { id: 'payable', label: 'Contas a Pagar', icon: CalendarArrowUp },
    { id: 'receivable', label: 'Contas a Receber', icon: CalendarArrowDown },
    { id: 'banks', label: 'Bancos e Saldo', icon: Landmark },
    { id: 'cards', label: 'Cartões de Crédito', icon: CreditCard },
    { id: 'reconcile', label: 'Importar Extrato', icon: RefreshCw },
    { id: 'settings', label: 'Ajustes', icon: SettingsIcon },
  ];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden font-sans">
      <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-6 flex flex-col hidden lg:flex">
        <div className="mb-10 flex items-center gap-3">
           <div className={`p-2 bg-indigo-600 rounded-lg text-white`}>
             <Landmark size={20} />
           </div>
           <span className="text-xl font-bold dark:text-white">FinAI SaaS</span>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto custom-scrollbar pr-2">
          {navItems.map(item => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id)} 
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === item.id ? `bg-indigo-600 text-white shadow-lg` : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
            >
              <item.icon size={20} /> <span className="font-medium text-sm">{item.label}</span>
            </button>
          ))}
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
              <h2 className="text-2xl font-bold dark:text-white tracking-tight">
                Olá, {session.user.user_metadata?.full_name || session.user.email?.split('@')[0]}
              </h2>
              <p className="text-gray-500 text-sm">Organização: {session.user.email}</p>
           </div>
           <button 
             onClick={() => setIsTransModalOpen(true)}
             className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition flex items-center gap-2"
           >
             <Plus size={20} /> Novo Lançamento
           </button>
        </header>

        <div className="max-w-7xl mx-auto pb-10">
          {activeTab === 'dashboard' && <Dashboard transactions={transactions} themeColor={themeColor} categories={categories} />}
          {activeTab === 'list' && (
            <TransactionList 
              transactions={transactions} 
              categories={categories} 
              accounts={accountsWithBalances}
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
          {activeTab === 'payable' && (
              <AccountsPayable 
                transactions={transactions} 
                onToggleStatus={(id) => setTransactions(prev => prev.map(t => t.id === id ? {...t, isPaid: true} : t))} 
                onOpenTransactionModal={() => setIsTransModalOpen(true)} 
              />
          )}
          {activeTab === 'receivable' && (
              <AccountsReceivable 
                transactions={transactions} 
                onToggleStatus={(id) => setTransactions(prev => prev.map(t => t.id === id ? {...t, isPaid: true} : t))} 
                onOpenTransactionModal={() => setIsTransModalOpen(true)} 
              />
          )}
          {activeTab === 'banks' && (
            <BankAccountManager 
              accounts={accountsWithBalances} 
              transactions={transactions}
              onAddAccount={(a) => setAccounts(prev => [...prev, a])}
              onUpdateAccount={(a) => setAccounts(prev => prev.map(i => i.id === a.id ? a : i))}
              onDeleteAccount={(id) => setAccounts(prev => prev.filter(i => i.id !== id))}
            />
          )}
          {activeTab === 'cards' && (
            <CreditCardManager 
              cards={creditCards} 
              transactions={transactions}
              onAddCard={(c) => setCreditCards(prev => [...prev, c])}
              onDeleteCard={(id) => setCreditCards(prev => prev.filter(i => i.id !== id))}
            />
          )}
          {activeTab === 'reconcile' && (
            <StatementImporter 
              accounts={accountsWithBalances}
              onImport={(newTrans) => setTransactions(prev => [...newTrans, ...prev])}
            />
          )}
          {activeTab === 'settings' && (
            <Settings 
              themeColor={themeColor}
              setThemeColor={setThemeColor}
              userName={session.user.user_metadata?.full_name || session.user.email}
              setUserName={() => {}}
              userPhone=""
              setUserPhone={() => {}}
              aiRules={[]}
              onAddAiRule={() => {}}
              onDeleteAiRule={() => {}}
              onResetData={() => {
                setTransactions([]);
                setAccounts([]);
                localStorage.clear();
              }}
            />
          )}
        </div>
      </main>

      <TransactionModal 
        isOpen={isTransModalOpen} 
        onClose={() => setIsTransModalOpen(false)} 
        onSave={(t) => setTransactions(prev => [t, ...prev])} 
        categories={categories} 
        accounts={accountsWithBalances} 
        transactions={transactions} 
      />
    </div>
  );
};

export default App;
