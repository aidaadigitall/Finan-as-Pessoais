
import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Image as ImageIcon, Paperclip, Loader2, Check, X, Play, Square, Edit2, Save, Maximize2, Share2, Trash2, FileAudio, ChevronDown, ChevronUp, FileText, Clock, CalendarClock, DollarSign, Calendar, Sparkles, Download, MoreHorizontal, Copy, Bot, User, ArrowUp, Zap } from 'lucide-react';
import { ChatMessage, Transaction, TransactionType, TransactionStatus, Category, AIRule, ThemeColor, RecurrenceFrequency, RecurrenceLabels } from '../types';
import { analyzeFinancialInput, getFinancialAdvice } from '../services/geminiService';

interface ChatInterfaceProps {
  onAddTransaction: (transaction: Transaction) => void;
  categories: Category[];
  userRules: AIRule[];
  onAddRule: (rule: AIRule) => void;
  themeColor: ThemeColor;
  transactions: Transaction[];
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ onAddTransaction, categories, userRules, onAddRule, themeColor, transactions }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      content: 'Olá! Sou o FinAI. 🤖\nPosso ajudar a organizar suas finanças, categorizar gastos ou dar conselhos sobre seus investimentos. Como posso ajudar hoje?',
      type: 'text',
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  
  // History & Scroll State
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

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

  // Lightbox State
  const [lightboxMedia, setLightboxMedia] = useState<{ type: 'image' | 'audio', url: string } | null>(null);

  // Share Feedback State
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  // Control scrolling
  const isAutoScrollEnabled = useRef(true);

  const scrollToBottom = () => {
    if (isAutoScrollEnabled.current) {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, audioPreviewUrl, expandedCardIds]);

  // Infinite Scroll Simulation
  const handleScroll = () => {
      if (chatContainerRef.current) {
          const { scrollTop } = chatContainerRef.current;
          if (scrollTop < 50 && !isLoadingHistory && messages.length > 5) {
              loadMoreHistory();
          }
          const { scrollHeight, clientHeight } = chatContainerRef.current;
          isAutoScrollEnabled.current = scrollHeight - scrollTop - clientHeight < 100;
      }
  };

  const loadMoreHistory = () => {
    setIsLoadingHistory(true);
    const prevHeight = chatContainerRef.current?.scrollHeight || 0;

    setTimeout(() => {
        const oldMessages: ChatMessage[] = [
            // Simulação de histórico
        ];
        
        setMessages(prev => [...oldMessages, ...prev]);
        setIsLoadingHistory(false);
        
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight - prevHeight;
        }
    }, 1000);
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxMedia(null);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);


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
    isAutoScrollEnabled.current = true;

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
         content: 'Ocorreu um erro ao processar sua mensagem. Verifique sua conexão e tente novamente.',
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
      recurrence: details.recurrence || 'none'
    };

    onAddTransaction(newTransaction);

    const recurrenceText = newTransaction.recurrence && newTransaction.recurrence !== 'none' 
        ? ` (${RecurrenceLabels[newTransaction.recurrence]})` 
        : '';
    const statusText = isPaidFinal ? '✅ Confirmado' : '⏰ Agendado';

    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, content: `${statusText}: ${details.description} - R$${(details.amount || 0).toFixed(2)}${recurrenceText}` , proposedTransaction: undefined } 
        : msg
    ));
    toggleCardDetails(messageId, false);
  };

  const handleRejectTransaction = (messageId: string) => {
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, content: `❌ Cancelado.` , proposedTransaction: undefined } 
          : msg
      ));
  }

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

  const startEditCategory = (msgId: string, currentCategory: string, currentRecurrence: RecurrenceFrequency) => {
      setEditingTransactionId(msgId);
      setEditCategory(currentCategory);
      setEditRecurrence(currentRecurrence || 'none');
  };

  const saveCategoryCorrection = (msgId: string, oldDetails: any) => {
      if (!editCategory) return;
      onAddRule({ keyword: oldDetails.description, category: editCategory });

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

  // --- File & Media Logic ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleSendMessage(undefined, e.target.files[0]);
    }
  };

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

  const transcribeAudio = () => {
    handleSendMessage();
  };

  const handleShare = async (transaction: Partial<Transaction>) => {
    const text = `💰 FinAI: ${transaction.description}\nValor: R$ ${(transaction.amount || 0).toFixed(2)}\nCategoria: ${transaction.category}`;
    if (navigator.share) {
      try { await navigator.share({ title: 'Lançamento FinAI', text }); } catch (err) { console.log('Share canceled'); }
    } else {
      navigator.clipboard.writeText(text);
      setCopiedId(transaction.description || 'unknown');
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const formatDuration = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getSendButtonColor = () => `bg-${themeColor}-600 hover:bg-${themeColor}-700`;
  
  const suggestions = [
      "💰 Resumo do mês",
      "📉 Analisar gastos",
      "☕ Gastei 15 reais na padaria",
      "💡 Dica de economia",
      "📅 Contas a pagar"
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-180px)] bg-gray-50 dark:bg-[#0b0e14] rounded-[2rem] shadow-xl overflow-hidden border border-gray-100 dark:border-gray-800 relative transition-all duration-300">
      
      {/* Lightbox Overlay */}
      {lightboxMedia && (
        <div 
            className="absolute inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={() => setLightboxMedia(null)}
        >
          <div className="absolute top-6 right-6 flex gap-3">
             <button className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition">
               <X size={24} />
             </button>
          </div>
          
          <div onClick={(e) => e.stopPropagation()} className="contents">
            {lightboxMedia.type === 'image' && (
                <img src={lightboxMedia.url} alt="Full screen" className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain" />
            )}
            {lightboxMedia.type === 'audio' && (
                <div className="bg-gray-900 p-8 rounded-3xl w-full max-w-md shadow-2xl flex flex-col items-center gap-6 border border-white/10">
                    <div className={`p-6 rounded-full bg-${themeColor}-500/20 text-${themeColor}-400`}>
                       <FileAudio size={64} />
                    </div>
                    <audio controls src={lightboxMedia.url} className="w-full" autoPlay />
                </div>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className={`relative z-10 px-6 py-4 flex items-center justify-between bg-white dark:bg-[#151a21] border-b border-gray-100 dark:border-gray-800 shadow-sm`}>
        <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br from-${themeColor}-500 to-${themeColor}-700 flex items-center justify-center text-white shadow-lg shrink-0 transition-all`}>
               {isLoading ? <Loader2 size={24} className="animate-spin" /> : <Bot size={28} />}
            </div>
            <div>
               <h2 className="font-black text-gray-800 dark:text-white text-lg leading-tight">FinAI Assistente</h2>
               <p className="text-xs font-medium text-gray-400 flex items-center gap-1.5">
                 <span className={`w-2 h-2 rounded-full ${isLoading ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                 {isLoading ? 'Processando...' : 'Online e pronto'}
               </p>
            </div>
        </div>
        <button 
           onClick={() => setMessages([])} 
           className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-gray-400 hover:text-gray-600 transition" 
           title="Limpar Conversa"
        >
            <Trash2 size={18} />
        </button>
      </div>

      {/* Messages Area */}
      <div 
        className="relative z-10 flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scroll-smooth custom-scrollbar" 
        ref={chatContainerRef}
        onScroll={handleScroll}
      >
        {isLoadingHistory && (
             <div className="flex justify-center py-2">
                 <div className="bg-gray-200 dark:bg-gray-800 px-4 py-1.5 rounded-full text-xs font-bold text-gray-500 flex items-center gap-2 animate-pulse">
                     <Loader2 size={12} className="animate-spin" /> Carregando histórico...
                 </div>
             </div>
        )}

        {messages.map((msg) => {
            const isMe = msg.sender === 'user';
            
            return (
          <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group animate-in slide-in-from-bottom-2 duration-300`}>
            
            {!isMe && (
                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mr-3 mt-1 shrink-0 text-gray-400">
                    <Bot size={16} />
                </div>
            )}

            <div className={`max-w-[85%] md:max-w-[75%] lg:max-w-[60%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              
              <div className={`
                  px-5 py-4 rounded-2xl shadow-sm text-sm leading-relaxed relative
                  ${isMe 
                    ? `bg-gradient-to-br from-${themeColor}-600 to-${themeColor}-700 text-white rounded-tr-none` 
                    : 'bg-white dark:bg-[#1c2128] text-gray-700 dark:text-gray-200 rounded-tl-none border border-gray-100 dark:border-gray-800'}
              `}>
                
                {/* Media Attachments */}
                {msg.type === 'image' && msg.mediaUrl && (
                  <div className="mb-3 rounded-xl overflow-hidden cursor-pointer relative shadow-md" onClick={() => setLightboxMedia({ type: 'image', url: msg.mediaUrl! })}>
                      <img src={msg.mediaUrl} alt="Attachment" className="max-h-60 w-full object-cover" />
                  </div>
                )}
                
                {msg.type === 'audio' && msg.mediaUrl && (
                    <div className={`flex items-center gap-3 p-3 rounded-xl mb-3 min-w-[220px] ${isMe ? 'bg-white/20' : 'bg-gray-50 dark:bg-gray-900'}`}>
                        <button onClick={() => setLightboxMedia({ type: 'audio', url: msg.mediaUrl! })} className={`p-2 rounded-full shadow-sm ${isMe ? 'bg-white text-' + themeColor + '-600' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-200'}`}>
                           <Play size={14} fill="currentColor" />
                        </button>
                        <div className="flex-1 space-y-1">
                            <div className={`h-1 rounded-full overflow-hidden w-full ${isMe ? 'bg-white/30' : 'bg-gray-200 dark:bg-gray-700'}`}>
                                <div className={`h-full w-1/3 ${isMe ? 'bg-white' : 'bg-gray-400'}`}></div>
                            </div>
                            <p className={`text-[10px] font-medium ${isMe ? 'text-white/80' : 'text-gray-400'}`}>Áudio Gravado</p>
                        </div>
                    </div>
                )}

                {/* Text Content */}
                <div className="whitespace-pre-wrap">
                    {msg.content}
                </div>
              </div>
              
              <span className="text-[10px] font-medium text-gray-400 mt-1.5 px-1 opacity-70">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>

              {/* Transaction Receipt Card */}
              {msg.proposedTransaction && (
                <div className="mt-3 w-full bg-white dark:bg-[#1c2128] rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-lg animate-in zoom-in-95 duration-500 max-w-sm">
                  {/* Card Header */}
                  <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center">
                     <div className="flex items-center gap-2">
                        {msg.proposedTransaction.isPaid === false 
                            ? <CalendarClock size={16} className="text-orange-500" />
                            : <Check size={16} className="text-emerald-500" />
                        }
                        <span className="text-xs font-black uppercase tracking-wider text-gray-500">
                            {msg.proposedTransaction.isPaid === false ? 'Agendamento' : 'Novo Lançamento'}
                        </span>
                     </div>
                     <button onClick={() => handleShare(msg.proposedTransaction!)} className="text-gray-400 hover:text-indigo-500 transition">
                        {copiedId === msg.proposedTransaction.description ? <Check size={14}/> : <Share2 size={14} />}
                     </button>
                  </div>
                  
                  <div className="p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-400 font-bold uppercase mb-1">Valor</p>
                            <p className="text-2xl font-black text-gray-800 dark:text-white">R$ {(msg.proposedTransaction.amount || 0).toFixed(2)}</p>
                        </div>
                        <div className={`p-2 rounded-xl ${msg.proposedTransaction.type === TransactionType.EXPENSE ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                            {msg.proposedTransaction.type === TransactionType.EXPENSE ? <ArrowUp size={20} className="rotate-45" /> : <ArrowUp size={20} className="rotate-[225deg]" />}
                        </div>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-3 border border-gray-100 dark:border-gray-800">
                        <p className="text-xs text-gray-400 font-bold uppercase mb-1">Descrição</p>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{msg.proposedTransaction.description}</p>
                    </div>

                    {/* Detailed Fields (Collapsible) */}
                    {expandedCardIds.has(msg.id) && (
                        <div className="pt-2 animate-in slide-in-from-top-2 space-y-3">
                            <div>
                                <p className="text-xs text-gray-400 font-bold uppercase mb-1">Categoria</p>
                                {editingTransactionId === msg.id ? (
                                    <div className="flex gap-2">
                                        <select 
                                            value={editCategory}
                                            onChange={(e) => setEditCategory(e.target.value)}
                                            className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-sm outline-none"
                                        >
                                            {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                        </select>
                                        <button onClick={() => saveCategoryCorrection(msg.id, msg.proposedTransaction)} className="bg-indigo-600 text-white p-2 rounded-lg">
                                            <Check size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-900 p-2 rounded-lg border border-gray-100 dark:border-gray-800">
                                        <span className="text-sm font-medium dark:text-white">{msg.proposedTransaction.category}</span>
                                        <button onClick={() => startEditCategory(msg.id, msg.proposedTransaction!.category!, msg.proposedTransaction!.recurrence as any)} className="text-indigo-500 p-1 hover:bg-indigo-50 rounded">
                                            <Edit2 size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                  </div>

                  {/* Card Actions */}
                  <div className="p-3 bg-gray-50 dark:bg-gray-900/50 flex gap-2 border-t border-gray-100 dark:border-gray-800">
                      <button onClick={() => handleRejectTransaction(msg.id)} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 font-bold text-xs hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                          Cancelar
                      </button>
                      <button onClick={() => handleConfirmTransaction(msg.id, msg.proposedTransaction)} className={`flex-1 py-2.5 rounded-xl bg-${themeColor}-600 text-white hover:bg-${themeColor}-700 text-xs font-bold transition shadow-md`}>
                          Confirmar
                      </button>
                  </div>
                  <button onClick={() => toggleCardDetails(msg.id)} className="w-full py-1.5 text-[10px] font-bold text-gray-400 hover:text-gray-600 bg-white dark:bg-[#1c2128] transition border-t border-gray-100 dark:border-gray-800">
                      {expandedCardIds.has(msg.id) ? 'MENOS DETALHES' : 'MAIS DETALHES'}
                  </button>
                </div>
              )}
            </div>
            
            {isMe && (
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center ml-3 mt-1 shrink-0 text-gray-500 dark:text-gray-400">
                    <User size={16} />
                </div>
            )}
          </div>
        )})}
        
        {/* Typing Indicator */}
        {isLoading && (
          <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 items-end">
            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mr-3 mb-1 text-gray-400">
               <Bot size={16} />
            </div>
            <div className="bg-white dark:bg-[#1c2128] rounded-2xl rounded-tl-none p-4 shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-2">
               <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
               </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="relative z-20 bg-white dark:bg-[#151a21] p-4 border-t border-gray-100 dark:border-gray-800">
         
         {/* Quick Suggestions Chips */}
         {messages.length < 3 && !input && (
             <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
                 {suggestions.map((s, i) => (
                     <button 
                        key={i} 
                        onClick={() => handleSendMessage(s.replace(/^[^\s]+\s/, ''))}
                        className="whitespace-nowrap px-4 py-2 bg-gray-50 dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-gray-600 dark:text-gray-300 hover:text-indigo-600 text-xs font-bold rounded-xl border border-gray-200 dark:border-gray-700 transition"
                     >
                         {s}
                     </button>
                 ))}
             </div>
         )}

         {/* Hidden File Input */}
         <input type="file" ref={fileInputRef} className="hidden" accept="image/*,audio/*" onChange={handleFileSelect} />

         {isRecording ? (
             <div className="w-full bg-red-50 dark:bg-red-900/20 rounded-2xl p-3 flex items-center justify-between shadow-inner animate-in fade-in border border-red-100 dark:border-red-900/30">
                 <div className="flex items-center gap-3 text-red-500 animate-pulse">
                     <div className="p-2 bg-red-100 dark:bg-red-800 rounded-full">
                        <Mic size={20} fill="currentColor" />
                     </div>
                     <span className="font-mono font-bold text-lg">{formatDuration(recordingDuration)}</span>
                 </div>
                 <div className="flex items-center gap-1 h-8 px-4 flex-1 justify-center opacity-50">
                     {[...Array(20)].map((_, i) => (
                         <div key={i} className="w-1 bg-red-400 rounded-full animate-bounce" style={{ height: `${Math.random() * 100}%`, animationDuration: `${0.4 + Math.random() * 0.4}s` }} />
                     ))}
                 </div>
                 <button onClick={stopRecording} className="p-3 bg-white dark:bg-gray-800 text-red-500 rounded-xl shadow-sm hover:scale-105 transition">
                     <Square size={20} fill="currentColor" />
                 </button>
             </div>
         ) : audioPreviewUrl ? (
             <div className="w-full bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-3 flex flex-col gap-3 shadow-sm border border-gray-100 dark:border-gray-700 animate-in slide-in-from-bottom-2">
                 <div className="flex items-center gap-3">
                     <button onClick={() => {
                        const audio = document.getElementById('preview-audio') as HTMLAudioElement;
                        audio?.play();
                     }} className={`p-3 bg-${themeColor}-100 text-${themeColor}-600 rounded-xl`}>
                         <Play size={20} fill="currentColor"/>
                     </button>
                     <audio id="preview-audio" src={audioPreviewUrl} className="hidden" />
                     <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                         <div className={`h-full bg-${themeColor}-500 w-1/3`}></div>
                     </div>
                     <button onClick={clearAudioPreview} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition">
                         <Trash2 size={20} />
                     </button>
                 </div>
                 
                 <div className="flex gap-3">
                     <button onClick={transcribeAudio} className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-green-600/20">
                        <Send size={18} /> Enviar Áudio
                     </button>
                 </div>
             </div>
         ) : (
             <div className="flex items-end gap-2">
                <div className="flex items-center gap-1 mb-1">
                    <button onClick={() => fileInputRef.current?.click()} className="p-3 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition" title="Anexar Arquivo">
                        <Paperclip size={22} />
                    </button>
                </div>
                
                <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center shadow-inner border border-transparent focus-within:border-indigo-500/30 focus-within:bg-white dark:focus-within:bg-[#1c2128] transition-all">
                    <textarea 
                        value={input} 
                        onChange={(e) => setInput(e.target.value)} 
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                            }
                        }}
                        placeholder="Digite uma mensagem..." 
                        className="flex-1 bg-transparent border-none outline-none text-gray-800 dark:text-white placeholder-gray-400 px-4 py-3.5 max-h-32 min-h-[50px] resize-none text-sm"
                        disabled={isLoading}
                        rows={1}
                    />
                </div>

                <div className="mb-1">
                    {(input || audioPreviewUrl) ? (
                        <button 
                            onClick={() => handleSendMessage()} 
                            disabled={isLoading}
                            className={`p-3.5 rounded-2xl text-white shadow-lg shadow-${themeColor}-600/30 transform transition active:scale-95 disabled:opacity-50 disabled:scale-100 bg-${themeColor}-600 hover:bg-${themeColor}-700`}
                        >
                            {isLoading ? <Loader2 size={22} className="animate-spin" /> : <Send size={22} />}
                        </button>
                    ) : (
                        <button 
                            onClick={startRecording}
                            className={`p-3.5 rounded-2xl text-white shadow-lg shadow-${themeColor}-600/30 transform transition active:scale-95 hover:scale-105 bg-${themeColor}-600 hover:bg-${themeColor}-700`}
                        >
                            <Mic size={22} />
                        </button>
                    )}
                </div>
             </div>
         )}
      </div>
    </div>
  );
};
