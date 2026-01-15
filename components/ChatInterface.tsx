import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Image as ImageIcon, Paperclip, Loader2, Check, X, Play, Square, Edit2, Save, Maximize2, Share2, Trash2, FileAudio, ChevronDown, ChevronUp, FileText, Clock, CalendarClock, DollarSign, Calendar, Sparkles, Download, MoreHorizontal, Copy } from 'lucide-react';
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
      content: 'Olá! Sou seu assistente FinAI. 🤖\nEnvie áudios, imagens ou textos sobre seus gastos e eu organizo tudo.',
      type: 'text',
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  
  // History State
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  
  // Audio Confirmation State
  const [isAudioConfirmed, setIsAudioConfirmed] = useState(false);
  
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

  // Control scrolling to bottom
  const shouldScrollRef = useRef(true);

  const scrollToBottom = () => {
    if (shouldScrollRef.current) {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
        }, 100);
    }
    shouldScrollRef.current = true;
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, editingTransactionId, audioPreviewUrl, expandedCardIds, input]);

  // Handle Esc for Lightbox
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxMedia(null);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  // Handle Load History
  const handleLoadHistory = () => {
    setIsLoadingHistory(true);
    shouldScrollRef.current = false;

    setTimeout(() => {
        const oldMessages: ChatMessage[] = [
            { id: `hist-${Date.now()}-1`, sender: 'user', content: 'Quanto gastei com Uber mês passado?', type: 'text', timestamp: new Date(Date.now() - 86400000 * 5) },
            { id: `hist-${Date.now()}-2`, sender: 'ai', content: 'No mês passado, você gastou um total de R$ 345,20 em transporte.', type: 'text', timestamp: new Date(Date.now() - 86400000 * 5) },
        ];
        
        setMessages(prev => [...oldMessages, ...prev]);
        setIsLoadingHistory(false);
    }, 1000);
  };

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
      if (isConsulting || textToSend.toLowerCase().includes('analise') || textToSend.toLowerCase().includes('dica')) {
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
         content: 'Ocorreu um erro ao processar sua mensagem. Tente novamente.',
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

  const handleSnooze = (messageId: string, details: any, days: number) => {
      const currentDue = details.dueDate ? new Date(details.dueDate) : new Date();
      currentDue.setDate(currentDue.getDate() + days);
      const newDueDate = currentDue.toISOString().split('T')[0];

      setMessages(prev => prev.map(msg => {
          if (msg.id === messageId && msg.proposedTransaction) {
              return {
                  ...msg,
                  proposedTransaction: { ...msg.proposedTransaction, dueDate: newDueDate }
              };
          }
          return msg;
      }));
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
      setIsAudioConfirmed(false);

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
    setIsAudioConfirmed(false);
  };

  const transcribeAudio = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert("Navegador sem suporte a transcrição. Digite o texto.");
      return;
    }

    setIsTranscribing(true);
    // @ts-ignore
    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      setInput(event.results[0][0].transcript);
      setIsTranscribing(false);
    };

    recognition.onerror = () => {
      setIsTranscribing(false);
      alert("Erro na transcrição. Tente novamente.");
    };
    recognition.start();
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
  const getBubbleColor = (isUser: boolean) => {
    if (isUser) return `bg-${themeColor}-100 dark:bg-${themeColor}-900/40 text-gray-800 dark:text-gray-100 rounded-tr-none`;
    return 'bg-white dark:bg-gray-800 dark:text-gray-100 rounded-tl-none border border-gray-100 dark:border-gray-700';
  };

  return (
    <div className="flex flex-col h-[600px] bg-[#E5DDD5] dark:bg-[#111b21] rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700 relative">
      <style>{`
        .chat-bg-pattern {
            background-image: url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png');
            background-repeat: repeat;
            opacity: 0.5;
        }
        .dark .chat-bg-pattern {
            opacity: 0.05;
        }
      `}</style>
      <div className="absolute inset-0 chat-bg-pattern pointer-events-none z-0"></div>

      {/* Lightbox Overlay */}
      {lightboxMedia && (
        <div 
            className="absolute inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={() => setLightboxMedia(null)}
        >
          <div className="absolute top-4 right-4 flex gap-2">
             {lightboxMedia.type === 'image' && (
               <a 
                 href={lightboxMedia.url} 
                 download={`finai-image-${Date.now()}.png`}
                 onClick={(e) => e.stopPropagation()}
                 className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition"
               >
                 <Download size={24} />
               </a>
             )}
             <button className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition">
               <X size={24} />
             </button>
          </div>
          
          <div onClick={(e) => e.stopPropagation()} className="contents">
            {lightboxMedia.type === 'image' && (
                <img src={lightboxMedia.url} alt="Full screen" className="max-w-full max-h-[80vh] rounded-lg shadow-2xl object-contain" />
            )}
            {lightboxMedia.type === 'audio' && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl w-full max-w-md shadow-2xl flex flex-col items-center gap-4">
                    <div className={`p-4 rounded-full bg-${themeColor}-100 dark:bg-${themeColor}-900/30 text-${themeColor}-600`}>
                       <FileAudio size={48} />
                    </div>
                    <audio controls src={lightboxMedia.url} className="w-full" autoPlay />
                </div>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className={`relative z-10 px-4 py-3 flex items-center justify-between shadow-md bg-[#f0f2f5] dark:bg-[#202c33] border-b border-gray-200 dark:border-gray-700`}>
        <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full bg-${themeColor}-600 flex items-center justify-center text-white shadow-sm`}>
               <Sparkles size={20} />
            </div>
            <div>
               <h2 className="font-bold text-gray-800 dark:text-white leading-tight">FinAI Assistente</h2>
               <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                 {isLoading ? <span className="text-indigo-500 font-medium">Digitando...</span> : 'Online'}
               </p>
            </div>
        </div>
        <button 
           onClick={() => handleSendMessage("Faça uma análise completa da minha situação financeira.", undefined, true)}
           disabled={isLoading}
           className={`px-3 py-1.5 rounded-full bg-white dark:bg-gray-700 text-${themeColor}-600 dark:text-${themeColor}-400 text-xs font-semibold shadow-sm border border-gray-200 dark:border-gray-600 hover:bg-gray-50 transition`}
        >
            Analisar Finanças
        </button>
      </div>

      {/* Messages Area */}
      <div className="relative z-10 flex-1 overflow-y-auto p-4 space-y-4" ref={chatContainerRef}>
        <div className="flex justify-center pb-2">
            <button 
                onClick={handleLoadHistory}
                disabled={isLoadingHistory}
                className="text-xs text-gray-500 dark:text-gray-400 bg-white/80 dark:bg-gray-800/80 px-3 py-1 rounded-full shadow-sm backdrop-blur-sm border border-gray-100 dark:border-gray-700 hover:bg-white transition flex items-center gap-2"
            >
                {isLoadingHistory ? <Loader2 size={10} className="animate-spin"/> : <Clock size={10}/>} Carregar anteriores
            </button>
        </div>

        {messages.map((msg) => {
            const isMe = msg.sender === 'user';
            const isConsulting = !msg.proposedTransaction && msg.sender === 'ai' && msg.content.length > 60;

            return (
          <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}>
            <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-3 shadow-sm relative transition-all ${getBubbleColor(isMe)}`}>
              
              {/* Media Attachments */}
              {msg.type === 'image' && msg.mediaUrl && (
                <div className="mb-2 rounded-lg overflow-hidden cursor-pointer relative" onClick={() => setLightboxMedia({ type: 'image', url: msg.mediaUrl! })}>
                    <img src={msg.mediaUrl} alt="Attachment" className="max-h-60 w-full object-cover" />
                    <div className="absolute inset-0 bg-black/10 hover:bg-black/20 transition flex items-center justify-center">
                        <Maximize2 className="text-white opacity-0 group-hover:opacity-100 drop-shadow-md" size={24} />
                    </div>
                </div>
              )}
              
              {msg.type === 'audio' && msg.mediaUrl && (
                  <div className="flex items-center gap-3 bg-black/5 dark:bg-white/10 p-2 rounded-xl mb-2 min-w-[220px]">
                      <button onClick={() => setLightboxMedia({ type: 'audio', url: msg.mediaUrl! })} className="p-2 bg-white dark:bg-gray-700 rounded-full shadow-sm text-gray-600 dark:text-gray-200">
                         <Play size={14} fill="currentColor" />
                      </button>
                      <div className="flex-1 space-y-1">
                          <div className="h-1 bg-gray-300 dark:bg-gray-500 rounded-full overflow-hidden w-full">
                              <div className="h-full bg-gray-500 dark:bg-gray-300 w-1/3"></div>
                          </div>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400">Mensagem de voz</p>
                      </div>
                  </div>
              )}

              {/* Text Content */}
              <div className={`text-sm whitespace-pre-wrap leading-relaxed ${isConsulting ? 'prose prose-sm dark:prose-invert max-w-none' : ''}`}>
                  {isConsulting && (
                      <div className={`flex items-center gap-2 mb-2 pb-2 border-b ${isMe ? 'border-white/20' : 'border-gray-200 dark:border-gray-700'}`}>
                          <Sparkles size={14} className={isMe ? 'text-white' : `text-${themeColor}-500`} />
                          <span className={`font-bold text-xs uppercase tracking-wider ${isMe ? 'text-white' : `text-${themeColor}-600`}`}>Consultoria AI</span>
                      </div>
                  )}
                  {msg.content}
              </div>
              
              <span className={`text-[10px] block text-right mt-1 opacity-70 ${isMe ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400'}`}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>

              {/* Transaction Receipt Card */}
              {msg.proposedTransaction && (
                <div className="mt-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm animate-in zoom-in-95 duration-300">
                  {/* Card Header */}
                  <div className={`px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center ${
                      msg.proposedTransaction.isPaid === false 
                        ? 'bg-orange-50 dark:bg-orange-900/10' 
                        : 'bg-gray-50 dark:bg-gray-900/30'
                  }`}>
                     <div className="flex items-center gap-2">
                        {msg.proposedTransaction.isPaid === false 
                            ? <CalendarClock size={16} className="text-orange-500" />
                            : <DollarSign size={16} className="text-green-500" />
                        }
                        <span className={`text-xs font-bold uppercase tracking-wider ${
                            msg.proposedTransaction.isPaid === false ? 'text-orange-600' : 'text-gray-600 dark:text-gray-300'
                        }`}>
                            {msg.proposedTransaction.isPaid === false ? 'Agendamento' : 'Auditoria'}
                        </span>
                     </div>
                     <button 
                       onClick={() => handleShare(msg.proposedTransaction!)}
                       className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition text-gray-400 hover:text-indigo-600"
                       title="Compartilhar"
                     >
                        {copiedId === msg.proposedTransaction.description ? <Check size={14} className="text-green-500"/> : <Share2 size={14} />}
                     </button>
                  </div>
                  
                  {/* Card Body */}
                  <div className="p-4 space-y-3">
                    <div className="flex justify-between items-baseline">
                        <span className="text-2xl font-bold text-gray-800 dark:text-white">
                            R$ {(msg.proposedTransaction.amount || 0).toFixed(2)}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full border ${
                            msg.proposedTransaction.type === TransactionType.EXPENSE 
                            ? 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:border-red-900' 
                            : 'bg-green-50 text-green-600 border-green-100 dark:bg-green-900/20 dark:border-green-900'
                        }`}>
                            {msg.proposedTransaction.type === TransactionType.EXPENSE ? 'Despesa' : 'Receita'}
                        </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 font-medium line-clamp-2">
                        {msg.proposedTransaction.description}
                    </p>

                    {/* Detailed Fields (Collapsible) */}
                    {expandedCardIds.has(msg.id) && (
                        <div className="pt-3 mt-3 border-t border-dashed border-gray-200 dark:border-gray-700 text-xs space-y-2 animate-in slide-in-from-top-2">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500">Categoria:</span>
                                {editingTransactionId === msg.id ? (
                                    <select 
                                        value={editCategory}
                                        onChange={(e) => setEditCategory(e.target.value)}
                                        className="bg-gray-50 border rounded p-1"
                                    >
                                        {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                    </select>
                                ) : (
                                    <span className="font-medium bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-700 dark:text-gray-300">
                                        {msg.proposedTransaction.category}
                                    </span>
                                )}
                            </div>
                            {/* Editing Actions */}
                            {editingTransactionId === msg.id ? (
                                <button onClick={() => saveCategoryCorrection(msg.id, msg.proposedTransaction)} className="w-full mt-2 bg-indigo-600 text-white py-1 rounded">Salvar</button>
                            ) : (
                                <button onClick={() => startEditCategory(msg.id, msg.proposedTransaction!.category!, msg.proposedTransaction!.recurrence as any)} className="text-indigo-500 flex items-center gap-1 hover:underline">
                                    <Edit2 size={10} /> Editar Categoria
                                </button>
                            )}
                        </div>
                    )}
                  </div>

                  {/* Card Actions */}
                  <div className="p-3 bg-gray-50 dark:bg-gray-900/50 flex gap-2">
                      <button onClick={() => handleRejectTransaction(msg.id)} className="flex-1 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition">
                          Cancelar
                      </button>
                      <button onClick={() => handleConfirmTransaction(msg.id, msg.proposedTransaction)} className="flex-1 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-bold transition shadow-sm">
                          Confirmar
                      </button>
                  </div>
                  <button onClick={() => toggleCardDetails(msg.id)} className="w-full py-1 text-[10px] text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition text-center">
                      {expandedCardIds.has(msg.id) ? 'Ocultar Detalhes' : 'Ver Detalhes'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )})}
        
        {/* Typing Indicator */}
        {isLoading && (
          <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2">
            <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-tl-none p-4 shadow-sm border border-gray-100 dark:border-gray-700">
               <div className="flex gap-1.5">
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
      <div className="relative z-20 bg-[#f0f2f5] dark:bg-[#202c33] p-2 pr-4 flex items-end gap-2 border-t border-gray-200 dark:border-gray-700">
         {/* Hidden File Input */}
         <input type="file" ref={fileInputRef} className="hidden" accept="image/*,audio/*" onChange={handleFileSelect} />

         {isRecording ? (
             <div className="flex-1 bg-white dark:bg-gray-700 rounded-full p-3 flex items-center justify-between shadow-inner animate-in fade-in">
                 <div className="flex items-center gap-3 text-red-500 animate-pulse">
                     <Mic size={20} fill="currentColor" />
                     <span className="font-mono font-medium">{formatDuration(recordingDuration)}</span>
                 </div>
                 <div className="flex items-center gap-1 h-6">
                     {[...Array(12)].map((_, i) => (
                         <div key={i} className="w-1 bg-red-400 rounded-full animate-bounce" style={{ height: `${Math.random() * 100}%`, animationDuration: `${0.4 + Math.random() * 0.4}s` }} />
                     ))}
                 </div>
                 <button onClick={stopRecording} className="p-1 bg-red-100 text-red-600 rounded-full">
                     <Square size={16} fill="currentColor" />
                 </button>
             </div>
         ) : audioPreviewUrl ? (
             <div className="flex-1 bg-white dark:bg-gray-700 rounded-2xl p-2 flex flex-col gap-2 shadow-sm animate-in slide-in-from-bottom-2">
                 <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-xl">
                     <button onClick={clearAudioPreview} className="p-2 text-gray-400 hover:text-red-500 transition"><Trash2 size={18}/></button>
                     <audio src={audioPreviewUrl} controls className="flex-1 h-8" />
                 </div>
                 
                 {!isAudioConfirmed ? (
                     <div className="flex gap-2">
                         <button onClick={() => setIsAudioConfirmed(true)} className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-bold transition">
                            Usar Áudio
                         </button>
                     </div>
                 ) : (
                     <div className="flex gap-2 items-center px-1">
                         {isTranscribing ? (
                             <div className="flex-1 flex items-center justify-center gap-2 text-xs text-gray-500">
                                 <Loader2 size={12} className="animate-spin" /> Transcrevendo...
                             </div>
                         ) : input ? (
                            <div className="flex-1 flex items-center gap-2 text-xs bg-indigo-50 dark:bg-indigo-900/20 p-2 rounded border border-indigo-100 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300">
                                <FileText size={14} />
                                <span className="truncate flex-1">"{input}"</span>
                                <button onClick={useTranscribedText} className="font-bold hover:underline">Usar</button>
                            </div>
                         ) : (
                             <button onClick={transcribeAudio} className="flex-1 flex items-center justify-center gap-1 py-1.5 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-xs text-gray-500 hover:bg-gray-50 transition">
                                <FileText size={14} /> Transcrever
                             </button>
                         )}
                     </div>
                 )}
             </div>
         ) : (
             <>
                <button onClick={() => fileInputRef.current?.click()} className="p-3 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition">
                    <Paperclip size={24} />
                </button>
                <div className="flex-1 bg-white dark:bg-gray-700 rounded-3xl flex items-center px-4 py-2 shadow-sm border border-gray-200 dark:border-gray-600 focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
                    <input 
                        type="text" 
                        value={input} 
                        onChange={(e) => setInput(e.target.value)} 
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Mensagem..." 
                        className="flex-1 bg-transparent border-none outline-none text-gray-800 dark:text-white placeholder-gray-400"
                        disabled={isLoading}
                    />
                </div>
             </>
         )}

         {/* Send / Record Action Button */}
         {(input || audioPreviewUrl) && !isRecording ? (
             <button 
                onClick={() => handleSendMessage()} 
                disabled={isLoading}
                className={`p-3 rounded-full text-white shadow-lg transform transition active:scale-95 disabled:opacity-50 disabled:scale-100 ${getSendButtonColor()}`}
             >
                 {isLoading ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} />}
             </button>
         ) : !isRecording && (
             <button 
                onClick={startRecording}
                className={`p-3 rounded-full text-white shadow-lg transform transition active:scale-95 hover:scale-105 ${getSendButtonColor()}`}
             >
                 <Mic size={24} />
             </button>
         )}
      </div>
    </div>
  );
  
  function useTranscribedText() {
      // Just clear audio preview so standard send logic picks up text 'input'
      if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
      setAudioPreviewUrl(null);
      setRecordedBlob(null);
      setIsAudioConfirmed(false);
  }
};