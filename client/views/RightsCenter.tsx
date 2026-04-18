import React, { useState, useEffect } from 'react';
import { Crown, Lock, CheckCircle2, Gem, Star, Circle, CheckCircle, Briefcase, PlusCircle } from 'lucide-react';
import { api } from '../services/apiService';
import { ViewState, User } from '../types';
import ConsultationModal from '../components/ConsultationModal';

// 各等级权益配置
interface LevelBenefits {
  title: string;
  desc: string;
  services: Array<{ title: string; desc: string }>;
}

// VIP 会员 / 合规基石版
const VIP_BENEFITS: LevelBenefits = {
  title: 'VIP 会员',
  desc: '解决"裸奔"问题，提供标准化的法律底座。',
  services: [
    { title: '人工法律咨询 (10次/月)', desc: '线上律师快速响应，解答日常物业管理纠纷。' },
    { title: 'SaaS催收赋能工具 (永久免费)', desc: '解锁欠费计算器、催收进度看板、自动生成催款单功能。' },
    { title: '劳动用工风险基础包', desc: '含标准版《劳动合同》、《员工手册》及入职风险提示函。' },
    { title: '物业服务合同通用库', desc: '含《前期物业服务合同》、《临时管理规约》等标准模板。' },
    { title: '外包供应商合同严选库', desc: '含保安、保洁、绿化外包合同模板，明确违约责任与赔偿条款。' }
  ]
};

// 尊享 VIP / 稳盘运营版
const STANDARD_BENEFITS: LevelBenefits = {
  title: '尊享 VIP',
  desc: '解决"运营痛点"，重点在于防范业委会风险。',
  services: [
    { title: '人工法律咨询 (50次/月)', desc: '大幅增加咨询频次，满足项目经理高频请示需求。' },
    { title: '合同"轻定制"服务 (1次/季度)', desc: '律师远程审改一份现有合同（如补充协议、分包合同），堵塞漏洞。' },
    { title: '律师函发送额度 (5封/月)', desc: '针对恶意欠费或侵权行为，由东元律所出具正式律师函。' },
    { title: '日常运营法律风险指引', desc: '提供公区管理、装修巡查等日常场景的合规操作指引。' },
    { title: '案件委托优先受理权', desc: '发生诉讼案件时，享受优先立案与律师选派权益。' }
  ]
};

// 至尊 VIP / 战略护航版
const PREMIUM_BENEFITS: LevelBenefits = {
  title: '至尊 VIP',
  desc: '深度介入"风控与决策"，解决重大危机。',
  services: [
    { title: '无限次人工法律咨询', desc: '律师团队 7×24小时响应，支持电话/视频远程会议。' },
    { title: '重大危机公关法律支持', desc: '针对网络舆情、重大安全事故，律师亲自代写《澄清声明》并指导应对。' },
    { title: '企业年度法律风险体检', desc: '律所远程审计企业全年合同、制度，出具《年度法律风险体检报告》。' },
    { title: '高层决策法律参谋', desc: '针对企业并购、股权变更等重大事项提供法律意见。' },
    { title: '线下培训 (1次/年)', desc: '资深律师赴企业进行物业法律知识专题培训 (差旅费另计)。' }
  ]
};

// 根据等级代码获取权益配置
const getLevelBenefits = (levelName: string, levelCode: string): LevelBenefits => {
  const name = levelName.toLowerCase();
  const code = (levelCode || '').toLowerCase();

  // 优先匹配名称
  if (name.includes('vip') && !name.includes('尊享') && !name.includes('至尊')) {
    return VIP_BENEFITS;
  }
  if (name.includes('尊享')) {
    return STANDARD_BENEFITS;
  }
  if (name.includes('至尊')) {
    return PREMIUM_BENEFITS;
  }

  // 备用：匹配代码
  if (code === 'vip' || code === 'basic' || code === 'standard') {
    return VIP_BENEFITS;
  }
  if (code === 'premium' || code === 'advanced') {
    return PREMIUM_BENEFITS;
  }

  return VIP_BENEFITS; // 默认
};

interface RightsCenterProps {
  setCurrentView?: (view: ViewState) => void;
}

interface VipLevel {
  id: string;
  level_name: string;
  level_code: string;
  min_amount: number;
  max_amount: number | null;
  selectable_projects_count: number;
  sort_order: number;
}

interface SpecialProject {
  id: string;
  title: string;
  description?: string;
}

const GOLD = '#FFD700';
const GOLD_TRANSPARENT_10 = 'rgba(255,215,0,0.1)';
const SLATE_700 = 'rgba(51,65,85,0.5)';
const SLATE_600 = '#64748b';

const RightsCenter: React.FC<RightsCenterProps> = ({ setCurrentView }) => {
  const [stats, setStats] = useState<any>(null);
  const [levels, setLevels] = useState<VipLevel[]>([]);
  const [activeTab, setActiveTab] = useState<string>('');
  const [user, setUser] = useState<User | null>(null);
  const [allProjects, setAllProjects] = useState<SpecialProject[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showConsultModal, setShowConsultModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submittedLevels, setSubmittedLevels] = useState<Set<string>>(new Set());

  const getToken = () => sessionStorage.getItem('token') || localStorage.getItem('token') || '';

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
        role: userData.role as any,
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

  useEffect(() => { refreshData(); }, []);

  const refreshData = async () => {
    try {
      setLoading(true);
      const currentUser = await getSessionUser();
      setUser(currentUser);

      const levelsData = await api.getVipLevels();
      const transformedLevels = (Array.isArray(levelsData) ? levelsData : []).map((apiLevel: any) => ({
        id: apiLevel.id,
        level_name: apiLevel.level_name || apiLevel.name || '',
        level_code: apiLevel.level_code || apiLevel.label || '',
        min_amount: apiLevel.min_amount || apiLevel.thresholdAmount || 0,
        max_amount: apiLevel.max_amount ?? null,
        selectable_projects_count: apiLevel.selectable_projects_count ?? apiLevel.selectableProjectsCount ?? 1,
        sort_order: apiLevel.sort_order || 0
      }));
      setLevels(transformedLevels);

      const projectsData = await api.getSpecialProjects();
      setAllProjects(Array.isArray(projectsData) ? projectsData : []);

      // 读取已提交的挡位ID列表
      const stored = sessionStorage.getItem('submittedLevels');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setSubmittedLevels(new Set(parsed));
        } catch (e) {
          console.error('解析已提交挡位失败:', e);
        }
      }

      if (currentUser) {
        try {
          const statsData = await api.getEnterpriseStats(getToken());
          setStats(statsData);
          if (currentUser.selected_projects) {
            setSelectedProjects(currentUser.selected_projects);
          }
        } catch (err) {
          console.error('加载统计数据失败:', err);
          setStats({ total_recovered_amount: 0, total_entrusted_amount: 0, entrusted_count: 0 });
        }
      }
    } catch (err) {
      console.error('加载权益中心数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const getLevelStatus = (threshold: number) => {
    if (!stats) return 'LOCKED';
    return (stats.total_entrusted_amount || 0) >= threshold ? 'UNLOCKED' : 'LOCKED';
  };

  const getCurrentLevelId = () => {
    let currentId = levels[0]?.id;
    for (const lvl of levels) {
      if ((stats?.total_entrusted_amount || 0) >= lvl.min_amount) {
        currentId = lvl.id;
      }
    }
    return currentId;
  };

  const currentLevelId = getCurrentLevelId();

  useEffect(() => {
    if (levels.length > 0 && !activeTab) {
      setActiveTab(currentLevelId);
    }
  }, [levels, stats, currentLevelId]);

  const activeLevel = levels.find(l => l.id === activeTab);
  const status = activeLevel ? getLevelStatus(activeLevel.min_amount) : 'LOCKED';

  const handleToggleProject = async (id: string) => {
    // 只有当前等级的专项服务才能操作
    if (!activeLevel || activeLevel.id !== currentLevelId) return;
    if (status !== 'UNLOCKED') return;
    // 挡位已提交过专项服务，不能再选择
    if (submittedLevels.has(activeLevel.id)) return;
    if (selectedProjects.includes(id)) {
      setSelectedProjects(prev => prev.filter(p => p !== id));
    } else {
      setSelectedProjects(prev => [...prev, id]);
    }
  };

  const handleSaveSelection = async () => {
    if (!user) return;
    if (!activeLevel) return;
    if (selectedProjects.length === 0) {
      alert('请至少选择一个专项服务');
      return;
    }
    setIsSaving(true);
    try {
      await api.selectProjects(selectedProjects, getToken());
      // 记录当前挡位已提交
      const newSubmitted = new Set([...submittedLevels, activeLevel.id]);
      setSubmittedLevels(newSubmitted);
      sessionStorage.setItem('submittedLevels', JSON.stringify([...newSubmitted]));
      alert('申请已提交！请等待管理员审批，审批通过后服务将正式开通。');
      setSelectedProjects([]);
    } catch (err) {
      alert('提交失败: ' + (err as any).message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRequestMoreServices = async () => {
    if (!user) return;
    const reason = prompt('请简要说明您需要增加专项服务的需求（如：增加业委会换届指导）：');
    if (reason && reason.trim()) {
      try {
        await api.createServiceRequest({
          request_type: 'ADD_PROJECT',
          title: '申请增加专项服务',
          description: reason.trim()
        }, getToken());
        alert('申请已提交！管理员将尽快审核并与您联系。');
      } catch (err) {
        alert('申请失败: ' + (err as any).message);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-[#0F1115] items-center justify-center">
        <div className="animate-spin text-[#FFD700]"><Gem size={36} /></div>
        <p className="text-slate-300 text-sm mt-3">加载权益中心...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#0F1115] animate-fade-in relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] bg-[#FFD700] rounded-full blur-[150px] opacity-10"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[300px] h-[300px] bg-[#FF7F00] rounded-full blur-[120px] opacity-10"></div>

      <div className="px-6 pt-6 pb-2 relative z-10">
        <div className="flex items-center gap-3 mb-1.5">
          <Crown className="text-[#FFD700]" fill="#FFD700" size={28} />
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#FFD700] via-[#FDB931] to-[#D4AF37]">权益中心</h1>
        </div>
        <p className="text-sm text-slate-300 font-medium tracking-wide">以案源抵服务 · 累计委托解锁黑金权益</p>
      </div>

      <div className="px-6 py-4 flex gap-3 overflow-x-auto no-scrollbar relative z-10">
        {levels.map(lvl => {
          const isUnlocked = getLevelStatus(lvl.min_amount) === 'UNLOCKED';
          const isActive = activeTab === lvl.id;
          const isCurrent = lvl.id === currentLevelId;
          const btnClass = isActive
            ? 'flex-1 min-w-[110px] py-3.5 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all relative overflow-visible bg-gradient-to-b from-amber-500/25 to-amber-600/5 border-amber-400/50 shadow-[0_0_20px_rgba(255,215,0,0.2)]'
            : 'flex-1 min-w-[110px] py-3.5 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all relative overflow-visible bg-white/[0.04] border-white/10 text-slate-500 hover:bg-white/[0.08]';
          const textClass = isActive ? 'text-base font-black italic text-amber-400' : 'text-base font-black italic text-slate-400';
          return (
            <button key={lvl.id} onClick={() => setActiveTab(lvl.id)} className={btnClass}>
              <span className={textClass}>{lvl.level_name}</span>
              <span className="text-[10px] uppercase opacity-60 tracking-widest font-semibold">{lvl.level_code}</span>
              {!isUnlocked && <div className="absolute top-1.5 right-1.5 text-slate-600"><Lock size={11} /></div>}
              {isCurrent && <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-red-500 to-rose-500 text-white text-[9px] font-black px-2 py-0.5 rounded-md shadow-lg whitespace-nowrap z-20">CURRENT</div>}
            </button>
          );
        })}
      </div>

      <div className="flex-1 px-4 pb-24 overflow-y-auto no-scrollbar relative z-10">
        {activeLevel && (
          <div className={status === 'UNLOCKED'
            ? 'rounded-[2rem] p-1 border border-amber-500/30 bg-gradient-to-b from-amber-500/25 to-transparent'
            : 'rounded-[2rem] p-1 border border-slate-700/20 bg-gradient-to-b from-slate-700/20 to-transparent'
          }>
            <div className="bg-[#181A20] rounded-[1.8rem] p-6 min-h-[400px]">
              <div className="flex justify-between items-start mb-6 pb-6 border-b border-white/[0.06]">
                <div>
                  {/* 等级标题 */}
                  <h2 className={status === 'UNLOCKED' ? 'text-2xl font-black tracking-wide text-white' : 'text-2xl font-black tracking-wide text-slate-500'}>
                    {activeLevel.level_name}
                  </h2>
                  {/* 等级描述 */}
                  {(() => {
                    const benefits = getLevelBenefits(activeLevel.level_name, activeLevel.level_code);
                    return (
                      <p className={`text-sm mt-2.5 leading-relaxed ${status === 'UNLOCKED' ? 'text-slate-200' : 'text-slate-500'}`}>
                        {benefits.desc}
                      </p>
                    );
                  })()}
                  {status === 'LOCKED' && (
                    <p className="text-sm text-orange-400 mt-2.5 font-bold flex items-center gap-1.5 animate-pulse">
                      <Lock size={14} />累计委托数据达到 {(activeLevel.min_amount/10000).toFixed(0)} 万元解锁
                    </p>
                  )}
                  {status === 'UNLOCKED' && (
                    <p className="text-sm mt-2.5 font-bold flex items-center gap-1.5" style={{ color: GOLD }}>
                      <CheckCircle2 size={14} />当前等级权益已生效
                    </p>
                  )}
                </div>
                <div style={status === 'UNLOCKED'
                  ? { backgroundColor: 'rgba(255,215,0,0.12)', color: GOLD, padding: '14px', borderRadius: '9999px' }
                  : { backgroundColor: SLATE_700, color: SLATE_600, padding: '14px', borderRadius: '9999px' }
                }>
                  <Gem size={32} />
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="font-black text-base text-white flex items-center gap-2">
                  <Briefcase size={18} style={{ color: GOLD }} />常规法律顾问服务
                </h3>
                <div className="space-y-5">
                  {(() => {
                    const benefits = getLevelBenefits(activeLevel.level_name, activeLevel.level_code);
                    return benefits.services.map((item, idx) => (
                      <div key={idx} className={status === 'UNLOCKED' ? 'relative pl-5 border-l-2 border-amber-500/50' : 'relative pl-5 border-l-2 border-slate-700'}>
                        <h4 className={status === 'UNLOCKED' ? 'text-base font-bold mb-1.5 text-slate-100' : 'text-base font-bold mb-1.5 text-slate-500'}>
                          {idx + 1}. {item.title}
                        </h4>
                        {item.desc && (
                          <p className={`text-sm mt-1 leading-relaxed ${status === 'UNLOCKED' ? 'text-slate-400' : 'text-slate-600'}`}>{item.desc}</p>
                        )}
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {activeLevel.min_amount >= 0 && (
                <div className="mt-8 pt-6 border-t border-white/5">
                  <div className="flex justify-between items-end mb-4">
                    <h3 className={status === 'UNLOCKED' ? 'font-black text-base text-white flex items-center gap-2' : 'font-black text-base text-slate-500 flex items-center gap-2'}>
                      <Star size={18} className={status === 'UNLOCKED' ? 'text-amber-400' : 'text-slate-600'} />专项法律服务定制
                    </h3>
                    {status === 'UNLOCKED' ? (
                      <span className="text-xs text-slate-400">
                        已选 <span className="font-bold" style={{ color: GOLD }}>{selectedProjects.length}</span> 项
                        ，还可选择 <span className="font-bold" style={{ color: activeLevel.selectable_projects_count > selectedProjects.length ? GOLD : '#FF6B6B' }}>
                          {Math.max(0, activeLevel.selectable_projects_count - selectedProjects.length)}
                        </span> 项
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500">
                        可选 <span className="font-bold text-slate-400">{activeLevel.selectable_projects_count}</span> 项
                      </span>
                    )}

                  <div className="grid grid-cols-1 gap-3.5">
                    {allProjects.map(proj => {
                      const isSelected = selectedProjects.includes(proj.id);
                      const isUnlocked = status === 'UNLOCKED';
                      const isCurrentLevel = activeLevel.id === currentLevelId;
                      const isSubmitted = submittedLevels.has(activeLevel.id);
                      const remainingQuota = Math.max(0, activeLevel.selectable_projects_count - selectedProjects.length);
                      // 只有当前等级且未提交过才能操作：已选中的可以取消，未选中的需要剩余配额
                      const canSelect = isUnlocked && isCurrentLevel && !isSubmitted && (isSelected || remainingQuota > 0);
                      const disabled = !isUnlocked || !isCurrentLevel || isSubmitted || (!isSelected && remainingQuota <= 0);

                      const cardClass = !isUnlocked
                        ? 'p-4 rounded-xl border bg-white/[0.03] border-white/5 opacity-50 flex flex-col gap-3 transition-all'
                        : isSubmitted
                        ? 'p-4 rounded-xl border bg-emerald-500/[0.06] border-emerald-500/20 opacity-60 flex flex-col gap-3 transition-all'
                        : isSelected
                        ? 'p-4 rounded-xl border bg-amber-500/10 border-amber-400 flex flex-col gap-3 transition-all cursor-pointer shadow-[0_0_12px_rgba(255,215,0,0.08)]'
                        : disabled
                        ? 'p-4 rounded-xl border bg-white/[0.03] border-white/5 opacity-50 flex flex-col gap-3 transition-all'
                        : 'p-4 rounded-xl border bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.08] flex flex-col gap-3 transition-all cursor-pointer';
                      const titleClass = isSelected ? 'text-sm font-bold text-amber-400' : isSubmitted ? 'text-sm font-bold text-emerald-400' : disabled ? 'text-sm font-bold text-slate-500' : 'text-sm font-bold text-slate-200';
                      const iconClass = isSelected ? 'text-amber-400' : isSubmitted ? 'text-emerald-400' : 'text-slate-600';

                      return (
                        <div key={proj.id} className={cardClass} onClick={() => canSelect && handleToggleProject(proj.id)}>
                          <div className="flex items-center justify-between">
                            <div>
                              <div className={titleClass}>{proj.title}</div>
                              <div className="text-xs text-slate-500 mt-1">{proj.description}</div>
                            </div>
                            <div className={iconClass}>
                              {isSubmitted
                                ? <CheckCircle size={20} fill="rgba(34,197,94,0.3)" className="text-emerald-400" />
                                : isSelected
                                ? <CheckCircle size={20} fill={GOLD} className="text-black" />
                                : disabled
                                ? <Lock size={18} className="text-slate-600" />
                                : <Circle size={20} />
                              }
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {status === 'UNLOCKED' && activeLevel.id === currentLevelId && (
                    <div className="space-y-3 mt-4">
                      {submittedLevels.has(activeLevel.id) ? (
                        <div className="w-full py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                          <CheckCircle size={18} />专项服务已提交，等待审批
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={handleSaveSelection}
                            disabled={isSaving || selectedProjects.length === 0}
                            className="w-full py-3.5 rounded-xl font-black text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ backgroundColor: GOLD, color: '#1a1a1a' }}
                          >
                            {isSaving ? '保存中...' : `确认选择专项服务${selectedProjects.length > 0 ? `（${selectedProjects.length}项）` : ''}`}
                          </button>
                          <button onClick={handleRequestMoreServices} className="w-full py-3.5 bg-white/[0.04] text-slate-300 font-bold text-sm rounded-xl border border-dashed border-slate-600 hover:text-white hover:border-slate-400 hover:bg-white/[0.08] transition-colors flex items-center justify-center gap-2">
                            <PlusCircle size={16} />申请增加额外服务
                          </button>
                        </>
                      )}
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
