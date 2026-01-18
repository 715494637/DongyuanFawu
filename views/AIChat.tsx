
import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Volume2, Globe, Sparkles, Headphones } from 'lucide-react';
import { ChatMessage } from '../types';
import { sendMessageToAI, textToSpeech, decodeAudioData } from '../services/geminiService';
import ConsultationModal from '../components/ConsultationModal';
import { api } from '../services/apiService';

const AIChat: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([{ id: '0', role: 'model', text: '您好！我是东元物业法务助手。我可以为您提供《民法典》咨询、文书草拟及风险建议。（回答仅供参考）', timestamp: Date.now() }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [useSearch, setUseSearch] = useState(true);
  const [showConsult, setShowConsult] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [initialized, setInitialized] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Initialize messages with config from API
  useEffect(() => {
    const initChat = async () => {
      try {
        const config = await api.getConfig().catch(() => ({}));
        const welcomeText = config.welcome_message || '您好！我是东元物业法务助手。我可以为您提供《民法典》咨询、文书草拟及风险建议。（回答仅供参考）';
        setMessages([{ id: '0', role: 'model', text: welcomeText, timestamp: Date.now() }]);
      } catch (err) {
        console.error('获取欢迎消息失败:', err);
      } finally {
        setInitialized(true);
      }
    };
    initChat();
  }, []);

  useEffect(() => {
    if (initialized) {
      scrollToBottom();
    }
  }, [messages, initialized]);

  useEffect(() => {
    // 1. Check for Pending Search (from RightsCenter etc.)
    const pendingSearch = localStorage.getItem('dy_pending_search');
    if (pendingSearch) {
      handleSend(pendingSearch);
      localStorage.removeItem('dy_pending_search');
      return; 
    }

    // 2. Check for Report Context (from HealthCheck)
    const reportContext = localStorage.getItem('dy_report_context');
    if (reportContext) {
      // Automatically send the report context to AI to start the conversation
      handleSend(reportContext);
      localStorage.removeItem('dy_report_context');
    }
  }, []);

  const playAudio = async (text: string) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    const ctx = audioContextRef.current;
    const audioData = await textToSpeech(text);
    if (audioData) {
      const buffer = await decodeAudioData(audioData, ctx);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start();
    }
  };

  const handleSend = async (forcedText?: string) => {
    const textToSend = forcedText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: textToSend,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    if (!forcedText) setInput('');
    setLoading(true);

    try {
      // Use Pro model implicitly by isComplex flag if needed, but here simple search toggle is enough for general chat
      const responseText = await sendMessageToAI(userMsg.text, useSearch, true); // defaulting to 'complex' mode for better chat quality
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
       const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "抱歉，法律大脑连接超时，请检查网络后重试。",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
            <div className={`flex gap-3 max-w-[88%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-md ${msg.role === 'user' ? 'bg-orange-500 text-white' : 'bg-white border border-gray-100 text-blue-600'}`}>
                {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
              </div>
              <div className="flex flex-col gap-1">
                <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm relative group ${
                  msg.role === 'user' 
                    ? 'bg-orange-500 text-white rounded-tr-none' 
                    : 'bg-white text-gray-700 rounded-tl-none border border-gray-100'
                }`}>
                  {msg.text.split('\n').map((line, i) => (
                    <p key={i} className={i !== 0 ? 'mt-2' : ''}>{line}</p>
                  ))}
                  
                  {msg.role === 'model' && (
                    <button 
                      onClick={() => playAudio(msg.text)}
                      className="absolute -right-10 top-0 p-2 text-gray-400 hover:text-orange-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Volume2 size={16} />
                    </button>
                  )}
                </div>
                <span className="text-[10px] text-gray-400 px-1">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
             <div className="flex gap-3 items-center bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">法律助手思考中...</span>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-gray-100 space-y-3">
        {/* Level 3 Funnel: Connect to Human */}
        <div className="flex items-center justify-between px-2">
           <button 
             className="text-[10px] font-bold text-slate-500 flex items-center gap-1 hover:text-orange-600 transition-colors"
             onClick={() => setShowConsult(true)}
           >
             <Headphones size={12} /> 转人工咨询
           </button>
           <button 
             onClick={() => setUseSearch(!useSearch)}
             className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold transition-all ${useSearch ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'}`}
           >
             <Globe size={12} /> {useSearch ? '已开启实时检索' : '仅本地知识库'}
           </button>
        </div>
        
        <div className="flex items-center gap-2 bg-gray-50 px-4 py-3 rounded-2xl border border-gray-200 focus-within:border-orange-500/50 focus-within:ring-4 focus-within:ring-orange-500/5 transition-all">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="描述您的问题..."
            className="flex-1 bg-transparent outline-none text-sm text-gray-800 placeholder-gray-400 font-medium"
          />
          <button 
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className={`p-2.5 rounded-xl transition-all ${loading || !input.trim() ? 'text-gray-300' : 'text-white bg-orange-500 shadow-lg shadow-orange-500/30 active:scale-90 hover:bg-orange-600'}`}
          >
            <Send size={18} />
          </button>
        </div>
        
        {/* Footer Disclaimer */}
        <p className="text-center text-[9px] text-gray-300 transform scale-90">
           AI 辅助生成内容仅供参考，不构成正式法律意见。
        </p>
      </div>

      <ConsultationModal isOpen={showConsult} onClose={() => setShowConsult(false)} />
    </div>
  );
};

export default AIChat;
