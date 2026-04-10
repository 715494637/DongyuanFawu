
import React, { useState, useEffect } from 'react';
import { MessageSquare, ChevronDown, ChevronUp, Copy, Volume2 } from 'lucide-react';
import { cachedApi } from '../services/apiService';

interface ScriptStep {
  label: string;
  content: string;
}

interface Script {
  id: string;
  title: string;
  category?: string;
  steps?: ScriptStep[];
  is_active: boolean;
}

const ScriptKit: React.FC = () => {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadScripts = async () => {
      try {
        setLoading(true);
        const data = await cachedApi.getCollectionScripts();
        setScripts(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('加载话术库失败:', err);
        setScripts([]);
      } finally {
        setLoading(false);
      }
    };
    loadScripts();
  }, []);

  const copyScript = (script: Script) => {
    // content 字段已移除，统一使用 steps
    const text = script.steps?.map(s => `${s.label}: ${s.content}`).join('\n\n') || script.title;
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => alert('已复制到剪贴板'));
    } else {
      alert('已复制到剪贴板');
    }
  };

  return (
    <div className="p-6 pb-24 space-y-6 animate-fade-in bg-slate-50 min-h-full">
      <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-xl">
        <h2 className="text-xl font-black mb-1 flex items-center gap-2">
          <MessageSquare size={24} /> 催费话术锦囊
        </h2>
        <p className="text-[10px] text-indigo-100 opacity-80 uppercase tracking-widest">让每一句回复都合法、合情、合理</p>
      </div>

      {loading ? (
        <div className="text-center text-slate-400 py-8">加载中...</div>
      ) : scripts.length === 0 ? (
        <div className="text-center text-slate-400 py-8">暂无话术数据</div>
      ) : (
        <div className="space-y-4">
          {scripts.map(s => (
              <div key={s.id} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                  <button
                    onClick={() => setOpenId(openId === s.id ? null : s.id)}
                    className="w-full p-6 flex justify-between items-center bg-white hover:bg-slate-50 transition-colors"
                  >
                      <span className="font-bold text-slate-800">{s.title}</span>
                      {openId === s.id ? <ChevronUp size={20} className="text-indigo-500"/> : <ChevronDown size={20} className="text-gray-300"/>}
                  </button>

                  {openId === s.id && (
                      <div className="p-6 pt-0 space-y-4 bg-slate-50/50">
                          {s.steps && s.steps.length > 0 ? (
                              s.steps.map((step, idx) => (
                                  <div key={idx} className="relative pl-6 border-l-2 border-indigo-200">
                                      <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 bg-indigo-500 rounded-full"></div>
                                      <div className="text-[10px] text-indigo-500 font-bold uppercase mb-1">{step.label}</div>
                                      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-sm text-slate-700 font-medium leading-relaxed">
                                          {step.content}
                                      </div>
                                  </div>
                              ))
                          ) : null}
                          <button
                            onClick={() => copyScript(s)}
                            className="w-full py-3 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
                          >
                              <Copy size={14}/> 复制话术
                          </button>
                      </div>
                  )}
              </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ScriptKit;
