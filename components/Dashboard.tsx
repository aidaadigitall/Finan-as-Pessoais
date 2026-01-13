import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { Transaction, TransactionType, TransactionStatus, ThemeColor, Category, RecurrenceLabels } from '../types';
import { TrendingUp, TrendingDown, DollarSign, Calendar, FileText, Target, AlertTriangle, ArrowUpCircle, ArrowDownCircle, Eye, Info, Wallet, PieChart as PieIcon } from 'lucide-react';

interface DashboardProps {
  transactions: Transaction[];
  themeColor: ThemeColor;
  categories: Category[];
}

// Psychological Colors: 
// Expense: Red/Rose (Alert), Income: Emerald (Growth), Balance: Blue (Trust)
const COLORS_EXPENSE = ['#ef4444', '#f87171', '#fca5a5', '#fbbf24', '#f59e0b', '#d97706'];
const COLORS_INCOME = ['#10b981', '#34d399', '#6ee7b7', '#059669'];

export const Dashboard: React.FC<DashboardProps> = ({ transactions, themeColor, categories }) => {
  const [period, setPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [expandedTransactionId, setExpandedTransactionId] = useState<string | null>(null);

  // Filter Transactions based on Period
  const filteredTransactions = transactions.filter(t => {
      const tDate = new Date(t.date);
      const now = new Date();

      if (period === 'monthly') {
          return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
      } else {
          // Annual = Current Year
          return tDate.getFullYear() === now.getFullYear();
      }
  });
  
  const stats = filteredTransactions.reduce(
    (acc, curr) => {
      if (curr.status !== TransactionStatus.CONFIRMED) return acc;
      const amount = curr.amount || 0;
      if (curr.type === TransactionType.INCOME) {
        acc.income += amount;
        acc.balance += amount;
      } else {
        acc.expense += amount;
        acc.balance -= amount;
      }
      return acc;
    },
    { income: 0, expense: 0, balance: 0 }
  );

  // Group by Category for Pie Chart
  const categoryData = filteredTransactions
    .filter(t => t.status === TransactionStatus.CONFIRMED && t.type === TransactionType.EXPENSE)
    .reduce((acc: any[], curr) => {
      const amount = curr.amount || 0;
      const existing = acc.find(item => item.name === curr.category);
      if (existing) {
        existing.value += amount;
      } else {
        acc.push({ name: curr.category, value: amount });
      }
      return acc;
    }, [])
    .sort((a, b) => b.value - a.value);

  // Chart Data Preparation
  let recentActivity = [];
  
  if (period === 'monthly') {
      const days = new Map();
      filteredTransactions.filter(t => t.status === TransactionStatus.CONFIRMED).forEach(t => {
          const day = new Date(t.date).getDate();
          const amount = t.amount || 0;
          // Calculate net for the day
          const val = t.type === TransactionType.INCOME ? amount : -amount;
          days.set(day, (days.get(day) || 0) + val);
      });
      
      const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
         recentActivity.push({ 
             name: i.toString(), 
             amount: days.get(i) || 0,
             // Helper for color coding bars
             fill: (days.get(i) || 0) >= 0 ? '#10b981' : '#ef4444' 
         });
      }
  } else {
      const months = new Map();
      filteredTransactions.filter(t => t.status === TransactionStatus.CONFIRMED).forEach(t => {
          const m = new Date(t.date).toLocaleString('default', { month: 'short' });
          const amount = t.amount || 0;
          const val = t.type === TransactionType.INCOME ? amount : -amount;
          months.set(m, (months.get(m) || 0) + val);
      });
      recentActivity = Array.from(months, ([name, amount]) => ({ 
          name, 
          amount,
          fill: amount >= 0 ? '#10b981' : '#ef4444'
      }));
  }

  const handleExportPDF = () => {
    window.print();
  };
  
  // Budget Logic
  const currentMonthTransactions = transactions.filter(t => {
      const now = new Date();
      const tDate = new Date(t.date);
      return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear() && t.status === TransactionStatus.CONFIRMED && t.type === TransactionType.EXPENSE;
  });
  const categoriesWithBudget = categories.filter(c => c.budgetLimit && c.budgetLimit > 0);
  const getBudgetProgress = (categoryName: string, limit: number) => {
      const spent = currentMonthTransactions
          .filter(t => t.category === categoryName)
          .reduce((sum, t) => sum + (t.amount || 0), 0);
      const percent = Math.min((spent / limit) * 100, 100);
      let color = 'bg-emerald-500';
      if (percent > 90) color = 'bg-red-500';
      else if (percent > 75) color = 'bg-amber-500';
      return { spent, percent, color };
  };

  const lastTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const toggleDetails = (id: string) => {
      setExpandedTransactionId(prev => prev === id ? null : id);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header & Filter */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 gap-4">
         <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <Wallet className="text-indigo-600 dark:text-indigo-400" />
                Painel Financeiro
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Visão geral da sua saúde financeira.</p>
         </div>
         
         <div className="flex items-center gap-3 w-full md:w-auto">
            <button 
               onClick={handleExportPDF}
               className="hidden md:flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl transition no-print bg-gray-50 dark:bg-gray-800"
            >
                <FileText size={16} /> Relatório
            </button>
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-xl p-1 no-print w-full md:w-auto">
                <button 
                onClick={() => setPeriod('monthly')}
                className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-semibold transition shadow-sm ${period === 'monthly' ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
                >
                Mensal
                </button>
                <button 
                onClick={() => setPeriod('annual')}
                className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-semibold transition shadow-sm ${period === 'annual' ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
                >
                Anual
                </button>
            </div>
         </div>
      </div>

      {/* Stats Cards - Financial Psychology Applied */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Balance - Blue (Trust/Stability) */}
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg shadow-indigo-200 dark:shadow-none transform transition hover:scale-[1.02]">
           <div className="relative z-10">
               <p className="text-blue-100 font-medium text-sm mb-1">Saldo Total</p>
               <h3 className="text-3xl font-bold tracking-tight">R$ {stats.balance.toFixed(2)}</h3>
               <div className="mt-4 flex items-center gap-2 text-blue-200 text-xs bg-white/10 w-fit px-2 py-1 rounded-lg backdrop-blur-sm">
                   <Target size={12} />
                   <span>{period === 'monthly' ? 'Resultado do Mês' : 'Acumulado do Ano'}</span>
               </div>
           </div>
           <DollarSign className="absolute right-[-20px] bottom-[-20px] text-white opacity-10" size={120} />
        </div>

        {/* Income - Green (Growth) */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between group hover:border-emerald-200 dark:hover:border-emerald-900 transition-colors">
          <div className="flex justify-between items-start">
             <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Receitas</p>
                <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  R$ {stats.income.toFixed(2)}
                </h3>
             </div>
             <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                <TrendingUp size={24} />
             </div>
          </div>
          <div className="w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full mt-4 overflow-hidden">
             <div className="bg-emerald-500 h-full rounded-full" style={{ width: '100%' }}></div>
          </div>
        </div>

        {/* Expense - Red (Caution/Alert) */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between group hover:border-red-200 dark:hover:border-red-900 transition-colors">
          <div className="flex justify-between items-start">
             <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Despesas</p>
                <h3 className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                  R$ {stats.expense.toFixed(2)}
                </h3>
             </div>
             <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl text-red-600 dark:text-red-400 group-hover:scale-110 transition-transform">
                <TrendingDown size={24} />
             </div>
          </div>
          <div className="w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full mt-4 overflow-hidden">
             {/* Simple visual ratio of expense vs income */}
             <div className="bg-red-500 h-full rounded-full" style={{ width: `${Math.min((stats.expense / (stats.income || 1)) * 100, 100)}%` }}></div>
          </div>
        </div>
      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Flow Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
             <TrendingUp size={20} className="text-gray-400" />
             Fluxo Financeiro
          </h3>
          <div className="h-72">
             {recentActivity.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={recentActivity}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.3} />
                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} tick={{fill: '#9ca3af'}} dy={10} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `R$${val}`} tick={{fill: '#9ca3af'}} />
                    <Tooltip 
                        cursor={{fill: '#f3f4f6', opacity: 0.4}} 
                        formatter={(value: number) => [`R$ ${Math.abs(value || 0).toFixed(2)}`, value >= 0 ? 'Saldo Positivo' : 'Saldo Negativo']}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                    />
                    <Bar dataKey="amount" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
             ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                    <BarChart size={48} className="mb-2 opacity-20" />
                    <p>Sem dados suficientes</p>
                </div>
             )}
          </div>
        </div>

        {/* Categories Pie Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2 flex items-center gap-2">
             <PieIcon size={20} className="text-gray-400" />
             Top Despesas
          </h3>
          <div className="h-60 relative">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS_EXPENSE[index % COLORS_EXPENSE.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => `R$ ${(value || 0).toFixed(2)}`} 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                    <PieIcon size={48} className="mb-2 opacity-20" />
                    <p>Sem despesas</p>
                </div>
            )}
            {/* Center Text Overlay */}
            {categoryData.length > 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                        <span className="text-xs text-gray-400 block">Total</span>
                        <span className="font-bold text-gray-700 dark:text-gray-200">
                            {categoryData.length} Cats
                        </span>
                    </div>
                </div>
            )}
          </div>
          <div className="flex flex-col gap-2 mt-2 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
             {categoryData.slice(0, 4).map((entry, index) => (
                 <div key={index} className="flex items-center justify-between text-xs">
                     <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: COLORS_EXPENSE[index % COLORS_EXPENSE.length]}}></span>
                        <span className="text-gray-600 dark:text-gray-300 truncate max-w-[100px]">{entry.name}</span>
                     </div>
                     <span className="font-medium text-gray-700 dark:text-gray-200">R$ {entry.value.toFixed(0)}</span>
                 </div>
             ))}
          </div>
        </div>
      </div>

      {/* Budget & Recent Transactions Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Budget Monitoring */}
          {categoriesWithBudget.length > 0 && period === 'monthly' && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                    <Target size={20} className="text-emerald-500" />
                    Metas de Gastos
                </h3>
                <div className="space-y-5">
                    {categoriesWithBudget.slice(0, 4).map(cat => {
                        const { spent, percent, color } = getBudgetProgress(cat.name, cat.budgetLimit!);
                        return (
                            <div key={cat.id}>
                                <div className="flex justify-between items-end mb-1">
                                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{cat.name}</span>
                                    <div className="text-right">
                                        <span className={`text-xs font-bold ${percent > 100 ? 'text-red-500' : 'text-gray-500'}`}>
                                            {percent.toFixed(0)}%
                                        </span>
                                    </div>
                                </div>
                                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 mb-1">
                                    <div className={`h-2 rounded-full transition-all duration-700 ${color}`} style={{ width: `${percent}%` }}></div>
                                </div>
                                <div className="flex justify-between text-[10px] text-gray-400">
                                    <span>R$ {spent.toFixed(0)}</span>
                                    <span>Meta: R$ {cat.budgetLimit}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
          )}

          {/* Recent Transactions List */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                <Info size={20} className="text-blue-500" />
                Lançamentos Recentes
              </h3>
              <div className="overflow-hidden">
                {lastTransactions.length > 0 ? (
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {lastTransactions.map(t => (
                            <div key={t.id} className="py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg px-2 transition-colors -mx-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full ${t.type === TransactionType.INCOME ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' : 'bg-red-50 text-red-600 dark:bg-red-900/20'}`}>
                                            {t.type === TransactionType.INCOME ? <ArrowUpCircle size={18} /> : <ArrowDownCircle size={18} />}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-800 dark:text-white text-sm">{t.description}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {new Date(t.date).toLocaleDateString('pt-BR', {day: '2-digit', month: 'short'})} • {t.category}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`font-bold text-sm ${t.type === TransactionType.INCOME ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                            {t.type === TransactionType.INCOME ? '+' : '-'} R$ {t.amount.toFixed(2)}
                                        </span>
                                        <button 
                                        onClick={() => toggleDetails(t.id)}
                                        className={`p-1.5 rounded-full transition ${expandedTransactionId === t.id ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30' : 'text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'}`}
                                        title="Detalhes"
                                        >
                                            <Eye size={16} />
                                        </button>
                                    </div>
                                </div>
                                
                                {expandedTransactionId === t.id && (
                                    <div className="mt-3 bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg text-sm animate-in fade-in slide-in-from-top-1 ml-11">
                                        <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                                            <div>
                                                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Fonte</p>
                                                <p className="text-gray-700 dark:text-gray-300 text-xs">{t.source === 'whatsapp_ai' ? 'IA / WhatsApp' : 'Manual'}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Recorrência</p>
                                                <p className="text-gray-700 dark:text-gray-300 text-xs">{t.recurrence && t.recurrence !== 'none' ? RecurrenceLabels[t.recurrence] : 'Única'}</p>
                                            </div>
                                            {t.originalInput && (
                                                <div className="col-span-2 mt-1 pt-2 border-t border-gray-200 dark:border-gray-600">
                                                    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Input Original</p>
                                                    <p className="italic text-gray-600 dark:text-gray-400 text-xs">"{t.originalInput}"</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">Nenhum lançamento recente.</p>
                )}
              </div>
          </div>
      </div>
    </div>
  );
};