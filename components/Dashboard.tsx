
import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { Transaction, TransactionType, TransactionStatus, ThemeColor, Category, RecurrenceLabels } from '../types';
import { TrendingUp, TrendingDown, DollarSign, Wallet, FileText, Target, ArrowUpCircle, ArrowDownCircle, Eye, Activity, PieChart as PieIcon, ArrowRight, ShieldCheck, Zap, ChevronRight, Filter } from 'lucide-react';

interface DashboardProps {
  transactions: Transaction[];
  themeColor: ThemeColor;
  categories: Category[];
}

const COLORS_EXPENSE = ['#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export const Dashboard: React.FC<DashboardProps> = ({ transactions, themeColor, categories }) => {
  const [period, setPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [selectedParentCategory, setSelectedParentCategory] = useState<string | null>(null);

  const filteredTransactions = transactions.filter(t => {
      const tDate = new Date(t.date);
      const now = new Date();
      if (period === 'monthly') {
          return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
      } else {
          return tDate.getFullYear() === now.getFullYear();
      }
  });

  // Mapeamento de categoria -> categoria pai para agregação
  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach(c => map.set(c.name, c));
    return map;
  }, [categories]);

  // Agregação por Categoria Pai
  const parentCategoryData = useMemo(() => {
    const data: Record<string, number> = {};
    filteredTransactions
      .filter(t => t.type === TransactionType.EXPENSE && t.isPaid) // Considera apenas pagos
      .forEach(t => {
        const cat = categoryMap.get(t.category);
        let parentName = t.category;
        
        if (cat && cat.parentId) {
            const parent = categories.find(c => c.id === cat.parentId);
            if (parent) parentName = parent.name;
        }
        
        data[parentName] = (data[parentName] || 0) + t.amount;
      });

    return Object.entries(data)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTransactions, categoryMap, categories]);

  // Detalhamento de subcategorias da categoria pai selecionada
  const subCategoryData = useMemo(() => {
    if (!selectedParentCategory) return [];
    const parent = categories.find(c => c.name === selectedParentCategory);
    if (!parent) return [];

    const data: Record<string, number> = {};
    filteredTransactions
      .filter(t => t.type === TransactionType.EXPENSE && t.isPaid)
      .forEach(t => {
        const cat = categoryMap.get(t.category);
        if (cat && (cat.id === parent.id || cat.parentId === parent.id)) {
            data[t.category] = (data[t.category] || 0) + t.amount;
        }
      });

    return Object.entries(data)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [selectedParentCategory, filteredTransactions, categoryMap, categories]);

  // Cálculo de totais (Cards Superiores)
  const stats = filteredTransactions.reduce(
    (acc, curr) => {
      // CORREÇÃO: Verifica estritamente se está PAGO (isPaid). 
      // Se estiver pendente, não soma no saldo líquido nem nos totais.
      if (!curr.isPaid) return acc;

      const amount = curr.amount || 0;
      if (curr.type === TransactionType.INCOME) { acc.income += amount; acc.balance += amount; }
      else if (curr.type === TransactionType.EXPENSE) { acc.expense += amount; acc.balance -= amount; }
      return acc;
    },
    { income: 0, expense: 0, balance: 0 }
  );

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
         <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white tracking-tight">Análise Estratégica</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Visão detalhada do fluxo de caixa realizado.</p>
         </div>
         <div className="flex bg-white dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700">
            <button onClick={() => setPeriod('monthly')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${period === 'monthly' ? 'bg-indigo-600 text-white' : 'text-gray-500'}`}>MÊS</button>
            <button onClick={() => setPeriod('annual')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${period === 'annual' ? 'bg-indigo-600 text-white' : 'text-gray-500'}`}>ANO</button>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-indigo-600 p-6 rounded-[2rem] text-white shadow-xl">
           <p className="text-indigo-100 text-xs font-black uppercase tracking-widest mb-1">Saldo Líquido (Realizado)</p>
           <h3 className="text-3xl font-black">{formatCurrency(stats.balance)}</h3>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm">
           <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-1">Total Entradas</p>
           <h3 className="text-3xl font-black text-emerald-500">{formatCurrency(stats.income)}</h3>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm">
           <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-1">Total Saídas</p>
           <h3 className="text-3xl font-black text-rose-500">{formatCurrency(stats.expense)}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gráfico de Categorias Pai */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700">
           <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-gray-800 dark:text-white uppercase tracking-tighter text-lg">Gastos por Categoria</h3>
              <PieIcon size={20} className="text-gray-300" />
           </div>
           <div className="h-64 relative">
              <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Pie
                        data={parentCategoryData}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        onClick={(data) => setSelectedParentCategory(data.name)}
                    >
                        {parentCategoryData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS_EXPENSE[index % COLORS_EXPENSE.length]} className="cursor-pointer" />
                        ))}
                    </Pie>
                    <Tooltip formatter={(val: number) => formatCurrency(val)} />
                 </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                 <span className="text-[10px] font-black text-gray-400 uppercase">Clique para detalhar</span>
              </div>
           </div>
           <div className="mt-6 space-y-2">
              {parentCategoryData.map((item, index) => (
                <button 
                  key={item.name} 
                  onClick={() => setSelectedParentCategory(item.name)}
                  className={`w-full flex justify-between items-center p-3 rounded-2xl transition ${selectedParentCategory === item.name ? 'bg-indigo-50 dark:bg-indigo-900/30 ring-1 ring-indigo-200' : 'hover:bg-gray-50 dark:hover:bg-gray-900'}`}
                >
                   <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS_EXPENSE[index % COLORS_EXPENSE.length] }} />
                      <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{item.name}</span>
                   </div>
                   <span className="text-sm font-black text-gray-900 dark:text-white">{formatCurrency(item.value)}</span>
                </button>
              ))}
           </div>
        </div>

        {/* Detalhamento de Subcategorias (Drill-down) */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700">
            {selectedParentCategory ? (
               <div className="animate-in slide-in-from-right-4">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="font-black text-gray-800 dark:text-white uppercase tracking-tighter text-lg flex items-center gap-2">
                         <ChevronRight size={20} className="text-indigo-500" />
                         {selectedParentCategory} <span className="text-gray-400 font-medium text-xs">Subcategorias</span>
                      </h3>
                      <button onClick={() => setSelectedParentCategory(null)} className="text-xs font-black text-indigo-600 hover:underline">VOLTAR</button>
                  </div>
                  
                  <div className="space-y-4">
                     {subCategoryData.map((sub, idx) => {
                        const parentValue = parentCategoryData.find(p => p.name === selectedParentCategory)?.value || 1;
                        const percent = (sub.value / parentValue) * 100;
                        
                        return (
                           <div key={sub.name} className="space-y-1">
                              <div className="flex justify-between text-xs font-bold uppercase text-gray-500">
                                 <span>{sub.name}</span>
                                 <span>{formatCurrency(sub.value)}</span>
                              </div>
                              <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                 <div 
                                    className="h-full bg-indigo-500 rounded-full transition-all duration-1000" 
                                    style={{ width: `${percent}%` }}
                                 />
                              </div>
                              <p className="text-[10px] text-gray-400 font-medium">{percent.toFixed(1)}% do total de {selectedParentCategory}</p>
                           </div>
                        );
                     })}
                     {subCategoryData.length === 0 && (
                        <div className="py-20 text-center text-gray-400">Nenhum gasto detalhado.</div>
                     )}
                  </div>
               </div>
            ) : (
               <div className="h-full flex flex-col items-center justify-center text-center p-8 text-gray-400">
                  <Filter size={48} className="mb-4 opacity-20" />
                  <p className="font-bold">Selecione uma categoria ao lado para ver o detalhamento por subcategoria.</p>
               </div>
            )}
        </div>
      </div>
    </div>
  );
};
