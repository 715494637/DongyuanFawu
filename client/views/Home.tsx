
import React, { useState, useEffect } from 'react';
import { Calculator, Stethoscope, FileText, ChevronRight, Quote, Gavel, Download, Lock, Crown, Bot, PhoneCall, Activity, CheckCircle, Briefcase, Sparkles, Shield } from 'lucide-react';
import { ViewState, UserRole, User } from '../types';
import FeatureCard from '../components/FeatureCard';
import { sendMessageToAI } from '../services/geminiService';
import { api, cachedApi } from '../services/apiService';
import { useCache, CACHE_KEYS } from '../services/DataCacheContext';

interface HomeProps {
  setCurrentView: (view: ViewState) => void;
}

interface VipLevelConfig {
  id: string;
  level_name: string;
  level_code: string;
  min_amount: number;
  max_amount: number | null;
  benefits: { features?: string[] };
  sort_order: number;
}

interface EnterpriseStats {
  id: string;
  enterprise_name: string;
  total_recovered_amount: number;
  total_entrusted_amount: number;
  entrusted_count: number;
}

const Home: React.FC<HomeProps> = ({ setCurrentView }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [stats, setStats] = useState<EnterpriseStats | null>(null);
  const [vipLevels, setVipLevels] = useState<VipLevelConfig[]>([]);
  const [currentLevel, setCurrentLevel] = useState<VipLevelConfig | null>(null);
  const [nextLevel, setNextLevel] = useState<VipLevelConfig | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ 正确：在组件顶层调用 useCache()
  const cache = useCache();

  // 从 localStorage 读取缓存数据
  const loadFromLocalStorage = () => {
    try {
      const cachedUser = localStorage.getItem('dy_cached_user');
      const cachedStats = localStorage.getItem('dy_cached_stats');
      const cachedVipLevels = localStorage.getItem('dy_cached_vip_levels');
      const cacheTimestamp = localStorage.getItem('dy_cache_timestamp');

      // 检查缓存是否过期（5分钟）
      const isExpired = cacheTimestamp
        ? Date.now() - parseInt(cacheTimestamp) > 5 * 60 * 1000
        : true;

      if (!isExpired) {
        let hasData = false;
        if (cachedUser) {
          setCurrentUser(JSON.parse(cachedUser));
          hasData = true;
        }
        if (cachedStats) {
          setStats(JSON.parse(cachedStats));
          hasData = true;
        }
        if (cachedVipLevels) {
          setVipLevels(JSON.parse(cachedVipLevels));
          hasData = true;
        }
        if (hasData) {
          setLoading(false);
        }
      }
    } catch (e) {
      console.error('读取本地缓存失败:', e);
    }
  };

  // 保存数据到 localStorage
  const saveToLocalStorage = (
    user?: User | null,
    statsData?: EnterpriseStats | null,
    levelsData?: VipLevelConfig[]
  ) => {
    try {
      if (user) localStorage.setItem('dy_cached_user', JSON.stringify(user));
      if (statsData) localStorage.setItem('dy_cached_stats', JSON.stringify(statsData));
      if (levelsData) localStorage.setItem('dy_cached_vip_levels', JSON.stringify(levelsData));
      localStorage.setItem('dy_cache_timestamp', Date.now().toString());
    } catch (e) {
      console.error('保存本地缓存失败:', e);
    }
  };

  // Call Animation State
  const [showCallOverlay, setShowCallOverlay] = useState(false);
  const [callCountdown, setCallCountdown] = useState<number | string | null>(null);

  const [dailyTip, setDailyTip] = useState({
    title: '物业纠纷处理原则',
    content: '《民法典》第九百四十二条：物业服务人应当维护物业服务区域内的基本秩序。'
  });

  // 获取 token
  const getToken = () => {
    return sessionStorage.getItem('token') || localStorage.getItem('token') || '';
  };

  // 获取 session user - 使用 API
  const getSessionUser = async (): Promise<User | null> => {
    const token = getToken();
    if (!token) return null;
    try {
      const userData = await api.getCurrentUser(token);
      return {
        id: userData.id,
        username: userData.username,
        phoneNumber: userData.phone_number,
        role: userData.role as UserRole,
        enterpriseName: userData.enterprise_name,
        isCertified: userData.is_certified,
        approvalStatus: userData.approval_status,
        quota: userData.quota || { lawyerLetters: 0, consultations: 0 },
        selectedProjects: userData.selected_projects || []
      };
    } catch (err) {
      console.error('获取当前用户失败:', err);
      return null;
    }
  };

  useEffect(() => {
    // 1. 优先从 localStorage 加载缓存数据（避免闪烁）
    loadFromLocalStorage();

    const loadData = async () => {
      try {
        const token = getToken();

        // 并行请求：用户信息、统计数据、VIP等级（使用缓存）
        const [userData, statsData, levelsData] = await Promise.all([
          cachedApi.getCurrentUser(token),
          token ? cachedApi.getEnterpriseStats(token) : null,
          cachedApi.getVipLevels()
        ]).catch(async (err) => {
          // 如果用户信息获取失败，可能 token 无效
          console.error('获取用户数据失败:', err);
          // 继续尝试获取其他数据
          return [null, null, []];
        });

        // 设置用户信息
        let user: User | null = null;
        if (userData) {
          user = {
            id: userData.id,
            username: userData.username,
            phoneNumber: userData.phone_number,
            role: userData.role as UserRole,
            enterpriseName: userData.enterprise_name,
            isCertified: userData.is_certified,
            approvalStatus: userData.approval_status,
            quota: userData.quota || { lawyerLetters: 0, consultations: 0 },
            selectedProjects: userData.selected_projects || []
          };
          setCurrentUser(user);
        }

        // 设置统计数据
        if (statsData) {
          setStats(statsData);
        } else {
          setStats({ id: '', enterprise_name: '', total_recovered_amount: 0, total_entrusted_amount: 0, entrusted_count: 0 });
        }

        // 处理 VIP 等级
        const levels = Array.isArray(levelsData) ? levelsData : [];
        setVipLevels(levels);

        // 保存到 localStorage
        saveToLocalStorage(user, statsData, levels);

        // 计算当前等级
        if (userData?.enterprise_name && levels.length > 0) {
          const entrustedAmount = statsData?.total_entrusted_amount || 0;
          let lvl: VipLevelConfig | null = null;
          let next: VipLevelConfig | null = null;

          for (let i = 0; i < levels.length; i++) {
            if (entrustedAmount >= levels[i].min_amount) {
              lvl = levels[i];
            } else {
              next = levels[i];
              break;
            }
          }
          if (!lvl && levels.length > 0) next = levels[0];

          setCurrentLevel(lvl);
          setNextLevel(next);
        }

      } catch (err) {
        console.error('加载首页数据失败:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Daily Tip（每日锦囊缓存24小时）
    const fetchTip = async () => {
      // 先检查缓存
      const cachedTip = cache.getCache<{title: string; content: string}>(CACHE_KEYS.DAILY_TIP);
      if (cachedTip) {
        setDailyTip(cachedTip);
        return;
      }

      // 缓存没有，调用 AI
      try {
        const res = await sendMessageToAI("生成一条今日物业管理相关的法律微锦囊，格式：标题：xxx 正文：xxx", false, false);
        const titleMatch = res.match(/标题：(.*)/);
        const contentMatch = res.match(/正文：(.*)/);
        if (titleMatch && contentMatch) {
          const tip = { title: titleMatch[1].trim(), content: contentMatch[1].trim() };
          setDailyTip(tip);
          // 存入缓存，24小时有效
          cache.setCache(CACHE_KEYS.DAILY_TIP, tip);
        }
      } catch (e) {}
    };
    fetchTip();
  }, [cache]);

  const handleLawyerCall = () => {
    if (!currentUser) return;

    // 1. Role Check
    if (currentUser.role === UserRole.EMPLOYEE || currentUser.role === UserRole.USER) {
      alert("权限不足：该功能仅限项目主管及以上级别使用。\n请联系您的上级或管理员。");
      return;
    }

    // 2. Quota Logic
    let remaining: number | string = 0;
    let shouldDeduct = false;

    if (currentUser.role === UserRole.EXECUTIVE || currentUser.role === UserRole.ADMIN) {
        remaining = "∞"; // Infinite for Executives
        shouldDeduct = false;
    } else if (currentUser.role === UserRole.MANAGER) {
        remaining = currentUser.quota?.consultations || 0;
        shouldDeduct = true;

        if (typeof remaining === 'number' && remaining <= 0) {
            alert("您的专家咨询权益次数已用尽。\n请联系管理员充值或增加委托金额。");
            return;
        }
    }

    // Start Animation Flow
    setShowCallOverlay(true);
    setCallCountdown(remaining);

    // Animation sequence
    setTimeout(() => {
        // Update State if deduction is needed
        if (shouldDeduct && typeof remaining === 'number') {
            const newCount = remaining - 1;
            setCallCountdown(newCount);
            setCurrentUser({ ...currentUser, quota: { ...currentUser.quota, consultations: newCount } as any });
        }

        // Step 2: Redirect after short delay
        setTimeout(() => {
            const phoneNumber = '400-888-9999';
            window.location.href = `tel:${phoneNumber}`;

            // Close overlay after redirect
            setTimeout(() => setShowCallOverlay(false), 1000);
        }, 800);
    }, 1200);
  };

  const handleHealthCheck = () => {
      if (!currentUser) return;
      if (currentUser.role !== UserRole.EXECUTIVE && currentUser.role !== UserRole.ADMIN) {
          alert("权限管控：企业法务体检涉及公司核心经营数据，仅限【高管/老板】账号访问。");
          return;
      }
      setCurrentView(ViewState.LEGAL_HEALTH_CHECK);
  };

  const downloadTemplate = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open('https://www.kdocs.cn/l/crHK1dJSNw2a', '_blank');
  };

  // 权益进度计算
  const getProgress = () => {
      if (!nextLevel) return 100;
      const prevThreshold = currentLevel ? currentLevel.min_amount : 0;
      const totalDiff = nextLevel.min_amount - prevThreshold;
      const currentDiff = (stats?.total_entrusted_amount || 0) - prevThreshold;
      return Math.min(100, Math.max(0, (currentDiff / totalDiff) * 100));
  };

  // 判断是否为管理层 (能看数据)
  const isManagement = currentUser && [UserRole.ADMIN, UserRole.EXECUTIVE, UserRole.MANAGER].includes(currentUser.role);

  return (
    <div className="flex flex-col px-6 gap-6 pb-6 pt-2 animate-fade-in relative overflow-hidden">

      {/* 1. 看板区域 (区分管理层/员工层) */}
      {isManagement ? (
        // === 管理层数据看板 (Management Dashboard) ===
        <div className="relative mt-2 z-10">
            <div className="absolute inset-0 bg-gradient-to-br from-[#1A1C23] to-[#0F1115] rounded-[2.5rem] shadow-2xl"></div>
            {/* Decor */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500 rounded-full blur-[80px] opacity-10"></div>

            <div className="relative z-10 p-8 text-white">
            {/* Top Row Stats */}
            <div className="flex justify-between items-start mb-8">
                <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">累计追回金额 (元)</p>
                    <h2 className="text-4xl font-black tracking-tight text-[#FF7F00]">
                    {loading ? '...' : (stats?.total_recovered_amount || 0).toLocaleString()}
                    </h2>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">累计委托金额 (元)</p>
                    <h2 className="text-2xl font-black tracking-tight text-white">
                    {loading ? '...' : (stats?.total_entrusted_amount || 0).toLocaleString()}
                    </h2>
                </div>
            </div>

            <div className="flex gap-4 h-32">
                {/* VIP Card (Left) */}
                <div
                    onClick={() => setCurrentView(ViewState.RIGHTS_CENTER)}
                    className="flex-[1.3] bg-[#2A2D35] rounded-2xl p-4 border border-white/5 relative overflow-hidden group cursor-pointer active:scale-95 transition-all flex flex-col justify-between"
                >
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                            <Crown size={16} className={currentLevel ? "text-[#FFD700]" : "text-slate-500"} fill={currentLevel ? "#FFD700" : "none"} />
                            <span className={`font-black text-sm italic ${currentLevel ? 'text-[#FFD700]' : 'text-slate-500'}`}>
                                {currentLevel ? currentLevel.level_name : '注册会员'}
                            </span>
                        </div>
                        <ChevronRight size={14} className="text-slate-500" />
                    </div>
                    <div className="w-full h-1.5 bg-slate-700 rounded-full mt-2 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-[#FFD700] to-orange-400 transition-all duration-1000" style={{width: `${getProgress()}%`}}></div>
                    </div>
                </div>

                <p className="text-[8px] text-slate-400 font-medium">
                    {nextLevel ? (
                        <>还差 <span className="text-white font-bold">{(nextLevel.min_amount - (stats?.total_entrusted_amount || 0)).toLocaleString()}</span> 升级到 {nextLevel.level_name}</>
                    ) : (
                        <span className="text-[#FFD700]">已解锁至尊权益</span>
                    )}
                </p>
                </div>

                {/* Tools Card (Right) */}
                <div className="flex-1 bg-[#2A2D35] rounded-2xl p-2 border border-white/5 flex flex-col justify-center gap-2 relative">
                <button
                    onClick={downloadTemplate}
                    className="flex-1 w-full bg-white text-slate-900 rounded-xl text-[10px] font-bold flex items-center justify-center gap-2 active:scale-95 hover:bg-slate-200 transition-colors shadow-sm"
                >
                    <Download size={14} /> 下载数据模板
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); setCurrentView(ViewState.AI_CHAT); }}
                    className="flex-1 w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl text-[10px] font-bold flex items-center justify-center gap-2 active:scale-95 hover:opacity-90 transition-colors shadow-sm"
                >
                    <Bot size={14} /> 物业智能法务
                </button>
                </div>
            </div>
            </div>
        </div>
      ) : (
        // === 员工层工作台 (Employee Workspace) ===
        <div className="relative mt-2 z-10">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-800 rounded-[2.5rem] shadow-2xl"></div>
            <div className="absolute top-0 left-0 w-full h-full opacity-20" style={{backgroundImage: 'radial-gradient(circle at 10% 10%, rgba(255,255,255,0.2) 0%, transparent 20%)'}}></div>

            <div className="relative z-10 p-8 text-white">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles size={18} className="text-yellow-300" />
                            <span className="text-xs font-bold text-blue-200 uppercase tracking-widest">东元法物 · 数字化工作台</span>
                        </div>
                        <h2 className="text-3xl font-black tracking-tight leading-tight">
                            你好，{currentUser?.username || '伙伴'}
                        </h2>
                        <p className="text-xs text-blue-100 mt-1 opacity-80">规范作业流程 · 降低法律风险</p>
                    </div>
                    {/* 工具箱快捷入口 */}
                    <button
                        onClick={() => setCurrentView(ViewState.TOOLBOX)}
                        className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20 active:scale-95 transition-transform hover:bg-white/20 cursor-pointer shadow-lg"
                    >
                        <Briefcase size={24} className="text-blue-200" />
                    </button>
                </div>

                <div className="flex gap-4 h-24">
                    {/* Role Info */}
                    <div className="flex-[1.2] bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex flex-col justify-center">
                        <span className="text-[10px] text-blue-200 uppercase font-bold">当前角色</span>
                        <div className="text-lg font-black mt-1 flex items-center gap-2">
                            <Shield size={18} className="text-white"/>
                            {currentUser?.role === UserRole.EMPLOYEE ? '一线员工' : '注册用户'}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex-1 flex flex-col gap-2">
                        <button
                            onClick={downloadTemplate}
                            className="flex-1 w-full bg-white text-blue-900 rounded-xl text-[10px] font-black flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all"
                        >
                            <Download size={14} /> 下载工作模板
                        </button>
                        <button
                            onClick={() => setCurrentView(ViewState.TOOLBOX)}
                            className="flex-1 w-full bg-blue-500/50 backdrop-blur border border-white/20 text-white rounded-xl text-[10px] font-black flex items-center justify-center gap-2 active:scale-95 transition-all"
                        >
                            <Briefcase size={14} /> 打开工具箱
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* 2. 呼叫律师 (Direct Dial Mode) */}
      <div
        onClick={handleLawyerCall}
        className={`relative w-full h-24 rounded-[2rem] p-5 text-white shadow-xl flex items-center justify-between group cursor-pointer active:scale-98 transition-all overflow-hidden border z-10 ${
          currentUser?.role === UserRole.EMPLOYEE || currentUser?.role === UserRole.USER
            ? 'bg-slate-800 border-slate-700 opacity-90'
            : 'bg-slate-900 border-slate-700'
        }`}
      >
        <div className="absolute right-[-10px] top-[-10px] w-24 h-24 bg-green-500 opacity-10 rounded-full blur-2xl animate-pulse"></div>
        <div className="flex items-center gap-4 relative z-10">
           <div className={`p-3 rounded-full shadow-lg ${
             currentUser?.role === UserRole.EMPLOYEE || currentUser?.role === UserRole.USER
               ? 'bg-slate-600'
               : 'bg-green-500 animate-pulse shadow-green-500/30'
           }`}>
              {currentUser?.role === UserRole.EMPLOYEE || currentUser?.role === UserRole.USER ? <Lock size={20} /> : <PhoneCall size={20} />}
           </div>
           <div>
              <h4 className="font-black text-lg tracking-tight flex items-center gap-2">
                呼叫人工律师
                {(currentUser?.role === UserRole.EMPLOYEE || currentUser?.role === UserRole.USER) && <span className="text-[9px] bg-slate-700 px-2 py-0.5 rounded text-slate-300">限主管/高管</span>}
              </h4>
              <p className="text-[10px] text-slate-400 font-medium">遇到复杂纠纷？一键连线法律顾问</p>
           </div>
        </div>
        <ChevronRight size={20} className="text-slate-500 group-hover:text-white transition-colors" />
      </div>

      {/* 3. 核心业务流 - Updated to include Health Check */}
      <div className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <span className="w-1 h-4 bg-orange-500 rounded-full"></span>
            <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest">核心业务流</h3>
          </div>

          {/* Main Hero Card for Health Check - NEW PROMINENT ENTRY */}
          <div
            onClick={handleHealthCheck}
            className="w-full bg-gradient-to-r from-rose-500 to-pink-600 rounded-[2rem] p-5 shadow-lg shadow-rose-500/20 text-white flex items-center justify-between cursor-pointer active:scale-98 transition-all relative overflow-hidden group"
          >
             <div className="absolute right-[-10px] bottom-[-20px] opacity-20 group-hover:scale-110 transition-transform">
                <Activity size={80} />
             </div>
             <div className="flex items-center gap-4 relative z-10">
                <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm shadow-inner">
                   <Activity size={24} className="text-white" />
                </div>
                <div>
                   <h4 className="font-black text-lg flex items-center gap-2">
                       企业法务体检
                       {currentUser?.role !== UserRole.EXECUTIVE && currentUser?.role !== UserRole.ADMIN && <Lock size={14} className="opacity-80"/>}
                   </h4>
                   <p className="text-[10px] text-rose-100 font-medium opacity-90 mt-0.5">
                       {currentUser?.role !== UserRole.EXECUTIVE && currentUser?.role !== UserRole.ADMIN ? '仅限高管访问' : 'AI生成深度合规风险诊断报告'}
                   </p>
                </div>
             </div>
             <ChevronRight size={20} className="text-rose-200" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FeatureCard
              title="欠费催收助手"
              icon={<Gavel size={26} />}
              onClick={() => setCurrentView(ViewState.COLLECTION_CRM)}
              bgClass="bg-orange-50"
              colorClass="text-orange-600"
            />
            <FeatureCard
              title="纠纷快诊"
              icon={<Stethoscope size={26} />}
              onClick={() => setCurrentView(ViewState.DIAGNOSIS)}
              colorClass="text-purple-500"
              bgClass="bg-purple-50"
            />
          </div>
        </div>

        <div className="space-y-3">
           <div className="flex items-center gap-2 px-1">
            <span className="w-1 h-4 bg-purple-500 rounded-full"></span>
            <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest">常用功能</h3>
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
              title="催费计算器"
              icon={<Calculator size={26} />}
              onClick={() => setCurrentView(ViewState.CALCULATOR)}
              colorClass="text-green-500"
              bgClass="bg-green-50"
            />
          </div>
        </div>
      </div>

      {/* 4. 每日金句 */}
      <div className="relative mt-2 mb-10 group" onClick={() => setCurrentView(ViewState.AI_CHAT)}>
        <div className="absolute inset-0 bg-slate-200 rounded-[2.5rem] rotate-1 group-hover:rotate-2 transition-transform"></div>
        <div className="relative bg-white rounded-[2.5rem] p-8 shadow-lg border border-slate-100 cursor-pointer">
           <Quote size={40} className="absolute top-6 right-6 text-slate-100 fill-slate-50" />
           <div className="mb-4">
              <span className="inline-block px-3 py-1 bg-slate-900 text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-full">Daily Insight</span>
           </div>
           <h3 className="text-lg font-black text-slate-800 mb-3 tracking-tight">{dailyTip.title}</h3>
           <p className="text-xs text-slate-500 leading-relaxed font-medium italic">
             "{dailyTip.content}"
           </p>
           <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-orange-500">
             查看详情 <ChevronRight size={12} />
           </div>
        </div>
      </div>

      {/* Calling Overlay Animation */}
      {showCallOverlay && (
          <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-xl flex flex-col items-center justify-center animate-fade-in">
              {/* Pulse Ring */}
              <div className="absolute w-[600px] h-[600px] bg-green-500 rounded-full opacity-10 animate-ping"></div>

              <div className="relative z-10 flex flex-col items-center">
                  {/* Phone Icon */}
                  <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(34,197,94,0.5)] animate-bounce">
                      <PhoneCall size={40} className="text-white fill-white" />
                  </div>

                  <h2 className="text-2xl font-black text-white mt-8 tracking-widest">
                      正在呼叫东元法律顾问
                  </h2>
                  <p className="text-slate-400 text-xs mt-2 font-mono uppercase tracking-[0.2em]">Connecting to Secure Line...</p>

                  {/* Quota Counter Animation */}
                  <div className="mt-12 bg-slate-800 border border-slate-700 rounded-3xl p-6 flex flex-col items-center min-w-[200px]">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">剩余咨询次数</span>
                      <div className="text-5xl font-black text-white font-mono flex items-center gap-2 transition-all">
                          {/* Animated Number Logic */}
                          <span className="animate-[pulse_0.5s_ease-in-out] text-[#FFD700]">
                              {callCountdown}
                          </span>
                      </div>
                      {typeof callCountdown === 'string' && (
                          <div className="mt-2 flex items-center gap-1 text-[10px] text-green-400 font-bold bg-green-900/50 px-2 py-0.5 rounded">
                              <CheckCircle size={10}/> 高管专属通道
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default Home;
