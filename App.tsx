
import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { authService } from './services/authService';
import { financialService } from './services/financialService';
import { Transaction, BankAccount, Category, AIRule } from './types';
import { Dashboard } from './components/Dashboard';
import { TransactionList } from './components/TransactionList';
import { ChatInterface } from './components/ChatInterface';
import { BankAccountManager } from './components/BankAccountManager';
import { CategoryManager } from './components/CategoryManager';
import { TransactionModal } from './components/TransactionModal';
import { Loader2, LayoutDashboard, List, Landmark, LogOut, MessageSquare, Tag, Plus } from 'lucide-react';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [org, setOrg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Dados Granulares
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  
  const [categories, setCategories] = useState<Category[]>([
    { id: '1', name: 'Alimentação', type: 'expense', budgetLimit: 500 },
    { id: '2', name: 'Moradia', type: 'expense', budgetLimit: 2000 },
    { id: '3', name: 'Salário', type: 'income' },
    { id: '4', name: 'Lazer', type: 'expense', budgetLimit: 300 }
  ]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isTransModalOpen, setIsTransModalOpen] = useState(false);

  useEffect(() => {
    // Check session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadUserData(session.user.id);
      else setLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) loadUserData(session.user.id);
      else {
        setOrg(null);
        setTransactions([]);
        setAccounts([]);
        setLoading(false);
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  const loadUserData = async (userId: string) => {
    try {
      setLoadingData(true);
      // 1. Buscar Organização
      const { data: members, error: orgError } = await supabase
        .from('organization_members')
        .select('organization_id, organizations(*)')
        .eq('user_id', userId)
        .limit(1);

      if (orgError) throw orgError;

      if (members && members.length > 0) {
        const organization = members[0].organizations;
        setOrg(organization);
        
        // 2. Carregar dados financeiros em paralelo
        const [transData, accData] = await Promise.all([
          financialService.getTransactions(organization.id),
          financialService.getBankAccounts(organization.id)
        ]);
        
        setTransactions(transData as any || []);
        setAccounts(accData as any || []);
      } else {
        // Se não tem org, criar uma padrão para o usuário (First time experience)
        const newOrg = await authService.createInitialOrg(userId);
        setOrg(newOrg);
      }
    } catch (e) {
      console.error("Erro ao carregar dados do usuário:", e);
    } finally {
      setLoading(false);
      setLoadingData(false);
    }
  };

  const handleAddTransaction = async (newTrans: Partial<Transaction>) => {
    if (!org) return;
    try {
      const saved = await financialService.createTransaction(newTrans, org.id);
      setTransactions(prev => [saved as any, ...prev]);
    } catch (e) {
      alert("Erro ao salvar transação");
    }
  };

  const handleToggleStatus = async (id: string) => {
    const trans = transactions.find(t => t.id === id);
    if (!trans) return;
    try {
      const updated = await financialService.updateTransaction(id, { isPaid: !trans.isPaid });
      setTransactions(prev => prev.map(t => t.id === id ? updated as any : t));
    } catch (e) {
      alert("Erro ao atualizar status");
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900">
        <Loader2 className="animate-spin text-indigo-500" size={48} />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0f172a] p-4">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-700">
          <Landmark className="text-indigo-600 mx-auto mb-6" size={48} />
          <h1 className="text-2xl font-bold text-center dark:text-white mb-8">FinAI SaaS Login</h1>
          <button 
            onClick={() => authService.signIn('demo@finai.com', 'password123')}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition"
          >
            Acessar com Conta Demo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden font-sans">
      {/* Sidebar e Layout mantidos conforme original mas agora dinâmicos */}
      <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-6 flex flex-col hidden lg:flex">
        <div className="mb-10 flex items-center gap-3">
           <Landmark className="text-indigo-600" size={24} />
           <span className="text-xl font-bold dark:text-white">FinAI SaaS</span>
        </div>
        
        <nav className="flex-1 space-y-1">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
            <LayoutDashboard size={20} /> <span className="font-medium">Dashboard</span>
          </button>
          <button onClick={() => setActiveTab('chat')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'chat' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
            <MessageSquare size={20} /> <span className="font-medium">Assistente IA</span>
          </button>
          <button onClick={() => setActiveTab('list')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'list' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
            <List size={20} /> <span className="font-medium">Lançamentos</span>
          </button>
          <button onClick={() => setActiveTab('accounts')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'accounts' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
            <Landmark size={20} /> <span className="font-medium">Contas</span>
          </button>
        </nav>

        <div className="mt-auto pt-6 border-t border-gray-700">
          <button onClick={() => authService.signOut()} className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition font-medium">
            <LogOut size={20} /> Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-4 lg:p-8">
        <header className="mb-8 flex justify-between items-center">
           <div>
              <h2 className="text-2xl font-bold dark:text-white">Bem-vindo, {session.user.email}</h2>
              <p className="text-gray-500 text-sm">Empresa: <span className="text-indigo-600 font-bold">{org?.name}</span></p>
           </div>
           <button 
             onClick={() => setIsTransModalOpen(true)}
             className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg transition flex items-center gap-2"
           >
             <Plus size={20} /> Novo Lançamento
           </button>
        </header>

        {loadingData ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-indigo-500" /></div>
        ) : (
          <>
            {activeTab === 'dashboard' && <Dashboard transactions={transactions} themeColor="indigo" categories={categories} />}
            {activeTab === 'list' && (
              <TransactionList 
                transactions={transactions} 
                categories={categories} 
                accounts={accounts}
                onUpdateTransaction={() => {}} 
                onToggleStatus={handleToggleStatus} 
              />
            )}
            {activeTab === 'accounts' && (
              <BankAccountManager 
                accounts={accounts} 
                transactions={transactions} 
                onAddAccount={(acc) => financialService.createBankAccount(acc, org.id).then(saved => setAccounts(p => [...p, saved as any]))}
                onUpdateAccount={() => {}} 
                onDeleteAccount={() => {}} 
              />
            )}
            {activeTab === 'chat' && (
              <ChatInterface 
                onAddTransaction={handleAddTransaction as any} 
                categories={categories} 
                userRules={[]} 
                onAddRule={() => {}} 
                themeColor="indigo" 
                transactions={transactions} 
              />
            )}
          </>
        )}
      </main>

      <TransactionModal 
        isOpen={isTransModalOpen} 
        onClose={() => setIsTransModalOpen(false)} 
        onSave={handleAddTransaction as any} 
        categories={categories} 
        accounts={accounts} 
        transactions={transactions} 
      />
    </div>
  );
};

export default App;
