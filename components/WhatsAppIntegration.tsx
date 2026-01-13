import React, { useState } from 'react';
import { QrCode, Smartphone, Wifi, WifiOff, MessageSquare, Send, Loader2, CheckCircle2, AlertCircle, Server, Key, Globe, Copy } from 'lucide-react';
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
  
  // Settings State
  const [gatewayUrl, setGatewayUrl] = useState('https://api.seusaas.com/evolution');
  const [apiKey, setApiKey] = useState('sk_live_...');
  const [webhookUrl, setWebhookUrl] = useState('https://app.finai.com/api/webhook/whatsapp');

  const handleSimulate = async () => {
    if (!simulationText.trim()) return;
    
    setIsSimulating(true);
    setSimulationStatus('idle');
    try {
      await onSimulateMessage(simulationText);
      setSimulationStatus('success');
      setSimulationText('');
      setTimeout(() => setSimulationStatus('idle'), 3000);
    } catch (error) {
      setSimulationStatus('error');
    } finally {
      setIsSimulating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copiado!');
  };

  const getThemeText = () => `text-${themeColor}-600`;
  const getThemeBg = () => `bg-${themeColor}-600`;
  const getThemeBorder = () => `border-${themeColor}-200`;

  return (
    <div className="space-y-8">
      
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
                  Sincronização via Gateway (Evolution API / Baileys).
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
                <div className={`w-48 h-48 bg-white p-2 rounded-xl border-2 ${getThemeBorder()} mb-4 flex items-center justify-center`}>
                   <QrCode size={150} className="text-gray-800" />
                </div>
                <p className="text-sm text-gray-500 mb-6 text-center max-w-xs">
                  Abra o WhatsApp > Aparelhos Conectados > Conectar Aparelho e escaneie o código.
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4 animate-in zoom-in duration-300">
                  <CheckCircle2 size={48} className="text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">Instância Ativa</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-2 text-center">
                  Número: <strong>{config.phoneNumber}</strong>
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-6 font-mono bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded">
                  ID: {config.instanceId}
                </p>
              </div>
            )}
          </div>
          
          <button
             onClick={config.status === 'disconnected' ? onConnect : onDisconnect}
             className={`w-full ${config.status === 'disconnected' ? getThemeBg() : 'bg-red-500 hover:bg-red-600'} text-white px-6 py-3 rounded-lg hover:opacity-90 transition font-medium flex items-center justify-center gap-2`}
          >
             {config.status === 'disconnected' ? 'Gerar QR Code (Simulado)' : 'Desconectar Sessão'}
          </button>
        </div>

        {/* Configuration Card (SaaS Style) */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
           <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <Server className={getThemeText()} size={20} />
              Configuração do Gateway
           </h3>
           <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Configure os dados da sua instância do <strong>Evolution API</strong> ou outro gateway compatível.
           </p>

           <div className="space-y-4">
              <div>
                 <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                    <Globe size={12} /> URL do Gateway API
                 </label>
                 <input 
                    type="text" 
                    value={gatewayUrl}
                    onChange={(e) => setGatewayUrl(e.target.value)}
                    className="w-full p-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                 />
              </div>

              <div>
                 <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                    <Key size={12} /> API Key (Global)
                 </label>
                 <input 
                    type="password" 
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full p-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                 />
              </div>

              <div className="pt-2">
                 <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                    Webhook de Retorno (Configure no seu Gateway)
                 </label>
                 <div className="flex gap-2">
                    <input 
                        readOnly
                        type="text" 
                        value={webhookUrl}
                        className="flex-1 p-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-900 text-gray-500 cursor-not-allowed"
                    />
                    <button 
                        onClick={() => copyToClipboard(webhookUrl)}
                        className="p-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-gray-600 dark:text-gray-300 transition"
                    >
                        <Copy size={18} />
                    </button>
                 </div>
                 <p className="text-[10px] text-gray-400 mt-1">
                    Este é o endpoint que o Evolution API deve chamar quando receber uma mensagem.
                 </p>
              </div>
           </div>

           <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-lg flex gap-3">
              <AlertCircle size={20} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div className="text-xs text-blue-800 dark:text-blue-300">
                 <strong>Dica de Arquiteto:</strong> Para produção real, utilize o <a href="#" className="underline">Evolution API</a> com Docker. É a solução Open Source mais estável para transformar WhatsApp em API REST.
              </div>
           </div>
        </div>
      </div>

      {/* Simulator Section */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
             <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <MessageSquare className={getThemeText()} />
                Simulador de Webhook (Teste a IA)
             </h3>
             <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-md border border-orange-200">
                Ambiente de Teste
             </span>
          </div>
          
          <div className="flex flex-col md:flex-row gap-6">
             <div className="flex-1">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Como não temos um backend Node.js ativo neste ambiente de demonstração, use este campo para simular o <strong>payload JSON</strong> que o Evolution API enviaria para o seu sistema.
                </p>
                <div className="relative">
                    <textarea
                      value={simulationText}
                      onChange={(e) => setSimulationText(e.target.value)}
                      placeholder="Digite como se fosse no WhatsApp: 'Gastei 120 reais no mercado hoje'"
                      className="w-full p-4 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-opacity-50 min-h-[100px] resize-none shadow-sm"
                      style={{ '--tw-ring-color': `var(--${themeColor}-500)` } as any}
                      disabled={config.status === 'disconnected'}
                    />
                </div>
                <div className="flex justify-between items-center mt-3">
                    <div className="text-sm">
                       {simulationStatus === 'success' && (
                         <span className="text-green-600 flex items-center gap-1 animate-in fade-in"><CheckCircle2 size={16} /> Webhook processado com sucesso!</span>
                       )}
                       {simulationStatus === 'error' && (
                         <span className="text-red-600 flex items-center gap-1 animate-in fade-in"><AlertCircle size={16} /> Falha no processamento.</span>
                       )}
                    </div>
                    <button
                      onClick={handleSimulate}
                      disabled={isSimulating || !simulationText.trim() || config.status === 'disconnected'}
                      className={`${getThemeBg()} text-white px-5 py-2 rounded-lg hover:opacity-90 transition disabled:opacity-50 flex items-center gap-2 shadow-md`}
                    >
                      {isSimulating ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                      Disparar Evento
                    </button>
                 </div>
             </div>

             <div className="w-full md:w-1/3 bg-gray-900 rounded-xl p-4 text-xs font-mono text-gray-300 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-8 bg-gray-800 flex items-center px-4 border-b border-gray-700">
                   <span className="text-gray-400">log_terminal</span>
                </div>
                <div className="mt-6 space-y-2 opacity-80">
                   <p><span className="text-green-400">POST</span> /api/webhook/whatsapp</p>
                   <p className="text-blue-300">{`{`}</p>
                   <p className="pl-4 text-blue-300">{`"event": "messages.upsert",`}</p>
                   <p className="pl-4 text-blue-300">{`"data": {`}</p>
                   <p className="pl-8 text-yellow-300">{`"body": "${simulationText || '...'}",`}</p>
                   <p className="pl-8 text-yellow-300">{`"from": "${config.phoneNumber || '...'}"`}</p>
                   <p className="pl-4 text-blue-300">{`}`}</p>
                   <p className="text-blue-300">{`}`}</p>
                   {isSimulating && <p className="text-gray-400 animate-pulse">Processing by Gemini AI...</p>}
                </div>
             </div>
          </div>
      </div>

    </div>
  );
};