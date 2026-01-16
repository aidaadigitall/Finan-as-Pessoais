import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { ChatInterface } from './components/ChatInterface';
import { TransactionList } from './components/TransactionList';
import { CategoryManager } from './components/CategoryManager';
import { AccountsPayable } from './components/AccountsPayable';
import { AccountsReceivable } from './components/AccountsReceivable';
import { WhatsAppIntegration } from './components/WhatsAppIntegration';
import { BankAccountManager } from './components/BankAccountManager';
import { TransactionModal } from './components/TransactionModal';
import { analyzeFinancialInput } from './services/geminiService';
import { Transaction, TransactionType, TransactionStatus, Category, AppNotification, ThemeColor, AIRule, WhatsAppConfig, BankAccount } from './types';
import { LayoutDashboard, MessageSquare, List, Wallet, Tag, ArrowDownCircle, ArrowUpCircle, Bell, Settings, Moon, Sun, X, Check, Smartphone, User, Palette, Brain, Database, Trash2, LogOut, Save, Plus, Landmark, Menu } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'chat' | 'list' | 'payable' | 'receivable' | 'categories' | 'whatsapp' | 'accounts'>('dashboard');
  
  // Mobile Menu State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [themeColor, setThemeColor] = useState<ThemeColor>('indigo');
  
  // Settings Modal State
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'profile' | 'appearance' | 'ai' | 'data'>('profile');

  // Transaction Modal State
  const [showTransactionModal, setShowTransactionModal] = useState(false);

  // User Profile State
  const [userName, setUserName] = useState('Admin User');
  const [userPhone, setUserPhone] = useState('');

  // Notifications State
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // AI Learning State
  const [aiRules, setAiRules] = useState<AIRule[]>([]);

  // Bank Accounts State
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([
      { id: '1', name: 'Conta Principal', bankName: 'Nubank', initialBalance: 1000, currentBalance: 1000, color: 'purple', icon: 'landmark' },
      { id: '2', name: 'Reserva', bankName: 'Itaú', initialBalance: 5000, currentBalance: 5000, color: 'orange', icon: 'landmark' }
  ]);

  // WhatsApp Config State
  const [whatsAppConfig, setWhatsAppConfig] = useState<WhatsAppConfig>({
    status: 'disconnected',
    phoneNumber: null,
    instanceId: null
  });

  // Initial Categories
  const [categories, setCategories] = useState<Category[]>([
    { id: '1', name: 'Alimentação', type: 'expense', budgetLimit: 1200 },
    { id: '2', name: 'Transporte', type: 'expense', budgetLimit: 500 },
    { id: '3', name: 'Lazer', type: 'expense', budgetLimit: 300 },
    { id: '4', name: 'Contas Fixas', type: 'expense' },
    { id: '5', name: 'Salário', type: 'income' },
    { id: '6', name: 'Investimentos', type: 'both' },
    { id: '7', name: 'Transferência', type: 'both' }
  ]);

  // Transactions
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Dark Mode Effect
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Close mobile menu when tab changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [activeTab]);

  // Recalculate Account Balances
  useEffect(() => {
      const newAccounts = bankAccounts.map(acc => {
          let balance = acc.initialBalance;
          
          transactions.forEach(t => {
              if (!t.isPaid) return;
              if (t.type === TransactionType.INCOME && t.accountId === acc.id) balance += t.amount;
              if (t.type === TransactionType.EXPENSE && t.accountId === acc.id) balance -= t.amount;
              if (t.type === TransactionType.TRANSFER && t.accountId === acc.id) balance -= t.amount;
              if (t.type === TransactionType.TRANSFER && t.destinationAccountId === acc.id) balance += t.amount;
          });

          return { ...acc, currentBalance: balance };
      });
      
      const hasChanged = JSON.stringify(newAccounts) !== JSON.stringify(bankAccounts);
      if (hasChanged) setBankAccounts(newAccounts);
  }, [transactions]);


  const handleAddTransaction = (newTransaction: Transaction) => {
    if (!newTransaction.accountId && bankAccounts.length > 0) {
        newTransaction.accountId = bankAccounts[0].id;
    }
    setTransactions(prev => [...prev, newTransaction]);
  };

  const handleUpdateTransaction = (updatedTransaction: Transaction) => {
    setTransactions(prev => prev.map(t => t.id === updatedTransaction.id ? updatedTransaction : t));
  };

  const handleToggleStatus = (id: string) => {
      setTransactions(prev => prev.map(t => 
        t.id === id ? { ...t, isPaid: !t.isPaid } : t
      ));
  };

  const handleAddAccount = (acc: BankAccount) => setBankAccounts(prev => [...prev, acc]);
  const handleUpdateAccount = (acc: BankAccount) => setBankAccounts(prev => prev.map(a => a.id === acc.id ? acc : a));
  const handleDeleteAccount = (id: string) => {
      if (confirm("Excluir conta? O histórico será mantido.")) setBankAccounts(prev => prev.filter(a => a.id !== id));
  };

  const handleAddCategory = (newCategory: Category) => setCategories(prev => [...prev, newCategory]);
  const handleUpdateCategory = (updatedCategory: Category) => setCategories(prev => prev.map(c => c.id === updatedCategory.id ? updatedCategory : c));
  const handleDeleteCategory = (id: string) => setCategories(prev => prev.filter(c => c.id !== id));

  const handleAddAiRule = (rule: AIRule) => setAiRules(prev => [...prev, rule]);
  const handleDeleteAiRule = (index: number) => setAiRules(prev => prev.filter((_, i) => i !== index));

  const handleResetData = () => {
      if (confirm("Tem certeza? Isso apagará tudo.")) {
          setTransactions([]);
          setAiRules([]);
          setNotifications([]);
      }
  };

  const handleConnectWhatsApp = () => {
    setTimeout(() => {
        setWhatsAppConfig({ status: 'connected', phoneNumber: userPhone || '+55 11 99999-9999', instanceId: 'inst_12345' });
    }, 1500);
  };
  const handleDisconnectWhatsApp = () => setWhatsAppConfig({ status: 'disconnected', phoneNumber: null, instanceId: null });
  const handleWhatsAppSimulation = async (message: string) => {
      const result = await analyzeFinancialInput(message, null, categories, aiRules);
      if (result.isTransaction && result.transactionDetails) {
          const newTransaction: Transaction = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            description: result.transactionDetails.description,
            amount: result.transactionDetails.amount || 0,
            type: result.transactionDetails.type,
            category: result.transactionDetails.category,
            status: TransactionStatus.CONFIRMED,
            isPaid: true,
            source: 'whatsapp_ai',
            originalInput: message,
            accountId: bankAccounts[0]?.id
          };
          handleAddTransaction(newTransaction);
          setNotifications(prev => [{ id: Date.now().toString(), title: 'Novo Lançamento via WhatsApp', message: `Lançado: ${newTransaction.description} - R$${newTransaction.amount}`, type: 'success', read: false, date: new Date().toISOString() }, ...prev]);
      }
  };

  const getThemeClass = (type: 'bg' | 'text' | 'border', shade: string = '600') => `${type}-${themeColor}-${shade}`;

  // Menu Items Config
  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'accounts', icon: Landmark, label: 'Contas Bancárias' },
    { id: 'chat', icon: MessageSquare, label: 'Chat IA' },
    { id: 'list', icon: List, label: 'Diário' },
    { id: 'payable', icon: ArrowDownCircle, label: 'A Pagar' },
    { id: 'receivable', icon: ArrowUpCircle, label: 'A Receber' },
    { id: 'categories', icon: Tag, label: 'Categorias' },
    { id: 'whatsapp', icon: Smartphone, label: 'Integrações' }
  ];

  return (
    <div className={`flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 overflow-hidden`}>
      
      {/* Mobile Sidebar Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 
        transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
        flex flex-col
      `}>
        <div className="h-16 flex items-center px-6 border-b border-gray-100 dark:border-gray-700">
          <div className={`${getThemeClass('bg')} p-2 rounded-lg text-white shadow-lg`}>
            <Wallet size={24} />
          </div>
          <span className="ml-3 font-bold text-xl text-gray-800 dark:text-white tracking-tight">FinAI</span>
          <button 
             onClick={() => setIsMobileMenuOpen(false)} 
             className="md:hidden ml-auto text-gray-400 hover:text-gray-600"
          >
             <X size={24} />
          </button>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => (
             <button 
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 group ${
                activeTab === item.id 
                    ? `bg-${themeColor}-50 dark:bg-${themeColor}-900/20 text-${themeColor}-600 dark:text-${themeColor}-400 font-semibold shadow-sm` 
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
            >
                <item.icon size={20} className={`transition-transform group-hover:scale-110 ${activeTab === item.id ? '' : 'opacity-70'}`} />
                <span className="ml-3">{item.label}</span>
                {activeTab === item.id && (
                    <div className={`ml-auto w-1.5 h-1.5 rounded-full ${getThemeClass('bg')}`}></div>
                )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
           <button 
              onClick={() => setIsDarkMode(!isDarkMode)} 
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md transition-all"
           >
              <div className="flex items-center gap-3">
                 {isDarkMode ? <Moon size={18} className="text-indigo-400" /> : <Sun size={18} className="text-orange-500" />}
                 <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{isDarkMode ? 'Escuro' : 'Claro'}</span>
              </div>
              <div className={`w-8 h-4 rounded-full relative transition-colors ${isDarkMode ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                 <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all shadow-sm ${isDarkMode ? 'left-4.5' : 'left-0.5'}`} style={{ left: isDarkMode ? '18px' : '2px' }}></div>
              </div>
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Mobile Header */}
        <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 md:px-8 z-10 shrink-0">
          <div className="flex items-center gap-3">
             <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
             >
                <Menu size={24} />
             </button>
             <div>
                <h1 className="text-lg md:text-xl font-bold text-gray-800 dark:text-white capitalize leading-none">
                  {menuItems.find(i => i.id === activeTab)?.label}
                </h1>
             </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
             <button 
                onClick={() => setShowTransactionModal(true)}
                className={`flex items-center gap-2 bg-${themeColor}-600 hover:bg-${themeColor}-700 text-white px-3 md:px-4 py-2 rounded-lg font-medium shadow-sm transition active:scale-95 text-sm md:text-base`}
             >
                <Plus size={18} /> <span className="hidden md:inline">Lançamento</span>
             </button>

             <div className="relative">
                <button 
                   onClick={() => setShowNotifications(!showNotifications)}
                   className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                >
                    <Bell size={20} />
                    {notifications.length > 0 && <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-800"></span>}
                </button>
             </div>

             <button 
                onClick={() => { setShowSettings(true); setSettingsTab('profile'); }}
                className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold border border-indigo-200 dark:border-indigo-800 shadow-sm"
             >
                 {userName.substring(0, 2).toUpperCase()}
             </button>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto space-y-6">
            {activeTab === 'dashboard' && <Dashboard transactions={transactions} themeColor={themeColor} categories={categories} />}
            {activeTab === 'accounts' && <BankAccountManager accounts={bankAccounts} transactions={transactions} onAddAccount={handleAddAccount} onUpdateAccount={handleUpdateAccount} onDeleteAccount={handleDeleteAccount} />}
            {activeTab === 'chat' && (
              <ChatInterface onAddTransaction={handleAddTransaction} categories={categories} userRules={aiRules} onAddRule={handleAddAiRule} themeColor={themeColor} transactions={transactions} />
            )}
            {activeTab === 'list' && <TransactionList transactions={transactions} categories={categories} accounts={bankAccounts} onUpdateTransaction={handleUpdateTransaction} onToggleStatus={handleToggleStatus} />}
            {activeTab === 'payable' && <AccountsPayable transactions={transactions} onToggleStatus={handleToggleStatus} />}
            {activeTab === 'receivable' && <AccountsReceivable transactions={transactions} onToggleStatus={handleToggleStatus} />}
            {activeTab === 'categories' && <CategoryManager categories={categories} onAddCategory={handleAddCategory} onUpdateCategory={handleUpdateCategory} onDeleteCategory={handleDeleteCategory} />}
            {activeTab === 'whatsapp' && <WhatsAppIntegration config={whatsAppConfig} onConnect={handleConnectWhatsApp} onDisconnect={handleDisconnectWhatsApp} onSimulateMessage={handleWhatsAppSimulation} themeColor={themeColor} />}
          </div>
        </main>
      </div>

      {/* Transaction Modal */}
      <TransactionModal 
         isOpen={showTransactionModal} 
         onClose={() => setShowTransactionModal(false)}
         onSave={handleAddTransaction}
         categories={categories}
         accounts={bankAccounts}
         transactions={transactions}
      />

      {/* Settings Modal (Responsive) */}
      {showSettings && (
         <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[85vh] md:h-auto md:max-h-[80vh]">
                
                {/* Mobile Settings Nav */}
                <div className="md:hidden p-4 border-b border-gray-100 dark:border-gray-700 flex gap-2 overflow-x-auto no-scrollbar bg-gray-50 dark:bg-gray-900">
                    {['profile', 'appearance', 'ai', 'data'].map(id => (
                        <button key={id} onClick={() => setSettingsTab(id as any)} className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${settingsTab === id ? `bg-${themeColor}-600 text-white` : 'bg-white dark:bg-gray-800 text-gray-600'}`}>
                           {id.charAt(0).toUpperCase() + id.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Desktop Settings Sidebar */}
                <div className="hidden md:block w-1/3 bg-gray-50 dark:bg-gray-900/50 border-r border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6">Configurações</h2>
                    <nav className="flex flex-col gap-2">
                        {[
                            { id: 'profile', icon: User, label: 'Perfil' },
                            { id: 'appearance', icon: Palette, label: 'Aparência' },
                            { id: 'ai', icon: Brain, label: 'Inteligência' },
                            { id: 'data', icon: Database, label: 'Dados' }
                        ].map(item => (
                            <button
                                key={item.id}
                                onClick={() => setSettingsTab(item.id as any)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                                    settingsTab === item.id 
                                    ? `bg-white dark:bg-gray-800 text-${themeColor}-600 dark:text-${themeColor}-400 shadow-md` 
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                                }`}
                            >
                                <item.icon size={18} />
                                {item.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Content Area */}
                <div className="flex-1 p-6 md:p-8 overflow-y-auto relative bg-white dark:bg-gray-800">
                    <button onClick={() => setShowSettings(false)} className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition">
                        <X size={20} className="text-gray-500" />
                    </button>

                    {settingsTab === 'profile' && (
                        <div className="space-y-6">
                            <h3 className="text-2xl font-bold text-gray-800 dark:text-white">Perfil</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nome</label>
                                    <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Telefone</label>
                                    <input type="text" value={userPhone} onChange={(e) => setUserPhone(e.target.value)} className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                                </div>
                            </div>
                        </div>
                    )}
                    {settingsTab === 'appearance' && (
                        <div className="space-y-6">
                             <h3 className="text-2xl font-bold text-gray-800 dark:text-white">Aparência</h3>
                             <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                {['indigo', 'blue', 'emerald', 'violet', 'rose'].map((c) => (
                                    <button key={c} onClick={() => setThemeColor(c as ThemeColor)} className={`h-12 rounded-xl bg-${c}-600 ${themeColor === c ? 'ring-4 ring-offset-2 ring-gray-300 dark:ring-gray-600' : ''}`}></button>
                                ))}
                             </div>
                        </div>
                    )}
                    {settingsTab === 'ai' && (
                        <div className="space-y-6">
                            <h3 className="text-2xl font-bold text-gray-800 dark:text-white">Regras da IA</h3>
                            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 min-h-[200px]">
                                {aiRules.length === 0 ? <p className="text-gray-500 text-center mt-8">Nenhuma regra.</p> : (
                                    aiRules.map((r, i) => (
                                        <div key={i} className="flex justify-between items-center p-2 border-b border-gray-200 dark:border-gray-700">
                                            <span className="text-sm dark:text-white">{r.keyword} -> {r.category}</span>
                                            <button onClick={() => handleDeleteAiRule(i)}><Trash2 size={16} className="text-red-500" /></button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                    {settingsTab === 'data' && (
                        <div className="space-y-6">
                            <h3 className="text-2xl font-bold text-gray-800 dark:text-white">Zona de Perigo</h3>
                            <button onClick={handleResetData} className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 w-full md:w-auto">Resetar Dados</button>
                        </div>
                    )}
                </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default App;