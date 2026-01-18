
import React, { useState, useEffect, useCallback } from 'react';
import { supabase, isConfigured } from './lib/supabase';
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
import { AccountsPayable } from './components/AccountsPayable';
import { AccountsReceivable } from './components/AccountsReceivable';

import { 
  LayoutDashboard, List, Landmark, LogOut, Plus, 
  CreditCard, Tag, MessageSquare, Menu, Loader2, AlertTriangle, RefreshCw, Briefcase,
  TrendingDown, TrendingUp
} from 'lucide-react';
import { Transaction, BankAccount, Category, CreditCard as CreditCardType, TransactionStatus } from './types';

type AppState = 'BOOTING' | 'AUTH_REQUIRED' | 'LOADING_DATA' | 'READY' | 'CRITICAL_ERROR';
type View = 'executive' | 'dashboard' | 'transactions' | 'accounts' | 'cards' | 'categories' | 'chat' | 'payable' | 'receivable';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('BOOTING');
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<View>('executive');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cards, setCards] = useState<CreditCardType[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Estado para armazenar a transação sendo editada
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);

  const loadData = useCallback(async (id: string) => {
    try {
      const [t, a, c, crd] = await Promise.all([
        financialService.getTransactions(id),
        financialService.getBankAccounts(id),
        financialService.getCategories(id),
        financialService.getCreditCards(id)
      ]);
      setTransactions(t);
      setAccounts(a);
      setCategories(c);
      setCards(crd);
      
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

  const handleAddCard = async (card: CreditCardType) => {
    if (!orgId) return;
    try {
      await financialService.createCreditCard(card, orgId);
      await loadData(orgId);
    } catch (e: any) { alert("Erro ao criar cartão: " + e.message); }
  };

  const handleUpdateCard = async (card: CreditCardType) => {
    if (!orgId) return;
    try {
      await financialService.updateCreditCard(card, orgId);
      await loadData(orgId);
    } catch (e: any) { alert("Erro ao atualizar cartão: " + e.message); }
  };

  const handleDeleteCard = async (id: string) => {
    if (!orgId) return;
    try {
      await financialService.deleteCreditCard(id);
      await loadData(orgId);
    } catch (e: any) { alert("Erro ao excluir cartão: " + e.message); }
  };

  const handleAddAccount = async (acc: BankAccount) => {
    if (!orgId) return;
    try {
      await financialService.createBankAccount(acc, orgId);
      await loadData(orgId);
    } catch (e: any) { alert("Erro ao criar conta: " + e.message); }
  };

  // Implementação correta de atualização de conta
  const handleUpdateAccount = async (acc: BankAccount) => {
    if (!orgId) return;
    try {
      await financialService.updateBankAccount(acc, orgId);
      await loadData(orgId);
    } catch (e: any) { alert("Erro ao atualizar conta: " + e.message); }
  };

  // Implementação correta de exclusão de conta
  const handleDeleteAccount = async (id: string) => {
    if (!orgId) return;
    if (!confirm("Tem certeza que deseja excluir esta conta? Todas as transações vinculadas perderão a referência.")) return;
    try {
      await financialService.deleteBankAccount(id);
      await loadData(orgId);
    } catch (e: any) { alert("Erro ao excluir conta: " + e.message); }
  };

  const handleSaveTransaction = async (t: Transaction) => {
    if (!orgId) return;
    try {
      if (transactionToEdit) {
         // Edição
         await financialService.updateTransaction(t, orgId);
      } else {
         // Novo
         await financialService.createTransaction(t, orgId);
      }
      await loadData(orgId);
      setTransactionToEdit(null); // Reseta após salvar
    } catch (e: any) { alert("Erro ao salvar: " + e.message); }
  };

  // Esta função apenas atualiza o estado local, ideal para toggle rápido
  const handleUpdateTransactionLocal = async (t: Transaction) => {
    setTransactions(prev => prev.map(item => item.id === t.id ? t : item));
  };
  
  // Função que abre o modal já preenchido
  const handleEditTransaction = (t: Transaction) => {
      setTransactionToEdit(t);
      setIsModalOpen(true);
  };
  
  const openNewTransactionModal = () => {
      setTransactionToEdit(null);
      setIsModalOpen(true);
  };

  const handleAddCategory = async (cat: Category) => {
    if (!orgId) return;
    try {
      await financialService.createCategory(cat, orgId);
      await loadData(orgId);
    } catch (e: any) { alert("Erro ao criar categoria: " + e.message); }
  };
  
  const handleToggleStatus = async (id: string) => {
      // Toggle local para feedback instantâneo
      // Idealmente, chamaria um serviço de updateStatus no backend aqui também
      setTransactions(prev => prev.map(t => {
          if (t.id === id) return { ...t, isPaid: !t.isPaid, status: !t.isPaid ? TransactionStatus.CONFIRMED : TransactionStatus.PENDING_AUDIT };
          return t;
      }));
  };

  if (appState === 'BOOTING' || appState === 'LOADING_DATA') return <Loading message="Sincronizando..." />;
  if (appState === 'CRITICAL_ERROR') return <ErrorScreen error={errorDetails} onRetry={initialize} />;
  if (appState === 'AUTH_REQUIRED') return <Auth onAuthSuccess={initialize} themeColor="indigo" />;

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
          <NavItem icon={LayoutDashboard} label="Dashboard" view="dashboard" />
          <NavItem icon={List} label="Movimentações" view="transactions" />
          <div className="pt-4 pb-2 text-xs font-bold text-gray-400 uppercase tracking-widest pl-4">Operacional</div>
          <NavItem icon={TrendingDown} label="Contas a Pagar" view="payable" />
          <NavItem icon={TrendingUp} label="Contas a Receber" view="receivable" />
          <div className="pt-4 pb-2 text-xs font-bold text-gray-400 uppercase tracking-widest pl-4">Cadastros</div>
          <NavItem icon={Landmark} label="Contas Bancárias" view="accounts" />
          <NavItem icon={CreditCard} label="Cartões de Crédito" view="cards" />
          <NavItem icon={Tag} label="Categorias" view="categories" />
          <NavItem icon={MessageSquare} label="Assistente IA" view="chat" />
        </nav>
        <button onClick={() => authService.signOut()} className="flex items-center gap-3 px-4 py-3 text-red-500 font-bold hover:bg-red-50 rounded-xl"><LogOut size={18} /> Sair</button>
      </aside>

      <main className="flex-1 overflow-y-auto bg-[#f8fafc] dark:bg-[#0b0e14]">
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-[#151a21]/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex justify-between items-center">
          <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-gray-500"><Menu size={22} /></button>
          <div className="flex-1 px-4"></div>
          <button onClick={openNewTransactionModal} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black shadow-xl flex items-center gap-2 transition-all active:scale-95">
            <Plus size={20}/> Novo Lançamento
          </button>
        </header>

        <div className="p-6 lg:p-10 max-w-7xl mx-auto">
          {currentView === 'executive' && <ExecutiveDashboard orgId={orgId || ''} themeColor="indigo" />}
          {currentView === 'dashboard' && <Dashboard transactions={transactions} themeColor="indigo" categories={categories} />}
          {currentView === 'transactions' && <TransactionList transactions={transactions} categories={categories} accounts={accounts} onUpdateTransaction={handleUpdateTransactionLocal} onToggleStatus={handleToggleStatus} onEditTransaction={handleEditTransaction} />}
          {currentView === 'payable' && <AccountsPayable transactions={transactions} accounts={accounts} onToggleStatus={handleToggleStatus} onUpdateTransaction={handleUpdateTransactionLocal} onOpenTransactionModal={openNewTransactionModal} />}
          {currentView === 'receivable' && <AccountsReceivable transactions={transactions} accounts={accounts} onToggleStatus={handleToggleStatus} onUpdateTransaction={handleUpdateTransactionLocal} onOpenTransactionModal={openNewTransactionModal} />}
          {currentView === 'accounts' && <BankAccountManager accounts={accounts} transactions={transactions} onAddAccount={handleAddAccount} onUpdateAccount={handleUpdateAccount} onDeleteAccount={handleDeleteAccount} />}
          {currentView === 'cards' && <CreditCardManager cards={cards} transactions={transactions} accounts={accounts} onAddCard={handleAddCard} onDeleteCard={handleDeleteCard} onAddTransaction={handleSaveTransaction} onUpdateTransaction={handleUpdateTransactionLocal} onUpdateCard={handleUpdateCard} />}
          {currentView === 'categories' && <CategoryManager categories={categories} onAddCategory={handleAddCategory} onUpdateCategory={()=>{}} onDeleteCategory={()=>{}} />}
          {currentView === 'chat' && <ChatInterface onAddTransaction={handleSaveTransaction} categories={categories} userRules={[]} onAddRule={()=>{}} themeColor="indigo" transactions={transactions} />}
        </div>
      </main>
      <TransactionModal 
         isOpen={isModalOpen} 
         onClose={() => setIsModalOpen(false)} 
         onSave={handleSaveTransaction} 
         categories={categories} 
         accounts={accounts} 
         cards={cards}
         transactionToEdit={transactionToEdit} // Passa a transação para edição
      />
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
    <div className="max-w-md w-full bg-[#151a21] rounded-[2.5rem] p-10 border border-red-500/30 text-center text-white">
      <AlertTriangle size={40} className="mx-auto mb-6 text-red-500" />
      <h2 className="text-2xl font-black mb-2">Erro Crítico</h2>
      <p className="text-sm text-gray-400 mb-8">{error}</p>
      <button onClick={onRetry} className="w-full py-4 bg-indigo-600 rounded-2xl font-black shadow-xl flex items-center justify-center gap-3"><RefreshCw size={20} /> Tentar Novamente</button>
    </div>
  </div>
);

export default App;
