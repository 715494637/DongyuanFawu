
import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, CheckCircle2, ChevronRight, PhoneCall } from 'lucide-react';
import { db } from '../services/dbService';
import { EmergencySOP as SOPType } from '../types';

const EmergencySOP: React.FC = () => {
  const [sops, setSops] = useState<SOPType[]>([]);
  const [activeSop, setActiveSop] = useState<SOPType | null>(null);
  const [step, setStep] = useState(0);

  useEffect(() => {
    setSops(db.getSOPs());
  }, []);

  if (activeSop) {
    return (
        <div className="flex flex-col h-full bg-red-50 animate-fade-in p-6 pb-24">
            <div className="flex items-center justify-between mb-8">
                <button onClick={() => { setActiveSop(null); setStep(0); }} className="p-2 bg-white rounded-full text-slate-500"><ChevronRight size={20} className="rotate-180"/></button>
                <div className="px-4 py-1 bg-red-100 text-red-600 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse">紧急模式 ON</div>
            </div>

            <h2 className="text-3xl font-black text-slate-900 mb-2">{activeSop.title}</h2>
            <p className="text-sm text-slate-500 mb-8 font-bold">请严格按步骤操作，切勿慌乱！</p>

            <div className="flex-1">
                <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl border-2 border-red-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5"><AlertTriangle size={100}/></div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase mb-4">当前步骤 {step + 1} / {activeSop.steps.length}</div>
                    
                    <div className="text-xl font-black text-slate-800 leading-normal mb-8 min-h-[80px]">
                        {activeSop.steps[step]}
                    </div>

                    {step === 0 && (
                        <div className="mb-6 bg-red-50 p-4 rounded-xl flex items-center gap-3">
                            <PhoneCall className="text-red-500" size={24}/>
                            <div className="text-xs font-bold text-red-700">一键呼叫 120 / 110</div>
                        </div>
                    )}

                    <button 
                        onClick={() => setStep(prev => Math.min(prev + 1, activeSop.steps.length - 1))}
                        disabled={step === activeSop.steps.length - 1}
                        className="w-full py-5 bg-red-500 text-white rounded-2xl font-black text-lg shadow-xl shadow-red-500/30 active:scale-95 transition-all disabled:opacity-50 disabled:bg-slate-300"
                    >
                        {step === activeSop.steps.length - 1 ? '处置完毕' : '已完成，下一步'}
                    </button>
                </div>
                
                <div className="mt-6 p-6 bg-yellow-50 rounded-3xl border border-yellow-100 text-yellow-800">
                    <h4 className="font-black text-xs uppercase mb-2 flex items-center gap-2"><AlertTriangle size={14}/> 法律禁忌 (DON'T)</h4>
                    <p className="text-xs font-medium leading-relaxed">{activeSop.tips}</p>
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className="p-6 pb-24 space-y-6 animate-fade-in bg-slate-50 min-h-full">
      <div className="bg-red-600 rounded-3xl p-6 text-white shadow-xl">
        <h2 className="text-xl font-black mb-1 flex items-center gap-2">
          <AlertTriangle size={24} /> 紧急情况 SOP
        </h2>
        <p className="text-[10px] text-red-100 opacity-80 uppercase tracking-widest">红按钮 · 傻瓜式操作 · 法律避雷</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {sops.map(s => (
            <button 
                key={s.id}
                onClick={() => setActiveSop(s)}
                className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex items-center justify-between active:scale-[0.98] transition-all hover:border-red-200 group"
            >
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 group-hover:bg-red-500 group-hover:text-white transition-colors">
                        <AlertTriangle size={24}/>
                    </div>
                    <div className="text-left">
                        <h4 className="font-black text-slate-800">{s.title}</h4>
                        <span className="inline-block mt-1 px-2 py-0.5 bg-red-100 text-red-600 text-[9px] font-black rounded uppercase">High Risk</span>
                    </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"><ChevronRight size={16} className="text-slate-400"/></div>
            </button>
        ))}
      </div>
    </div>
  );
};

export default EmergencySOP;
