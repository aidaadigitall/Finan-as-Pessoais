
import React, { useState } from 'react';
import { authService } from '../services/authService';
import { Landmark, Mail, Lock, Loader2, ArrowRight, Info } from 'lucide-react';
import { ThemeColor } from '../types';
import { isSupabaseConfigured } from '../lib/supabase';

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

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await authService.signInWithGoogle();
      // O redirecionamento é controlado pelo Supabase
    } catch (err: any) {
      setError(err.message || 'Erro ao conectar com Google');
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { session } = await authService.signIn(email, password);
        if (session) onAuthSuccess(session);
      } else {
        await authService.signUp(email, password);
        setError("Verifique seu e-mail para confirmar o cadastro!");
      }
    } catch (err: any) {
      setError(err.message || 'Erro na autenticação.');
    } finally {
      setLoading(false);
    }
  };

  const configured = isSupabaseConfigured();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0e14] relative overflow-hidden p-4">
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse"></div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-[2rem] flex items-center justify-center text-white mx-auto shadow-2xl mb-6">
            <Landmark size={40} />
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">FinAI <span className="text-indigo-500/80">SaaS</span></h1>
          <p className="text-gray-400 font-medium">Gestão financeira profissional</p>
        </div>

        <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
          {!configured && (
            <div className="bg-rose-500/10 border border-rose-500/50 text-rose-400 text-xs p-4 rounded-2xl flex gap-3 mb-6">
              <Info size={16} className="shrink-0" />
              Credenciais do Supabase ausentes no vite.config.ts
            </div>
          )}

          <div className="space-y-4">
            <button 
              onClick={handleGoogleLogin}
              disabled={loading || !configured}
              className="w-full py-4 bg-white text-gray-900 rounded-2xl font-bold transition-all shadow-xl flex items-center justify-center gap-3 hover:bg-gray-100 disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continuar com Google
            </button>

            <div className="relative flex items-center justify-center my-6">
              <div className="border-t border-white/10 w-full"></div>
              <span className="bg-[#12161d] px-4 text-[9px] text-gray-500 uppercase font-black tracking-[0.3em] absolute">OU EMAIL</span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-indigo-500/10 border border-indigo-500/50 text-indigo-400 text-xs p-3 rounded-xl">
                  {error}
                </div>
              )}

              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                placeholder="email@empresa.com"
              />

              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                placeholder="Senha"
              />

              <button 
                type="submit"
                disabled={loading || !configured}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : (isLogin ? 'Entrar' : 'Cadastrar')}
              </button>
            </form>

            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="w-full text-xs text-gray-500 hover:text-white transition-colors pt-2"
            >
              {isLogin ? "Não tem conta? Cadastre-se" : "Já possui conta? Faça login"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
