import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Play, Square, Check, X, Share2, Trash2, FileAudio, Paperclip, Loader2, CalendarClock, ArrowUp, Edit2, Bot, User, MoreVertical, Phone, Video, Plus } from 'lucide-react';
import { ChatMessage, Transaction, TransactionType, TransactionStatus, Category, AIRule, ThemeColor, RecurrenceFrequency, RecurrenceLabels } from '../types';
import { analyzeFinancialInput, getFinancialAdvice } from '../services/geminiService';

interface ChatInterfaceProps {
  onAddTransaction: (transaction: Transaction) => void;
  categories: Category[];
  userRules: AIRule[];
  onAddRule: (rules: AIRule[]) => void;
  themeColor: ThemeColor;
  transactions: Transaction[];
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ onAddTransaction, categories, userRules, onAddRule, themeColor, transactions }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      content: '👋 Olá! Sou seu assistente financeiro.\n\nMe conte sobre seus gastos (ex: "Gastei 50 no Uber") ou peça uma análise (ex: "Como foi meu mês?").',
      type: 'text',
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  
  // Correction & Card State
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
  const [expandedCardIds, setExpandedCardIds] = useState<Set<string>>(new Set());
  const [editCategory, setEditCategory] = useState('');
  const [editRecurrence, setEditRecurrence] = useState<RecurrenceFrequency>('none');

  // Lightbox
  const [lightboxMedia, setLightboxMedia] = useState<{ type: 'image' | 'audio', url: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, audioPreviewUrl, expandedCardIds]);

  const handleSendMessage = async (text?: string, file?: File, isConsulting: boolean = false) => {
    const textToSend = text || input;
    const fileToSend = file || (recordedBlob ? new File([recordedBlob], "audio_note.mp3", { type: 'audio/mp3' }) : undefined);

    if (!textToSend.trim() && !fileToSend) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      content: textToSend,
      type: fileToSend ? (fileToSend.type.startsWith('image') ? 'image' : 'audio') : 'text',
      mediaUrl: fileToSend ? URL.createObjectURL(fileToSend) : undefined,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setInput('');
    clearAudioPreview();
    setIsLoading(true);

    try {
      if (isConsulting || textToSend.toLowerCase().includes('analise') || textToSend.toLowerCase().includes('dica') || textToSend.toLowerCase().includes('resumo')) {
         const advice = await getFinancialAdvice(textToSend, transactions, categories);
         const aiResponse: ChatMessage = {
            id: (Date.now() + 1).toString(),
            sender: 'ai',
            content: advice || "Desculpe, não consegui analisar no momento.",
            type: 'text',
            timestamp: new Date()
         };
         setMessages(prev => [...prev, aiResponse]);
      } else {
         const result = await analyzeFinancialInput(textToSend || null, fileToSend || null, categories, userRules);
         const aiResponse: ChatMessage = {
            id: (Date.now() + 1).toString(),
            sender: 'ai',
            content: result.responseMessage,
            type: 'text',
            timestamp: new Date(),
            proposedTransaction: result.isTransaction ? result.transactionDetails : undefined
         };

         setMessages(prev => [...prev, aiResponse]);
         if (aiResponse.proposedTransaction) {
            toggleCardDetails(aiResponse.id, true);
         }
      }
    } catch (error) {
      setMessages(prev => [...prev, {
         id: (Date.now() + 1).toString(),
         sender: 'ai',
         content: 'Ocorreu um erro ao processar sua mensagem. Verifique sua conexão e a chave de API nas configurações.',
         type: 'text',
         timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmTransaction = (messageId: string, details: any, overrideIsPaid: boolean = false) => {
    const isPaidFinal = overrideIsPaid ? true : (details.isPaid !== undefined ? details.isPaid : true);
    
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      dueDate: details.dueDate || undefined,
      description: details.description,
      amount: details.amount || 0,
      type: details.type,
      category: details.category, 
      status: TransactionStatus.CONFIRMED,
      isPaid: isPaidFinal,
      source: 'whatsapp_ai',
      recurrence: details.recurrence || 'none',
      installmentCount: details.installmentCount
    };

    onAddTransaction(newTransaction);

    const recurrenceText = newTransaction.recurrence && newTransaction.recurrence !== 'none' 
        ? ` (${RecurrenceLabels[newTransaction.recurrence]})` 
        : '';
    const statusText = isPaidFinal ? '✅ Confirmado' : '⏰ Agendado';

    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, content: `*${statusText}*\n${details.description}\nR$ ${(details.amount || 0).toFixed(2)}${recurrenceText}` , proposedTransaction: undefined } 
        : msg
    ));
    toggleCardDetails(messageId, false);
  };

  const toggleCardDetails = (id: string, forceState?: boolean) => {
      setExpandedCardIds(prev => {
          const newSet = new Set(prev);
          if (forceState !== undefined) {
              forceState ? newSet.add(id) : newSet.delete(id);
          } else {
              newSet.has(id) ? newSet.delete(id) : newSet.add(id);
          }
          return newSet;
      });
  };

  const saveCategoryCorrection = (msgId: string, oldDetails: any) => {
      if (!editCategory) return;
      onAddRule([...userRules, { keyword: oldDetails.description, category: editCategory }]);

      setMessages(prev => prev.map(msg => {
          if (msg.id === msgId && msg.proposedTransaction) {
              return {
                  ...msg,
                  proposedTransaction: {
                      ...msg.proposedTransaction,
                      category: editCategory,
                      recurrence: editRecurrence
                  }
              };
          }
          return msg;
      }));
      setEditingTransactionId(null);
  };

  // --- Audio Logic ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      setRecordingDuration(0);

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
        setRecordedBlob(audioBlob);
        setAudioPreviewUrl(URL.createObjectURL(audioBlob));
        stream.getTracks().forEach(track => track.stop());
        if (timerRef.current) clearInterval(timerRef.current);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      timerRef.current = window.setInterval(() => setRecordingDuration(p => p + 1), 1000);
    } catch (err) {
      alert("Permissão de microfone necessária.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const clearAudioPreview = () => {
    if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
    setAudioPreviewUrl(null);
    setRecordedBlob(null);
  };

  const formatDuration = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const suggestions = [
      "💰 Resumo do mês",
      "📉 Analisar gastos",
      "☕ Gastei 15 reais na padaria",
      "💡 Dica de economia",
      "📅 Contas a pagar"
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-180px)] bg-[#efeae2] dark:bg-[#0b141a] rounded-xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-800 relative">
      
      {/* Lightbox */}
      {lightboxMedia && (
        <div className="absolute inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setLightboxMedia(null)}>
          <button className="absolute top-4 right-4 text-white"><X size={32}/></button>
          {lightboxMedia.type === 'image' && <img src={lightboxMedia.url} className="max-w-full max-h-full rounded-lg" />}
        </div>
      )}

      {/* Header WhatsApp Style */}
      <div className="bg-white dark:bg-[#202c33] px-4 py-3 flex items-center justify-between border-b border-gray-200 dark:border-gray-700 shadow-sm z-10">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white">
               <Bot size={24} />
            </div>
            <div>
               <h2 className="font-bold text-gray-800 dark:text-gray-100 text-sm">FinAI Assistente</h2>
               <p className="text-xs text-gray-500 dark:text-gray-400">
                 {isLoading ? 'Digitando...' : 'Online'}
               </p>
            </div>
        </div>
        <div className="flex items-center gap-4 text-indigo-600 dark:text-indigo-400">
            <Video size={20} className="cursor-not-allowed opacity-50" />
            <Phone size={20} className="cursor-not-allowed opacity-50" />
            <button onClick={() => setMessages([])} className="hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-full transition"><Trash2 size={20} /></button>
        </div>
      </div>

      {/* Chat Area */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth custom-scrollbar" 
        style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', backgroundRepeat: 'repeat', backgroundSize: '400px', backgroundBlendMode: 'overlay' }}
      >
        {messages.map((msg) => {
            const isMe = msg.sender === 'user';
            
            return (
          <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}>
            <div className={`relative max-w-[85%] md:max-w-[70%] rounded-lg px-3 py-2 shadow-sm text-sm ${
                isMe 
                ? 'bg-[#d9fdd3] dark:bg-[#005c4b] text-gray-800 dark:text-gray-100 rounded-tr-none' 
                : 'bg-white dark:bg-[#202c33] text-gray-800 dark:text-gray-100 rounded-tl-none'
            }`}>
                {/* Tail for bubble */}
                <div className={`absolute top-0 w-0 h-0 border-[6px] border-transparent ${
                    isMe 
                    ? 'right-[-6px] border-t-[#d9fdd3] dark:border-t-[#005c4b] border-l-[#d9fdd3] dark:border-l-[#005c4b]' 
                    : 'left-[-6px] border-t-white dark:border-t-[#202c33] border-r-white dark:border-r-[#202c33]'
                }`}></div>

                {/* Media */}
                {msg.type === 'image' && msg.mediaUrl && (
                  <div className="mb-2 rounded-lg overflow-hidden cursor-pointer" onClick={() => setLightboxMedia({ type: 'image', url: msg.mediaUrl! })}>
                      <img src={msg.mediaUrl} alt="Media" className="max-w-full max-h-60 object-cover" />
                  </div>
                )}
                {msg.type === 'audio' && msg.mediaUrl && (
                    <div className="flex items-center gap-2 mb-2 min-w-[200px]">
                        <button className="text-gray-500"><Play size={20}/></button>
                        <div className="h-1 bg-gray-300 dark:bg-gray-600 flex-1 rounded-full"></div>
                    </div>
                )}

                {/* Text Content with Markdown-like bolding */}
                <div className="whitespace-pre-wrap leading-relaxed">
                    {msg.content.split('\n').map((line, i) => (
                        <p key={i} dangerouslySetInnerHTML={{ __html: line.replace(/\*(.*?)\*/g, '<b>$1</b>') }}></p>
                    ))}
                </div>
                
                <div className="text-[10px] text-gray-400 dark:text-gray-500 text-right mt-1 flex items-center justify-end gap-1">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {isMe && <Check size={14} className="text-blue-500" />}
                </div>

                {/* Transaction Card */}
                {msg.proposedTransaction && (
                    <div className="mt-2 bg-gray-50 dark:bg-[#111b21] rounded-lg border-l-4 border-indigo-500 overflow-hidden">
                        <div className="p-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-bold text-gray-800 dark:text-white">R$ {(msg.proposedTransaction.amount || 0).toFixed(2)}</p>
                                    <p className="text-xs text-gray-500">{msg.proposedTransaction.description}</p>
                                </div>
                                <div className={`p-1 rounded ${msg.proposedTransaction.type === 'expense' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                    <ArrowUp size={16} className={msg.proposedTransaction.type === 'expense' ? 'rotate-45' : 'rotate-[225deg]'} />
                                </div>
                            </div>
                            
                            {expandedCardIds.has(msg.id) && (
                                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
                                    <div className="flex justify-between items-center bg-white dark:bg-[#202c33] p-2 rounded border border-gray-200 dark:border-gray-700">
                                        <span className="text-xs font-bold text-gray-500">Categoria</span>
                                        {editingTransactionId === msg.id ? (
                                            <div className="flex gap-1">
                                                <select value={editCategory} onChange={e => setEditCategory(e.target.value)} className="text-xs p-1 rounded border">
                                                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                                </select>
                                                <button onClick={() => saveCategoryCorrection(msg.id, msg.proposedTransaction)} className="text-green-600"><Check size={14}/></button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs">{msg.proposedTransaction.category}</span>
                                                <button onClick={() => { setEditingTransactionId(msg.id); setEditCategory(msg.proposedTransaction!.category!); }}><Edit2 size={12}/></button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-2 mt-2">
                                        <button onClick={() => toggleCardDetails(msg.id, false)} className="flex-1 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-bold rounded">Cancelar</button>
                                        <button onClick={() => handleConfirmTransaction(msg.id, msg.proposedTransaction)} className="flex-1 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded">Confirmar</button>
                                    </div>
                                </div>
                            )}
                        </div>
                        {!expandedCardIds.has(msg.id) && (
                            <button onClick={() => toggleCardDetails(msg.id)} className="w-full bg-gray-100 dark:bg-[#2a3942] py-1 text-xs font-bold text-gray-500 hover:text-indigo-600">
                                REVISAR E CONFIRMAR
                            </button>
                        )}
                    </div>
                )}
            </div>
          </div>
        )})}
      </div>

      {/* Input Area */}
      <div className="bg-[#f0f2f5] dark:bg-[#202c33] p-2 md:p-3 flex items-end gap-2 z-20">
         
         {messages.length < 3 && !input && !isRecording && (
             <div className="absolute bottom-20 left-4 right-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide z-10">
                 {suggestions.map((s, i) => (
                     <button key={i} onClick={() => handleSendMessage(s.replace(/^[^\s]+\s/, ''))} className="whitespace-nowrap px-3 py-1.5 bg-white dark:bg-[#2a3942] text-gray-600 dark:text-gray-200 text-xs font-medium rounded-full shadow-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition">
                         {s}
                     </button>
                 ))}
             </div>
         )}

         {/* File Input */}
         <input type="file" ref={fileInputRef} className="hidden" accept="image/*,audio/*" onChange={(e) => e.target.files?.[0] && handleSendMessage(undefined, e.target.files[0])} />
         <button onClick={() => fileInputRef.current?.click()} className="p-3 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition">
            <Plus size={24} />
         </button>

         {isRecording ? (
             <div className="flex-1 bg-white dark:bg-[#2a3942] rounded-lg p-3 flex items-center justify-between animate-pulse">
                 <div className="flex items-center gap-3 text-red-500 font-mono">
                     <Mic size={20} fill="currentColor" /> {formatDuration(recordingDuration)}
                 </div>
                 <button onClick={stopRecording} className="text-red-500"><Square size={20} fill="currentColor" /></button>
             </div>
         ) : audioPreviewUrl ? (
             <div className="flex-1 bg-white dark:bg-[#2a3942] rounded-lg p-2 flex items-center justify-between">
                 <button className="p-2 bg-green-500 rounded-full text-white" onClick={() => handleSendMessage()}><Send size={16}/></button>
                 <audio controls src={audioPreviewUrl} className="h-8 w-40" />
                 <button onClick={clearAudioPreview} className="text-red-500 p-2"><Trash2 size={20}/></button>
             </div>
         ) : (
             <div className="flex-1 bg-white dark:bg-[#2a3942] rounded-lg flex items-center px-4 py-2">
                <input 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Mensagem"
                    className="flex-1 bg-transparent border-none outline-none text-gray-800 dark:text-white text-sm placeholder-gray-500"
                />
             </div>
         )}

         {input || audioPreviewUrl ? (
             <button onClick={() => handleSendMessage()} className="p-3 bg-[#00a884] hover:bg-[#008f6f] text-white rounded-full shadow-md transition transform active:scale-95">
                 {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
             </button>
         ) : (
             <button onClick={startRecording} className="p-3 bg-[#00a884] hover:bg-[#008f6f] text-white rounded-full shadow-md transition transform active:scale-95">
                 <Mic size={20} />
             </button>
         )}
      </div>
    </div>
  );
};