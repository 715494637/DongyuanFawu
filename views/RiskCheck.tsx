
import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckSquare, AlertCircle, HardHat, FileText, ChevronRight } from 'lucide-react';
import { api } from '../services/apiService';
import { RiskScenario } from '../types';

const RiskCheck: React.FC = () => {
  const [scenarios, setScenarios] = useState<RiskScenario[]>([]);
  const [activeScenario, setActiveScenario] = useState<RiskScenario | null>(null);
  const [answers, setAnswers] = useState<Record<number, boolean>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await api.getRisks();
        setScenarios(data);
      } catch (error) {
        console.error('Failed to load risk scenarios:', error);
      }
    };

    loadData();
  }, []);

  const handleStart = (s: RiskScenario) => {
    setActiveScenario(s);
    setAnswers({});
    setIsSubmitted(false);
  };

  const toggleAnswer = (idx: number) => {
    setAnswers(prev => ({...prev, [idx]: !prev[idx]}));
  };

  const getScore = () => {
    if (!activeScenario || !activeScenario.questions) return 0;
    const total = activeScenario.questions.length;
    if (total === 0) return 0;
    const yesCount = Object.values(answers).filter(v => v).length;
    return Math.round((yesCount / total) * 100);
  };

  const score = getScore();
  const riskLevel = score === 100 ? '安全' : score > 60 ? '中风险' : '高风险';
  const riskColor = score === 100 ? 'text-green-600 bg-green-100' : score > 60 ? 'text-orange-600 bg-orange-100' : 'text-red-600 bg-red-100';

  if (!activeScenario) {
    return (
      <div className="p-6 bg-slate-50 min-h-full space-y-6 pb-24 animate-fade-in">
        <div className="bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden">
          <h2 className="text-2xl font-black tracking-tight relative z-10">合规风控自查</h2>
          <p className="text-xs text-slate-400 mt-2 relative z-10 leading-relaxed">通过标准化量化清单，动态掌握小区法律防范薄弱环节。</p>
          <div className="absolute right-[-20px] bottom-[-20px] opacity-10 rotate-12"><HardHat size={120} /></div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {scenarios.map(s => (
            <button 
              key={s.id}
              onClick={() => handleStart(s)}
              className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-between hover:border-orange-200 active:scale-[0.98] transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="bg-orange-50 p-3 rounded-2xl text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-all">
                  <ShieldCheck size={24} />
                </div>
                <div className="text-left">
                  <span className="font-black text-gray-800 text-sm block">{s.title}</span>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{s.questions?.length || 0} 项检查指标</span>
                </div>
              </div>
              <ChevronRight size={20} className="text-gray-300" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-full flex flex-col pb-24 animate-fade-in">
      <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-20">
        <div className="flex flex-col">
          <button onClick={() => setActiveScenario(null)} className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-1 flex items-center gap-1">
            &larr; 返回主题列表
          </button>
          <h2 className="font-black text-gray-800 text-lg tracking-tight">{activeScenario.title}</h2>
        </div>
      </div>

      {!isSubmitted ? (
        <div className="p-6 flex-1 space-y-6">
          <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 text-[10px] font-bold text-orange-700 uppercase tracking-widest text-center">
            请基于当前项目实际执行情况如实勾选
          </div>
          <div className="space-y-4">
            {activeScenario.questions?.map((q, idx) => (
              <div 
                key={idx} 
                onClick={() => toggleAnswer(idx)}
                className={`p-5 rounded-3xl border-2 cursor-pointer transition-all flex items-start gap-4 ${answers[idx] ? 'bg-orange-50/50 border-orange-500/20' : 'bg-white border-slate-50'}`}
              >
                <div className={`mt-0.5 w-6 h-6 rounded-xl border-2 flex items-center justify-center shrink-0 transition-colors ${answers[idx] ? 'bg-orange-500 border-orange-500' : 'border-slate-200'}`}>
                  {answers[idx] && <CheckSquare size={16} className="text-white" />}
                </div>
                <span className={`text-sm leading-relaxed ${answers[idx] ? 'text-gray-900 font-black' : 'text-gray-600 font-medium'}`}>{q}</span>
              </div>
            ))}
          </div>

          <button 
            onClick={() => setIsSubmitted(true)}
            className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-sm shadow-xl active:scale-95 transition-all mt-8"
          >
            完成自查并生成量化报告
          </button>
        </div>
      ) : (
        <div className="p-8 flex flex-col items-center animate-fade-in">
            <div className={`w-32 h-32 rounded-full flex flex-col items-center justify-center border-8 mb-6 shadow-2xl ${
                score === 100 ? 'border-green-500 text-green-600' : 
                score > 60 ? 'border-orange-500 text-orange-600' : 
                'border-red-500 text-red-600'
            }`}>
                <span className="text-3xl font-black">{score}</span>
                <span className="text-[10px] font-black uppercase tracking-widest opacity-50">合规分</span>
            </div>
            
            <div className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-[0.2em] mb-8 ${riskColor}`}>
                风险评估：{riskLevel}
            </div>

            {score < 100 ? (
                <div className="w-full bg-red-50 border border-red-100 rounded-[2rem] p-8 mb-8 space-y-4">
                    <h4 className="flex items-center gap-2 text-red-700 font-black text-sm">
                        <AlertCircle size={20} /> 关键合规缺口提示
                    </h4>
                    <p className="text-xs text-red-600 leading-relaxed font-medium">
                        当前项目有 {(activeScenario.questions?.length || 0) - Object.keys(answers).length} 项关键风控点未满足法律要求。这在法庭举证时可能导致物业处于极端不利地位。
                    </p>
                    <button className="w-full py-3 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase">查看详细整改指引</button>
                </div>
            ) : (
                <div className="w-full bg-green-50 border border-green-100 rounded-[2rem] p-8 mb-8 text-center space-y-3">
                  <h4 className="text-green-700 font-black">完美合规状态</h4>
                  <p className="text-xs text-green-600 font-medium">该主题下所有法律合规点均已落实，建议保持日常巡检留痕。</p>
                </div>
            )}

            <div className="w-full space-y-4">
                <button className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg">
                    导出 PDF 报告报备总部
                </button>
                <button onClick={() => setIsSubmitted(false)} className="w-full border border-slate-200 text-slate-400 py-4 rounded-2xl font-black text-xs uppercase tracking-widest">
                    重新开始检查
                </button>
            </div>
        </div>
      )}
    </div>
  );
};

export default RiskCheck;
