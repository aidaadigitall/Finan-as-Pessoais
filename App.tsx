import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { ChatInterface } from './components/ChatInterface';
import { TransactionList } from './components/TransactionList';
import { CategoryManager } from './components/CategoryManager';
import { AccountsPayable } from './components/AccountsPayable';
import { AccountsReceivable } from './components/AccountsReceivable';
import { WhatsAppIntegration } from './components/WhatsAppIntegration';
import { analyzeFinancialInput } from './services/geminiService';
import { Transaction, TransactionType, TransactionStatus, Category, AppNotification, ThemeColor, AIRule, WhatsAppConfig } from './types';
import { LayoutDashboard, MessageSquare, List, Wallet, Tag, ArrowDownCircle, ArrowUpCircle, Bell, Settings, Moon, Sun, X, Check, Smartphone, User, Palette, Brain, Database, Trash2, LogOut, Save } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'chat' | 'list' | 'payable' | 'receivable' | 'categories' | 'whatsapp'>('dashboard');
  
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [themeColor, setThemeColor] = useState<ThemeColor>('indigo');
  
  // Settings Modal State
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'profile' | 'appearance' | 'ai' | 'data'>('profile');

  // User Profile State
  const [userName, setUserName] = useState('Usuário');
  const [userPhone, setUserPhone] = useState('');

  // Notifications State
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // AI Learning State
  const [aiRules, setAiRules] = useState<AIRule[]>([]);

  // WhatsApp Config State
  const [whatsAppConfig, setWhatsAppConfig] = useState<WhatsAppConfig>({
    status: 'disconnected',
    phoneNumber: null,
    instanceId: null
  });

  // Initial Categories with Budgets
  const [categories, setCategories] = useState<Category[]>([
    { id: '1', name: 'Alimentação', type: 'expense', budgetLimit: 1200 },
    { id: '2', name: 'Transporte', type: 'expense', budgetLimit: 500 },
    { id: '3', name: 'Lazer', type: 'expense', budgetLimit: 300 },
    { id: '4', name: 'Contas Fixas', type: 'expense' },
    { id: '5', name: 'Salário', type: 'income' },
    { id: '6', name: 'Investimentos', type: 'both' },
    { id: '7', name: 'Outros', type: 'both' }
  ]);

  // Mock Initial Data
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: '1',
      date: new Date().toISOString(),
      description: 'Salário Mensal',
      amount: 5000,
      type: TransactionType.INCOME,
      category: 'Salário',
      status: TransactionStatus.CONFIRMED,
      isPaid: true,
      source: 'manual'
    },
    {
      id: '2',
      date: new Date(Date.now() - 86400000).toISOString(),
      description: 'Supermercado',
      amount: 450.50,
      type: TransactionType.EXPENSE,
      category: 'Alimentação',
      status: TransactionStatus.CONFIRMED,
      isPaid: true,
      source: 'whatsapp_ai'
    },
    // Mock Pending Data for Notification Test
    {
      id: '4',
      date: new Date().toISOString(),
      dueDate: new Date(Date.now() + 86400000 * 2).toISOString(), // 2 days from now (Warning)
      description: 'Aluguel',
      amount: 1500,
      type: TransactionType.EXPENSE,
      category: 'Contas Fixas',
      status: TransactionStatus.CONFIRMED,
      isPaid: false,
      source: 'manual'
    }
  ]);

  // Dark Mode Effect
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Check Due Dates Logic
  useEffect(() => {
      const checkDueDates = () => {
          const now = new Date();
          const threeDaysFromNow = new Date();
          threeDaysFromNow.setDate(now.getDate() + 3);

          const newNotifications: AppNotification[] = [];

          transactions.forEach(t => {
              if (t.type === TransactionType.EXPENSE && !t.isPaid && t.dueDate) {
                  const dueDate = new Date(t.dueDate);
                  if (dueDate <= threeDaysFromNow && dueDate >= now) {
                      newNotifications.push({
                          id: `due-${t.id}`,
                          title: 'Conta próxima do vencimento',
                          message: `A conta "${t.description}" de R$${(t.amount || 0).toFixed(2)} vence em breve.`,
                          type: 'warning',
                          read: false,
                          date: new Date().toISOString(),
                          transactionId: t.id
                      });
                  }
              }
          });

          // Only set if different to avoid loop (simple comparison)
          if (newNotifications.length !== notifications.length) {
             setNotifications(newNotifications);
          }
      };

      checkDueDates();
      // In a real app, run this periodically or on transaction change
  }, [transactions]);


  const handleAddTransaction = (newTransaction: Transaction) => {
    setTransactions(prev => [...prev, newTransaction]);
  };

  const handleUpdateTransaction = (updatedTransaction: Transaction) => {
    setTransactions(prev => prev.map(t => t.id === updatedTransaction.id ? updatedTransaction : t));
  };

  const handleAddCategory = (newCategory: Category) => {
    setCategories(prev => [...prev, newCategory]);
  };

  const handleDeleteCategory = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  const handleToggleStatus = (id: string) => {
      setTransactions(prev => prev.map(t => 
        t.id === id ? { ...t, isPaid: !t.isPaid } : t
      ));
  };

  const handleAddAiRule = (rule: AIRule) => {
      setAiRules(prev => [...prev, rule]);
  };

  const handleDeleteAiRule = (index: number) => {
      setAiRules(prev => prev.filter((_, i) => i !== index));
  };

  const handleResetData = () => {
      if (confirm("Tem certeza? Isso apagará todas as transações, regras e configurações locais.")) {
          setTransactions([]);
          setAiRules([]);
          setNotifications([]);
          alert("Dados resetados com sucesso.");
      }
  };

  // WhatsApp Connect Mock
  const handleConnectWhatsApp = () => {
    // In a real SaaS, this would call an API to generate a QR code from backend
    setTimeout(() => {
        setWhatsAppConfig({
            status: 'connected',
            phoneNumber: userPhone || '+55 11 99999-9999',
            instanceId: 'inst_12345'
        });
    }, 1500);
  };

  const handleDisconnectWhatsApp = () => {
    setWhatsAppConfig({
        status: 'disconnected',
        phoneNumber: null,
        instanceId: null
    });
  };

  // Simulate Webhook Reciever
  const handleWhatsAppSimulation = async (message: string) => {
      // Reuse the Gemini AI Service to process the message string
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
            originalInput: message
          };

          handleAddTransaction(newTransaction);
          
          // Add notification
          setNotifications(prev => [{
             id: Date.now().toString(),
             title: 'Novo Lançamento via WhatsApp',
             message: `Lançado: ${newTransaction.description} - R$${newTransaction.amount}`,
             type: 'success',
             read: false,
             date: new Date().toISOString()
          }, ...prev]);
      }
  };

  // Helper for dynamic colors
  const getThemeClass = (type: 'bg' | 'text' | 'border', shade: string = '600') => {
      return `${type}-${themeColor}-${shade}`;
  };

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
              { id: 'chat', icon: MessageSquare, label: 'Chat IA' },
              { id: 'list', icon: List, label: 'Diário' },
              { id: 'payable', icon: ArrowDownCircle, label: 'A Pagar' },
              { id: 'receivable', icon: ArrowUpCircle, label: 'A Receber' },
              { id: 'whatsapp', icon: Smartphone, label: 'WhatsApp' },
              { id: 'categories', icon: Tag, label: 'Categorias' }
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

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-700">
           <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="w-full flex items-center justify-center md:justify-start px-3 py-3 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
           >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              <span className="ml-3 hidden md:block">{isDarkMode ? 'Modo Claro' : 'Modo Escuro'}</span>
           </button>
           <button 
              onClick={() => { setShowSettings(true); setSettingsTab('profile'); }}
              className="w-full flex items-center justify-center md:justify-start px-3 py-3 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
           >
              <Settings size={20} />
              <span className="ml-3 hidden md:block">Configurações</span>
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-x-hidden ml-20 md:ml-0">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
              {activeTab === 'dashboard' && 'Visão Geral'}
              {activeTab === 'chat' && 'Assistente WhatsApp'}
              {activeTab === 'list' && 'Lançamentos Diários'}
              {activeTab === 'payable' && 'Contas a Pagar'}
              {activeTab === 'receivable' && 'Contas a Receber'}
              {activeTab === 'categories' && 'Gerenciar Categorias'}
              {activeTab === 'whatsapp' && 'Integração WhatsApp'}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Gerencie suas finanças com inteligência artificial.</p>
          </div>
          <div className="flex items-center gap-4">
             {/* Notification Bell */}
             <div className="relative">
                <button 
                   onClick={() => setShowNotifications(!showNotifications)}
                   className="p-2 rounded-full bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                    <Bell size={20} />
                    {notifications.length > 0 && (
                        <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-gray-800"></span>
                    )}
                </button>

                {/* Notification Dropdown */}
                {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 z-50 overflow-hidden">
                        <div className="p-3 border-b border-gray-100 dark:border-gray-700 font-semibold text-gray-700 dark:text-gray-200">
                            Notificações ({notifications.length})
                        </div>
                        <div className="max-h-64 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <p className="p-4 text-sm text-gray-500 dark:text-gray-400 text-center">Nenhuma notificação nova.</p>
                            ) : (
                                notifications.map(notif => (
                                    <div key={notif.id} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-50 dark:border-gray-700 last:border-0 cursor-pointer">
                                        <div className="flex items-start gap-2">
                                            <div className="w-2 h-2 mt-1.5 rounded-full bg-orange-500 shrink-0"></div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{notif.title}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{notif.message}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
             </div>

             <div className={`hidden md:flex w-10 h-10 rounded-full bg-${themeColor}-100 dark:bg-${themeColor}-900/30 text-${themeColor}-600 dark:text-${themeColor}-400 items-center justify-center font-bold`}>
               {userName.substring(0, 2).toUpperCase()}
             </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto">
          {activeTab === 'dashboard' && (
            <Dashboard transactions={transactions} themeColor={themeColor} categories={categories} />
          )}

          {activeTab === 'chat' && (
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                   <div className={`bg-${themeColor}-600 text-white rounded-2xl p-6 shadow-lg mb-6`}>
                      <h3 className="font-bold text-lg mb-2">Como funciona?</h3>
                      <p className={`text-${themeColor}-100 text-sm mb-4`}>
                        Envie uma foto de um recibo, um áudio falando "Gastei 50 reais no almoço", ou apenas digite. 
                        A IA vai analisar e sugerir o lançamento para você confirmar.
                      </p>
                      <button 
                         onClick={() => setActiveTab('list')}
                         className="w-full bg-white/20 hover:bg-white/30 text-white py-2 rounded-lg text-sm transition"
                      >
                         Ver Extrato
                      </button>
                   </div>
                   {/* Mini Stat Summary in Chat Mode */}
                   <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
                       <p className="text-gray-500 dark:text-gray-400 text-sm">Saldo Atual</p>
                       <p className="text-2xl font-bold text-gray-800 dark:text-white">
                         R$ {transactions.reduce((acc, t) => {
                             if (!t.isPaid) return acc;
                             return t.type === 'income' ? acc + (t.amount || 0) : acc - (t.amount || 0);
                         }, 0).toFixed(2)}
                       </p>
                   </div>
                </div>
                <div className="lg:col-span-2">
                  <ChatInterface 
                    onAddTransaction={handleAddTransaction} 
                    categories={categories} 
                    userRules={aiRules}
                    onAddRule={handleAddAiRule}
                    themeColor={themeColor}
                    transactions={transactions}
                  />
                </div>
             </div>
          )}

          {activeTab === 'list' && (
            <TransactionList 
              transactions={transactions} 
              categories={categories}
              onUpdateTransaction={handleUpdateTransaction}
              onToggleStatus={handleToggleStatus}
            />
          )}

          {activeTab === 'payable' && (
             <AccountsPayable transactions={transactions} onToggleStatus={handleToggleStatus} />
          )}

          {activeTab === 'receivable' && (
             <AccountsReceivable transactions={transactions} onToggleStatus={handleToggleStatus} />
          )}

          {activeTab === 'categories' && (
            <CategoryManager 
              categories={categories} 
              onAddCategory={handleAddCategory}
              onDeleteCategory={handleDeleteCategory}
            />
          )}

          {activeTab === 'whatsapp' && (
             <WhatsAppIntegration 
                config={whatsAppConfig}
                onConnect={handleConnectWhatsApp}
                onDisconnect={handleDisconnectWhatsApp}
                onSimulateMessage={handleWhatsAppSimulation}
                themeColor={themeColor}
             />
          )}
        </div>
      </main>

      {/* Settings Modal - COMPLETE */}
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
                                    className="w-full p-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Telefone (WhatsApp)</label>
                                <input 
                                    type="text" 
                                    value={userPhone}
                                    onChange={(e) => setUserPhone(e.target.value)}
                                    placeholder="+55 11 99999-9999"
                                    className="w-full p-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
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