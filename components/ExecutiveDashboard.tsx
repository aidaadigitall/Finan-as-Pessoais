
import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, TrendingDown, DollarSign, Target, 
  ArrowUpRight, ArrowDownRight, Activity, 
  Briefcase, BarChart3, PieChart, Info, 
  Calendar, Filter, Download, Loader2
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar, Cell 
} from 'recharts';
import { dashboardService, DashboardMetrics, DREItem } from '../services/dashboardService';
import { Transaction, ThemeColor } from '../types';

interface ExecutiveDashboardProps {
  orgId: string;
  themeColor: ThemeColor;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({ orgId, themeColor }) => {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'30' | '90' | '180'>('30');
  const [data, setData] = useState<{ metrics: DashboardMetrics, dre: DREItem[], transactions: Transaction[] } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - parseInt(period));
      
      const result = await dashboardService.getExecutiveDashboard(
        orgId, 
        start.toISOString(), 
        end.toISOString()
      );
      setData(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orgId) fetchData();
  }, [orgId, period]);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const chartData = useMemo(() => {
    if (!data) return [];
    // Agrupa transações por dia para o gráfico
    const groups: Record<string, { date: string, income: number, expense: number }> = {};
    data.transactions.forEach(t => {
      const day = new Date(t.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      if (!groups[day]) groups[day] = { date: day, income: 0, expense: 0 };
      if (t.type === 'income') groups[day].income += Number(t.amount);
      if (t.type === 'expense') groups[day].expense += Number(t.amount);
    });
    return Object.values(groups).reverse().slice(-15);
  }, [data]);

  if (loading) return (
    <div className="h-96 flex flex-col items-center justify-center gap-4 text-gray-400">
      <Loader2 size={40} className="animate-spin text-indigo-500" />
      <p className="font-bold animate-pulse">Consolidando dados executivos...</p>
    </div>
  );

  if (!data) return null;

  const KPICard = ({ label, value, icon: Icon, trend, color }: any) => (
    <div className="bg-white dark:bg-[#151a21] p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all group">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-2xl ${color} text-white shadow-lg`}>
          <Icon size={20} />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-bold ${trend >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            {trend >= 0 ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>}
            {Math.abs(trend).toFixed(1)}%
          </div>
        )}
      </div>
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{label}</p>
      <h3 className="text-2xl font-black text-gray-800 dark:text-white truncate">{formatCurrency(value)}</h3>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-800 dark:text-white tracking-tighter">Cockpit Executivo</h2>
          <p className="text-gray-500 text-sm">Visão consolidada da saúde financeira da organização.</p>
        </div>
        <div className="flex bg-white dark:bg-gray-800 p-1 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          {[
            { l: '30 Dias', v: '30' },
            { l: '90 Dias', v: '90' },
            { l: '6 Meses', v: '180' }
          ].map(p => (
            <button 
              key={p.v}
              onClick={() => setPeriod(p.v as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${period === p.v ? `bg-${themeColor}-600 text-white shadow-lg` : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-900'}`}
            >
              {p.l}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de KPIs principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard label="Disponibilidade Real" value={data.metrics.totalBalance} icon={DollarSign} color="bg-indigo-600" />
        <KPICard label="Receita Bruta" value={data.metrics.periodIncome} icon={TrendingUp} color="bg-emerald-500" trend={12.5} />
        <KPICard label="EBITDA Projetado" value={data.dre[2].value} icon={Activity} color="bg-violet-500" />
        <KPICard label="Margem de Lucro" value={data.metrics.profitMargin} icon={Target} color="bg-rose-500" trend={-2.1} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Gráfico de Performance */}
        <div className="lg:col-span-2 bg-white dark:bg-[#151a21] p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-black text-gray-800 dark:text-white uppercase tracking-widest text-xs">Performance de Fluxo</h3>
            <div className="flex gap-4 text-[10px] font-bold uppercase">
              <span className="flex items-center gap-1.5 text-emerald-500"><div className="w-2 h-2 rounded-full bg-emerald-500"/> Entradas</span>
              <span className="flex items-center gap-1.5 text-rose-500"><div className="w-2 h-2 rounded-full bg-rose-500"/> Saídas</span>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 'bold'}}
                />
                <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                <Area type="monotone" dataKey="expense" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* DRE Resumida */}
        <div className="bg-white dark:bg-[#151a21] p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm">
          <h3 className="font-black text-gray-800 dark:text-white uppercase tracking-widest text-xs mb-8">DRE Resumida (Período)</h3>
          <div className="space-y-6">
            {data.dre.map((item, idx) => (
              <div key={idx} className="flex justify-between items-end border-b border-gray-50 dark:border-gray-800/50 pb-4">
                <div>
                  <p className="text-xs text-gray-400 font-bold mb-1 uppercase tracking-tight">{item.label}</p>
                  <p className={`text-xl font-black ${item.type === 'positive' ? 'text-emerald-500' : item.type === 'negative' ? 'text-rose-500' : 'text-indigo-500'}`}>
                    {formatCurrency(item.value)}
                  </p>
                </div>
                {idx === 0 && <span className="text-[10px] bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-lg font-black">100%</span>}
                {idx > 0 && <span className="text-[10px] text-gray-400 font-bold">{((item.value / data.dre[0].value) * 100).toFixed(1)}%</span>}
              </div>
            ))}
          </div>
          <button className="w-full mt-8 py-4 bg-gray-50 dark:bg-gray-900 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all flex items-center justify-center gap-2">
            <Download size={14}/> Exportar DRE Completa
          </button>
        </div>
      </div>

      {/* Grid Secundário: Pagar, Receber e Burn Rate */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white dark:bg-[#151a21] p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-6">
          <div className="p-4 bg-orange-100 text-orange-600 rounded-2xl"><BarChart3 size={24}/></div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Contas a Pagar</p>
            <h4 className="text-xl font-black text-gray-800 dark:text-white">{formatCurrency(data.metrics.accountsPayable)}</h4>
          </div>
        </div>
        <div className="bg-white dark:bg-[#151a21] p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-6">
          <div className="p-4 bg-emerald-100 text-emerald-600 rounded-2xl"><PieChart size={24}/></div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Contas a Receber</p>
            <h4 className="text-xl font-black text-gray-800 dark:text-white">{formatCurrency(data.metrics.accountsReceivable)}</h4>
          </div>
        </div>
        <div className="bg-[#151a21] p-8 rounded-[2.5rem] border border-indigo-500/20 shadow-indigo-500/5 shadow-xl flex items-center gap-6 relative overflow-hidden">
          <div className="p-4 bg-indigo-600 text-white rounded-2xl"><Activity size={24}/></div>
          <div className="relative z-10">
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Burn Rate Mensal</p>
            <h4 className="text-xl font-black text-white">{formatCurrency(data.metrics.burnRate)}</h4>
          </div>
          <div className="absolute right-[-20px] bottom-[-20px] text-white/5"><Activity size={120}/></div>
        </div>
      </div>
    </div>
  );
};
