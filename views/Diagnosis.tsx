
import React, { useState } from 'react';
import { ChevronRight, FileText, Sparkles, ArrowLeft, Shield, AlertTriangle, HeadphonesIcon, Camera, MessageSquare, Copy } from 'lucide-react';
import { sendMessageToAI } from '../services/geminiService';
import ConsultationModal from '../components/ConsultationModal';
import { ViewState } from '../types';

interface DiagnosisProps {
  setCurrentView?: (view: ViewState) => void;
}

// --- 核心渲染组件：彻底清洗 Markdown 符号 ---

// 1. 纯文本清洗函数：去除 ** * # 【 】 [ ] 等符号，保留文字内容
const cleanTextContent = (text: string) => {
  return text
    .replace(/\*\*/g, '')      // 去除加粗符
    .replace(/^#+\s*/, '')     // 去除行首 #
    .replace(/^[\*\-]\s*/, '') // 去除列表符
    .replace(/[【】\[\]]/g, '') // 去除括号
    .trim();
};

// 2. 行渲染组件
const FormattedLine: React.FC<{ line: string }> = ({ line }) => {
  const cleanLine = line.trim();
  if (!cleanLine) return <div className="h-2" />;

  // 判定是否为标题：以 # 开头，或包含【】，或以“：”结尾的短句，或纯加粗
  const isHeader = 
    cleanLine.startsWith('#') || 
    cleanLine.includes('【') || 
    (cleanLine.endsWith('：') && cleanLine.length < 20) ||
    (cleanLine.startsWith('**') && cleanLine.endsWith('**') && cleanLine.length < 30);

  // 判定是否为列表：以 * - 或 数字. 开头
  const isList = /^[*\-]\s|^\d+\.\s/.test(cleanLine);

  // 提取纯净文本
  const content = cleanTextContent(cleanLine);

  if (isHeader) {
    return (
      <h4 className="font-black text-gray-900 text-sm mt-5 mb-2 flex items-center gap-2 border-l-4 border-orange-500 pl-3">
        {content}
      </h4>
    );
  }

  if (isList) {
    // 尝试识别行内重点（原 **包裹的内容），加粗显示
    const hasBold = cleanLine.includes('**');
    if (hasBold) {
       // 简单的加粗解析：将一行按 ** 分割
       const parts = cleanLine.replace(/^[\*\-\d\.]+\s*/, '').split('**');
       return (
         <div className="flex gap-2 mb-1.5 items-start pl-1">
            <span className="text-orange-400 mt-1.5 text-[8px] shrink-0">●</span>
            <p className="text-sm text-gray-600 leading-relaxed font-medium">
              {parts.map((part, i) => 
                 i % 2 === 1 ? <span key={i} className="font-bold text-gray-800">{part}</span> : part
              )}
            </p>
         </div>
       )
    }
    return (
      <div className="flex gap-2 mb-1.5 items-start pl-1">
        <span className="text-orange-400 mt-1.5 text-[8px] shrink-0">●</span>
        <p className="text-sm text-gray-600 leading-relaxed font-medium">{cleanLine.replace(/^[\*\-\d\.]+\s*/, '').replace(/\*\*/g, '')}</p>
      </div>
    );
  }

  // 普通段落，也支持加粗解析
  const parts = cleanLine.split('**');
  return (
    <p className="text-sm text-gray-600 leading-relaxed font-medium mb-2">
      {parts.map((part, i) => 
          i % 2 === 1 ? <span key={i} className="font-bold text-gray-800">{part}</span> : part
      )}
    </p>
  );
};

const SimpleMarkdown = ({ content }: { content: string }) => {
  const lines = content.split('\n');
  return (
    <div className="space-y-1">
      {lines.map((line, i) => <FormattedLine key={i} line={line} />)}
    </div>
  );
};

// --- 主页面组件 ---

const Diagnosis: React.FC<DiagnosisProps> = ({ setCurrentView }) => {
  const [step, setStep] = useState(1);
  const [userInput, setUserInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [showConsult, setShowConsult] = useState(false);

  const handleAIDiagnosis = async () => {
    if (!userInput.trim()) return;
    setIsAnalyzing(true);
    setStep(2);

    // 优化 Prompt：强调输出结构，减少多余符号，但前端也会再次清洗
    const prompt = `你现在是东元物业法务中心的首席律师。请针对以下物业纠纷进行深度诊断：
    案情描述：${userInput}
    
    请按以下结构输出（不要使用Markdown代码块，直接分段）：
    【风险评级】
    [高/中/低] 及简短理由。
    【法律逻辑】
    引用《民法典》及物业法规分析责任。
    【处置建议】
    3条物业现场可执行的建议。
    【取证提醒】
    列出关键证据清单。`;

    try {
      // 强制使用 Pro 模型以获得更好效果
      const result = await sendMessageToAI(prompt, true, true);
      setAiReport(result);
    } catch (e) {
      setAiReport("分析接口调用失败。请检查 API 配置或稍后再试。");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const copyScript = () => {
    const script = "【管家安抚话术】\n“您好，您的诉求我们已经详细记录。关于您提到的问题，依据《物业服务合同》及相关法规，我们需要先进行现场勘验/核实。为了保障您的合法权益，建议我们先签署一份《情况确认单》，后续我们会请法务部门出具正式的书面回复。请您放心，我们一定依法依规处理。”";
    navigator.clipboard.writeText(script);
    alert('标准话术已复制，可发送给一线管家。');
  };

  const renderStep1 = () => (
    <div className="p-6 space-y-6 animate-fade-in pb-24">
      <div className="bg-orange-600 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden">
        <h2 className="text-2xl font-black mb-2 relative z-10">纠纷初步法律评估</h2>
        <p className="text-xs text-orange-100 opacity-80 relative z-10 leading-relaxed">对接东元法律大脑，实时分析物业纠纷责任与风控建议。</p>
        <div className="absolute top-[-20px] right-[-20px] opacity-10"><Shield size={120} /></div>
      </div>
      
      <div className="space-y-4">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">请描述发生的事件</label>
        <textarea
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          className="w-full h-48 bg-white border border-gray-100 rounded-3xl p-6 text-sm outline-none focus:ring-4 focus:ring-orange-500/5 focus:border-orange-500/20 shadow-sm transition-all resize-none"
          placeholder="例如：3号楼业主因外墙渗漏导致地板损坏，现拒绝交费并要求赔偿..."
        />
      </div>

      <button
        onClick={handleAIDiagnosis}
        disabled={!userInput.trim() || isAnalyzing}
        className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-sm flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all disabled:opacity-50"
      >
        <Sparkles size={20} className="text-orange-400" />
        提交 AI 助手深度评估
      </button>

      <div className="bg-orange-50 p-5 rounded-3xl border border-orange-100 flex gap-4">
        <AlertTriangle size={24} className="text-orange-500 shrink-0" />
        <p className="text-[11px] text-orange-700 leading-relaxed font-medium">
          免责提示：本评估由 AI 生成，仅供物业日常决策参考。如涉及大额赔偿或复杂人身伤害，请务必使用人工咨询功能。
        </p>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="p-4 pb-24 animate-fade-in">
      <button onClick={() => {setStep(1); setAiReport(null);}} className="mb-4 text-[10px] font-black text-gray-400 flex items-center gap-1 uppercase tracking-widest">
        <ArrowLeft size={14} /> 返回重新描述
      </button>

      <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden">
        <div className="p-8 bg-slate-900 text-white">
          <div className="flex justify-between items-center mb-4">
            <span className="bg-orange-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">智能诊断报告</span>
            <span className="text-[10px] text-slate-400 font-mono">AI Legal Analysis</span>
          </div>
          <h3 className="text-xl font-black tracking-tight">纠纷法律评估意见书</h3>
        </div>

        <div className="p-8">
          {isAnalyzing ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4">
              <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">AI 助手正在检索法律条文...</p>
            </div>
          ) : (
            <div className="space-y-8">
               {/* 风险提示栏 */}
               <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex gap-3 items-start">
                  <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
                  <div className="text-xs text-red-600 leading-relaxed">
                    <span className="font-black block mb-1">风险提示</span>
                    本报告仅供参考。如果系统提示“高风险”，建议立即点击下方按钮咨询人工律师。
                  </div>
               </div>

               {/* AI 内容渲染区 (美化版) */}
               <div>
                 {aiReport && <SimpleMarkdown content={aiReport} />}
               </div>

               {/* 核心后续动作 - 物业场景化 */}
               <div className="bg-slate-50 p-6 rounded-3xl border border-gray-100">
                  <h4 className="font-black text-[10px] text-slate-400 uppercase tracking-widest mb-4">建议后续关键动作</h4>
                  <div className="grid grid-cols-1 gap-3">
                    
                    {/* 动作1: 生成函件 (留痕) */}
                    <button 
                      onClick={() => setCurrentView && setCurrentView(ViewState.AI_DOC_GEN)}
                      className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-sm active:scale-95 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-50 text-blue-500 p-2 rounded-lg"><FileText size={18} /></div>
                        <div>
                          <span className="text-xs font-bold text-gray-800 block">生成整改通知/律师函</span>
                          <span className="text-[10px] text-gray-400">快速书面留痕，规避管理失职风险</span>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-gray-300 group-hover:text-blue-500" />
                    </button>

                    {/* 动作2: 取证指引 (免责) */}
                    <button 
                      onClick={() => setCurrentView && setCurrentView(ViewState.EVIDENCE_LIST)}
                      className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-sm active:scale-95 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-orange-50 text-orange-500 p-2 rounded-lg"><Camera size={18} /></div>
                        <div>
                          <span className="text-xs font-bold text-gray-800 block">查看此类案件取证要点</span>
                          <span className="text-[10px] text-gray-400">现场拍照/录音指引，防备日后诉讼</span>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-gray-300 group-hover:text-orange-500" />
                    </button>

                     {/* 动作3: 话术 (对峙) */}
                     <button 
                      onClick={copyScript}
                      className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-sm active:scale-95 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-purple-50 text-purple-500 p-2 rounded-lg"><MessageSquare size={18} /></div>
                        <div>
                          <span className="text-xs font-bold text-gray-800 block">获取管家安抚/谈判话术</span>
                          <span className="text-[10px] text-gray-400">一键复制标准法务回应口径</span>
                        </div>
                      </div>
                      <Copy size={16} className="text-gray-300 group-hover:text-purple-500" />
                    </button>

                  </div>
               </div>
            </div>
          )}
        </div>

        {!isAnalyzing && (
          <div className="p-8 border-t border-gray-50 flex gap-3 bg-slate-50">
            {/* Level 3: Human Funnel */}
            <button 
              onClick={() => setShowConsult(true)}
              className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-black text-xs shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
            >
               <HeadphonesIcon size={16} /> 案件复杂？一键咨询人工律师
            </button>
          </div>
        )}
      </div>

      <ConsultationModal isOpen={showConsult} onClose={() => setShowConsult(false)} />
    </div>
  );

  return (
    <div className="min-h-full bg-slate-50">
      {step === 1 ? renderStep1() : renderStep2()}
    </div>
  );
};

export default Diagnosis;
