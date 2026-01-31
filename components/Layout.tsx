
import React, { useState } from 'react';
import { Home, Briefcase, User as UserIcon, Bot, ArrowLeft, Bell, Search, X, Clock, AlertCircle, FileText, CheckCircle2, ChevronRight, Zap, BookOpen } from 'lucide-react';
import { ViewState } from '../types';
import { usePreload } from '../views/PreloadContext';

interface LayoutProps {
  currentView: ViewState;
  setCurrentView: (view: ViewState) => void;
  children: React.ReactNode;
  scrollRef?: React.RefObject<HTMLDivElement | null>;
}

const Layout: React.FC<LayoutProps> = ({ currentView, setCurrentView, children, scrollRef }) => {
  const isHome = currentView === ViewState.HOME;
  const [showSearch, setShowSearch] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [searchText, setSearchText] = useState('');

  // Search Results
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // 从 Context 获取缓存的搜索数据
  const { data: preloadData } = usePreload();

  // 定义一级页面（显示导航栏）
  const mainTabs = [ViewState.HOME, ViewState.TOOLBOX, ViewState.MY_ENTERPRISE];
  const showNavBar = mainTabs.includes(currentView);

  const handleNav = (view: ViewState) => {
    setCurrentView(view);
    setShowSearch(false);
    setShowNotif(false);
  };

  // Implement Real Global Search
  const handleSearch = (e: React.FormEvent) => {
      e.preventDefault();
      if (!searchText.trim()) return;
      
      const term = searchText.trim().toLowerCase();
      const results: any[] = [];

      // 1. Search Features
      const tools = [
          { title: '欠费催收助手', view: ViewState.COLLECTION_CRM, type: '功能' },
          { title: '纠纷快诊', view: ViewState.DIAGNOSIS, type: '功能' },
          { title: '催费计算器', view: ViewState.CALCULATOR, type: '功能' },
          { title: '文书模版中心', view: ViewState.DOCUMENTS, type: '功能' },
          { title: '企业法务体检', view: ViewState.LEGAL_HEALTH_CHECK, type: '功能' },
          { title: 'AI 法务助手', view: ViewState.AI_CHAT, type: '功能' },
          { title: '海报生成', view: ViewState.POSTER_GENERATOR, type: '功能' },
          { title: '取证清单', view: ViewState.EVIDENCE_LIST, type: '功能' },
          { title: '装修巡查', view: ViewState.RENOVATION_CHECK, type: '功能' },
          { title: '紧急 SOP', view: ViewState.EMERGENCY_SOP, type: '功能' },
          { title: '话术锦囊', view: ViewState.SCRIPT_KIT, type: '功能' },
      ];
      tools.forEach(t => {
          if (t.title.toLowerCase().includes(term)) results.push(t);
      });

      // 2. Search Docs (from Context cache)
      if (preloadData.loaded && preloadData.docs.length > 0) {
        preloadData.docs.forEach(d => {
            if (d.title.toLowerCase().includes(term) || (d.category && d.category.includes(term))) {
                results.push({ title: d.title, view: ViewState.DOCUMENTS, type: '文书', sub: d.category });
            }
        });

        // 3. Search Laws (from Context cache)
        preloadData.laws.forEach(l => {
            if (l.title.toLowerCase().includes(term) || (l.content && l.content.includes(term))) {
                results.push({ title: l.title, view: ViewState.CIVIL_CODE, type: '法规', sub: l.content ? l.content.slice(0, 20) + '...' : '' });
            }
        });
      }

      setSearchResults(results);
  };

  const navigateToResult = (item: any) => {
      setCurrentView(item.view);
      setShowSearch(false);
      setSearchText('');
      setSearchResults([]);
  };

  const showBackButton = currentView !== ViewState.HOME;

  const toolboxChildren = [
    ViewState.POSTER_GENERATOR,
    ViewState.EVIDENCE_LIST,
    ViewState.CIVIL_CODE,
    ViewState.NOTICE_GENERATOR,
    ViewState.AI_DOC_GEN,
    ViewState.RENOVATION_CHECK,
    ViewState.SCRIPT_KIT,
    ViewState.EMERGENCY_SOP,
    ViewState.LEGAL_HEALTH_CHECK
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
      case ViewState.COLLECTION_CRM: return '欠费催收助手';
      case ViewState.RENOVATION_CHECK: return '装修巡查单';
      case ViewState.SCRIPT_KIT: return '催费话术锦囊';
      case ViewState.EMERGENCY_SOP: return '紧急情况SOP';
      case ViewState.LAWYER_VIDEO: return '呼叫律师';
      case ViewState.RIGHTS_CENTER: return '会员权益中心';
      case ViewState.LEGAL_HEALTH_CHECK: return '企业法务体检';
      default: return '东元法物';
    }
  };

  // Mock Notifications - In a real app, this would come from a context or prop
  const notifications = [
      { id: 1, title: '合规报告已生成', desc: '您提交的“企业法务体检”已有结果，请查收。', time: '10分钟前', icon: FileText, color: 'text-blue-500 bg-blue-50', unread: true },
      { id: 2, title: '新的欠费预警', desc: '本月欠费超过 12 个月的户数增加 3 户。', time: '2小时前', icon: AlertCircle, color: 'text-orange-500 bg-orange-50', unread: false },
      { id: 3, title: '系统升级通知', desc: '东元法物已更新至 v4.2 版本，新增视频连线功能。', time: '昨天', icon: CheckCircle2, color: 'text-green-500 bg-green-50', unread: false },
  ];
  
  const hasUnread = notifications.some(n => n.unread);

  return (
    // 使用 100dvh (dynamic viewport height) 适配移动端浏览器地址栏伸缩
    <div className="flex flex-col h-[100dvh] w-full bg-[#f8fafc] relative overflow-hidden">
      
      {/* 1. 动态弥散背景 (Cinematic Ambient Background) */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
         {/* 主色光球 */}
         <div className={`absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-[#FF7F00] rounded-full blur-[120px] opacity-20 transition-all duration-700 ${isHome ? 'opacity-20' : 'opacity-10 scale-90'}`}></div>
         {/* 辅色光球 (增加冷暖对比) */}
         <div className="absolute top-[20%] right-[-20%] w-[400px] h-[400px] bg-blue-600 rounded-full blur-[100px] opacity-5"></div>
      </div>

      {/* 2. 头部区域 (Glass Header) */}
      <header className={`relative z-30 shrink-0 px-6 pt-4 pb-2 flex items-center justify-between transition-all duration-300 ${isHome ? 'h-[70px]' : 'h-[60px]'}`}>
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
        
        <div className="flex items-center gap-3 relative">
          {/* Search Button */}
          {isHome && (
             <button 
                onClick={() => { setShowSearch(!showSearch); setShowNotif(false); setSearchResults([]); setSearchText(''); }}
                className={`p-2 backdrop-blur-md border rounded-full transition-all ${
                    showSearch 
                    ? 'bg-orange-500 text-white border-orange-500 rotate-90' 
                    : 'bg-white/50 border-white/40 text-slate-500 hover:text-slate-800'
                }`}
             >
                {showSearch ? <X size={20} /> : <Search size={20} />}
             </button>
          )}
          
          {/* Notification Button & Dropdown */}
          <div className="relative">
              <button 
                onClick={() => { setShowNotif(!showNotif); setShowSearch(false); }}
                className={`relative p-2 backdrop-blur-md border rounded-full transition-all ${
                    showNotif 
                    ? 'bg-slate-800 text-white border-slate-800' 
                    : 'bg-white/50 border-white/40 text-slate-500 hover:text-slate-800'
                }`}
              >
                <Bell size={20} />
                {hasUnread && (
                    <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 border border-white rounded-full animate-pulse"></span>
                )}
              </button>

              {/* Notification Dropdown Panel */}
              {showNotif && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setShowNotif(false)}></div>
                    <div className="absolute right-0 top-12 w-72 bg-white/90 backdrop-blur-xl border border-white/60 rounded-2xl shadow-2xl z-40 p-1 animate-fade-in-up origin-top-right">
                        <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">通知中心</span>
                            {hasUnread && <span className="text-[10px] bg-red-100 text-red-500 font-bold px-1.5 py-0.5 rounded">未读消息</span>}
                        </div>
                        <div className="max-h-64 overflow-y-auto no-scrollbar p-1">
                            {notifications.map(n => (
                                <div key={n.id} className="flex gap-3 p-3 hover:bg-white/50 rounded-xl transition-colors cursor-pointer border-b border-dashed border-gray-50 last:border-0">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${n.color}`}>
                                        <n.icon size={14} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <div className="text-xs font-bold text-slate-800">{n.title}</div>
                                            {n.unread && <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1"></div>}
                                        </div>
                                        <div className="text-[10px] text-slate-500 mt-0.5 leading-snug">{n.desc}</div>
                                        <div className="text-[9px] text-slate-300 mt-1 flex items-center gap-1"><Clock size={8}/> {n.time}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-2 border-t border-gray-100 text-center">
                            <button className="text-[10px] font-bold text-slate-400 hover:text-slate-600">查看全部消息</button>
                        </div>
                    </div>
                  </>
              )}
          </div>
        </div>
      </header>

      {/* Global Search Overlay Bar */}
      {showSearch && (
        <div className="absolute top-[70px] left-0 w-full px-6 z-20 animate-fade-in flex flex-col gap-2">
            <form onSubmit={handleSearch} className="bg-white/90 backdrop-blur-xl border border-white/60 p-2 rounded-2xl shadow-xl flex items-center gap-2">
                <Search size={18} className="text-slate-400 ml-2" />
                <input 
                    autoFocus
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="搜功能、找文书、查法条..."
                    className="flex-1 bg-transparent outline-none text-sm font-bold text-slate-700 placeholder:text-slate-400 h-10"
                />
                <button type="submit" className="bg-orange-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-orange-500/20 active:scale-95 transition-all">
                    搜索
                </button>
            </form>

            {/* Search Results Dropdown */}
            {searchResults.length > 0 && (
                <div className="bg-white/90 backdrop-blur-xl border border-white/60 rounded-2xl shadow-2xl overflow-hidden max-h-[60vh] overflow-y-auto no-scrollbar">
                    <div className="p-2">
                        {searchResults.map((item, idx) => (
                            <div 
                                key={idx} 
                                onClick={() => navigateToResult(item)}
                                className="flex items-center justify-between p-3 hover:bg-orange-50 rounded-xl cursor-pointer transition-colors border-b border-gray-100 last:border-0"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                                        item.type === '功能' ? 'bg-orange-100 text-orange-600' : 
                                        item.type === '文书' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
                                    }`}>
                                        {item.type === '功能' ? <Zap size={14}/> : item.type === '文书' ? <FileText size={14}/> : <BookOpen size={14}/>}
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-slate-800">{item.title}</div>
                                        {item.sub && <div className="text-[10px] text-slate-400">{item.sub}</div>}
                                    </div>
                                </div>
                                <ChevronRight size={16} className="text-slate-300"/>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
      )}

      {/* 3. 滚动内容区 - WeChat Adaption: Increased bottom padding to ensure content is not hidden by dock/browser bars */}
      <main ref={scrollRef} className={`flex-1 relative z-10 overflow-y-auto no-scrollbar ${showNavBar ? 'pb-32' : 'pb-10'}`}>
        {children}
      </main>

      {/* 4. 浮动 AI 按钮 */}
      {currentView !== ViewState.AI_CHAT && (
        <button 
          onClick={() => setCurrentView(ViewState.AI_CHAT)}
          className={`fixed right-6 z-50 group transition-all duration-300 ${showNavBar ? 'bottom-[calc(110px+env(safe-area-inset-bottom))]' : 'bottom-[calc(30px+env(safe-area-inset-bottom))]'}`}
        >
          <div className="absolute inset-0 bg-orange-400 rounded-full blur opacity-40 group-hover:opacity-60 transition-opacity animate-pulse"></div>
          <div className="relative w-14 h-14 bg-gradient-to-br from-[#FF7F00] to-[#F38020] text-white rounded-full shadow-2xl flex items-center justify-center border-2 border-white/20 hover:scale-105 active:scale-95 transition-all">
             <Bot size={28} />
          </div>
        </button>
      )}

      {/* 5. 悬浮式玻璃导航栏 (Floating Glass Dock) - 适配 iPhone 底部安全区域 */}
      <nav 
        className={`fixed left-6 right-6 h-[72px] bg-white/80 backdrop-blur-xl border border-white/40 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] rounded-[2rem] z-40 flex justify-between items-center px-2 transition-transform duration-500 bottom-[calc(1.5rem+env(safe-area-inset-bottom))] ${showNavBar ? 'translate-y-0' : 'translate-y-[200%]'}`}
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
