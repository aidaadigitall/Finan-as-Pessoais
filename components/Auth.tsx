
import React, { useState } from 'react';
import { authService } from '../services/authService';
import { Landmark, Mail, Lock, Loader2, Sparkles, ArrowRight, Github } from 'lucide-react';
import { ThemeColor } from '../types';

interface AuthProps {
  onAuthSuccess: (session: any) => void;
  themeColor: ThemeColor;
}

export const Auth: React.FC<AuthProps> = ({ onAuthSuccess, themeColor }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let result;
      if (isLogin) {
        result = await authService.signIn(email, password);
      } else {
        // Para simplificar o fluxo inicial, usamos o signIn demo no App.tsx, 
        // mas aqui implementamos o fluxo real do Supabase
        const { data, error: signUpError } = await (authService as any).signUp?.(email, password) || 
                                              { data: null, error: new Error("Método não implementado") };
        if (signUpError) throw signUpError;
        result = data;
      }
      if (result?.session) onAuthSuccess(result.session);
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro na autenticação.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    try {
      const data = await authService.signIn('demo@finai.com', 'password123');
      onAuthSuccess(data.session);
    } catch (err: any) {
      setError('Erro ao acessar conta demo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] relative overflow-hidden p-4">
      {/* Background Orbs */}
      <div className={`absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-${themeColor}-600/20 rounded-full blur-[120px] animate-pulse`}></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse delay-700"></div>

      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in duration-500">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className={`w-16 h-16 bg-${themeColor}-600 rounded-2xl flex items-center justify-center text-white mx-auto shadow-xl shadow-indigo-500/20 mb-4`}>
            <Landmark size={32} />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">FinAI <span className="text-gray-400">SaaS</span></h1>
          <p className="text-gray-400 mt-2">Gestão financeira inteligente para empresas</p>
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          <div className="flex bg-black/20 p-1 rounded-xl mb-8">
            <button 
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${isLogin ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-white'}`}
            >
              Entrar
            </button>
            <button 
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${!isLogin ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-white'}`}
            >
              Criar Conta
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-xs p-3 rounded-lg animate-shake">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">E-mail Corporativo</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  placeholder="exemplo@empresa.com"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Senha</label>
                {isLogin && <button type="button" className="text-[10px] text-indigo-400 hover:underline">Esqueceu a senha?</button>}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className={`w-full py-4 bg-${themeColor}-600 hover:bg-${themeColor}-500 text-white rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50`}
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : (isLogin ? 'Acessar Dashboard' : 'Registrar Empresa')}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <div className="mt-8">
            <div className="relative flex items-center justify-center mb-6">
              <div className="border-t border-white/10 w-full"></div>
              <span className="bg-[#1e293b] px-3 text-[10px] text-gray-500 uppercase font-bold absolute">Ou continue com</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={handleDemoLogin}
                className="flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-white py-3 rounded-xl hover:bg-white/10 transition text-sm font-medium"
              >
                <Sparkles size={16} className="text-amber-400" />
                Demo
              </button>
              <button className="flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-white py-3 rounded-xl hover:bg-white/10 transition text-sm font-medium">
                <Github size={16} />
                GitHub
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-gray-500 text-xs mt-8">
          Ao continuar, você concorda com nossos <br />
          <span className="text-gray-400 underline cursor-pointer">Termos de Uso</span> e <span className="text-gray-400 underline cursor-pointer">Política de Privacidade</span>.
        </p>
      </div>
    </div>
  );
};
