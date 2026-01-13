import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Transaction, TransactionType, TransactionStatus, ThemeColor } from '../types';
import { TrendingUp, TrendingDown, DollarSign, Calendar, FileText } from 'lucide-react';

interface DashboardProps {
  transactions: Transaction[];
  themeColor: ThemeColor;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ef4444', '#3b82f6'];

export const Dashboard: React.FC<DashboardProps> = ({ transactions, themeColor }) => {
  const [period, setPeriod] = useState<'monthly' | 'annual'>('monthly');

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
    .sort((a, b) => b.value - a.value); // Sort biggest expenses first

  // Bar Chart Data - Grouped by Day (Monthly) or Month (Annual)
  let recentActivity = [];
  
  if (period === 'monthly') {
      // Group by Day
      const days = new Map();
      filteredTransactions.filter(t => t.status === TransactionStatus.CONFIRMED).forEach(t => {
          const day = new Date(t.date).getDate();
          const amount = t.amount || 0;
          const val = t.type === TransactionType.INCOME ? amount : -amount;
          days.set(day, (days.get(day) || 0) + val);
      });
      
      // Create array for all days in month so chart is chronological
      const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
         if (days.has(i)) {
             recentActivity.push({ name: i.toString(), amount: days.get(i) });
         }
      }
      recentActivity.sort((a,b) => parseInt(a.name) - parseInt(b.name));

  } else {
      // Group by Month
      const months = new Map();
      filteredTransactions.filter(t => t.status === TransactionStatus.CONFIRMED).forEach(t => {
          const m = new Date(t.date).toLocaleString('default', { month: 'short' });
          const amount = t.amount || 0;
          const val = t.type === TransactionType.INCOME ? amount : -amount;
          months.set(m, (months.get(m) || 0) + val);
      });
      // Convert map to array
      recentActivity = Array.from(months, ([name, amount]) => ({ name, amount }));
  }

  const handleExportPDF = () => {
    window.print();
  };
  
  // Dynamic color class mapping
  const getThemeText = () => {
      switch(themeColor) {
          case 'blue': return 'text-blue-600';
          case 'emerald': return 'text-emerald-600';
          case 'violet': return 'text-violet-600';
          case 'rose': return 'text-rose-600';
          default: return 'text-indigo-600';
      }
  };

  const getThemeButton = (isActive: boolean) => {
      if (!isActive) return 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200';
      
      switch(themeColor) {
          case 'blue': return 'bg-white dark:bg-gray-800 text-blue-600 shadow-sm';
          case 'emerald': return 'bg-white dark:bg-gray-800 text-emerald-600 shadow-sm';
          case 'violet': return 'bg-white dark:bg-gray-800 text-violet-600 shadow-sm';
          case 'rose': return 'bg-white dark:bg-gray-800 text-rose-600 shadow-sm';
          default: return 'bg-white dark:bg-gray-800 text-indigo-600 shadow-sm';
      }
  }

  return (
    <div className="space-y-6">
      {/* Header & Filter */}
      <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
         <h2 className={`font-semibold flex items-center gap-2 text-gray-700 dark:text-gray-200`}>
            <Calendar size={20} className={getThemeText()} />
            Resumo {period === 'monthly' ? 'Mensal' : 'Anual'}
         </h2>
         <div className="flex items-center gap-4">
            <button 
               onClick={handleExportPDF}
               className="hidden md:flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg transition no-print"
            >
                <FileText size={16} /> PDF
            </button>
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 no-print">
                <button 
                onClick={() => setPeriod('monthly')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${getThemeButton(period === 'monthly')}`}
                >
                Mês Atual
                </button>
                <button 
                onClick={() => setPeriod('annual')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${getThemeButton(period === 'annual')}`}
                >
                Ano Atual
                </button>
            </div>
         </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Saldo {period === 'monthly' ? 'do Mês' : 'do Ano'}</p>
            <h3 className={`text-2xl font-bold ${stats.balance >= 0 ? 'text-gray-900 dark:text-white' : 'text-red-600'}`}>
              R$ {stats.balance.toFixed(2)}
            </h3>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-full text-blue-600 dark:text-blue-400">
            <DollarSign size={24} />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Receitas</p>
            <h3 className="text-2xl font-bold text-green-600 dark:text-green-400">
              R$ {stats.income.toFixed(2)}
            </h3>
          </div>
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-full text-green-600 dark:text-green-400">
            <TrendingUp size={24} />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Despesas</p>
            <h3 className="text-2xl font-bold text-red-600 dark:text-red-400">
              R$ {stats.expense.toFixed(2)}
            </h3>
          </div>
          <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-full text-red-600 dark:text-red-400">
            <TrendingDown size={24} />
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 page-break-inside-avoid">
        {/* Expense Breakdown */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Despesas por Categoria</h3>
          <div className="h-64">
            {categoryData.length > 0 ? (
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
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => `R$ ${(value || 0).toFixed(2)}`} 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
               <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-500">Sem dados para o período</div>
            )}
          </div>
          <div className="flex flex-wrap gap-2 mt-4 justify-center">
             {categoryData.map((entry, index) => (
                 <div key={index} className="flex items-center text-xs text-gray-600 dark:text-gray-300">
                     <span className="w-3 h-3 rounded-full mr-1" style={{backgroundColor: COLORS[index % COLORS.length]}}></span>
                     {entry.name}
                 </div>
             ))}
          </div>
        </div>

        {/* Recent Flow */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Fluxo de Caixa ({period === 'monthly' ? 'Diário' : 'Mensal'})</h3>
          <div className="h-64">
             {recentActivity.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={recentActivity}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.5} />
                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} tick={{fill: '#9ca3af'}} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `R$${val}`} tick={{fill: '#9ca3af'}} />
                    <Tooltip 
                        cursor={{fill: 'transparent'}} 
                        formatter={(value: number) => `R$ ${(value || 0).toFixed(2)}`}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#fff' }}
                        itemStyle={{ color: '#374151' }}
                    />
                    <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
             ) : (
                <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-500">Sem transações no período</div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};