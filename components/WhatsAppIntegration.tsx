
import React, { useState } from 'react';
import { QrCode, Smartphone, Wifi, WifiOff, MessageSquare, Send, Loader2, CheckCircle2, AlertCircle, Server, Key, Globe, Copy, ExternalLink, Save, Hash } from 'lucide-react';
import { WhatsAppConfig, ThemeColor } from '../types';

interface WhatsAppIntegrationProps {
  config: WhatsAppConfig;
  onConnect: () => void;
  onDisconnect: () => void;
  onSimulateMessage: (message: string) => Promise<void>;
  themeColor: ThemeColor;
}

export const WhatsAppIntegration: React.FC<WhatsAppIntegrationProps> = ({ 
  config, 
  onConnect, 
  onDisconnect, 
  onSimulateMessage,
  themeColor 
}) => {
  const [simulationText, setSimulationText] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationStatus, setSimulationStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [lastResponse, setLastResponse] = useState<string | null>(null);
  
  // Settings State - Configurado com os dados completos (ID e Token) da Z-API
  const [gatewayUrl, setGatewayUrl] = useState('https://api.z-api.io');
  const [instanceId, setInstanceId] = useState('3ED6EA14FE1D7279996982BFEDF24C27');
  const [apiKey, setApiKey] = useState('2C7B1F60C573E088895BB142'); // Token configurado
  
  // Webhook correto apontando para o Supabase do usuário
  const [webhookUrl, setWebhookUrl] = useState('https://aqimvhbgujedzyrpjogx.supabase.co/functions/v1/whatsapp-webhook');
  
  const [isSaving, setIsSaving] = useState(false);

  const handleSimulate = async () => {
    if (!simulationText.trim()) return;
    
    setIsSimulating(true);
    setSimulationStatus('idle');
    setLastResponse(null);
    try {
      await onSimulateMessage(simulationText);
      setSimulationStatus('success');
      setSimulationText('');
    } catch (error) {
      setSimulationStatus('error');
    } finally {
      setIsSimulating(false);
    }
  };

  const handleSaveConfig = () => {
    if (!apiKey) {
        alert("Por favor, preencha o Token da Instância (Client Token) que está no painel da Z-API.");
        return;
    }
    setIsSaving(true);
    // Simula salvamento
    setTimeout(() => {
        setIsSaving(false);
        // Em um app real, aqui salvaríamos no banco de dados
        alert(`Integração salva com sucesso!\n\nCertifique-se de copiar o Webhook abaixo e configurar no painel da Z-API para receber as mensagens.`);
    }, 1000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("URL do Webhook copiada!");
  };

  const getThemeText = () => `text-${themeColor}-600`;
  const getThemeBg = () => `bg-${themeColor}-600`;
  const getThemeBorder = () => `border-${themeColor}-200`;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Top Section: Connection Status & Gateway Config */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Connection Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <Smartphone className={getThemeText()} />
                  Conexão WhatsApp
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Integração ativa via <strong>Z-API</strong>.
                </p>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
                config.status === 'connected' 
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              }`}>
                {config.status === 'connected' ? <Wifi size={14} /> : <WifiOff size={14} />}
                {config.status === 'connected' ? 'Conectado' : 'Desconectado'}
              </div>
            </div>

            {config.status === 'disconnected' ? (
              <div className="flex flex-col items-center justify-center py-4">
                <div className={`w-48 h-48 bg-white p-2 rounded-xl border-2 ${getThemeBorder()} mb-4 flex items-center justify-center relative`}>
                   <QrCode size={150} className="text-gray-800" />
                   <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                      <span className="text-xs font-bold text-gray-500">QR Code Z-API</span>
                   </div>
                </div>
                <p className="text-sm text-gray-500 mb-6 text-center max-w-xs">
                  Para conectar, configure as credenciais ao lado e escaneie o QR Code no painel da Z-API.
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4 animate-in zoom-in duration-300">
                  <CheckCircle2 size={48} className="text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">Instância Ativa</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-2 text-center">
                  Sessão Z-API vinculada com sucesso.
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-6 font-mono bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded break-all max-w-[200px] text-center">
                  ID: {config.instanceId || instanceId}
                </p>
              </div>
            )}
          </div>
          
          <button
             onClick={config.status === 'disconnected' ? onConnect : onDisconnect}
             className={`w-full ${config.status === 'disconnected' ? getThemeBg() : 'bg-red-500 hover:bg-red-600'} text-white px-6 py-3 rounded-lg hover:opacity-90 transition font-medium flex items-center justify-center gap-2`}
          >
             {config.status === 'disconnected' ? 'Conectar Integração' : 'Desconectar Instância'}
          </button>
        </div>

        {/* Configuration Card (Z-API Style) */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex flex-col h-full">
           <div>
               <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                  <Server className={getThemeText()} size={20} />
                  Credenciais Z-API
               </h3>
               <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  Dados extraídos da sua instância. O token foi preenchido automaticamente.
               </p>

               <div className="space-y-4">
                  <div>
                     <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                        <Globe size={12} /> URL da API
                     </label>
                     <div className="flex gap-2">
                        <input 
                            type="text" 
                            value={gatewayUrl}
                            onChange={(e) => setGatewayUrl(e.target.value)}
                            className="flex-1 p-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                     </div>
                  </div>

                  <div>
                     <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                        <Hash size={12} /> ID da Instância
                     </label>
                     <input 
                        type="text" 
                        value={instanceId}
                        onChange={(e) => setInstanceId(e.target.value)}
                        className="w-full p-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                     />
                  </div>

                  <div className="relative">
                     <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                        <Key size={12} /> Token da Instância
                     </label>
                     <input 
                        type="text" 
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="Cole o token da Z-API aqui..."
                        className="w-full p-2.5 text-sm border border-emerald-300 dark:border-emerald-800 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                     />
                     {apiKey && (
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-bold flex items-center gap-1">
                            <CheckCircle2 size={10} /> Token configurado
                        </p>
                     )}
                  </div>

                  <div className="pt-2">
                     <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                        Webhook de Retorno (Copie e cole na Z-API)
                     </label>
                     <div className="flex gap-2">
                        <input 
                            readOnly
                            type="text" 
                            value={webhookUrl}
                            className="flex-1 p-2.5 text-sm border border-emerald-200 dark:border-emerald-800 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300 font-bold"
                        />
                        <button 
                            onClick={() => copyToClipboard(webhookUrl)}
                            className="p-2.5 bg-emerald-100 dark:bg-emerald-800 hover:bg-emerald-200 dark:hover:bg-emerald-700 rounded-lg text-emerald-700 dark:text-emerald-100 transition shadow-sm"
                            title="Copiar URL do Webhook"
                        >
                            <Copy size={18} />
                        </button>
                     </div>
                     <p className="text-[10px] text-gray-400 mt-1">
                        Este é o link correto para o seu sistema. Configure no campo "Webhook de Retorno" na Z-API.
                     </p>
                  </div>
               </div>
           </div>

           <div className="mt-auto pt-6">
               <button 
                  onClick={handleSaveConfig}
                  disabled={isSaving}
                  className={`w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 text-white py-2.5 rounded-lg transition-all ${isSaving ? 'opacity-75 cursor-wait' : ''}`}
               >
                   {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                   {isSaving ? 'Salvando...' : 'Salvar Configurações Z-API'}
               </button>
           </div>
        </div>
      </div>

      {/* Simulator Section */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
             <div>
                 <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <MessageSquare className={getThemeText()} />
                    Simulador de Webhook (Teste a IA)
                 </h3>
                 <p className="text-xs text-gray-500 mt-1">
                     Teste como a IA responderá às mensagens recebidas via WhatsApp sem precisar configurar o gateway real.
                 </p>
             </div>
             <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-md border border-orange-200 font-bold">
                Ambiente de Teste
             </span>
          </div>
          
          <div className="flex flex-col md:flex-row gap-6">
             <div className="flex-1 flex flex-col">
                <div className="relative flex-1">
                    <textarea
                      value={simulationText}
                      onChange={(e) => setSimulationText(e.target.value)}
                      placeholder="Digite como se estivesse no WhatsApp:&#10;'Gastei 120 reais no mercado hoje'&#10;'Como está meu saldo?'"
                      className="w-full h-full min-h-[140px] p-4 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-opacity-50 resize-none shadow-sm font-medium"
                      style={{ '--tw-ring-color': `var(--${themeColor}-500)` } as any}
                    />
                    <div className="absolute bottom-3 right-3">
                         <button
                            onClick={handleSimulate}
                            disabled={isSimulating || !simulationText.trim()}
                            className={`${getThemeBg()} text-white px-4 py-2 rounded-lg hover:opacity-90 transition disabled:opacity-50 flex items-center gap-2 shadow-md text-sm font-bold`}
                            >
                            {isSimulating ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                            Enviar Mensagem
                        </button>
                    </div>
                </div>
             </div>

             <div className="w-full md:w-1/3 bg-gray-900 rounded-xl p-4 text-xs font-mono text-gray-300 overflow-hidden relative min-h-[200px] flex flex-col">
                <div className="absolute top-0 left-0 w-full h-8 bg-gray-800 flex items-center justify-between px-4 border-b border-gray-700">
                   <span className="text-gray-400">log_terminal</span>
                   <div className="flex gap-1.5">
                       <div className="w-2.5 h-2.5 rounded-full bg-red-500"/>
                       <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"/>
                       <div className="w-2.5 h-2.5 rounded-full bg-green-500"/>
                   </div>
                </div>
                <div className="mt-8 space-y-2 opacity-90 overflow-y-auto custom-scrollbar flex-1">
                   {isSimulating ? (
                       <>
                           <p><span className="text-green-400">POST</span> {webhookUrl}</p>
                           <p className="text-blue-300">{`{ "event": "messages.upsert", ... }`}</p>
                           <p className="text-yellow-300 animate-pulse">Processing by Gemini AI...</p>
                       </>
                   ) : simulationStatus === 'success' ? (
                        <>
                           <p className="text-gray-500">// Mensagem recebida</p>
                           <p className="text-white">User: "{simulationText || '...'}"</p>
                           <div className="my-2 border-t border-gray-800"></div>
                           <p className="text-gray-500">// Resposta da IA</p>
                           <p className="text-green-400">FinAI: Processamento concluído.</p>
                           <p className="text-indigo-300">Ação: Lançamento/Consulta executada.</p>
                        </>
                   ) : simulationStatus === 'error' ? (
                       <p className="text-red-400">Error: Failed to process message.</p>
                   ) : (
                       <p className="text-gray-500 italic">Aguardando evento...</p>
                   )}
                </div>
             </div>
          </div>
      </div>

    </div>
  );
};
