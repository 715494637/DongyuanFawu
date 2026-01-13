
import React, { useState, useEffect, useRef } from 'react';
import { Stethoscope, CheckCircle, XCircle, ChevronRight, AlertCircle, RefreshCw, FileText, ArrowRight, Bot, ExternalLink, Zap, MessageSquare, ShieldAlert, Activity, ArrowLeft } from 'lucide-react';
import { db } from '../services/dbService';
import { HealthCheckSection, ViewState } from '../types';
import { sendMessageToAI } from '../services/geminiService';

interface LegalHealthCheckProps {
  setCurrentView?: (view: ViewState) => void;
}

const LegalHealthCheck: React.FC<LegalHealthCheckProps> = ({ setCurrentView }) => {
  const [sections, setSections] = useState<HealthCheckSection[]>([]);
  const [currentSectionIdx, setCurrentSectionIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({}); // Key format: "sectionIdx-qIdx", Value: 0 (Yes/Good) or 1 (No/Risk)
  const [isCompleted, setIsCompleted] = useState(false);
  
  // AI Report State
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Ref for scrolling
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSections(db.getHealthCheck());
    db.logUsage('LEGAL_HEALTH_CHECK', '企业法务体检');
  }, []);

  // 核心修复：监听板块索引变化，强制滚动主容器
  useEffect(() => {
      const mainContainer = document.querySelector('main');
      if (mainContainer) {
          mainContainer.scrollTo({ top: 0, behavior: 'auto' }); // 使用 auto 瞬间回顶，避免 smooth 带来的滚动延迟感
      } else {
          window.scrollTo(0, 0);
      }
  }, [currentSectionIdx, isCompleted]);

  const handleAnswer = (qIdx: number, value: number) => {
    setAnswers(prev => ({
      ...prev,
      [`${currentSectionIdx}-${qIdx}`]: value
    }));
  };

  const nextSection = () => {
    if (currentSectionIdx < sections.length - 1) {
      setCurrentSectionIdx(prev => prev + 1);
    } else {
      setIsCompleted(true);
    }
  };

  const calculateScore = () => {
    let totalRiskPoints = 0;
    Object.values(answers).forEach((val: number) => totalRiskPoints += val);
    return totalRiskPoints;
  };

  const getRiskDetails = () => {
      const riskSummary: { title: string, count: number }[] = [];
      sections.forEach((sec, sIdx) => {
          let count = 0;
          sec.questions.forEach((_, qIdx) => {
              if (answers[`${sIdx}-${qIdx}`] === 1) count++;
          });
          if (count > 0) riskSummary.push({ title: sec.title, count });
      });
      return riskSummary;
  };

  const getRecommendations = () => {
      const risks = getRiskDetails();
      const recs: any[] = [];

      const map: Record<string, any[]> = {
          '物业费收缴与债权管理': [
              { type: 'tool', label: '欠费催收助手', view: ViewState.COLLECTION_CRM, iconName: 'Zap' },
              { type: 'tool', label: '催费计算器', view: ViewState.CALCULATOR, iconName: 'Zap' },
              { type: 'project', label: '专项：物业费调价法律辅导', desc: '解决收缴率低的核心痛点' }
          ],
          '基础合同与印章管理': [
              { type: 'tool', label: '文档模版中心', view: ViewState.DOCUMENTS, iconName: 'FileText' },
              { type: 'project', label: '专项：经营用房租赁风控', desc: '规范合同与公共收益' }
          ],
          '劳资人事合规': [
              { type: 'project', label: '专项：劳动用工风险排查', desc: '规避社保与辞退纠纷' }
          ],
          '现场安全与侵权责任': [
              { type: 'tool', label: '紧急情况 SOP', view: ViewState.EMERGENCY_SOP, iconName: 'AlertCircle' },
              { type: 'tool', label: '标准取证清单', view: ViewState.EVIDENCE_LIST, iconName: 'FileText' },
              { type: 'project', label: '专项：高空抛物技防法律建议', desc: '完善监控与警示' }
          ],
          '装修与违建管理': [
              { type: 'tool', label: '装修巡查单', view: ViewState.RENOVATION_CHECK, iconName: 'FileText' },
              { type: 'project', label: '专项：装修管理专项整顿', desc: '承重墙破坏等重大违规' }
          ],
          '数据合规与业委会关系': [
              { type: 'tool', label: '危机公关公告生成', view: ViewState.NOTICE_GENERATOR, iconName: 'Zap' },
              { type: 'project', label: '专项：项目保盘法律策略', desc: '应对业委会换届风险' }
          ]
      };

      risks.forEach(r => {
          if (map[r.title]) {
              recs.push(...map[r.title]);
          }
      });

      const uniqueRecs = Array.from(new Map(recs.map(item => [item.label, item])).values());
      return uniqueRecs;
  };

  const getResult = () => {
    const score = calculateScore();
    
    if (score >= 13) {
      return {
        level: '高风险',
        sub: 'ICU急救状态',
        color: 'bg-red-500',
        textColor: 'text-red-600',
        borderColor: 'border-red-200',
        bgColor: 'bg-red-50',
        icon: ShieldAlert,
        // 详细分点说明
        desc: `您的企业合规体系存在重大系统性漏洞，属于极高危状态。具体表现在：
1. 核心收费权（物业费）缺乏法律闭环，诉讼时效可能已过，资产流失严重。
2. 用工管理“裸奔”，未签订规范合同或社保不足，面临巨额赔偿风险。
3. 现场安全管理（电梯/消防）存在盲区，一旦发生人身伤亡事故，负责人可能面临刑事责任。`,
        consequence: '极易引发群体性诉讼、巨额行政罚款甚至停业整顿。企业抗风险能力极弱，处于“一告就输”的被动局面。',
        strategy: '立即启动“法律休克疗法”。建议聘请专项法律顾问进驻，全面重塑合同、用工及现场安全制度。'
      };
    } else if (score >= 6) {
      return {
        level: '中风险',
        sub: '带病作业状态',
        color: 'bg-orange-500',
        textColor: 'text-orange-600',
        borderColor: 'border-orange-200',
        bgColor: 'bg-orange-50',
        icon: AlertCircle,
        desc: `日常运营具备基本法律意识，但在关键证据留存和抗风险细节上存在明显短板：
1. 催收记录不完整，导致部分物业费债权无法得到法院支持。
2. 装修巡查、公区管理流于形式，缺乏有效的书面留痕。
3. 面对恶意欠费业主或复杂人身伤害索赔时，举证能力不足。`,
        consequence: '在处理常规纠纷时尚可应对，但胜诉率不稳定。容易因小疏忽导致大赔偿，存在资产缓慢流失的隐患。',
        strategy: '重点补强“留痕管理”。完善催收文书送达证据链，规范装修巡查记录。建议针对薄弱板块（如劳资或安全）进行单项合规整改。'
      };
    } else {
      return {
        level: '低风险',
        sub: '健康运行状态',
        color: 'bg-green-500',
        textColor: 'text-green-600',
        borderColor: 'border-green-200',
        bgColor: 'bg-green-50',
        icon: Activity,
        desc: `恭喜！您的企业合规管理水平优于 90% 的同行。
1. 各项管理动作基本符合《民法典》及物业法规要求。
2. 拥有较完善的风控体系，核心业务流程（收费/用工/安全）均有迹可循。
3. 企业抗风险能力强，能够有效规避大部分日常法律陷阱。`,
        consequence: '即便发生诉讼，胜诉概率也较高。企业经营稳健，品牌信誉良好。',
        strategy: '保持现状并追求卓越。建议定期关注最新司法解释（如高空抛物、个人信息保护），微调管理规约，冲击行业标杆。'
      };
    }
  };

  const getIconComponent = (name: string) => {
      switch(name) {
          case 'Zap': return Zap;
          case 'FileText': return FileText;
          case 'AlertCircle': return AlertCircle;
          default: return Bot;
      }
  };

  const generateAIReport = async () => {
      setIsGenerating(true);
      const resultStats = getResult();
      
      let riskPointsText = "";
      sections.forEach((sec, sIdx) => {
          sec.questions.forEach((q, qIdx) => {
              if (answers[`${sIdx}-${qIdx}`] === 1) {
                  riskPointsText += `- [${sec.title}] ${q}\n`;
              }
          });
      });
      if (!riskPointsText) riskPointsText = "无明显风险点，合规状况良好。";

      const prompt = `
      你是一位资深物业法律顾问。用户完成了一份法律体检，系统评级为【${resultStats.level}】。
      以下是用户存在的具体风险点：
      ${riskPointsText}

      请生成一份深度的《企业合规诊断报告》，必须包含：
      1. 【总体风险评级】：明确指出风险等级（高/中/低），并给出简短的专业评语。
      2. 【核心法律风险分析】：针对上述风险点，引用《民法典》、《物业管理条例》或相关司法解释，详细说明可能导致的法律后果。
      3. 【整改行动指南】：给出3-5条具体的、可落地的整改建议。
      4. 【东元工具推荐】：推荐使用“东元法物”系统内的工具（如：欠费催收助手、装修巡查单、紧急SOP）或建议申请专项服务。

      要求：语气专业、严肃、切中痛点，字数在500字左右。
      `;

      try {
          const res = await sendMessageToAI(prompt, false, true);
          setAiReport(res);
      } catch (e) {
          setAiReport("报告生成失败，请检查网络或重试。");
      } finally {
          setIsGenerating(false);
          setTimeout(() => {
              const reportEl = document.getElementById('ai-report-area');
              if (reportEl) reportEl.scrollIntoView({ behavior: 'smooth' });
          }, 100);
      }
  };

  const handleConsultAI = () => {
      if (!aiReport || !setCurrentView) return;
      const reportContext = `以下是我的企业法务体检报告内容：\n\n${aiReport}\n\n请针对以上报告内容，协助我制定更详细的整改计划，或者回答我关于其中法律条文的疑问。`;
      localStorage.setItem('dy_report_context', reportContext);
      setCurrentView(ViewState.AI_CHAT);
  };

  if (sections.length === 0) return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
          <Activity className="animate-spin" size={32} />
          <p className="text-xs font-bold">加载体检模块中...</p>
      </div>
  );

  const currentSection = sections[currentSectionIdx];
  if (!currentSection) return <div className="p-8 text-center text-slate-400">数据加载异常，请刷新重试。</div>;

  const progress = ((currentSectionIdx) / sections.length) * 100;
  const answeredCount = Object.keys(answers).filter(k => k.startsWith(`${currentSectionIdx}-`)).length;
  const isSectionComplete = answeredCount >= currentSection.questions.length;

  if (isCompleted) {
    const result = getResult();
    const score = calculateScore();
    const recommendations = getRecommendations();
    
    return (
      <div ref={topRef} className="p-6 pb-32 bg-slate-50 min-h-full animate-fade-in">
        <div className="flex items-center gap-2 mb-4">
            <button onClick={() => { setIsCompleted(false); setCurrentSectionIdx(0); setAnswers({}); setAiReport(null); }} className="text-slate-400">
                <ArrowLeft size={20} />
            </button>
            <h2 className="text-lg font-black text-slate-800">诊断结果</h2>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden mb-6">
           <div className={`p-8 text-white ${result.color} relative overflow-hidden`}>
              <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>
              
              <div className="flex justify-between items-start relative z-10">
                 <div>
                    <h2 className="text-2xl font-black mb-1">企业体检报告</h2>
                    <p className="text-xs opacity-80 uppercase tracking-widest font-bold">Health Check Report</p>
                 </div>
                 <div className="text-center">
                    <div className="text-5xl font-black tracking-tighter">{score}</div>
                    <div className="text-[10px] font-bold uppercase opacity-80">风险指数</div>
                 </div>
              </div>
              
              {/* 风险等级仪表盘 (Risk Meter) */}
              <div className="mt-6 relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                      <div className="bg-white/20 backdrop-blur-md rounded-lg px-3 py-1 text-xs font-bold border border-white/30 flex items-center gap-1">
                        <result.icon size={14} />
                        当前评级：{result.level}
                      </div>
                      <span className="text-sm font-black italic opacity-90">{result.sub}</span>
                  </div>
                  
                  {/* 可视化进度条 */}
                  <div className="w-full bg-black/20 h-1.5 rounded-full mt-4 mb-1 relative flex items-center justify-between px-1">
                       {/* 标记点 */}
                       {['低风险', '中风险', '高风险'].map((l, i) => (
                          <div key={l} className="relative flex flex-col items-center">
                             <div className={`w-3 h-3 rounded-full transition-all duration-500 border-2 border-white/50 ${result.level === l ? 'bg-white scale-125 shadow-[0_0_10px_rgba(255,255,255,0.8)]' : 'bg-white/20'}`}></div>
                             <span className={`absolute top-4 text-[9px] font-bold whitespace-nowrap transition-opacity ${result.level === l ? 'opacity-100 text-white' : 'opacity-50 text-white/70'}`}>{l}</span>
                          </div>
                       ))}
                  </div>
              </div>
              
              <Stethoscope className="absolute bottom-[-20px] right-[-20px] opacity-20 rotate-12" size={140} />
           </div>
           
           <div className="p-8 space-y-8">
              {/* 风险详细解读板块 */}
              <div className={`rounded-2xl p-5 border ${result.borderColor} ${result.bgColor}`}>
                 <div className="space-y-4">
                     <div>
                         <h3 className={`font-black text-sm mb-2 flex items-center gap-2 ${result.textColor}`}>
                            <Activity size={16} /> 现状诊断 (详细)
                         </h3>
                         <div className="text-xs text-slate-700 leading-relaxed font-medium text-justify whitespace-pre-wrap pl-1 border-l-2 border-slate-300 ml-1">
                            {result.desc}
                         </div>
                     </div>
                     <div className="w-full h-px bg-slate-200/50"></div>
                     <div>
                         <h3 className={`font-black text-sm mb-1 flex items-center gap-2 ${result.textColor}`}>
                            <AlertCircle size={16} /> 潜在法律后果
                         </h3>
                         <p className="text-xs text-slate-700 leading-relaxed font-medium text-justify">
                            {result.consequence}
                         </p>
                     </div>
                     <div className="w-full h-px bg-slate-200/50"></div>
                     <div>
                         <h3 className={`font-black text-sm mb-1 flex items-center gap-2 ${result.textColor}`}>
                            <CheckCircle size={16} /> 初步应对策略
                         </h3>
                         <p className="text-xs text-slate-700 leading-relaxed font-medium text-justify">
                            {result.strategy}
                         </p>
                     </div>
                 </div>
              </div>

              {/* 智能解决方案推荐 */}
              {recommendations.length > 0 && (
                  <div>
                      <h3 className="font-black text-slate-800 text-sm mb-3 flex items-center gap-2">
                          <Zap size={16} className="text-orange-500" /> 推荐落地工具与服务
                      </h3>
                      <div className="grid grid-cols-1 gap-3">
                          {recommendations.slice(0, 4).map((rec: any, idx) => {
                              const IconComp = getIconComponent(rec.iconName);
                              return (
                                  <div 
                                    key={idx} 
                                    onClick={() => {
                                        if(rec.type === 'tool' && setCurrentView) setCurrentView(rec.view);
                                        if(rec.type === 'project' && setCurrentView) setCurrentView(ViewState.RIGHTS_CENTER);
                                    }}
                                    className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex items-center justify-between hover:border-orange-200 hover:bg-orange-50/50 transition-all cursor-pointer group active:scale-98"
                                  >
                                      <div className="flex items-center gap-3">
                                          {rec.type === 'tool' ? (
                                              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                                  <IconComp size={14} />
                                              </div>
                                          ) : (
                                              <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                                                  <Bot size={14} />
                                              </div>
                                          )}
                                          <div>
                                              <div className="text-xs font-bold text-slate-800">{rec.label}</div>
                                              <div className="text-[10px] text-slate-400 mt-0.5">{rec.desc || '系统内置工具'}</div>
                                          </div>
                                      </div>
                                      <ExternalLink size={14} className="text-slate-300 group-hover:text-orange-500"/>
                                  </div>
                              );
                          })}
                      </div>
                  </div>
              )}

              {/* AI 深度报告 */}
              <div className="border-t border-slate-100 pt-6" id="ai-report-area">
                  <h3 className="font-black text-slate-800 text-sm mb-3 flex items-center gap-2">
                      <Bot size={16} className="text-indigo-500" /> AI 深度合规分析
                  </h3>
                  
                  {!aiReport ? (
                      <button 
                        onClick={generateAIReport}
                        disabled={isGenerating}
                        className="w-full py-4 bg-indigo-50 text-indigo-600 rounded-2xl font-black text-xs flex items-center justify-center gap-2 border border-indigo-100 hover:bg-indigo-100 transition-all"
                      >
                          {isGenerating ? <RefreshCw className="animate-spin" size={14}/> : <Bot size={14}/>}
                          {isGenerating ? 'AI 正在分析全盘数据...' : '生成深度诊断报告 (引用法律条文)'}
                      </button>
                  ) : (
                      <div className="space-y-4">
                          <div className="bg-indigo-50/50 rounded-2xl p-5 border border-indigo-100">
                              <div className="prose prose-sm max-w-none text-xs text-slate-600 leading-relaxed whitespace-pre-wrap font-medium">
                                  {aiReport}
                              </div>
                          </div>
                          
                          {/* 咨询 AI 按钮 */}
                          <button 
                            onClick={handleConsultAI}
                            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 transition-all active:scale-95"
                          >
                              <MessageSquare size={14} /> 基于此报告，继续咨询 AI 助手
                          </button>
                      </div>
                  )}
              </div>
           </div>
        </div>

        <div className="space-y-3 pb-8">
           <button 
             onClick={() => { setIsCompleted(false); setCurrentSectionIdx(0); setAnswers({}); setAiReport(null); }}
             className="w-full bg-white text-slate-500 py-4 rounded-2xl font-black text-sm border border-slate-200 active:scale-95 transition-all flex items-center justify-center gap-2"
           >
             <RefreshCw size={16} /> 重新评测
           </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={topRef} className="flex flex-col h-full bg-white animate-fade-in">
      {/* Header with Progress */}
      <div className="px-6 pt-6 pb-2 bg-white sticky top-0 z-10">
         <div className="flex justify-between items-end mb-4">
            <div>
               <h2 className="text-xl font-black text-slate-900">企业合规体检</h2>
               <p className="text-[10px] text-slate-400 mt-1 font-bold uppercase tracking-widest">
                 板块 {currentSectionIdx + 1} / {sections.length}：{currentSection.title}
               </p>
            </div>
            <div className="text-orange-500 font-black italic text-xl">
               {Math.round(progress)}%
            </div>
         </div>
         <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-orange-500 transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
         </div>
      </div>

      {/* Questionnaire */}
      <div className="flex-1 overflow-y-auto p-6 pb-32">
         <div className="space-y-6">
            {currentSection.questions.map((q, idx) => {
               const key = `${currentSectionIdx}-${idx}`;
               const val = answers[key];
               return (
                  <div key={idx} className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                     <p className="text-sm font-bold text-slate-800 leading-relaxed mb-4">
                        {idx + 1}. {q}
                     </p>
                     <div className="flex gap-3">
                        <button 
                           onClick={() => handleAnswer(idx, 0)}
                           className={`flex-1 py-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all ${
                              val === 0 
                                ? 'bg-green-500 text-white shadow-lg shadow-green-500/30' 
                                : 'bg-white text-slate-400 border border-slate-200 hover:border-green-200'
                           }`}
                        >
                           <CheckCircle size={14} /> 是 / 有
                        </button>
                        <button 
                           onClick={() => handleAnswer(idx, 1)}
                           className={`flex-1 py-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all ${
                              val === 1 
                                ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' 
                                : 'bg-white text-slate-400 border border-slate-200 hover:border-red-200'
                           }`}
                        >
                           <XCircle size={14} /> 否 / 不清楚
                        </button>
                     </div>
                  </div>
               );
            })}
         </div>
      </div>

      {/* Footer Navigation */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t border-slate-100 pb-12">
         <div className="text-center text-[10px] text-slate-400 mb-2 font-bold">
            {isSectionComplete ? '本板块已完成' : `还需回答 ${currentSection.questions.length - answeredCount} 题`}
         </div>
         <button 
            onClick={nextSection}
            disabled={!isSectionComplete}
            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all disabled:opacity-50 disabled:bg-slate-300"
         >
            {currentSectionIdx === sections.length - 1 ? '提交并查看诊断报告' : '下一板块'} <ArrowRight size={16} />
         </button>
      </div>
    </div>
  );
};

export default LegalHealthCheck;
