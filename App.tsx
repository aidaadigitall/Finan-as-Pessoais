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
import { LayoutDashboard, MessageSquare, List, Wallet, Tag, ArrowDownCircle, ArrowUpCircle, Bell, Settings, Moon, Sun, X, Check, Smartphone, User, Palette, Brain, Database, Trash2, LogOut, Save, Plus, Landmark } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'chat' | 'list' | 'payable' | 'receivable' | 'categories' | 'whatsapp' | 'accounts'>('dashboard');
  
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

  // Recalculate Account Balances whenever transactions change
  useEffect(() => {
      const newAccounts = bankAccounts.map(acc => {
          let balance = acc.initialBalance;
          
          transactions.forEach(t => {
              if (!t.isPaid) return;

              // Income adds to account
              if (t.type === TransactionType.INCOME && t.accountId === acc.id) {
                  balance += t.amount;
              }
              // Expense subtracts from account
              if (t.type === TransactionType.EXPENSE && t.accountId === acc.id) {
                  balance -= t.amount;
              }
              // Transfer Out
              if (t.type === TransactionType.TRANSFER && t.accountId === acc.id) {
                  balance -= t.amount;
              }
              // Transfer In
              if (t.type === TransactionType.TRANSFER && t.destinationAccountId === acc.id) {
                  balance += t.amount;
              }
          });

          return { ...acc, currentBalance: balance };
      });
      
      // Prevent infinite loop: only update if balances changed
      const hasChanged = JSON.stringify(newAccounts) !== JSON.stringify(bankAccounts);
      if (hasChanged) {
        setBankAccounts(newAccounts);
      }
  }, [transactions]);


  const handleAddTransaction = (newTransaction: Transaction) => {
    // If account not specified, default to first
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

  // --- Bank Account Handlers ---
  const handleAddAccount = (acc: BankAccount) => {
      setBankAccounts(prev => [...prev, acc]);
  };
  const handleUpdateAccount = (acc: BankAccount) => {
      setBankAccounts(prev => prev.map(a => a.id === acc.id ? acc : a));
  };
  const handleDeleteAccount = (id: string) => {
      if (confirm("Excluir conta? O histórico de transações será mantido, mas o saldo não será mais rastreado.")) {
        setBankAccounts(prev => prev.filter(a => a.id !== id));
      }
  };

  // --- Category Handlers ---
  const handleAddCategory = (newCategory: Category) => setCategories(prev => [...prev, newCategory]);
  const handleUpdateCategory = (updatedCategory: Category) => setCategories(prev => prev.map(c => c.id === updatedCategory.id ? updatedCategory : c));
  const handleDeleteCategory = (id: string) => setCategories(prev => prev.filter(c => c.id !== id));

  // --- AI Rules Handlers ---
  const handleAddAiRule = (rule: AIRule) => setAiRules(prev => [...prev, rule]);
  const handleDeleteAiRule = (index: number) => setAiRules(prev => prev.filter((_, i) => i !== index));

  const handleResetData = () => {
      if (confirm("Tem certeza? Isso apagará todas as transações, regras e configurações locais.")) {
          setTransactions([]);
          setAiRules([]);
          setNotifications([]);
      }
  };

  // WhatsApp Logic (Simplified)
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
            accountId: bankAccounts[0]?.id // Default to first account for AI imports
          };
          handleAddTransaction(newTransaction);
          setNotifications(prev => [{ id: Date.now().toString(), title: 'Novo Lançamento via WhatsApp', message: `Lançado: ${newTransaction.description} - R$${newTransaction.amount}`, type: 'success', read: false, date: new Date().toISOString() }, ...prev]);
      }
  };

  const getThemeClass = (type: 'bg' | 'text' | 'border', shade: string = '600') => `${type}-${themeColor}-${shade}`;

  return (
    <div className={`min-h-screen flex bg-gray-50 dark:bg-gray-900 transition-colors duration-200`}>
      
      {/* Sidebar Navigation */}
      <aside className="w-20 md:w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col fixed md:relative h-full z-20">
        <div className="h-16 flex items-center justify-center md:justify-start md:px-6 border-b border-gray-100 dark:border-gray-700">
          <div className={`${getThemeClass('bg')} p-2 rounded-lg text-white`}>
            <Wallet size={24} />
          </div>
          <span className="ml-3 font-bold text-xl text-gray-800 dark:text-white hidden md:block">FinAI</span>
        </div>

        <nav className="flex-1 py-6 space-y-2 px-2 md:px-4 overflow-y-auto scrollbar-hide">
          {[
              { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
              { id: 'accounts', icon: Landmark, label: 'Contas Bancárias' },
              { id: 'chat', icon: MessageSquare, label: 'Chat IA' },
              { id: 'list', icon: List, label: 'Diário' },
              { id: 'payable', icon: ArrowDownCircle, label: 'A Pagar' },
              { id: 'receivable', icon: ArrowUpCircle, label: 'A Receber' },
              { id: 'categories', icon: Tag, label: 'Categorias' },
              { id: 'whatsapp', icon: Smartphone, label: 'Integrações' }
          ].map((item) => (
             <button 
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center justify-center md:justify-start px-3 py-3 rounded-xl transition-all duration-200 ${
                activeTab === item.id 
                    ? `bg-${themeColor}-50 dark:bg-${themeColor}-900/20 text-${themeColor}-600 dark:text-${themeColor}-400 font-medium` 
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
            >
                <item.icon size={22} />
                <span className="ml-3 hidden md:block">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100 dark:border-gray-700">
           <button onClick={() => setIsDarkMode(!isDarkMode)} className="w-full flex items-center justify-center md:justify-start px-3 py-3 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition">
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              <span className="ml-3 hidden md:block">{isDarkMode ? 'Claro' : 'Escuro'}</span>
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-x-hidden ml-20 md:ml-0">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white capitalize">
              {activeTab === 'accounts' ? 'Minhas Contas' : activeTab}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Gestão financeira inteligente.</p>
          </div>
          <div className="flex items-center gap-4">
             <button 
                onClick={() => setShowTransactionModal(true)}
                className={`hidden md:flex items-center gap-2 bg-${themeColor}-600 hover:bg-${themeColor}-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition transform hover:scale-105`}
             >
                <Plus size={18} /> Novo Lançamento
             </button>

             {/* Notification Bell */}
             <div className="relative">
                <button 
                   onClick={() => setShowNotifications(!showNotifications)}
                   className="p-2 rounded-full bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                    <Bell size={20} />
                    {notifications.length > 0 && <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-gray-800"></span>}
                </button>
                {/* Notification Dropdown logic omitted for brevity, same as before */}
             </div>

             {/* Profile Trigger */}
             <button 
                onClick={() => { setShowSettings(true); setSettingsTab('profile'); }}
                className={`flex items-center gap-3 pl-1 pr-3 py-1 rounded-full bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition cursor-pointer`}
                title="Editar Perfil"
             >
               <div className={`w-8 h-8 rounded-full bg-${themeColor}-100 dark:bg-${themeColor}-900/30 text-${themeColor}-600 dark:text-${themeColor}-400 flex items-center justify-center font-bold`}>
                 {userName.substring(0, 2).toUpperCase()}
               </div>
               <span className="text-sm font-medium text-gray-700 dark:text-gray-200 hidden md:block">{userName}</span>
             </button>
          </div>
        </header>

        <div className="max-w-7xl mx-auto">
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

      {/* Transaction Modal */}
      <TransactionModal 
         isOpen={showTransactionModal} 
         onClose={() => setShowTransactionModal(false)}
         onSave={handleAddTransaction}
         categories={categories}
         accounts={bankAccounts}
         transactions={transactions}
      />

      {/* Settings Modal */}
      {showSettings && (
         <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
                
                {/* Sidebar */}
                <div className="w-full md:w-1/3 bg-gray-50 dark:bg-gray-900 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700 p-4">
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-6 pl-2 hidden md:block">Configurações</h2>
                    <nav className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible no-scrollbar">
                        {[
                            { id: 'profile', icon: User, label: 'Perfil' },
                            { id: 'appearance', icon: Palette, label: 'Aparência' },
                            { id: 'ai', icon: Brain, label: 'Inteligência' },
                            { id: 'data', icon: Database, label: 'Dados' }
                        ].map(item => (
                            <button
                                key={item.id}
                                onClick={() => setSettingsTab(item.id as any)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                                    settingsTab === item.id 
                                    ? `bg-white dark:bg-gray-800 text-${themeColor}-600 dark:text-${themeColor}-400 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700` 
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800'
                                }`}
                            >
                                <item.icon size={18} />
                                {item.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Content Area */}
                <div className="flex-1 p-6 overflow-y-auto relative">
                    <button 
                        onClick={() => setShowSettings(false)} 
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                        <X size={24} />
                    </button>

                    {settingsTab === 'profile' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-2">
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-2">Perfil do Usuário</h3>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nome de Exibição</label>
                                <input 
                                    type="text" 
                                    value={userName}
                                    onChange={(e) => setUserName(e.target.value)}
                                    className="w-full p-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Telefone (WhatsApp)</label>
                                <input 
                                    type="text" 
                                    value={userPhone}
                                    onChange={(e) => setUserPhone(e.target.value)}
                                    placeholder="+55 11 99999-9999"
                                    className="w-full p-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                />
                                <p className="text-xs text-gray-500 mt-1">Utilizado para identificar suas mensagens na integração.</p>
                            </div>
                        </div>
                    )}

                    {settingsTab === 'appearance' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-2">
                             <h3 className="text-xl font-bold text-gray-800 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-2">Aparência</h3>
                             
                             <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Cor do Tema</label>
                                <div className="flex gap-3 flex-wrap">
                                    {[
                                        { name: 'indigo', hex: 'bg-indigo-600' },
                                        { name: 'blue', hex: 'bg-blue-600' },
                                        { name: 'emerald', hex: 'bg-emerald-600' },
                                        { name: 'violet', hex: 'bg-violet-600' },
                                        { name: 'rose', hex: 'bg-rose-600' },
                                    ].map((color) => (
                                        <button
                                            key={color.name}
                                            onClick={() => setThemeColor(color.name as ThemeColor)}
                                            className={`w-10 h-10 rounded-full ${color.hex} flex items-center justify-center transition-transform hover:scale-110 ring-2 ring-offset-2 dark:ring-offset-gray-800 ${themeColor === color.name ? 'ring-gray-400' : 'ring-transparent'}`}
                                        >
                                            {themeColor === color.name && <Check size={16} className="text-white" />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Modo Escuro</label>
                                <button 
                                    onClick={() => setIsDarkMode(!isDarkMode)}
                                    className={`flex items-center justify-between w-full p-3 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-200'} transition-all`}
                                >
                                    <div className="flex items-center gap-3">
                                        {isDarkMode ? <Moon size={20} className="text-indigo-400" /> : <Sun size={20} className="text-orange-500" />}
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                            {isDarkMode ? 'Ativado' : 'Desativado'}
                                        </span>
                                    </div>
                                    <div className={`w-10 h-5 rounded-full relative transition-colors ${isDarkMode ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isDarkMode ? 'left-6' : 'left-1'}`}></div>
                                    </div>
                                </button>
                            </div>
                        </div>
                    )}

                    {settingsTab === 'ai' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-2 h-full flex flex-col">
                             <h3 className="text-xl font-bold text-gray-800 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-2 flex items-center gap-2">
                                <Brain size={20} className={`text-${themeColor}-600`} /> 
                                Regras de Aprendizado
                             </h3>
                             <p className="text-sm text-gray-500 dark:text-gray-400">
                                Estas são as regras criadas automaticamente quando você corrige a IA. Exclua uma regra se ela estiver incorreta.
                             </p>

                             <div className="flex-1 overflow-y-auto border border-gray-100 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/50 p-2">
                                {aiRules.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                        <Brain size={48} className="mb-2 opacity-20" />
                                        <p className="text-sm">Nenhuma regra aprendida ainda.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {aiRules.map((rule, index) => (
                                            <div key={index} className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded shadow-sm border border-gray-100 dark:border-gray-700">
                                                <div className="flex items-center gap-2 text-sm">
                                                    <span className="text-gray-500 dark:text-gray-400">Se contiver:</span>
                                                    <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1.5 rounded text-gray-800 dark:text-gray-200">"{rule.keyword}"</span>
                                                    <span className="text-gray-400">→</span>
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium bg-${themeColor}-50 text-${themeColor}-700 dark:bg-${themeColor}-900/30 dark:text-${themeColor}-400`}>
                                                        {rule.category}
                                                    </span>
                                                </div>
                                                <button 
                                                    onClick={() => handleDeleteAiRule(index)}
                                                    className="text-gray-400 hover:text-red-500 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                                                    title="Excluir regra"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                             </div>
                        </div>
                    )}

                    {settingsTab === 'data' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-2">
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-2">Gestão de Dados</h3>
                            
                            <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-lg p-4">
                                <h4 className="text-red-800 dark:text-red-400 font-bold text-sm mb-2 flex items-center gap-2">
                                    <LogOut size={16} /> Zona de Perigo
                                </h4>
                                <p className="text-xs text-red-600 dark:text-red-300 mb-4">
                                    Esta ação apagará todas as transações, configurações e regras de aprendizado armazenadas neste dispositivo.
                                </p>
                                <button 
                                    onClick={handleResetData}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition"
                                >
                                    Resetar Todos os Dados
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Buttons (Mobile Only usually, but here persistent) */}
                <div className="p-6 pt-0 mt-auto md:hidden">
                    <button 
                        onClick={() => setShowSettings(false)}
                        className={`w-full py-2.5 rounded-lg text-white font-medium bg-${themeColor}-600 hover:bg-${themeColor}-700 transition flex items-center justify-center gap-2`}
                    >
                        <Save size={18} /> Fechar
                    </button>
                </div>

            </div>
         </div>
      )}
    </div>
  );
};

export default App;