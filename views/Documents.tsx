
import React, { useState, useEffect } from 'react';
import { FileText, Download, Sparkles, ChevronRight, Copy, Check, Send, Bot, X } from 'lucide-react';
import { api } from '../services/apiService';
import { DocumentItem } from '../types';
import { sendMessageToAI } from '../services/geminiService';

const Documents: React.FC = () => {
  const [activeCat, setActiveCat] = useState("全部");
  const [categories, setCategories] = useState<string[]>([]);
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const [showAIGen, setShowAIGen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResult, setAiResult] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const docsData = await api.getDocuments();
        setDocs(docsData);

        // 从文档中提取分类
        const cats = ['全部', ...new Set(docsData.map(doc => doc.category))];
        setCategories(cats);
      } catch (error) {
        console.error('Failed to load documents:', error);
      }
    };

    loadData();
  }, []);

  const filteredDocs = activeCat === "全部" 
    ? docs 
    : docs.filter(d => d.category === activeCat);

  const handleCopy = (id: string, text: string) => {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        });
    } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        } catch (err) {
            console.error('Copy failed', err);
            alert('复制失败，请手动复制。');
        }
        document.body.removeChild(textArea);
    }
  };

  const generateWithAI = async () => {
    if (!aiPrompt.trim() || isGenerating) return;
    setIsGenerating(true);
    setAiResult('');
    
    const fullPrompt = `撰写一份专业的物业法律文书模版。需求：${aiPrompt}。直接返回正文，使用[]标注可填项。`;

    try {
      const res = await sendMessageToAI(fullPrompt);
      setAiResult(res);
    } catch (e) {
      setAiResult("生成失败，请重试。");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-full flex flex-col relative">
      <div className="bg-white px-4 py-3 shadow-sm border-b border-gray-100 overflow-x-auto no-scrollbar sticky top-0 z-20">
        <div className="flex gap-3">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCat(cat)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-black transition-all ${
                activeCat === cat ? 'bg-[#FF7F00] text-white shadow-lg shadow-orange-500/20' : 'bg-gray-100 text-gray-400'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div 
          onClick={() => setShowAIGen(true)}
          className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl p-5 text-white shadow-xl flex items-center justify-between cursor-pointer active:scale-95 transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-2xl">
              <Sparkles size={24} className="text-blue-200" />
            </div>
            <div>
              <h4 className="font-black text-sm tracking-wide">AI 智慧文书助手</h4>
              <p className="text-[10px] text-blue-100 mt-1 opacity-80">输入需求，秒级生成定制法律文书</p>
            </div>
          </div>
          <ChevronRight size={20} className="text-white/50" />
        </div>

        {filteredDocs.map(doc => (
          <div key={doc.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm animate-fade-in group hover:border-orange-200 transition-colors">
            <div className="flex items-start gap-4">
                <div className="bg-orange-50 p-3 rounded-xl text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-all">
                  <FileText size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-gray-800 text-sm truncate">{doc.title}</h3>
                    <span className="text-[9px] font-black text-orange-400 bg-orange-50 px-2 py-0.5 rounded uppercase">{doc.category}</span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1.5 leading-relaxed line-clamp-2">{doc.description}</p>
                </div>
            </div>
            <div className="mt-5 flex gap-2 border-t border-gray-50 pt-4">
               <button 
                onClick={() => setSelectedDoc(doc)}
                className="flex-1 text-[11px] font-black py-2.5 bg-gray-50 text-gray-600 rounded-xl active:bg-gray-100 transition-colors"
               >
                 预览模版
               </button>
               <button 
                onClick={() => handleCopy(doc.id, doc.content)}
                className="flex-1 text-[11px] font-black py-2.5 bg-orange-50 text-[#FF7F00] rounded-xl flex items-center justify-center gap-1.5 active:bg-orange-100 transition-colors"
               >
                 {copiedId === doc.id ? <Check size={14} /> : <Copy size={14} />}
                 {copiedId === doc.id ? '已复制' : '复制正文'}
               </button>
            </div>
          </div>
        ))}
      </div>

      {/* 适配全面屏的弹窗 - 修正为居中卡片显示 */}
      {selectedDoc && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center shrink-0">
              <div>
                <h3 className="font-black text-gray-800 text-lg">{selectedDoc.title}</h3>
                <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-widest">东元法务标准监制 • V2.0</p>
              </div>
              <button onClick={() => setSelectedDoc(null)} className="p-2.5 bg-gray-100 rounded-full text-gray-400 active:scale-90"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50 no-scrollbar">
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-inner">
                <pre className="text-[13px] text-slate-600 leading-relaxed font-sans whitespace-pre-wrap">
                  {selectedDoc.content}
                </pre>
              </div>
            </div>
            <div className="p-6 bg-white border-t border-gray-100 shrink-0">
              <button 
                onClick={() => { handleCopy(selectedDoc.id, selectedDoc.content); setSelectedDoc(null); }}
                className="w-full bg-[#FF7F00] text-white py-4.5 rounded-2xl font-black text-sm shadow-xl shadow-orange-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Copy size={18} /> 复制全文并关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Documents;
