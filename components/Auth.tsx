
import React, { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { Landmark, Mail, Lock, Loader2, Sparkles, ArrowRight, Github, Info, CheckCircle2, X } from 'lucide-react';
import { ThemeColor } from '../types';

interface AuthProps {
  onAuthSuccess: (session: any) => void;
  themeColor: ThemeColor;
}

interface Toast {
  message: string;
  type: 'info' | 'success' | 'error';
  visible: boolean;
}

export const Auth: React.FC<AuthProps> = ({ onAuthSuccess, themeColor }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast>({ message: '', type: 'info', visible: false });

  const showToast = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 4000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let result;
      if (isLogin) {
        result = await authService.signIn(email, password);
      } else {
        const { data, error: signUpError } = await (authService as any).signUp?.(email, password) || 
                                              { data: null, error: new Error("Sistema de cadastro em manutenção. Use o login Demo.") };
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

  const handleSocialLogin = (provider: 'github' | 'google') => {
    const providerName = provider.charAt(0).toUpperCase() + provider.slice(1);
    showToast(`Conectando ao ${providerName}... Redirecionando para autenticação segura.`, 'info');
    
    // Simulating OAuth redirect
    setTimeout(() => {
        // No ambiente real: supabase.auth.signInWithOAuth({ provider })
        console.log(`OAuth logic for ${provider} triggered`);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0e14] relative overflow-hidden p-4">
      {/* Modern Toast Notification */}
      {toast.visible && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-4 fade-in duration-300">
          <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-md border ${
            toast.type === 'info' ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-100' : 
            toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-100' :
            'bg-rose-500/10 border-rose-500/50 text-rose-100'
          }`}>
            {toast.type === 'info' && <Info size={20} className="text-indigo-400" />}
            {toast.type === 'success' && <CheckCircle2 size={20} className="text-emerald-400" />}
            <span className="text-sm font-medium">{toast.message}</span>
            <button onClick={() => setToast(prev => ({ ...prev, visible: false }))} className="ml-2 hover:opacity-70">
              <X size={16} />
            </button>
            <div className="absolute bottom-0 left-0 h-1 bg-current opacity-20 animate-[progress_4s_linear]" style={{ width: '100%' }}></div>
          </div>
        </div>
      )}

      {/* Background Decor */}
      <div className={`absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-${themeColor}-600/10 rounded-full blur-[120px] animate-pulse`}></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse delay-700"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo Section */}
        <div className="text-center mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className={`w-20 h-20 bg-gradient-to-br from-${themeColor}-500 to-indigo-600 rounded-[2rem] flex items-center justify-center text-white mx-auto shadow-2xl shadow-indigo-500/20 mb-6 rotate-3 hover:rotate-0 transition-transform`}>
            <Landmark size={40} />
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">FinAI <span className="text-indigo-500/80">SaaS</span></h1>
          <p className="text-gray-400 font-medium">Gestão financeira inteligente para empresas</p>
        </div>

        {/* Card */}
        <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl shadow-black/50 animate-in zoom-in-95 duration-500">
          <div className="flex bg-black/40 p-1.5 rounded-2xl mb-8">
            <button 
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${isLogin ? 'bg-white text-gray-950 shadow-lg scale-[1.02]' : 'text-gray-500 hover:text-white'}`}
            >
              Entrar
            </button>
            <button 
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${!isLogin ? 'bg-white text-gray-950 shadow-lg scale-[1.02]' : 'text-gray-500 hover:text-white'}`}
            >
              Criar Conta
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/50 text-rose-400 text-xs p-4 rounded-2xl animate-shake flex gap-3">
                <Info size={16} className="shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">E-mail Corporativo</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-indigo-500 transition-colors" size={20} />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/10 transition-all placeholder:text-gray-600"
                  placeholder="exemplo@empresa.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Senha</label>
                {isLogin && <button type="button" className="text-[10px] text-indigo-400 font-bold hover:text-indigo-300 transition-colors">Esqueceu a senha?</button>}
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-indigo-500 transition-colors" size={20} />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/10 transition-all placeholder:text-gray-600"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className={`w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-2xl font-bold transition-all shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]`}
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : (isLogin ? 'Login' : 'Registrar Empresa')}
              {!loading && <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          <div className="mt-10">
            <div className="relative flex items-center justify-center mb-8">
              <div className="border-t border-white/10 w-full"></div>
              <span className="bg-[#161b22] px-4 text-[10px] text-gray-500 uppercase font-black tracking-widest absolute">OU</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <button 
                onClick={handleDemoLogin}
                className="flex flex-col items-center justify-center gap-2 bg-white/5 border border-white/10 text-white py-4 rounded-2xl hover:bg-white/10 transition-all hover:scale-[1.05] active:scale-95"
              >
                <Sparkles size={20} className="text-amber-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Demo</span>
              </button>
              <button 
                onClick={() => handleSocialLogin('github')}
                className="flex flex-col items-center justify-center gap-2 bg-white/5 border border-white/10 text-white py-4 rounded-2xl hover:bg-white/10 transition-all hover:scale-[1.05] active:scale-95"
              >
                <Github size={20} />
                <span className="text-[10px] font-bold uppercase tracking-wider">GitHub</span>
              </button>
              <button 
                onClick={() => handleSocialLogin('google')}
                className="flex flex-col items-center justify-center gap-2 bg-white/5 border border-white/10 text-white py-4 rounded-2xl hover:bg-white/10 transition-all hover:scale-[1.05] active:scale-95"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="text-[10px] font-bold uppercase tracking-wider">Google</span>
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-gray-500 text-xs mt-12 mb-8">
          Ao continuar, você concorda com nossos <br />
          <span className="text-gray-300 font-bold hover:underline cursor-pointer">Termos de Uso</span> e <span className="text-gray-300 font-bold hover:underline cursor-pointer">Política de Privacidade</span>.
        </p>
      </div>

      <style>{`
        @keyframes progress {
          from { width: 100%; }
          to { width: 0%; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
      `}</style>
    </div>
  );
};
