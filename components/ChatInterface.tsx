import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Image as ImageIcon, Paperclip, Loader2, Check, X, Play, Square, Edit2, Save, Maximize2, Share2, Trash2, FileAudio, Repeat } from 'lucide-react';
import { ChatMessage, Transaction, TransactionType, TransactionStatus, Category, AIRule, ThemeColor, RecurrenceFrequency, RecurrenceLabels } from '../types';
import { analyzeFinancialInput } from '../services/geminiService';

interface ChatInterfaceProps {
  onAddTransaction: (transaction: Transaction) => void;
  categories: Category[];
  userRules: AIRule[];
  onAddRule: (rule: AIRule) => void;
  themeColor: ThemeColor;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ onAddTransaction, categories, userRules, onAddRule, themeColor }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      content: 'Olá! Sou seu assistente financeiro FinAI. Envie comprovantes, áudios ou textos de suas transações que eu organizo tudo para você. 🚀',
      type: 'text',
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);

  // Correction State
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
  const [editCategory, setEditCategory] = useState('');
  const [editRecurrence, setEditRecurrence] = useState<RecurrenceFrequency>('none');

  // Lightbox State
  const [lightboxMedia, setLightboxMedia] = useState<{ type: 'image' | 'audio', url: string } | null>(null);

  // Share Feedback State
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, editingTransactionId, audioPreviewUrl]);

  const handleSendMessage = async (text?: string, file?: File) => {
    const textToSend = text || input;
    const fileToSend = file || (recordedBlob ? new File([recordedBlob], "audio_note.mp3", { type: 'audio/mp3' }) : undefined);

    if (!textToSend.trim() && !fileToSend) return;

    // 1. Add User Message
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

    // 2. Call AI Service
    try {
      const result = await analyzeFinancialInput(textToSend || null, fileToSend || null, categories, userRules);

      // 3. Process Response
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        content: result.responseMessage,
        type: 'text',
        timestamp: new Date(),
        proposedTransaction: result.isTransaction ? result.transactionDetails : undefined
      };

      setMessages(prev => [...prev, aiResponse]);

    } catch (error) {
      const errorMsg: ChatMessage = {
         id: (Date.now() + 1).toString(),
         sender: 'ai',
         content: 'Ocorreu um erro ao processar sua mensagem. Tente novamente.',
         type: 'text',
         timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmTransaction = (messageId: string, details: any) => {
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      dueDate: undefined,
      description: details.description,
      amount: details.amount || 0,
      type: details.type,
      category: details.category, 
      status: TransactionStatus.CONFIRMED,
      isPaid: true,
      source: 'whatsapp_ai',
      recurrence: details.recurrence || 'none'
    };

    onAddTransaction(newTransaction);

    const recurrenceText = newTransaction.recurrence && newTransaction.recurrence !== 'none' 
        ? ` (${RecurrenceLabels[newTransaction.recurrence]})` 
        : '';

    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, content: `✅ Lançamento confirmado: ${details.description} - R$${(details.amount || 0).toFixed(2)}${recurrenceText}` , proposedTransaction: undefined } 
        : msg
    ));
  };

  const handleRejectTransaction = (messageId: string) => {
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, content: `❌ Lançamento cancelado.` , proposedTransaction: undefined } 
          : msg
      ));
  }

  // --- Learning Logic ---
  const startEditCategory = (msgId: string, currentCategory: string, currentRecurrence: RecurrenceFrequency) => {
      setEditingTransactionId(msgId);
      setEditCategory(currentCategory);
      setEditRecurrence(currentRecurrence || 'none');
  };

  const saveCategoryCorrection = (msgId: string, oldDetails: any) => {
      if (!editCategory) return;
      const keyword = oldDetails.description; 
      onAddRule({ keyword, category: editCategory });

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
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
        const url = URL.createObjectURL(audioBlob);
        setRecordedBlob(audioBlob);
        setAudioPreviewUrl(url);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
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
    if (audioPreviewUrl) {
      URL.revokeObjectURL(audioPreviewUrl);
    }
    setAudioPreviewUrl(null);
    setRecordedBlob(null);
    setInput('');
  };

  const transcribeAudio = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert("Seu navegador não suporta transcrição nativa. Por favor, digite o texto.");
      return;
    }

    setIsTranscribing(true);
    setInput("Ouvindo..."); // Feedback visual

    // @ts-ignore
    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setIsTranscribing(false);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsTranscribing(false);
      setInput('');
      if (event.error === 'not-allowed') {
        alert("Permissão de microfone negada.");
      } else {
        alert("Não foi possível transcrever. Tente novamente.");
      }
    };

    recognition.onend = () => {
      setIsTranscribing(false);
    };
    
    recognition.start();
  };

  // --- Sharing ---
  const handleShare = async (transaction: Partial<Transaction>) => {
    const text = `💰 FinAI: ${transaction.description} - R$ ${(transaction.amount || 0).toFixed(2)} (${transaction.category})`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Lançamento FinAI',
          text: text,
        });
      } catch (err) {
        console.log('Error sharing', err);
      }
    } else {
      navigator.clipboard.writeText(text);
      setCopiedId(transaction.description || 'unknown');
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  // Dynamic Theme Colors
  const getSendButtonColor = () => `bg-${themeColor}-600 hover:bg-${themeColor}-700`;
  const getBubbleColor = (isUser: boolean) => {
    if (isUser) return `bg-${themeColor}-100 dark:bg-${themeColor}-900/30 text-gray-800 dark:text-gray-100`;
    return 'bg-white dark:bg-gray-800 dark:text-gray-100';
  };

  const getCategoryBadgeStyle = (category: string) => {
     return `bg-${themeColor}-50 text-${themeColor}-700 border-${themeColor}-200 dark:bg-${themeColor}-900/40 dark:text-${themeColor}-300 dark:border-${themeColor}-700`;
  };

  return (
    <div className="flex flex-col h-[600px] bg-[#E5DDD5] dark:bg-[#1f2937] rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700 relative">
      
      {/* Lightbox Overlay */}
      {lightboxMedia && (
        <div 
            className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 animate-in fade-in duration-200 cursor-pointer"
            onClick={() => setLightboxMedia(null)}
        >
          <button 
            onClick={() => setLightboxMedia(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 p-2 bg-black/20 rounded-full"
          >
            <X size={32} />
          </button>
          
          <div onClick={(e) => e.stopPropagation()} className="contents">
            {lightboxMedia.type === 'image' && (
                <img 
                src={lightboxMedia.url} 
                alt="Full screen" 
                className="max-w-full max-h-[80vh] rounded-lg shadow-2xl transition-transform hover:scale-[1.02]" 
                />
            )}
            
            {lightboxMedia.type === 'audio' && (
                <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl w-full max-w-md shadow-2xl cursor-default">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2 dark:text-white">
                    <FileAudio className={`text-${themeColor}-600`} /> 
                    Reproduzindo Áudio
                    </h3>
                    <audio controls src={lightboxMedia.url} className="w-full" autoPlay />
                </div>
            )}
          </div>
        </div>
      )}

      {/* Header WhatsApp Style */}
      <div className={`text-white p-4 flex items-center shadow-md z-10 ${getSendButtonColor()}`}>
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mr-3">
          <span className="font-bold text-lg">🤖</span>
        </div>
        <div>
          <h2 className="font-semibold text-lg">FinAI Agent</h2>
          <p className="text-xs text-white/80">{isLoading ? 'Digitando...' : 'Online'}</p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] dark:bg-none dark:bg-gray-900 bg-repeat">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] md:max-w-[70%] rounded-lg p-3 shadow-sm relative transition-all ${getBubbleColor(msg.sender === 'user')} ${
                msg.sender === 'user' ? 'rounded-tr-none' : 'rounded-tl-none'
              }`}
            >
              {/* Media Handling */}
              {msg.type === 'image' && msg.mediaUrl && (
                <div className="relative group cursor-pointer" onClick={() => setLightboxMedia({ type: 'image', url: msg.mediaUrl! })}>
                    <img src={msg.mediaUrl} alt="Upload" className="rounded-lg mb-2 max-h-48 w-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center opacity-0 group-hover:opacity-100 rounded-lg">
                        <Maximize2 className="text-white drop-shadow-md" size={24} />
                    </div>
                </div>
              )}
              {msg.type === 'audio' && msg.mediaUrl && (
                  <div className="flex items-center gap-2 mb-2 bg-gray-100 dark:bg-gray-700 p-2 rounded-full min-w-[200px]">
                      <button onClick={() => setLightboxMedia({ type: 'audio', url: msg.mediaUrl! })} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full">
                         <Play size={16} className="text-gray-600 dark:text-gray-300" />
                      </button>
                      <div className="h-1 bg-gray-300 dark:bg-gray-500 w-full rounded"></div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Audio</span>
                  </div>
              )}

              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              
              <span className="text-[10px] text-gray-500 dark:text-gray-400 block text-right mt-1">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>

              {/* Proposed Transaction Audit Card */}
              {msg.proposedTransaction && (
                <div className="mt-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                     <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Auditoria Necessária</p>
                     <button 
                       onClick={() => handleShare(msg.proposedTransaction!)}
                       className="text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition flex items-center gap-1"
                       title="Compartilhar"
                     >
                        {copiedId === msg.proposedTransaction.description ? (
                            <span className="text-green-500 text-[10px] font-bold flex items-center gap-0.5"><Check size={12}/> Copiado</span>
                        ) : (
                            <Share2 size={14} />
                        )}
                     </button>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Descrição:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{msg.proposedTransaction.description}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Valor:</span>
                      <span className={`font-bold ${msg.proposedTransaction.type === TransactionType.EXPENSE ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                        R$ {msg.proposedTransaction.amount}
                      </span>
                    </div>
                    
                    {/* Category Row */}
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-300">Categoria:</span>
                      
                      {editingTransactionId === msg.id ? (
                          <div className="flex-1 ml-2">
                              <select 
                                value={editCategory}
                                onChange={(e) => setEditCategory(e.target.value)}
                                className="w-full text-xs border rounded p-1 bg-white dark:bg-gray-600 dark:text-white mb-1"
                              >
                                  {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                              </select>
                          </div>
                      ) : (
                        <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-xs border ${getCategoryBadgeStyle(msg.proposedTransaction.category!)}`}>
                                {msg.proposedTransaction.category}
                            </span>
                        </div>
                      )}
                    </div>

                    {/* Recurrence Row */}
                    <div className="flex justify-between items-center">
                       <span className="text-gray-600 dark:text-gray-300">Recorrência:</span>
                       {editingTransactionId === msg.id ? (
                           <div className="flex-1 ml-2">
                               <select 
                                    value={editRecurrence}
                                    onChange={(e) => setEditRecurrence(e.target.value as RecurrenceFrequency)}
                                    className="w-full text-xs border rounded p-1 bg-white dark:bg-gray-600 dark:text-white"
                                >
                                    {Object.entries(RecurrenceLabels).map(([key, label]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                                </select>
                           </div>
                       ) : (
                           <div className="flex items-center gap-2">
                               <span className="text-xs text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 px-2 py-0.5 rounded">
                                   {RecurrenceLabels[msg.proposedTransaction.recurrence as RecurrenceFrequency || 'none']}
                               </span>
                           </div>
                       )}
                    </div>

                    {/* Edit Actions */}
                    <div className="flex justify-end pt-1">
                        {editingTransactionId === msg.id ? (
                             <button onClick={() => saveCategoryCorrection(msg.id, msg.proposedTransaction)} className="flex items-center gap-1 text-green-600 dark:text-green-400 text-xs font-medium">
                                 <Save size={14} /> Salvar Correção
                             </button>
                        ) : (
                             <button 
                                onClick={() => startEditCategory(msg.id, msg.proposedTransaction!.category!, msg.proposedTransaction!.recurrence as RecurrenceFrequency)}
                                className="flex items-center gap-1 text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-400 text-xs"
                             >
                                <Edit2 size={12} /> Editar
                             </button>
                        )}
                    </div>

                    {editingTransactionId === msg.id && (
                        <p className="text-[10px] text-indigo-600 dark:text-indigo-400 mt-1 italic">
                            *A IA aprenderá com esta correção.
                        </p>
                    )}
                  </div>
                  <div className="flex gap-2 mt-3 pt-2 border-t border-gray-200 dark:border-gray-600">
                    <button 
                      onClick={() => handleRejectTransaction(msg.id)}
                      className="flex-1 flex items-center justify-center gap-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 py-1.5 rounded-md hover:bg-red-200 dark:hover:bg-red-900/50 text-xs font-medium transition-colors"
                    >
                      <X size={14} /> Rejeitar
                    </button>
                    <button 
                      onClick={() => handleConfirmTransaction(msg.id, msg.proposedTransaction)}
                      className="flex-1 flex items-center justify-center gap-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 py-1.5 rounded-md hover:bg-green-200 dark:hover:bg-green-900/50 text-xs font-medium transition-colors"
                    >
                      <Check size={14} /> Confirmar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-gray-800 rounded-lg rounded-tl-none p-3 shadow-sm relative">
               <div className="flex items-center space-x-1 h-6 px-1">
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
      <div className="bg-[#F0F0F0] dark:bg-gray-800 p-2 border-t border-gray-200 dark:border-gray-700">
         {/* Audio Review UI */}
         {audioPreviewUrl ? (
             <div className="flex items-center gap-2 w-full animate-in slide-in-from-bottom-2 duration-200">
                <button onClick={clearAudioPreview} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition">
                   <Trash2 size={20} />
                </button>
                <div className="flex-1 bg-white dark:bg-gray-700 rounded-full px-4 py-2 flex items-center shadow-sm gap-3">
                   <audio src={audioPreviewUrl} controls className="h-8 w-full" />
                </div>
                <button 
                  onClick={transcribeAudio}
                  disabled={isTranscribing}
                  className="p-2 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition"
                  title="Transcrever Áudio para Texto"
                >
                   {isTranscribing ? <Loader2 size={20} className="animate-spin" /> : <Edit2 size={20} />}
                </button>
                <button 
                   onClick={() => handleSendMessage(undefined, undefined)} 
                   className={`p-3 text-white rounded-full shadow transition ${getSendButtonColor()}`}
                   title="Enviar"
                >
                   <Send size={20} />
                </button>
             </div>
         ) : (
            <div className="flex items-center gap-2">
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*,audio/*"
                onChange={handleFileSelect}
              />
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition"
                title="Anexar Arquivo"
              >
                <Paperclip size={20} />
              </button>

              <button 
                onClick={() => fileInputRef.current?.click()} 
                className="hidden md:block p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition"
                title="Enviar Imagem"
              >
                <ImageIcon size={20} />
              </button>

              <div className="flex-1 bg-white dark:bg-gray-700 rounded-full px-4 py-2 flex items-center shadow-sm">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder={isTranscribing ? "Ouvindo..." : "Digite ou envie áudio/foto..."}
                  className="flex-1 outline-none text-sm bg-transparent dark:text-white"
                  disabled={isLoading || isRecording}
                />
              </div>

              {input.trim() ? (
                <button 
                  onClick={() => handleSendMessage()}
                  disabled={isLoading}
                  className={`p-3 text-white rounded-full shadow transition disabled:opacity-50 ${getSendButtonColor()}`}
                >
                  {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                </button>
              ) : (
                <button 
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`p-3 rounded-full shadow transition text-white ${isRecording ? 'bg-red-500 animate-pulse' : getSendButtonColor()}`}
                  title={isRecording ? "Parar Gravação" : "Gravar Áudio"}
                >
                  {isRecording ? <Square size={20} fill="currentColor" /> : <Mic size={20} />}
                </button>
              )}
            </div>
         )}
      </div>
    </div>
  );
};