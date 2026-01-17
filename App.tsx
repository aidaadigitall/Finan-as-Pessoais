
import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { authService } from './services/authService';
import { financialService } from './services/financialService';
import { Transaction, BankAccount, Category } from './types';
import { Dashboard } from './components/Dashboard';
import { TransactionList } from './components/TransactionList';
import { ChatInterface } from './components/ChatInterface';
import { BankAccountManager } from './components/BankAccountManager';
import { TransactionModal } from './components/TransactionModal';
import { Settings } from './components/Settings';
import { 
  Loader2, 
  LayoutDashboard, 
  List, 
  Landmark, 
  LogOut, 
  MessageSquare, 
  Plus, 
  Settings as SettingsIcon 
} from 'lucide-react';

// Interfaces para tipagem robusta do SaaS
interface Organization {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
}

interface OrgMemberResponse {
  organization_id: string;
  organizations: Organization;
}

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  
  // Estados de Dados
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [categories, setCategories] = useState<Category[]>([
    { id: '1', name: 'Alimentação', type: 'expense', budgetLimit: 500 },
    { id: '2', name: 'Moradia', type: 'expense', budgetLimit: 2000 },
    { id: '3', name: 'Salário', type: 'income' },
    { id: '4', name: 'Lazer', type: 'expense', budgetLimit: 300 }
  ]);

  // UI State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isTransModalOpen, setIsTransModalOpen] = useState(false);
  const [themeColor, setThemeColor] = useState<any>('indigo');

  useEffect(() => {
    // Inicialização da sessão
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadUserData(session.user.id);
      else setLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        loadUserData(session.user.id);
      } else {
        setCurrentOrg(null);
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
      
      // Busca as organizações às quais o usuário pertence
      const { data, error: orgError } = await supabase
        .from('organization_members')
        .select(`
          organization_id,
          organizations (
            id,
            name,
            slug,
            owner_id
          )
        `)
        .eq('user_id', userId);

      if (orgError) throw orgError;

      // Tipagem defensiva: data é um array. Pegamos o primeiro registro.
      const members = data as unknown as OrgMemberResponse[];

      if (members && members.length > 0) {
        const organization = members[0].organizations;
        setCurrentOrg(organization);
        
        // Carrega dados financeiros vinculados à organização ativa
        await refreshFinancialData(organization.id);
      } else {
        // Fluxo de primeiro acesso: cria organização padrão
        const newOrg = await authService.createInitialOrg(userId);
        setCurrentOrg(newOrg);
        await refreshFinancialData(newOrg.id);
      }
    } catch (e) {
      console.error("Erro ao carregar dados do usuário:", e);
    } finally {
      setLoading(false);
      setLoadingData(false);
    }
  };

  const refreshFinancialData = async (orgId: string) => {
    const [transData, accData] = await Promise.all([
      financialService.getTransactions(orgId),
      financialService.getBankAccounts(orgId)
    ]);
    
    setTransactions(transData as any || []);
    setAccounts(accData as any || []);
  };

  const handleAddTransaction = async (newTrans: Partial<Transaction>) => {
    if (!currentOrg) return;
    try {
      const saved = await financialService.createTransaction(newTrans, currentOrg.id);
      setTransactions(prev => [saved as any, ...prev]);
      // Atualiza saldos das contas
      refreshFinancialData(currentOrg.id);
    } catch (e) {
      console.error(e);
      alert("Erro ao salvar transação");
    }
  };

  const handleToggleStatus = async (id: string) => {
    const trans = transactions.find(t => t.id === id);
    if (!trans || !currentOrg) return;
    try {
      const updated = await financialService.updateTransaction(id, { is_paid: !trans.isPaid } as any);
      setTransactions(prev => prev.map(t => t.id === id ? { ...t, isPaid: !t.isPaid } : t));
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
          <p className="text-center text-gray-500 text-xs mt-6 uppercase tracking-widest font-bold">
            Ambiente Seguro & Criptografado
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden font-sans">
      {/* Sidebar - Desktop */}
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
          <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'settings' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
            <SettingsIcon size={20} /> <span className="font-medium">Ajustes</span>
          </button>
        </nav>

        <div className="mt-auto pt-6 border-t border-gray-700">
          <button onClick={() => authService.signOut()} className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition font-medium">
            <LogOut size={20} /> Sair
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 lg:p-8">
        <header className="mb-8 flex justify-between items-center">
           <div>
              <h2 className="text-2xl font-bold dark:text-white">Olá, {session.user.email?.split('@')[0]}</h2>
              <p className="text-gray-500 text-sm">Organização Ativa: <span className="text-indigo-600 font-bold">{currentOrg?.name || 'Carregando...'}</span></p>
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
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && <Dashboard transactions={transactions} themeColor={themeColor} categories={categories} />}
            
            {activeTab === 'list' && (
              <TransactionList 
                transactions={transactions} 
                categories={categories} 
                accounts={accounts}
                onUpdateTransaction={async (t) => {
                   await financialService.updateTransaction(t.id, t as any);
                   if (currentOrg) refreshFinancialData(currentOrg.id);
                }} 
                onToggleStatus={handleToggleStatus} 
              />
            )}

            {activeTab === 'accounts' && (
              <BankAccountManager 
                accounts={accounts} 
                transactions={transactions} 
                onAddAccount={(acc) => {
                  if (currentOrg) {
                    financialService.createBankAccount(acc, currentOrg.id).then(() => refreshFinancialData(currentOrg.id));
                  }
                }}
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
                themeColor={themeColor} 
                transactions={transactions} 
              />
            )}

            {activeTab === 'settings' && (
              <Settings 
                themeColor={themeColor}
                setThemeColor={setThemeColor}
                userName={session.user.email}
                setUserName={() => {}}
                userPhone=""
                setUserPhone={() => {}}
                aiRules={[]}
                onAddAiRule={() => {}}
                onDeleteAiRule={() => {}}
                onResetData={() => {}}
              />
            )}
          </div>
        )}
      </main>

      {/* Modais Globais */}
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
