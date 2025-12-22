
import React from 'react';
import { Home, Briefcase, User as UserIcon, Bot, ArrowLeft, Bell, Search } from 'lucide-react';
import { ViewState } from '../types';

interface LayoutProps {
  currentView: ViewState;
  setCurrentView: (view: ViewState) => void;
  children: React.ReactNode;
  scrollRef?: React.RefObject<HTMLDivElement | null>;
}

const Layout: React.FC<LayoutProps> = ({ currentView, setCurrentView, children, scrollRef }) => {
  const isHome = currentView === ViewState.HOME;
  
  // 定义一级页面（显示导航栏）
  const mainTabs = [ViewState.HOME, ViewState.TOOLBOX, ViewState.MY_ENTERPRISE];
  const showNavBar = mainTabs.includes(currentView);

  const handleNav = (view: ViewState) => {
    setCurrentView(view);
  };

  const showBackButton = currentView !== ViewState.HOME;

  const toolboxChildren = [
    ViewState.POSTER_GENERATOR,
    ViewState.EVIDENCE_LIST,
    ViewState.CIVIL_CODE,
    ViewState.NOTICE_GENERATOR,
    ViewState.AI_DOC_GEN
  ];

  const getHeaderTitle = () => {
    switch (currentView) {
      case ViewState.CALCULATOR: return '催费计算器';
      case ViewState.DIAGNOSIS: return '纠纷快诊';
      case ViewState.DOCUMENTS: return '模版中心';
      case ViewState.RISK_CHECK: return '风险自查表';
      case ViewState.MY_ENTERPRISE: return '账户设置';
      case ViewState.TOOLBOX: return '工具箱';
      case ViewState.AI_CHAT: return 'AI 法务助手';
      case ViewState.POSTER_GENERATOR: return '海报生成';
      case ViewState.EVIDENCE_LIST: return '取证清单';
      case ViewState.CIVIL_CODE: return '民法典速查';
      case ViewState.NOTICE_GENERATOR: return '公告生成器';
      case ViewState.AI_DOC_GEN: return 'AI 文书定制';
      default: return '东元法物';
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#f8fafc] relative overflow-hidden">
      
      {/* 1. 动态弥散背景 (Cinematic Ambient Background) */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
         {/* 主色光球 */}
         <div className={`absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-[#FF7F00] rounded-full blur-[120px] opacity-20 transition-all duration-700 ${isHome ? 'opacity-20' : 'opacity-10 scale-90'}`}></div>
         {/* 辅色光球 (增加冷暖对比) */}
         <div className="absolute top-[20%] right-[-20%] w-[400px] h-[400px] bg-blue-600 rounded-full blur-[100px] opacity-5"></div>
      </div>

      {/* 2. 头部区域 (Glass Header) */}
      <header className={`relative z-20 shrink-0 px-6 pt-4 pb-2 flex items-center justify-between transition-all duration-300 ${isHome ? 'h-[70px]' : 'h-[60px]'}`}>
        <div className="flex items-center gap-4">
          {showBackButton ? (
            <>
              <button 
                onClick={() => {
                  if (toolboxChildren.includes(currentView)) {
                    setCurrentView(ViewState.TOOLBOX);
                  } else {
                    setCurrentView(ViewState.HOME);
                  }
                }} 
                className="p-2 bg-white/50 backdrop-blur-md border border-white/40 rounded-full text-slate-700 shadow-sm active:scale-90 transition-all"
              >
                <ArrowLeft size={20} />
              </button>
              <span className="font-black tracking-tight text-slate-800 text-lg">
                {getHeaderTitle()}
              </span>
            </>
          ) : (
             // 首页显示 East Capital 品牌 Logo (文字+Swoosh)
             <div className="flex items-center -ml-1">
                <svg height="36" viewBox="0 0 160 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* eastcapital - Orange Color to match brand */}
                  <text x="0" y="28" fill="#F38020" fontSize="28" fontFamily="Helvetica, Arial, sans-serif" fontWeight="bold" letterSpacing="-1.5">eastcapital</text>
                  
                  {/* Swoosh - Orange Arc */}
                  <path d="M25 35 Q 70 -5 155 20" stroke="#F38020" strokeWidth="2.5" strokeLinecap="round" fill="none" />

                  {/* 东元法物 - Small text aligned right under 'capital' */}
                  <text x="120" y="38" fill="#F38020" fontSize="9" fontWeight="bold" letterSpacing="1" textAnchor="middle">东元法物</text>
                </svg>
             </div>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          {isHome && (
             <button className="p-2 bg-white/50 backdrop-blur-md border border-white/40 rounded-full text-slate-500 hover:text-slate-800 transition-colors">
                <Search size={20} />
             </button>
          )}
          <div className="relative p-2 bg-white/50 backdrop-blur-md border border-white/40 rounded-full text-slate-500 hover:text-slate-800 transition-colors cursor-pointer">
            <Bell size={20} />
            <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 border border-white rounded-full"></span>
          </div>
        </div>
      </header>

      {/* 3. 滚动内容区 */}
      <main ref={scrollRef} className={`flex-1 relative z-10 overflow-y-auto no-scrollbar ${showNavBar ? 'pb-[120px]' : 'pb-6'}`}>
        {children}
      </main>

      {/* 4. 浮动 AI 按钮 (仅在非对话且非二级页显示，或者可以一直显示在右下角，这里保持仅 AI 页不显示的逻辑) */}
      {currentView !== ViewState.AI_CHAT && (
        <button 
          onClick={() => setCurrentView(ViewState.AI_CHAT)}
          className={`fixed right-6 z-50 group transition-all duration-300 ${showNavBar ? 'bottom-[110px]' : 'bottom-6'}`}
        >
          <div className="absolute inset-0 bg-orange-400 rounded-full blur opacity-40 group-hover:opacity-60 transition-opacity animate-pulse"></div>
          <div className="relative w-14 h-14 bg-gradient-to-br from-[#FF7F00] to-[#F38020] text-white rounded-full shadow-2xl flex items-center justify-center border-2 border-white/20 hover:scale-105 active:scale-95 transition-all">
             <Bot size={28} />
          </div>
        </button>
      )}

      {/* 5. 悬浮式玻璃导航栏 (Floating Glass Dock) - 仅在一级页面显示 */}
      <nav 
        className={`fixed bottom-6 left-6 right-6 h-[72px] bg-white/80 backdrop-blur-xl border border-white/40 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] rounded-[2rem] z-40 flex justify-between items-center px-2 transition-transform duration-500 ${showNavBar ? 'translate-y-0' : 'translate-y-[200%]'}`}
      >
        <button 
          onClick={() => handleNav(ViewState.HOME)}
          className={`flex flex-col items-center gap-1 w-full h-full justify-center rounded-3xl transition-all duration-300 relative ${currentView === ViewState.HOME ? 'text-orange-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <div className={`p-1.5 rounded-xl transition-all ${currentView === ViewState.HOME ? 'bg-orange-50' : 'bg-transparent'}`}>
             <Home size={24} strokeWidth={currentView === ViewState.HOME ? 2.5 : 2} />
          </div>
          <span className="text-[9px] font-bold tracking-wide">工作台</span>
          {currentView === ViewState.HOME && <div className="absolute bottom-1.5 w-1 h-1 bg-orange-500 rounded-full"></div>}
        </button>

        <button 
          onClick={() => handleNav(ViewState.TOOLBOX)}
          className={`flex flex-col items-center gap-1 w-full h-full justify-center rounded-3xl transition-all duration-300 relative ${currentView === ViewState.TOOLBOX || toolboxChildren.includes(currentView) ? 'text-orange-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <div className={`p-1.5 rounded-xl transition-all ${currentView === ViewState.TOOLBOX || toolboxChildren.includes(currentView) ? 'bg-orange-50' : 'bg-transparent'}`}>
            <Briefcase size={24} strokeWidth={currentView === ViewState.TOOLBOX || toolboxChildren.includes(currentView) ? 2.5 : 2} />
          </div>
          <span className="text-[9px] font-bold tracking-wide">工具箱</span>
          {(currentView === ViewState.TOOLBOX || toolboxChildren.includes(currentView)) && <div className="absolute bottom-1.5 w-1 h-1 bg-orange-500 rounded-full"></div>}
        </button>

        <button 
          onClick={() => handleNav(ViewState.MY_ENTERPRISE)}
          className={`flex flex-col items-center gap-1 w-full h-full justify-center rounded-3xl transition-all duration-300 relative ${currentView === ViewState.MY_ENTERPRISE ? 'text-orange-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <div className={`p-1.5 rounded-xl transition-all ${currentView === ViewState.MY_ENTERPRISE ? 'bg-orange-50' : 'bg-transparent'}`}>
            <UserIcon size={24} strokeWidth={currentView === ViewState.MY_ENTERPRISE ? 2.5 : 2} />
          </div>
          <span className="text-[9px] font-bold tracking-wide">我的</span>
          {currentView === ViewState.MY_ENTERPRISE && <div className="absolute bottom-1.5 w-1 h-1 bg-orange-500 rounded-full"></div>}
        </button>

      </nav>
    </div>
  );
};

export default Layout;
