
import React, { useState, useEffect } from 'react';
import { Calculator, Stethoscope, FileText, ShieldCheck, ChevronRight, Sparkles, Quote } from 'lucide-react';
import { ViewState } from '../types';
import FeatureCard from '../components/FeatureCard';
import { sendMessageToAI } from '../services/geminiService';

interface HomeProps {
  setCurrentView: (view: ViewState) => void;
}

const Home: React.FC<HomeProps> = ({ setCurrentView }) => {
  // 1. 初始化时直接计算时间，避免默认值导致的闪烁或错误显示
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good Morning';
    if (hour >= 12 && hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const [greeting, setGreeting] = useState(getGreeting());
  const [dailyTip, setDailyTip] = useState({
    title: '物业纠纷处理原则',
    content: '《民法典》第九百四十二条：物业服务人应当维护物业服务区域内的基本秩序，采取合理措施保护业主的人身、财产安全。'
  });

  useEffect(() => {
    // 定时器确保长时间停留在页面时问候语也能更新
    const timer = setInterval(() => {
      setGreeting(getGreeting());
    }, 60000);

    // 2. 获取每日锦囊
    const fetchTip = async () => {
      try {
        const res = await sendMessageToAI("生成一条今日物业管理相关的法律微锦囊，格式：标题：xxx 正文：xxx", false, false);
        const titleMatch = res.match(/标题：(.*)/);
        const contentMatch = res.match(/正文：(.*)/);
        if (titleMatch && contentMatch) {
          setDailyTip({ title: titleMatch[1].trim(), content: contentMatch[1].trim() });
        }
      } catch (e) {}
    };
    fetchTip();

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col px-6 gap-8 pb-6 pt-2 animate-fade-in relative overflow-hidden">
      
      {/* 顶部 Slogan 区 */}
      <div className="px-2 mt-2 relative">
        <div className="relative z-10">
          <h2 className="text-3xl font-black tracking-tighter text-slate-900 mb-1">
            {greeting}
          </h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            您的东元智能法务顾问 (LEVEL 1-3)
          </p>
        </div>
      </div>

      {/* AI 核心入口 - 视觉焦点 */}
      <div 
        onClick={() => setCurrentView(ViewState.AI_DOC_GEN)}
        className="relative w-full h-28 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-[2rem] p-6 text-white shadow-xl shadow-indigo-500/20 flex items-center justify-between group cursor-pointer active:scale-98 transition-all overflow-hidden"
      >
        {/* 背景装饰 */}
        <div className="absolute right-[-20px] top-[-20px] w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
        <div className="absolute left-[-20px] bottom-[-20px] w-32 h-32 bg-purple-400 opacity-20 rounded-full blur-2xl"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
             <Sparkles size={16} className="text-yellow-300 animate-pulse" />
             <span className="text-[10px] font-black uppercase tracking-widest opacity-80">AI Power</span>
          </div>
          <h4 className="font-black text-xl tracking-tight">AI 专业文书定制</h4>
          <p className="text-[11px] text-indigo-100 mt-1 font-medium">描述需求，秒出标准法律函件</p>
        </div>
        
        <div className="relative z-10 bg-white/10 backdrop-blur-sm p-3 rounded-full border border-white/10 group-hover:bg-white/20 transition-colors">
          <ChevronRight size={24} className="text-white" />
        </div>
      </div>

      {/* 功能网格区 */}
      <div className="space-y-6">
        {/* 风险与诊断 */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <span className="w-1 h-4 bg-orange-500 rounded-full"></span>
            <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest">合规自查</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FeatureCard title="风险自查表" icon={<ShieldCheck size={26} />} onClick={() => setCurrentView(ViewState.RISK_CHECK)} />
            <FeatureCard title="纠纷快诊" icon={<Stethoscope size={26} />} onClick={() => setCurrentView(ViewState.DIAGNOSIS)} />
          </div>
        </div>

        {/* 常用工具 */}
        <div className="space-y-3">
           <div className="flex items-center gap-2 px-1">
            <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
            <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest">实用工具</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FeatureCard 
              title="模版中心" 
              icon={<FileText size={26} />} 
              onClick={() => setCurrentView(ViewState.DOCUMENTS)} 
              colorClass="text-blue-500" 
              bgClass="bg-blue-50" 
            />
            <FeatureCard 
              title="催费计算" 
              icon={<Calculator size={26} />} 
              onClick={() => setCurrentView(ViewState.CALCULATOR)} 
              colorClass="text-blue-500" 
              bgClass="bg-blue-50" 
            />
          </div>
        </div>
      </div>

      {/* 每日金句 - 杂志排版风格 */}
      <div className="relative mt-2 mb-10 group">
        <div className="absolute inset-0 bg-slate-200 rounded-[2.5rem] rotate-1 group-hover:rotate-2 transition-transform"></div>
        <div className="relative bg-white rounded-[2.5rem] p-8 shadow-lg border border-slate-100">
           <Quote size={40} className="absolute top-6 right-6 text-slate-100 fill-slate-50" />
           <div className="mb-4">
              <span className="inline-block px-3 py-1 bg-slate-900 text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-full">Daily Insight</span>
           </div>
           <h3 className="text-lg font-black text-slate-800 mb-3 tracking-tight">{dailyTip.title}</h3>
           <p className="text-xs text-slate-500 leading-relaxed font-medium italic">
             “{dailyTip.content}”
           </p>
           <button 
             onClick={() => setCurrentView(ViewState.AI_CHAT)}
             className="mt-6 w-full py-3 bg-slate-50 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-colors"
           >
             Read Analysis
           </button>
        </div>
      </div>

    </div>
  );
};

export default Home;
