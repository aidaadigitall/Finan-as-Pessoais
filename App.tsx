
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
import { ConfirmationModal, CustomAction } from './components/ConfirmationModal';
import { Settings } from './components/Settings';

import { 
  LayoutDashboard, List, Landmark, LogOut, Plus, 
  CreditCard, Tag, MessageSquare, Menu, Loader2, AlertTriangle, RefreshCw, Briefcase,
  TrendingDown, TrendingUp, Settings as SettingsIcon, Layers, Trash2
} from 'lucide-react';
import { Transaction, BankAccount, Category, CreditCard as CreditCardType, TransactionStatus, SystemSettings, UserProfile } from './types';

type AppState = 'BOOTING' | 'AUTH_REQUIRED' | 'LOADING_DATA' | 'READY' | 'CRITICAL_ERROR';
type View = 'executive' | 'dashboard' | 'transactions' | 'accounts' | 'cards' | 'categories' | 'chat' | 'payable' | 'receivable' | 'settings';

interface ConfirmationState {
  isOpen: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  variant?: 'danger' | 'warning';
  confirmText?: string;
  customActions?: CustomAction[];
}

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

  // Estados Globais de Configuração e Perfil
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
      companyName: 'FinAI',
      themeColor: 'indigo',
      whatsapp: { status: 'disconnected' },
      apiKeys: {}
  });

  const [userProfile, setUserProfile] = useState<UserProfile>({
      id: '',
      name: 'Usuário',
      email: '',
      role: 'owner'
  });

  // Estado para o Modal de Confirmação
  const [confirmModal, setConfirmModal] = useState<ConfirmationState>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {}
  });

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

    // Inicializar Perfil Básico
    setUserProfile({
        id: session.user.id,
        email: session.user.email!,
        name: session.user.email!.split('@')[0],
        role: 'owner'
    });

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

  // Helper para abrir confirmação
  const requestConfirmation = (
    title: string, 
    description: string, 
    action: () => void, 
    variant: 'danger' | 'warning' = 'danger',
    confirmText: string = 'Confirmar',
    customActions?: CustomAction[]
  ) => {
    setConfirmModal({
      isOpen: true,
      title,
      description,
      onConfirm: action,
      variant,
      confirmText,
      customActions
    });
  };

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
    
    requestConfirmation(
      "Excluir Cartão de Crédito?",
      "Esta ação removerá o cartão e seu histórico de auditoria. As transações realizadas permanecerão no sistema.",
      async () => {
        try {
          await financialService.deleteCreditCard(id);
          await loadData(orgId);
        } catch (e: any) { alert("Erro ao excluir cartão: " + e.message); }
      },
      'danger',
      'Excluir Cartão'
    );
  };

  const handleAddAccount = async (acc: BankAccount) => {
    if (!orgId) return;
    try {
      await financialService.createBankAccount(acc, orgId);
      await loadData(orgId);
    } catch (e: any) { alert("Erro ao criar conta: " + e.message); }
  };

  const handleUpdateAccount = async (acc: BankAccount) => {
    if (!orgId) return;
    try {
      await financialService.updateBankAccount(acc, orgId);
      await loadData(orgId);
    } catch (e: any) { alert("Erro ao atualizar conta: " + e.message); }
  };

  const handleDeleteAccount = async (id: string) => {
    if (!orgId) return;
    
    requestConfirmation(
      "Excluir Conta Bancária?",
      "Tem certeza que deseja excluir esta conta? Todas as transações vinculadas perderão a referência e o saldo será recalculado.",
      async () => {
        try {
          await financialService.deleteBankAccount(id);
          await loadData(orgId);
        } catch (e: any) { alert("Erro ao excluir conta: " + e.message); }
      },
      'danger',
      'Sim, Excluir'
    );
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

  // Implementação da exclusão de transação (Com Suporte a Parcelamento)
  const handleDeleteTransaction = async (id: string) => {
      if (!orgId) return;
      
      const transaction = transactions.find(t => t.id === id);
      if (!transaction) return;

      // Se for parcelado, pergunta especial
      if (transaction.installmentId) {
          requestConfirmation(
              "Excluir Parcelamento",
              "Este lançamento faz parte de uma série parcelada. Como deseja prosseguir?",
              () => {}, // Callback default ignorado por causa das customActions
              'warning',
              '',
              [
                  {
                      label: "Excluir APENAS esta parcela",
                      variant: 'secondary',
                      icon: Trash2,
                      onClick: async () => {
                          try {
                              await financialService.deleteTransaction(id);
                              await loadData(orgId);
                          } catch (e: any) { alert("Erro: " + e.message); }
                      }
                  },
                  {
                      label: "Excluir TODAS as parcelas",
                      variant: 'danger',
                      icon: Layers,
                      onClick: async () => {
                          try {
                              await financialService.deleteInstallmentSeries(transaction.installmentId!);
                              await loadData(orgId);
                          } catch (e: any) { alert("Erro: " + e.message); }
                      }
                  }
              ]
          );
          return;
      }

      // Exclusão normal
      requestConfirmation(
          "Excluir Lançamento?",
          "Esta ação é irreversível e removerá o lançamento do seu histórico financeiro.",
          async () => {
              try {
                  await financialService.deleteTransaction(id);
                  await loadData(orgId);
              } catch (e: any) { alert("Erro ao excluir lançamento: " + e.message); }
          },
          'danger',
          'Excluir'
      );
  }

  const handleUpdateTransactionLocal = async (t: Transaction) => {
    setTransactions(prev => prev.map(item => item.id === t.id ? t : item));
  };
  
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

  const handleDeleteCategory = async (id: string) => {
     if (!orgId) return;
     requestConfirmation(
        "Excluir Categoria?",
        "As transações vinculadas a esta categoria não serão excluídas, mas ficarão sem categoria definida.",
        async () => {
             // Lógica de exclusão aqui
             setCategories(prev => prev.filter(c => c.id !== id));
        },
        'warning',
        'Excluir'
     );
  }
  
  const handleToggleStatus = async (id: string) => {
      const transaction = transactions.find(t => t.id === id);
      if (!transaction || !orgId) return;

      const updatedTransaction = { 
          ...transaction, 
          isPaid: !transaction.isPaid, 
          status: !transaction.isPaid ? TransactionStatus.CONFIRMED : TransactionStatus.PENDING_AUDIT 
      };

      setTransactions(prev => prev.map(t => t.id === id ? updatedTransaction : t));

      try {
          await financialService.updateTransaction(updatedTransaction, orgId);
      } catch (e: any) {
          setTransactions(prev => prev.map(t => t.id === id ? transaction : t));
          alert("Erro ao atualizar status: " + e.message);
      }
  };

  if (appState === 'BOOTING' || appState === 'LOADING_DATA') return <Loading message="Sincronizando..." />;
  if (appState === 'CRITICAL_ERROR') return <ErrorScreen error={errorDetails} onRetry={initialize} />;
  
  if (appState === 'AUTH_REQUIRED') return (
     <Auth 
        onAuthSuccess={initialize} 
        themeColor={systemSettings.themeColor} 
        companyName={systemSettings.companyName}
        logoUrl={systemSettings.loginLogoUrl}
     />
  );

  const NavItem = ({ icon: Icon, label, view }: any) => (
    <button 
      onClick={() => { setCurrentView(view); if (window.innerWidth < 1024) setIsSidebarOpen(false); }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${currentView === view ? `bg-${systemSettings.themeColor}-600 text-white shadow-lg` : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
    >
      <Icon size={18} /> <span className="text-sm">{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#0b0e14] overflow-hidden">
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-[#151a21] border-r border-gray-100 dark:border-gray-800 p-6 flex flex-col transition-transform lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="mb-10 flex items-center gap-3">
          {systemSettings.logoUrl ? (
              <img src={systemSettings.logoUrl} alt="Logo" className="h-10 w-auto object-contain" />
          ) : (
              <div className={`p-2 bg-${systemSettings.themeColor}-600 rounded-xl text-white shadow-xl`}>
                  <LayoutDashboard size={24}/>
              </div>
          )}
          <span className="font-black text-xl tracking-tight dark:text-white truncate">
             {systemSettings.companyName}
             <span className={`text-[10px] bg-${systemSettings.themeColor}-500 text-white px-2 py-0.5 rounded ml-1`}>PRO</span>
          </span>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto custom-scrollbar">
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
        
        <div className="pt-4 border-t border-gray-100 dark:border-gray-800 mt-2 space-y-1">
             <NavItem icon={SettingsIcon} label="Configurações" view="settings" />
             <button onClick={() => authService.signOut()} className="w-full flex items-center gap-3 px-4 py-3 text-red-500 font-bold hover:bg-red-50 rounded-xl"><LogOut size={18} /> Sair</button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-[#f8fafc] dark:bg-[#0b0e14]">
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-[#151a21]/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex justify-between items-center">
          <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-gray-500"><Menu size={22} /></button>
          
          <div className="flex-1 px-4 flex justify-end items-center gap-4">
               {/* User Info Header */}
               <div className="flex items-center gap-3">
                   <div className="text-right hidden md:block">
                       <p className="text-sm font-bold text-gray-800 dark:text-white">{userProfile.name}</p>
                       <p className="text-xs text-gray-500">{userProfile.role === 'owner' ? 'Administrador' : 'Colaborador'}</p>
                   </div>
                   <div className={`w-10 h-10 rounded-full bg-${systemSettings.themeColor}-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm`}>
                       {userProfile.avatarUrl ? <img src={userProfile.avatarUrl} alt="User" className="w-full h-full object-cover"/> : <span className={`text-${systemSettings.themeColor}-600 font-bold`}>{userProfile.name.charAt(0)}</span>}
                   </div>
               </div>
          </div>
          
          {currentView !== 'settings' && (
              <button onClick={openNewTransactionModal} className={`ml-4 bg-${systemSettings.themeColor}-600 text-white px-6 py-3 rounded-2xl font-black shadow-xl flex items-center gap-2 transition-all active:scale-95`}>
                  <Plus size={20}/> <span className="hidden sm:inline">Novo Lançamento</span>
              </button>
          )}
        </header>

        <div className="p-6 lg:p-10 max-w-7xl mx-auto">
          {currentView === 'executive' && <ExecutiveDashboard orgId={orgId || ''} themeColor={systemSettings.themeColor} />}
          {currentView === 'dashboard' && <Dashboard transactions={transactions} themeColor={systemSettings.themeColor} categories={categories} />}
          {currentView === 'transactions' && <TransactionList transactions={transactions} categories={categories} accounts={accounts} onUpdateTransaction={handleUpdateTransactionLocal} onToggleStatus={handleToggleStatus} onEditTransaction={handleEditTransaction} onDeleteTransaction={handleDeleteTransaction} />}
          {currentView === 'payable' && <AccountsPayable transactions={transactions} accounts={accounts} onToggleStatus={handleToggleStatus} onUpdateTransaction={handleUpdateTransactionLocal} onOpenTransactionModal={openNewTransactionModal} />}
          {currentView === 'receivable' && <AccountsReceivable transactions={transactions} accounts={accounts} onToggleStatus={handleToggleStatus} onUpdateTransaction={handleUpdateTransactionLocal} onOpenTransactionModal={openNewTransactionModal} />}
          {currentView === 'accounts' && <BankAccountManager accounts={accounts} transactions={transactions} onAddAccount={handleAddAccount} onUpdateAccount={handleUpdateAccount} onDeleteAccount={handleDeleteAccount} />}
          {currentView === 'cards' && <CreditCardManager cards={cards} transactions={transactions} accounts={accounts} onAddCard={handleAddCard} onDeleteCard={handleDeleteCard} onAddTransaction={handleSaveTransaction} onUpdateTransaction={handleUpdateTransactionLocal} onUpdateCard={handleUpdateCard} themeColor={systemSettings.themeColor} />}
          {currentView === 'categories' && <CategoryManager categories={categories} onAddCategory={handleAddCategory} onUpdateCategory={()=>{}} onDeleteCategory={handleDeleteCategory} />}
          {currentView === 'chat' && <ChatInterface onAddTransaction={handleSaveTransaction} categories={categories} userRules={[]} onAddRule={()=>{}} themeColor={systemSettings.themeColor} transactions={transactions} />}
          
          {currentView === 'settings' && (
              <Settings 
                settings={systemSettings} 
                onUpdateSettings={setSystemSettings}
                userProfile={userProfile}
                onUpdateProfile={setUserProfile}
              />
          )}
        </div>
      </main>
      
      {/* Modais Globais */}
      <TransactionModal 
         isOpen={isModalOpen} 
         onClose={() => setIsModalOpen(false)} 
         onSave={handleSaveTransaction} 
         categories={categories} 
         accounts={accounts} 
         cards={cards}
         transactionToEdit={transactionToEdit}
      />

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        description={confirmModal.description}
        variant={confirmModal.variant}
        confirmText={confirmModal.confirmText}
        customActions={confirmModal.customActions}
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
