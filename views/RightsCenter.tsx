
import React, { useState, useEffect } from 'react';
import { Crown, Lock, CheckCircle2, ChevronRight, Gem, ShieldCheck, Star, Circle, CheckCircle, Briefcase, PlusCircle, MessageCircle } from 'lucide-react';
import { db } from '../services/dbService';
import { VipLevelConfig, EnterpriseStats, User, SpecialProject, ViewState } from '../types';
import ConsultationModal from '../components/ConsultationModal';

interface RightsCenterProps {
  setCurrentView?: (view: ViewState) => void;
}

const RightsCenter: React.FC<RightsCenterProps> = ({ setCurrentView }) => {
  const [stats, setStats] = useState<EnterpriseStats>({ totalRecoveredAmount: 0, totalEntrustedAmount: 0, entrustedCount: 0 });
  const [levels, setLevels] = useState<VipLevelConfig[]>([]);
  const [activeTab, setActiveTab] = useState<string>('');
  const [user, setUser] = useState<User | null>(null);
  const [allProjects, setAllProjects] = useState<SpecialProject[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showConsultModal, setShowConsultModal] = useState(false);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
      let currentStats = { totalRecoveredAmount: 0, totalEntrustedAmount: 0, entrustedCount: 0 };
      
      const userId = db.getSession();
      if(userId) {
          const u = db.getUserById(userId);
          if(u) {
              setUser(u);
              setSelectedProjects(u.selectedProjects || []);
              if (u.enterpriseName) {
                  currentStats = db.getEnterpriseStats(u.enterpriseName);
              }
          }
      }
      
      setStats(currentStats);
      const lvls = db.getVipLevels();
      setLevels(lvls);
      setAllProjects(db.getSpecialProjects());

      // Default to highest unlocked
      let highestUnlocked = lvls[0]?.id;
      for (const lvl of lvls) {
          if (currentStats.totalEntrustedAmount >= lvl.thresholdAmount) {
              highestUnlocked = lvl.id;
          }
      }
      setActiveTab(highestUnlocked);
  };

  const getLevelStatus = (threshold: number) => {
    return stats.totalEntrustedAmount >= threshold ? 'UNLOCKED' : 'LOCKED';
  };

  // Determine current level ID based on stats (not selection)
  const getCurrentLevelId = () => {
      let currentId = levels[0]?.id;
      for (const lvl of levels) {
          if (stats.totalEntrustedAmount >= lvl.thresholdAmount) {
              currentId = lvl.id;
          }
      }
      return currentId;
  };

  const currentLevelId = getCurrentLevelId();
  const activeLevel = levels.find(l => l.id === activeTab);
  const status = activeLevel ? getLevelStatus(activeLevel.thresholdAmount) : 'LOCKED';

  // Project Selection Logic
  const handleToggleProject = (id: string) => {
      if (!activeLevel || status !== 'UNLOCKED' || activeLevel.selectableProjectsCount <= 0) return;
      
      if (selectedProjects.includes(id)) {
          setSelectedProjects(prev => prev.filter(p => p !== id));
      } else {
          if (selectedProjects.length < activeLevel.selectableProjectsCount) {
              setSelectedProjects(prev => [...prev, id]);
          } else {
              alert(`您当前等级仅限选择 ${activeLevel.selectableProjectsCount} 项专项服务`);
          }
      }
  };

  const handleSaveSelection = () => {
      if (!user) return;
      setIsSaving(true);
      db.updateUser(user.id, { selectedProjects });
      setTimeout(() => {
          setIsSaving(false);
          alert('专项服务选择已保存！您的客户经理将尽快联系您启动服务。');
      }, 800);
  };

  const handleRequestMoreServices = () => {
      if (!user) return;
      const reason = prompt("请简要说明您需要增加专项服务的需求（如：增加业委会换届指导）：");
      if (reason && reason.trim()) {
          db.addServiceRequest({
              id: Date.now().toString(),
              userId: user.id,
              username: user.username,
              enterpriseName: user.enterpriseName || '未知企业',
              requestType: 'ADD_PROJECT',
              content: reason.trim(),
              status: 'PENDING',
              timestamp: Date.now()
          });
          alert("申请已提交！管理员将尽快审核并与您联系。");
      }
  };

  const handleApplyService = (e: React.MouseEvent, proj: SpecialProject) => {
      e.stopPropagation(); 
      if (!user) return;

      // 1. Generate Request
      db.addServiceRequest({
          id: Date.now().toString(),
          userId: user.id,
          username: user.username,
          enterpriseName: user.enterpriseName || '未知企业',
          requestType: 'ADD_PROJECT',
          content: `申请开通专项服务：${proj.title}`,
          status: 'PENDING',
          timestamp: Date.now()
      });

      // 2. Open Consultation Modal
      setShowConsultModal(true);
  };

  return (
    <div className="flex flex-col h-full bg-[#0F1115] animate-fade-in relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] bg-[#FFD700] rounded-full blur-[150px] opacity-10"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[300px] h-[300px] bg-[#FF7F00] rounded-full blur-[120px] opacity-10"></div>

        {/* Header Area */}
        <div className="px-6 pt-6 pb-2 relative z-10">
            <div className="flex items-center gap-2 mb-1">
                <Crown className="text-[#FFD700]" fill="#FFD700" size={24} />
                <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#FFD700] via-[#FDB931] to-[#D4AF37]">
                    权益中心
                </h1>
            </div>
            <p className="text-xs text-slate-400 font-medium">以案源抵服务 · 累计委托解锁黑金权益</p>
        </div>

        {/* Level Tabs */}
        <div className="px-6 py-4 flex gap-3 overflow-x-auto no-scrollbar relative z-10">
            {levels.map(lvl => {
                const isUnlocked = stats.totalEntrustedAmount >= lvl.thresholdAmount;
                const isActive = activeTab === lvl.id;
                const isCurrent = lvl.id === currentLevelId;

                return (
                    <button
                        key={lvl.id}
                        onClick={() => setActiveTab(lvl.id)}
                        className={`flex-1 min-w-[100px] py-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all relative overflow-visible ${
                            isActive 
                                ? 'bg-gradient-to-b from-[#FFD700]/20 to-[#FFD700]/5 border-[#FFD700]/50 shadow-[0_0_15px_rgba(255,215,0,0.15)]' 
                                : 'bg-white/5 border-white/10 text-slate-500'
                        }`}
                    >
                        <span className={`text-sm font-black italic ${isActive ? 'text-[#FFD700]' : 'text-slate-400'}`}>{lvl.name}</span>
                        <span className="text-[9px] uppercase opacity-70 tracking-widest">{lvl.label}</span>
                        
                        {!isUnlocked && (
                            <div className="absolute top-1 right-1 text-slate-600"><Lock size={10} /></div>
                        )}
                        
                        {isCurrent && (
                            <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap z-20">
                                CURRENT
                            </div>
                        )}
                    </button>
                )
            })}
        </div>

        {/* Main Content Card */}
        <div className="flex-1 px-4 pb-24 overflow-y-auto no-scrollbar relative z-10">
            {activeLevel && (
                <div className={`rounded-[2rem] p-1 border transition-all duration-500 ${
                    status === 'UNLOCKED' ? 'bg-gradient-to-b from-[#FFD700]/30 to-transparent' : 'bg-gradient-to-b from-slate-700/30 to-transparent'
                }`}>
                    <div className="bg-[#181A20] rounded-[1.8rem] p-6 min-h-[400px]">
                        {/* Status Header */}
                        <div className="flex justify-between items-start mb-6 pb-6 border-b border-white/5">
                            <div>
                                <h2 className={`text-xl font-black tracking-wide ${status === 'UNLOCKED' ? 'text-white' : 'text-slate-500'}`}>
                                    {activeLevel.desc}
                                </h2>
                                {status === 'LOCKED' && (
                                    <p className="text-xs text-orange-500 mt-2 font-bold flex items-center gap-1 animate-pulse">
                                        <Lock size={12} />
                                        累计委托数据达到 {(activeLevel.thresholdAmount/10000).toFixed(0)} 万元解锁
                                    </p>
                                )}
                                {status === 'UNLOCKED' && (
                                    <p className="text-xs text-[#FFD700] mt-2 font-bold flex items-center gap-1">
                                        <CheckCircle2 size={12} />
                                        当前等级权益已生效
                                    </p>
                                )}
                            </div>
                            <div className={`p-3 rounded-full ${status === 'UNLOCKED' ? 'bg-[#FFD700]/10 text-[#FFD700]' : 'bg-slate-800 text-slate-600'}`}>
                                <Gem size={28} />
                            </div>
                        </div>

                        {/* Standard Rights List */}
                        <div className="space-y-6">
                            <h3 className="font-black text-sm text-white flex items-center gap-2">
                                <Briefcase size={16} className="text-[#FFD700]" /> 
                                常规法律顾问服务
                            </h3>
                            <div className="space-y-4">
                                {activeLevel.rights.map((right, idx) => (
                                    <div key={idx} className={`relative pl-4 border-l ${status === 'UNLOCKED' ? 'border-[#FFD700]/50' : 'border-slate-700'}`}>
                                        <h4 className={`text-sm font-bold mb-1 ${status === 'UNLOCKED' ? 'text-slate-200' : 'text-slate-500'}`}>
                                            {idx + 1}. {right.title}
                                        </h4>
                                        <p className="text-xs text-slate-500 leading-relaxed font-medium">
                                            {right.desc}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        {/* Special Projects Selection (If Applicable) */}
                        {activeLevel.selectableProjectsCount >= 0 && (
                             <div className="mt-8 pt-6 border-t border-white/5">
                                 <div className="flex justify-between items-end mb-4">
                                    <h3 className={`font-black text-sm flex items-center gap-2 ${status === 'UNLOCKED' ? 'text-white' : 'text-slate-500'}`}>
                                        <Star size={16} className={status === 'UNLOCKED' ? 'text-[#FFD700]' : 'text-slate-600'} />
                                        专项法律服务定制
                                    </h3>
                                    <span className="text-[10px] text-slate-400">
                                        可任选 <span className="text-[#FFD700] font-bold">{selectedProjects.length}/{activeLevel.selectableProjectsCount}</span> 项
                                    </span>
                                 </div>
                                 
                                 <div className="grid grid-cols-1 gap-3">
                                     {allProjects.map(proj => {
                                         const isSelected = selectedProjects.includes(proj.id);
                                         const disabled = status === 'LOCKED';
                                         return (
                                             <div
                                                key={proj.id}
                                                className={`p-4 rounded-xl border flex flex-col gap-3 transition-all ${
                                                    isSelected 
                                                        ? 'bg-[#FFD700]/10 border-[#FFD700] shadow-[0_0_10px_rgba(255,215,0,0.1)]' 
                                                        : 'bg-white/5 border-white/5 hover:bg-white/10'
                                                } ${disabled ? 'opacity-50' : ''}`}
                                             >
                                                <div className="flex items-center justify-between cursor-pointer" onClick={() => !disabled && handleToggleProject(proj.id)}>
                                                    <div className="text-left">
                                                        <div className={`text-xs font-bold ${isSelected ? 'text-[#FFD700]' : 'text-slate-300'}`}>{proj.title}</div>
                                                        <div className="text-[10px] text-slate-500 mt-0.5">{proj.desc}</div>
                                                    </div>
                                                    <div className={isSelected ? 'text-[#FFD700]' : 'text-slate-600'}>
                                                        {isSelected ? <CheckCircle size={18} fill="#FFD700" className="text-black" /> : <Circle size={18} />}
                                                    </div>
                                                </div>
                                                
                                                {/* Apply Button - Always visible for quick access */}
                                                {!disabled && (
                                                    <button 
                                                        onClick={(e) => handleApplyService(e, proj)}
                                                        className="w-full py-2.5 rounded-lg bg-white/10 hover:bg-[#FFD700] hover:text-black text-slate-300 text-[10px] font-bold flex items-center justify-center gap-1.5 transition-colors border border-white/5"
                                                    >
                                                        <MessageCircle size={12} /> 申请此服务
                                                    </button>
                                                )}
                                             </div>
                                         )
                                     })}
                                 </div>
                                 
                                 {status === 'UNLOCKED' && (
                                     <div className="space-y-3 mt-4">
                                         <button 
                                            onClick={handleSaveSelection}
                                            disabled={isSaving}
                                            className="w-full py-3 bg-[#FFD700] text-black font-black text-xs rounded-xl hover:bg-[#FDB931] transition-colors"
                                         >
                                             {isSaving ? '保存中...' : '确认选择专项服务'}
                                         </button>
                                         
                                         {/* 申请增加服务按钮 */}
                                         <button 
                                            onClick={handleRequestMoreServices}
                                            className="w-full py-3 bg-white/5 text-slate-400 font-bold text-xs rounded-xl border border-dashed border-slate-700 hover:text-white hover:border-slate-500 transition-colors flex items-center justify-center gap-2"
                                         >
                                             <PlusCircle size={14} /> 申请增加额外服务
                                         </button>
                                     </div>
                                 )}
                             </div>
                        )}

                    </div>
                </div>
            )}
        </div>

        <ConsultationModal isOpen={showConsultModal} onClose={() => setShowConsultModal(false)} />
    </div>
  );
};

export default RightsCenter;
