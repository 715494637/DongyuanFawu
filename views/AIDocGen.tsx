
import React, { useState } from 'react';
import { Sparkles, Copy, Check, Send, Bot, X, RefreshCw } from 'lucide-react';
import { sendMessageToAI } from '../services/geminiService';
import ConsultationModal from '../components/ConsultationModal';

const AIDocGen: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showConsult, setShowConsult] = useState(false);

  const generate = async () => {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);
    
    const fullPrompt = `你现在是一位资深的物业法律顾问。请根据以下需求，撰写一份正式、严谨且具有法律效力的物业管理文书草案。
    需求描述：${prompt}
    要求：
    1. 结构完整（含标题、致函对象、正文、落款日期）。
    2. 引用《民法典》相关条文增加威慑力。
    3. 对于需要用户填写的具体日期、金额等，请用[ ]标注。
    4. 仅返回文书内容，不需要解释。`;

    try {
      let res = await sendMessageToAI(fullPrompt);
      // 自动追加免责后缀
      res += "\n\n（本文档由智能系统生成，未经人工复核，仅作内部草拟使用。）";
      setResult(res);
    } catch (e) {
      setResult("生成失败，请重试。");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(result).then(() => setCopied(true));
    } else {
        const textArea = document.createElement("textarea");
        textArea.value = result;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            setCopied(true);
        } catch (e) {}
        document.body.removeChild(textArea);
    }
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 pb-24 space-y-6 animate-fade-in bg-slate-50 min-h-full">
      <div className="bg-indigo-600 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <h2 className="text-2xl font-black mb-2 flex items-center gap-2 relative z-10">
          <Sparkles size={24} className="text-indigo-200" /> AI 智绘文书
        </h2>
        <p className="text-xs text-indigo-100 opacity-80 relative z-10 leading-relaxed">让 AI 助手协助您起草非标准化的法律函件与调解协议。</p>
        <div className="absolute top-[-20px] right-[-20px] opacity-10"><Bot size={120} /></div>
      </div>

      {!result ? (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-gray-100 space-y-4">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">描述您的文书需求</label>
            <textarea 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="例如：起草一份针对租客在电梯内乱涂乱画行为的法律告知函，要求其限期修复并赔偿，语调需严肃并引用法律后果。"
              className="w-full h-40 bg-gray-50 border border-gray-100 rounded-3xl p-5 text-sm outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/20 transition-all resize-none shadow-inner"
            />
            <button 
              onClick={generate}
              disabled={!prompt.trim() || isGenerating}
              className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/20 active:scale-95 transition-all disabled:opacity-50"
            >
              {isGenerating ? <RefreshCw size={18} className="animate-spin" /> : <Send size={18} />}
              {isGenerating ? 'AI 助手正在草拟...' : '立即生成文书草稿'}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {['装修超时赔偿协议', '公共部位腾退令', '外包单位违约函'].map(tag => (
              <button 
                key={tag} 
                onClick={() => setPrompt(tag)}
                className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-4 py-2 rounded-full border border-indigo-100 hover:bg-indigo-100 transition-colors"
              >
                +{tag}
              </button>
            ))}
          </div>
          <p className="text-center text-[10px] text-gray-400">AI 生成内容仅供参考，不构成正式法律意见</p>
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden">
            <div className="bg-slate-50 p-4 border-b border-gray-100 flex justify-between items-center px-6">
               <span className="text-[10px] font-black text-indigo-500 uppercase flex items-center gap-1">
                 <Bot size={14} /> AI 生成草案
               </span>
               <button onClick={() => setResult('')} className="text-[10px] font-bold text-gray-400 hover:text-indigo-500">重新输入需求</button>
            </div>
            <div className="p-8">
              <pre className="text-xs text-gray-600 leading-relaxed font-sans whitespace-pre-wrap">{result}</pre>
            </div>
            <div className="p-6 bg-slate-50 border-t border-gray-100 flex gap-3">
              <button 
                onClick={handleCopy}
                className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/20 active:scale-95 transition-all"
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
                {copied ? '已复制' : '复制全文内容'}
              </button>
            </div>
          </div>
          <div className="text-center space-y-1">
             <p className="text-[10px] text-gray-400 font-medium px-6">
               本文档由智能系统生成，未经人工复核，仅作内部草拟使用。
             </p>
             <button 
               onClick={() => setShowConsult(true)}
               className="text-[10px] text-indigo-600 font-bold underline hover:text-indigo-700"
             >
               一键咨询人工律师复核
             </button>
          </div>
        </div>
      )}

      <ConsultationModal isOpen={showConsult} onClose={() => setShowConsult(false)} />
    </div>
  );
};

export default AIDocGen;
