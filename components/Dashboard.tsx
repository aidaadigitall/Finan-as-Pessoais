import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { Transaction, TransactionType, TransactionStatus, ThemeColor, Category, RecurrenceLabels } from '../types';
import { TrendingUp, TrendingDown, DollarSign, Wallet, FileText, Target, ArrowUpCircle, ArrowDownCircle, Eye, Activity, PieChart as PieIcon, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

interface DashboardProps {
  transactions: Transaction[];
  themeColor: ThemeColor;
  categories: Category[];
}

// Psychology of Money Palettes
const COLORS_EXPENSE = ['#f43f5e', '#fb7185', '#fda4af', '#fbbf24', '#f59e0b', '#d97706']; // Rose to Amber (Urgency to Caution)
const COLORS_INCOME = ['#10b981', '#34d399', '#6ee7b7', '#059669']; // Emerald (Growth)

export const Dashboard: React.FC<DashboardProps> = ({ transactions, themeColor, categories }) => {
  const [period, setPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [expandedTransactionId, setExpandedTransactionId] = useState<string | null>(null);

  // --- Data Processing Logic ---

  const filteredTransactions = transactions.filter(t => {
      const tDate = new Date(t.date);
      const now = new Date();
      if (period === 'monthly') {
          return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
      } else {
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
      } else if (curr.type === TransactionType.EXPENSE) {
        acc.expense += amount;
        acc.balance -= amount;
      }
      return acc;
    },
    { income: 0, expense: 0, balance: 0 }
  );

  // Savings Rate (Psychology: "Wealth is what you don't spend")
  const savingsRate = stats.income > 0 ? ((stats.income - stats.expense) / stats.income) * 100 : 0;

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
  let chartData = [];
  let accumulatedData = [];
  let currentBalance = 0;
  
  const generateChartData = () => {
    const dataMap = new Map();
    const isMonthly = period === 'monthly';
    const loopLimit = isMonthly 
        ? new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() 
        : 12;
    const labels = isMonthly 
        ? Array.from({length: loopLimit}, (_, i) => (i + 1).toString()) 
        : ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    // Pre-fill
    filteredTransactions.filter(t => t.status === TransactionStatus.CONFIRMED).forEach(t => {
        const key = isMonthly ? new Date(t.date).getDate() - 1 : new Date(t.date).getMonth();
        const amount = t.amount || 0;
        const net = t.type === TransactionType.INCOME ? amount : (t.type === TransactionType.EXPENSE ? -amount : 0);
        
        if (!dataMap.has(key)) dataMap.set(key, { income: 0, expense: 0, net: 0 });
        const entry = dataMap.get(key);
        if (t.type === TransactionType.INCOME) entry.income += amount;
        if (t.type === TransactionType.EXPENSE) entry.expense += amount;
        entry.net += net;
    });

    const recent = [];
    const accumulated = [];
    let runningBalance = 0;

    for (let i = 0; i < loopLimit; i++) {
        // Stop annual chart at current month
        if (!isMonthly && i > new Date().getMonth()) break;

        const entry = dataMap.get(i) || { income: 0, expense: 0, net: 0 };
        runningBalance += entry.net;

        recent.push({
            name: labels[i],
            Receitas: entry.income,
            Despesas: entry.expense,
            Net: entry.net
        });

        accumulated.push({
            name: labels[i],
            balance: runningBalance
        });
    }
    return { recent, accumulated };
  };

  const { recent: recentActivity, accumulated: accumulatedDataResult } = generateChartData();

  // Budget Logic
  const categoriesWithBudget = categories.filter(c => c.budgetLimit && c.budgetLimit > 0);
  const getBudgetProgress = (categoryName: string, limit: number) => {
      const spent = filteredTransactions
          .filter(t => t.category === categoryName && t.type === TransactionType.EXPENSE)
          .reduce((sum, t) => sum + (t.amount || 0), 0);
      const percent = Math.min((spent / limit) * 100, 100);
      let color = 'bg-emerald-500';
      if (percent > 90) color = 'bg-rose-500';
      else if (percent > 75) color = 'bg-amber-500';
      return { spent, percent, color };
  };

  const lastTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const toggleDetails = (id: string) => {
      setExpandedTransactionId(prev => prev === id ? null : id);
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
         <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white tracking-tight">
                Visão Geral
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
                Gerencie sua riqueza com racionalidade e clareza.
            </p>
         </div>
         
         <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <button 
                onClick={() => setPeriod('monthly')}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${period === 'monthly' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
                Mês Atual
            </button>
            <button 
                onClick={() => setPeriod('annual')}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${period === 'annual' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
                Ano Atual
            </button>
         </div>
      </div>

      {/* Psychology of Money Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* 1. BALANCE: Blue/Indigo -> Represents Trust, Stability, Logic */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 p-6 text-white shadow-xl shadow-indigo-200 dark:shadow-none transition-transform hover:scale-[1.01]">
           <div className="relative z-10 flex flex-col h-full justify-between">
               <div className="flex justify-between items-start">
                   <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                       <ShieldCheck size={24} className="text-white" />
                   </div>
                   {savingsRate > 20 && (
                       <span className="px-2 py-1 bg-emerald-400/20 backdrop-blur-md rounded text-[10px] font-bold uppercase tracking-wider text-emerald-100 border border-emerald-400/30">
                           Saúde Alta
                       </span>
                   )}
               </div>
               <div>
                   <p className="text-indigo-100 text-sm font-medium mb-1">Saldo Líquido</p>
                   <h3 className="text-3xl font-bold tracking-tight">{formatCurrency(stats.balance)}</h3>
                   <div className="mt-2 text-xs text-indigo-200 flex items-center gap-1">
                       <Wallet size={12} />
                       <span>Disponível para construir riqueza</span>
                   </div>
               </div>
           </div>
           {/* Abstract Decoration */}
           <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-white/10 to-transparent skew-x-12 opacity-50"></div>
           <DollarSign className="absolute -right-6 -bottom-6 text-white/10 rotate-12" size={140} />
        </div>

        {/* 2. INCOME: Emerald/Teal -> Represents Growth, Nature, Vitality */}
        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-6 shadow-sm transition-all hover:border-emerald-200 dark:hover:border-emerald-800 group">
           <div className="flex justify-between items-start mb-6">
               <div>
                   <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Entradas</p>
                   <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{formatCurrency(stats.income)}</h3>
               </div>
               <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                   <TrendingUp size={22} />
               </div>
           </div>
           <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{width: '100%'}}></div>
                </div>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">100%</span>
           </div>
           <p className="mt-3 text-xs text-gray-400">Recursos gerados no período.</p>
        </div>

        {/* 3. EXPENSE: Rose/Pink -> Represents Caution, Attention (Not panic red) */}
        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-6 shadow-sm transition-all hover:border-rose-200 dark:hover:border-rose-800 group">
           <div className="flex justify-between items-start mb-6">
               <div>
                   <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Saídas</p>
                   <h3 className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">{formatCurrency(stats.expense)}</h3>
               </div>
               <div className="p-2.5 bg-rose-50 dark:bg-rose-900/20 rounded-xl text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform">
                   <TrendingDown size={22} />
               </div>
           </div>
           <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    {/* Visual Ratio */}
                    <div 
                        className={`h-full rounded-full ${stats.expense > stats.income ? 'bg-red-600' : 'bg-rose-500'}`} 
                        style={{width: `${Math.min((stats.expense / (stats.income || 1)) * 100, 100)}%`}}
                    ></div>
                </div>
                <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                    {((stats.expense / (stats.income || 1)) * 100).toFixed(0)}%
                </span>
           </div>
           <p className="mt-3 text-xs text-gray-400">Comprometimento da renda.</p>
        </div>
      </div>

      {/* Main Analysis Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Wealth Accumulation Chart (Area) - The "Big Picture" */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <Activity size={20} className="text-indigo-500" />
                    Acumulação de Capital
                </h3>
                {period === 'monthly' && (
                    <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 rounded-md">
                        Fluxo Diário
                    </span>
                )}
            </div>
            
            <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={accumulatedDataResult}>
                        <defs>
                            <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.3} />
                        <XAxis 
                            dataKey="name" 
                            fontSize={12} 
                            tickLine={false} 
                            axisLine={false} 
                            tick={{fill: '#9ca3af'}} 
                            dy={10} 
                            interval={period === 'monthly' ? 4 : 0}
                        />
                        <YAxis 
                            fontSize={12} 
                            tickLine={false} 
                            axisLine={false} 
                            tickFormatter={(val) => `R$${val/1000}k`} 
                            tick={{fill: '#9ca3af'}} 
                        />
                        <Tooltip 
                            formatter={(value: number) => [`${formatCurrency(value)}`, 'Acumulado']}
                            contentStyle={{ 
                                borderRadius: '12px', 
                                border: 'none', 
                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', 
                                padding: '12px',
                                backgroundColor: 'rgba(255, 255, 255, 0.95)'
                            }}
                        />
                        <Area 
                            type="monotone" 
                            dataKey="balance" 
                            stroke="#6366f1" 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#colorBalance)" 
                            animationDuration={1500}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Psychology: "Where is the money going?" Pie Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2 flex items-center gap-2">
                <PieIcon size={20} className="text-rose-400" />
                Destino dos Recursos
            </h3>
            
            <div className="flex-1 min-h-[200px] relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={categoryData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                            cornerRadius={4}
                        >
                            {categoryData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS_EXPENSE[index % COLORS_EXPENSE.length]} />
                            ))}
                        </Pie>
                        <Tooltip 
                            formatter={(value: number) => formatCurrency(value)} 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                    </PieChart>
                </ResponsiveContainer>
                
                {/* Center Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                     <span className="text-xs text-gray-400 font-medium uppercase tracking-widest">Total</span>
                     <span className="text-sm font-bold text-gray-700 dark:text-gray-200">
                        {categoryData.length} Cats
                     </span>
                </div>
            </div>

            <div className="mt-4 space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {categoryData.slice(0, 5).map((entry, index) => (
                    <div key={index} className="flex items-center justify-between group cursor-default">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-8 rounded-full transition-all group-hover:h-4" style={{backgroundColor: COLORS_EXPENSE[index % COLORS_EXPENSE.length]}}></div>
                            <div>
                                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{entry.name}</p>
                                <p className="text-[10px] text-gray-400">
                                    {((entry.value / stats.expense) * 100).toFixed(1)}% do total
                                </p>
                            </div>
                        </div>
                        <span className="text-xs font-bold text-gray-600 dark:text-gray-400">
                            {formatCurrency(entry.value)}
                        </span>
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* Comparative Flow (Bar Chart) */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
         <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
             <ArrowRight size={20} className="text-gray-400" />
             Entradas vs Saídas
         </h3>
         <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={recentActivity} barGap={0} barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.3} />
                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} tick={{fill: '#9ca3af'}} dy={10} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `R$${val/1000}k`} tick={{fill: '#9ca3af'}} />
                    <Tooltip 
                        cursor={{fill: '#f3f4f6', opacity: 0.4}} 
                        formatter={(value: number) => [formatCurrency(value)]}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                    />
                    <Bar dataKey="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} stackId="a" />
                    <Bar dataKey="Despesas" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={40} stackId="b" />
                </BarChart>
            </ResponsiveContainer>
         </div>
      </div>

      {/* Bottom Section: Budget & Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Budget Monitoring (Psychology: Limits create Freedom) */}
          {categoriesWithBudget.length > 0 && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <Target size={20} className="text-indigo-500" />
                        Metas Financeiras
                    </h3>
                    <span className="text-xs text-indigo-500 font-medium bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded">
                        Planejamento
                    </span>
                </div>
                
                <div className="space-y-6">
                    {categoriesWithBudget.slice(0, 4).map(cat => {
                        const { spent, percent, color } = getBudgetProgress(cat.name, cat.budgetLimit!);
                        return (
                            <div key={cat.id} className="relative">
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{cat.name}</span>
                                    <span className="text-xs font-medium text-gray-500">
                                        {percent.toFixed(0)}% <span className="text-[10px] text-gray-400">usado</span>
                                    </span>
                                </div>
                                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3 overflow-hidden shadow-inner">
                                    <div className={`h-full rounded-full transition-all duration-1000 ease-out ${color}`} style={{ width: `${percent}%` }}></div>
                                </div>
                                <div className="flex justify-between text-[10px] text-gray-400 mt-1 font-mono">
                                    <span>{formatCurrency(spent)}</span>
                                    <span>Meta: {formatCurrency(cat.budgetLimit!)}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
          )}

          {/* Recent List */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                <Zap size={20} className="text-amber-500" />
                Atividade Recente
              </h3>
              <div className="space-y-1">
                {lastTransactions.length > 0 ? lastTransactions.map((t, idx) => (
                    <div key={t.id} onClick={() => toggleDetails(t.id)} className="group cursor-pointer rounded-xl p-3 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-full ${t.type === TransactionType.INCOME ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' : 'bg-rose-50 text-rose-600 dark:bg-rose-900/20'} transition-transform group-hover:scale-105`}>
                                    {t.type === TransactionType.INCOME ? <ArrowUpCircle size={18} /> : <ArrowDownCircle size={18} />}
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                        {t.description}
                                    </p>
                                    <p className="text-[10px] text-gray-400">
                                        {new Date(t.date).toLocaleDateString('pt-BR', {day: '2-digit', month: 'short'})} • {t.category}
                                    </p>
                                </div>
                            </div>
                            <span className={`font-bold text-sm ${t.type === TransactionType.INCOME ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                {t.type === TransactionType.INCOME ? '+' : '-'} {formatCurrency(t.amount)}
                            </span>
                        </div>
                        
                        {/* Expanded Detail */}
                        {expandedTransactionId === t.id && (
                            <div className="mt-2 pl-12 text-xs text-gray-500 animate-in slide-in-from-top-1 fade-in">
                                <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                                    <p>Fonte: {t.source === 'whatsapp_ai' ? 'Automático (IA)' : 'Manual'}</p>
                                    {t.originalInput && <p className="italic mt-1">"{t.originalInput}"</p>}
                                </div>
                            </div>
                        )}
                    </div>
                )) : (
                    <div className="text-center py-10 text-gray-400">
                        <p>Nenhuma transação recente.</p>
                    </div>
                )}
              </div>
          </div>
      </div>
    </div>
  );
};