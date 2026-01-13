
import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, Users, BookOpen, BrainCircuit, 
  Plus, Trash2, ShieldCheck, UserPlus, 
  Edit3, X, Camera, Scale, Save, Image as ImageIcon, Headphones, Settings, Building, Smartphone, Check, UserCheck, Crown, Upload, TrendingUp,
  FileText, MessageSquare, AlertTriangle, ClipboardList, Star, Activity, Inbox, ArrowRight, PhoneCall, BarChart2, Calendar
} from 'lucide-react';
import { db } from '../services/dbService';
import { DocumentItem, RiskScenario, User, UserRole, EvidenceGroup, LawArticle, CustomPosterTemplate, ContactQRCode, SystemConfig, RightsConfig, EnterpriseStats, VipLevelConfig, ScriptScenario, EmergencySOP, SpecialProject, ServiceRequest, UsageLog } from '../types';

const AdminDashboard: React.FC<{onLogout: () => void}> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<'stats' | 'kb' | 'docs' | 'risk' | 'evidence' | 'laws' | 'scripts' | 'sop' | 'renovation' | 'users' | 'rights' | 'resources' | 'special' | 'requests'>('stats');
  
  // Data States
  const [kbText, setKbText] = useState('');
  const [healthCheckPrompt, setHealthCheckPrompt] = useState('');
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [riskScenarios, setRiskScenarios] = useState<RiskScenario[]>([]);
  const [evidenceList, setEvidenceList] = useState<EvidenceGroup[]>([]);
  const [lawArticles, setLawArticles] = useState<LawArticle[]>([]);
  const [scripts, setScripts] = useState<ScriptScenario[]>([]);
  const [sops, setSops] = useState<EmergencySOP[]>([]);
  const [renovationItems, setRenovationItems] = useState<string[]>([]);
  const [specialProjects, setSpecialProjects] = useState<SpecialProject[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [usageLogs, setUsageLogs] = useState<UsageLog[]>([]);

  const [users, setUsers] = useState<User[]>([]);
  const [enterprises, setEnterprises] = useState<string[]>([]); 
  const [customPosters, setCustomPosters] = useState<CustomPosterTemplate[]>([]);
  const [contactQRs, setContactQRs] = useState<ContactQRCode[]>([]);
  const [systemConfig, setSystemConfig] = useState<SystemConfig>({ enablePhoneLogin: true, enableSplashScreen: true, welcomeMessage: '' });
  
  // New States for Stats & VIP Levels
  const [targetEnterprise, setTargetEnterprise] = useState<string>(''); // Currently selected enterprise for stats editing
  const [entStats, setEntStats] = useState<EnterpriseStats>({ totalRecoveredAmount: 0, totalEntrustedAmount: 0, entrustedCount: 0 });
  const [vipLevels, setVipLevels] = useState<VipLevelConfig[]>([]);

  // Stats Filtering
  const [statsPeriod, setStatsPeriod] = useState<'month' | 'quarter' | 'year'>('month');

  // Config States
  const [splashImage, setSplashImage] = useState<string | null>(null);
  const splashInputRef = useRef<HTMLInputElement>(null);
  
  // Modals / Editing States
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingDoc, setEditingDoc] = useState<DocumentItem | null>(null);
  const [editingLaw, setEditingLaw] = useState<LawArticle | null>(null);
  const [editingRenovationItem, setEditingRenovationItem] = useState<{idx: number, text: string} | null>(null);
  const [editingProject, setEditingProject] = useState<SpecialProject | null>(null);
  
  // New Editors for Modules
  const [editingRisk, setEditingRisk] = useState<{id: string, title: string, questions: string} | null>(null);
  const [editingEvidence, setEditingEvidence] = useState<{id: string, title: string, items: string} | null>(null);
  const [editingScript, setEditingScript] = useState<ScriptScenario | null>(null);
  const [editingSOP, setEditingSOP] = useState<{id: string, title: string, level: 'HIGH' | 'MEDIUM', steps: string, tips: string} | null>(null);

  const [newCompanyName, setNewCompanyName] = useState('');
  
  // Helper refs
  const posterFileRef = useRef<HTMLInputElement>(null);
  const qrFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    refreshData();
  }, []);

  // When target enterprise changes, reload its specific stats
  useEffect(() => {
      if (targetEnterprise) {
          const s = db.getEnterpriseStats(targetEnterprise);
          setEntStats(s);
      }
  }, [targetEnterprise]);

  const refreshData = () => {
    setKbText(db.getAIKB());
    setHealthCheckPrompt(db.getHealthCheckPrompt());
    setDocs(db.getDocs());
    setRiskScenarios(db.getCheckScenarios());
    setEvidenceList(db.getEvidenceList());
    setLawArticles(db.getCivilCode());
    setScripts(db.getScripts());
    setSops(db.getSOPs());
    setRenovationItems(db.getRenovationChecklist());
    setSpecialProjects(db.getSpecialProjects());
    setServiceRequests(db.getServiceRequests());
    setUsageLogs(db.getUsageLogs());

    const allUsers = db.getUsers();
    setUsers(allUsers);
    
    const ents = db.getEnterprises();
    setEnterprises(ents);
    
    // Set default target enterprise for stats editing if not set
    if (!targetEnterprise && ents.length > 0) {
        setTargetEnterprise(ents[0]);
    } else if (targetEnterprise) {
        // Refresh current stats
        const s = db.getEnterpriseStats(targetEnterprise);
        setEntStats(s);
    }

    setCustomPosters(db.getCustomPosters());
    setContactQRs(db.getContactQRCodes());
    setSplashImage(db.getSplashImage());
    setSystemConfig(db.getSystemConfig());
    
    setVipLevels(db.getVipLevels());
  };

  // --- Statistics Logic ---
  const getAggregatedStats = () => {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      const currentQuarter = Math.floor(currentMonth / 3);

      const filteredLogs = usageLogs.filter(log => {
          const logDate = new Date(log.timestamp);
          if (statsPeriod === 'month') {
              return logDate.getMonth() === currentMonth && logDate.getFullYear() === currentYear;
          } else if (statsPeriod === 'quarter') {
              return Math.floor(logDate.getMonth() / 3) === currentQuarter && logDate.getFullYear() === currentYear;
          } else {
              return logDate.getFullYear() === currentYear;
          }
      });

      // Aggregate: Map<EnterpriseName, Map<FeatureName, Count>>
      const aggregation: Record<string, Record<string, number>> = {};
      const allFeatures = new Set<string>();

      filteredLogs.forEach(log => {
          if (!aggregation[log.enterpriseName]) {
              aggregation[log.enterpriseName] = {};
          }
          if (!aggregation[log.enterpriseName][log.featureName]) {
              aggregation[log.enterpriseName][log.featureName] = 0;
          }
          aggregation[log.enterpriseName][log.featureName]++;
          allFeatures.add(log.featureName);
      });

      // Ensure 'East Capital Demo' or manual entries also appear if they have logs
      return { aggregation, features: Array.from(allFeatures) };
  };

  const saveKB = () => { 
      db.saveAIKB(kbText); 
      db.saveHealthCheckPrompt(healthCheckPrompt);
      alert('AI 知识库及指令配置已更新'); 
  };
  
  const handleConfigChange = (newConfig: Partial<SystemConfig>) => { 
      const updated = { ...systemConfig, ...newConfig }; 
      setSystemConfig(updated); 
      db.saveSystemConfig(updated); 
  };
  
  const handleStatChange = (key: keyof EnterpriseStats, val: number) => {
      const updated = { ...entStats, [key]: val };
      setEntStats(updated);
      // Auto-save to DB for the selected enterprise
      if (targetEnterprise) {
          db.saveEnterpriseStats(updated, targetEnterprise);
      }
  };

  const handleLevelUpdate = (id: string, field: string, val: any) => {
      const newLevels = vipLevels.map(l => l.id === id ? { ...l, [field]: val } : l);
      setVipLevels(newLevels);
      db.saveVipLevels(newLevels);
  };

  const getCurrentVipInfo = () => {
      const sortedLevels = [...vipLevels].sort((a, b) => a.thresholdAmount - b.thresholdAmount);
      let current = sortedLevels[0];
      let next = null;

      for (let i = 0; i < sortedLevels.length; i++) {
          if (entStats.totalEntrustedAmount >= sortedLevels[i].thresholdAmount) {
              current = sortedLevels[i];
          } else {
              next = sortedLevels[i];
              break;
          }
      }
      return { current, next };
  };

  const handleSplashUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => { 
          const base64 = ev.target?.result as string;
          db.saveSplashImage(base64); 
          setSplashImage(base64); 
          alert('开屏图已更新'); 
      };
      reader.readAsDataURL(file);
    }
  };
  const handleResetSplash = () => { if (confirm('确认恢复默认开屏？')) { db.saveSplashImage(null); setSplashImage(null); } };
  
  const handleApproveUser = (id: string) => { db.updateUser(id, { approvalStatus: 'APPROVED', isCertified: true }); refreshData(); };
  const handleRejectUser = (id: string) => { db.updateUser(id, { approvalStatus: 'REJECTED', isCertified: false }); refreshData(); };
  
  const handleAddCompany = () => { if(!newCompanyName.trim())return; db.addEnterprise(newCompanyName.trim()); refreshData(); setNewCompanyName(''); };
  const handleDeleteCompany = (n:string) => { if(confirm('确定删除该物业公司？')) {db.deleteEnterprise(n); refreshData();} };
  
  const handleSaveUser = (e:React.FormEvent) => { 
      e.preventDefault(); 
      if(!editingUser) return; 
      if(editingUser.role !== UserRole.ADMIN && !editingUser.enterpriseName) {alert('请选择所属公司'); return;} 
      if (!editingUser.quota) editingUser.quota = { lawyerLetters: 0, consultations: 0 };
      
      const all=db.getUsers(); 
      const idx=all.findIndex(x=>x.id===editingUser.id); 
      if(idx>-1)all[idx]=editingUser; else all.push(editingUser); 
      db.saveUsers(all); refreshData(); setEditingUser(null); 
  };

  const handleProcessRequest = (id: string, status: 'PROCESSED' | 'REJECTED') => {
      db.updateServiceRequest(id, { status });
      refreshData();
  };

  const handlePosterImageUpload = (e:any) => { 
      const f=e.target.files?.[0]; 
      if(f){ const r=new FileReader(); r.onload=(ev)=>{
          db.addCustomPoster({id:Date.now().toString(), name: '自定义海报', imageBase64: ev.target?.result as string, createdAt:Date.now()});
          refreshData();
      }; r.readAsDataURL(f);} 
  };
  
  const handleQRImageUpload = (e:any) => { 
      const f=e.target.files?.[0]; 
      if(f){ const r=new FileReader(); r.onload=(ev)=>{
           db.addContactQRCode({id:Date.now().toString(), name: '新顾问', imageBase64: ev.target?.result as string, createdAt:Date.now()});
           refreshData();
      }; r.readAsDataURL(f);} 
  };

  const deleteItem = (t:string,id:string) => { 
      if(!confirm('确定删除该项？'))return; 
      if(t==='user')db.deleteUser(id); 
      if(t==='poster')db.deleteCustomPoster(id); 
      if(t==='qr')db.deleteContactQRCode(id); 
      if(t==='doc') { const n = docs.filter(d=>d.id!==id); db.saveDocs(n); setDocs(n); }
      if(t==='law') { const n = lawArticles.filter(d=>d.id!==id); db.saveCivilCode(n); setLawArticles(n); }
      if(t==='project') { const n = specialProjects.filter(d=>d.id!==id); db.saveSpecialProjects(n); setSpecialProjects(n); }
      if(t==='risk') { const n = riskScenarios.filter(r=>r.id!==id); db.saveCheckScenarios(n); setRiskScenarios(n); }
      if(t==='evidence') { const n = evidenceList.filter(e=>e.id!==id); db.saveEvidenceList(n); setEvidenceList(n); }
      if(t==='script') { const n = scripts.filter(s=>s.id!==id); db.saveScripts(n); setScripts(n); }
      if(t==='sop') { const n = sops.filter(s=>s.id!==id); db.saveSOPs(n); setSops(n); }
      refreshData(); 
  };

  const handleSaveDoc = (e: React.FormEvent) => { e.preventDefault(); if (!editingDoc) return; const n = [...docs]; const idx = n.findIndex(d => d.id === editingDoc.id); if (idx > -1) n[idx] = editingDoc; else n.push(editingDoc); db.saveDocs(n); setDocs(n); setEditingDoc(null); };
  const handleSaveLaw = (e: React.FormEvent) => { e.preventDefault(); if (!editingLaw) return; const n = [...lawArticles]; const idx = n.findIndex(d => d.id === editingLaw.id); if (idx > -1) n[idx] = editingLaw; else n.push(editingLaw); db.saveCivilCode(n); setLawArticles(n); setEditingLaw(null); };
  const handleSaveProject = (e: React.FormEvent) => { e.preventDefault(); if (!editingProject) return; const n = [...specialProjects]; const idx = n.findIndex(d => d.id === editingProject.id); if (idx > -1) n[idx] = editingProject; else n.push(editingProject); db.saveSpecialProjects(n); setSpecialProjects(n); setEditingProject(null); };
  const handleSaveRisk = (e: React.FormEvent) => { e.preventDefault(); if (!editingRisk) return; const qs = editingRisk.questions.split('\n').filter(l => l.trim()); const nRisk = {id:editingRisk.id, title:editingRisk.title, questions:qs}; const n = [...riskScenarios]; const idx = n.findIndex(x => x.id === editingRisk.id); if (idx > -1) n[idx] = nRisk; else n.push(nRisk); db.saveCheckScenarios(n); setRiskScenarios(n); setEditingRisk(null); };
  const handleSaveEvidence = (e: React.FormEvent) => { e.preventDefault(); if (!editingEvidence) return; const is = editingEvidence.items.split('\n').filter(l => l.trim()); const nEv = {id:editingEvidence.id, title:editingEvidence.title, items:is}; const n = [...evidenceList]; const idx = n.findIndex(x => x.id === editingEvidence.id); if (idx > -1) n[idx] = nEv; else n.push(nEv); db.saveEvidenceList(n); setEvidenceList(n); setEditingEvidence(null); };
  const handleSaveSOP = (e: React.FormEvent) => { e.preventDefault(); if (!editingSOP) return; const ss = editingSOP.steps.split('\n').filter(l => l.trim()); const nSop: EmergencySOP = {id:editingSOP.id, title:editingSOP.title, level:editingSOP.level as any, steps:ss, tips:editingSOP.tips}; const n = [...sops]; const idx = n.findIndex(x => x.id === editingSOP.id); if (idx > -1) n[idx] = nSop; else n.push(nSop); db.saveSOPs(n); setSops(n); setEditingSOP(null); };
  const handleSaveScript = (e: React.FormEvent) => { e.preventDefault(); if (!editingScript) return; editingScript.steps = editingScript.steps.filter(s => s.label.trim() && s.content.trim()); const n = [...scripts]; const idx = n.findIndex(x => x.id === editingScript.id); if (idx > -1) n[idx] = editingScript; else n.push(editingScript); db.saveScripts(n); setScripts(n); setEditingScript(null); };

  // Generic Simple List Manager
  const SimpleListEditor = ({ title, items, onAdd, onDelete, renderItem }: any) => (
      <div className="bg-[#12151c] p-6 rounded-3xl border border-slate-800">
         <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-white text-lg">{title}</h3>
            <button onClick={onAdd} className="bg-orange-500 text-white p-2 rounded-lg text-xs font-bold flex items-center gap-1"><Plus size={14}/> 添加</button>
         </div>
         <div className="space-y-2">
            {items.map((item: any, idx: number) => (
               <div key={item.id || idx} className="bg-white/5 p-4 rounded-xl border border-white/5 flex justify-between items-start">
                   <div className="flex-1">{renderItem(item)}</div>
                   <button onClick={() => onDelete(item.id || idx)} className="text-slate-500 hover:text-red-500 p-1"><Trash2 size={16}/></button>
               </div>
            ))}
            {items.length === 0 && <div className="text-slate-500 text-xs text-center py-4">暂无数据</div>}
         </div>
      </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0c10] text-slate-300 flex font-sans overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-[#12151c] border-r border-slate-800 flex flex-col shadow-2xl shrink-0">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="bg-orange-500 p-2 rounded-xl"><ShieldCheck className="text-white" size={20} /></div>
          <div><h1 className="text-base font-black text-white">东元后台</h1><p className="text-[8px] text-orange-100 uppercase font-bold tracking-widest">Legal OS v4.5</p></div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto no-scrollbar">
          {[
            { id: 'stats', icon: BarChart2, label: '数据统计' },
            { id: 'kb', icon: BrainCircuit, label: 'AI 知识引擎' },
            { id: 'rights', icon: Crown, label: '权益配置' }, 
            { id: 'requests', icon: Inbox, label: '服务申请审批' },
            { id: 'special', icon: Star, label: '专项服务配置' },
            { id: 'users', icon: Users, label: '员工/角色管理' },
            { id: 'docs', icon: FileText, label: '文档中心' },
            { id: 'risk', icon: ShieldCheck, label: '风控合规' },
            { id: 'evidence', icon: Camera, label: '取证清单' },
            { id: 'scripts', icon: MessageSquare, label: '催费话术' },
            { id: 'sop', icon: AlertTriangle, label: 'SOP 预案' },
            { id: 'laws', icon: BookOpen, label: '法规库' },
            { id: 'renovation', icon: ClipboardList, label: '装修巡查项' },
            { id: 'resources', icon: Settings, label: '资源与外观' },
          ].map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${activeTab === item.id ? 'bg-orange-500/10 border-orange-500/40 text-white' : 'border-transparent hover:bg-white/5 text-slate-500'}`}>
              <div className="flex items-center gap-3">
                <item.icon size={18} className={activeTab === item.id ? 'text-orange-400' : ''} />
                <span className="font-bold text-xs">{item.label}</span>
                {item.id === 'requests' && serviceRequests.some(r => r.status === 'PENDING') && (
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse ml-auto"></span>
                )}
              </div>
            </button>
          ))}
        </nav>
        
        <div className="p-4"><button onClick={onLogout} className="w-full py-3 bg-red-500/10 text-red-500 rounded-xl font-bold text-xs hover:bg-red-500 hover:text-white transition-colors">退出后台</button></div>
      </div>

      <main className="flex-1 overflow-y-auto p-8 bg-[#0a0c10] no-scrollbar">
        
        {/* === TAB: Statistics (New) === */}
        {activeTab === 'stats' && (
            <div className="space-y-6 animate-fade-in">
                <div className="bg-[#12151c] p-8 rounded-[2.5rem] border border-slate-800">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="font-black text-white text-xl flex items-center gap-2">
                            <BarChart2 className="text-orange-500" /> 企业使用频次统计
                        </h3>
                        <div className="flex bg-black/40 p-1 rounded-xl border border-slate-800">
                            <button 
                                onClick={() => setStatsPeriod('month')}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${statsPeriod === 'month' ? 'bg-orange-500 text-white' : 'text-slate-500 hover:text-white'}`}
                            >
                                本月
                            </button>
                            <button 
                                onClick={() => setStatsPeriod('quarter')}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${statsPeriod === 'quarter' ? 'bg-orange-500 text-white' : 'text-slate-500 hover:text-white'}`}
                            >
                                本季度
                            </button>
                            <button 
                                onClick={() => setStatsPeriod('year')}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${statsPeriod === 'year' ? 'bg-orange-500 text-white' : 'text-slate-500 hover:text-white'}`}
                            >
                                本年度
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        {(() => {
                            const { aggregation, features } = getAggregatedStats();
                            const companies = Object.keys(aggregation);
                            
                            if (companies.length === 0) {
                                return <div className="text-center py-20 text-slate-500">暂无数据记录</div>
                            }

                            return (
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-800 text-xs font-bold text-slate-500 uppercase tracking-widest">
                                            <th className="p-4 pl-0">物业公司</th>
                                            {features.map(f => (
                                                <th key={f} className="p-4 text-center">{f}</th>
                                            ))}
                                            <th className="p-4 text-right pr-0">总计</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/50">
                                        {companies.map(company => {
                                            const rowTotal = features.reduce((acc, f) => acc + (aggregation[company][f] || 0), 0);
                                            return (
                                                <tr key={company} className="group hover:bg-white/5 transition-colors">
                                                    <td className="p-4 pl-0 font-bold text-white text-sm">{company}</td>
                                                    {features.map(f => (
                                                        <td key={f} className="p-4 text-center text-slate-400 font-mono text-xs">
                                                            {aggregation[company][f] ? (
                                                                <span className="bg-orange-500/10 text-orange-500 px-2 py-1 rounded font-bold">{aggregation[company][f]}</span>
                                                            ) : '-'}
                                                        </td>
                                                    ))}
                                                    <td className="p-4 pr-0 text-right font-black text-white text-sm">{rowTotal}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            );
                        })()}
                    </div>
                </div>
            </div>
        )}

        {/* ... (Existing Tabs KB, Requests, etc. Unchanged) ... */}
        {activeTab === 'kb' && (
             <div className="flex flex-col h-full gap-6">
                <div className="bg-[#12151c] p-8 rounded-3xl border border-slate-800 flex flex-col flex-1">
                    <div className="flex justify-between mb-4">
                        <h3 className="font-bold text-white flex items-center gap-2"><BrainCircuit size={18}/> 智能助手核心 Prompt (System Instruction)</h3>
                        <button onClick={saveKB} className="bg-orange-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2"><Save size={14}/> 保存所有配置</button>
                    </div>
                    <p className="text-xs text-slate-500 mb-2">配置主聊天界面的 AI 角色设定与知识边界。</p>
                    <textarea value={kbText} onChange={e => setKbText(e.target.value)} className="flex-1 bg-black/40 border border-slate-800 rounded-2xl p-6 text-slate-400 font-mono text-sm leading-relaxed outline-none focus:border-orange-500/30 transition-all resize-none mb-4" />
                </div>

                <div className="bg-[#12151c] p-8 rounded-3xl border border-slate-800 flex flex-col flex-1">
                    <h3 className="font-bold text-white flex items-center gap-2 mb-2"><Activity size={18}/> 企业体检报告生成指令</h3>
                    <p className="text-xs text-slate-500 mb-4">
                        配置“企业法务体检”功能中生成深度报告的 AI 提示词。<br/>
                        <span className="text-orange-500">注意：必须包含 <code>{`{{RISK_POINTS}}`}</code> 占位符，系统将自动替换为用户的风险项数据。</span>
                    </p>
                    <textarea value={healthCheckPrompt} onChange={e => setHealthCheckPrompt(e.target.value)} className="flex-1 bg-black/40 border border-slate-800 rounded-2xl p-6 text-slate-400 font-mono text-sm leading-relaxed outline-none focus:border-orange-500/30 transition-all resize-none" style={{minHeight: '300px'}} />
                </div>
            </div>
        )}

        {/* ... (Rest of existing tabs) ... */}
        {activeTab === 'requests' && (
            <div className="space-y-6">
                <div className="bg-[#12151c] p-6 rounded-3xl border border-slate-800">
                    <h3 className="font-bold text-white text-lg mb-6 flex items-center gap-2">
                        <Inbox className="text-orange-500" /> 服务申请审批
                    </h3>
                    <div className="space-y-3">
                        {serviceRequests.length === 0 ? (
                            <div className="text-center py-10 text-slate-500 text-sm">暂无待处理的申请</div>
                        ) : (
                            serviceRequests.map(req => (
                                <div key={req.id} className="bg-white/5 p-5 rounded-2xl border border-white/5 flex flex-col gap-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-white font-bold text-sm">{req.username}</span>
                                                <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded">{req.enterpriseName}</span>
                                            </div>
                                            <div className="text-[10px] text-slate-500">{new Date(req.timestamp).toLocaleString()}</div>
                                        </div>
                                        <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                                            req.status === 'PENDING' ? 'bg-orange-500/20 text-orange-500' :
                                            req.status === 'PROCESSED' ? 'bg-green-500/20 text-green-500' :
                                            'bg-red-500/20 text-red-500'
                                        }`}>
                                            {req.status === 'PENDING' ? '待处理' : req.status === 'PROCESSED' ? '已处理' : '已驳回'}
                                        </div>
                                    </div>
                                    <div className="bg-black/30 p-3 rounded-xl text-xs text-slate-300">
                                        <span className="text-slate-500 font-bold mr-2">申请内容:</span>
                                        {req.content}
                                    </div>
                                    {req.status === 'PENDING' && (
                                        <div className="flex gap-2 justify-end mt-1">
                                            <button 
                                                onClick={() => handleProcessRequest(req.id, 'PROCESSED')}
                                                className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                                            >
                                                <Check size={12}/> 标记已办理
                                            </button>
                                            <button 
                                                onClick={() => handleProcessRequest(req.id, 'REJECTED')}
                                                className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white rounded-lg text-xs font-bold flex items-center gap-1"
                                            >
                                                <X size={12}/> 驳回
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* ... (Shortened tabs) ... */}
        {activeTab === 'special' && (
             <SimpleListEditor 
                title="专项法律服务库" 
                items={specialProjects}
                onAdd={() => setEditingProject({id: Date.now().toString(), title: '', desc: ''})}
                onDelete={(id: string) => deleteItem('project', id)}
                renderItem={(item: SpecialProject) => (
                    <>
                       <div className="font-bold text-white text-sm mb-1">{item.title}</div>
                       <div className="text-xs text-slate-500">{item.desc}</div>
                       <button onClick={() => setEditingProject({...item})} className="mt-2 text-[10px] text-blue-400 hover:text-blue-300">编辑</button>
                    </>
                )}
            />
        )}

        {/* ... Docs, Laws, Risk, Evidence, Scripts, SOP, Renovation ... */}
        {/* Assume standard render here, preserving code space for the changed part */}
        {['docs', 'laws', 'risk', 'evidence', 'scripts', 'sop', 'renovation'].includes(activeTab) && (
            <>
                {activeTab === 'docs' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center bg-[#12151c] p-6 rounded-3xl border border-slate-800">
                            <h3 className="font-bold text-white">文档模板管理</h3>
                            <button onClick={() => setEditingDoc({ id: Date.now().toString(), title: '', category: '全部', description: '', content: '' })} className="bg-orange-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1"><Plus size={14}/> 新增文档</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {docs.map(doc => (
                                <div key={doc.id} className="bg-[#12151c] p-5 rounded-2xl border border-slate-800 hover:border-orange-500/30 transition-colors group">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-white text-sm">{doc.title}</h4>
                                        <span className="text-[9px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded">{doc.category}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 mb-4 line-clamp-2">{doc.description}</p>
                                    <div className="flex justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => setEditingDoc({...doc})} className="p-2 bg-slate-800 rounded-lg text-slate-300 hover:text-white"><Edit3 size={14}/></button>
                                        <button onClick={() => deleteItem('doc', doc.id)} className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white"><Trash2 size={14}/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {activeTab === 'laws' && <SimpleListEditor title="民法典法规库" items={lawArticles} onAdd={() => setEditingLaw({id: Date.now().toString(), title: '', content: ''})} onDelete={(id: string) => deleteItem('law', id)} renderItem={(item: LawArticle) => (<><div className="font-bold text-white text-sm mb-1">{item.title}</div><div className="text-xs text-slate-500 line-clamp-2">{item.content}</div><button onClick={() => setEditingLaw({...item})} className="mt-2 text-[10px] text-blue-400 hover:text-blue-300">编辑内容</button></>)} />}
                {activeTab === 'risk' && <SimpleListEditor title="风控自查场景管理" items={riskScenarios} onAdd={() => setEditingRisk({id: Date.now().toString(), title: '', questions: ''})} onDelete={(id: string) => deleteItem('risk', id)} renderItem={(item: RiskScenario) => (<><div className="font-bold text-white text-sm mb-1">{item.title}</div><div className="text-xs text-slate-500">{item.questions?.length || 0} 个检查项</div><button onClick={() => setEditingRisk({id: item.id, title: item.title || '', questions: (item.questions || []).join('\n')})} className="mt-2 text-[10px] text-blue-400 hover:text-blue-300">编辑问题清单</button></>)} />}
                {activeTab === 'evidence' && <SimpleListEditor title="取证清单配置" items={evidenceList} onAdd={() => setEditingEvidence({id: Date.now().toString(), title: '', items: ''})} onDelete={(id: string) => deleteItem('evidence', id)} renderItem={(item: EvidenceGroup) => (<><div className="font-bold text-white text-sm mb-1">{item.title}</div><div className="text-xs text-slate-500">{item.items?.length || 0} 个证据点</div><button onClick={() => setEditingEvidence({id: item.id, title: item.title, items: item.items.join('\n')})} className="mt-2 text-[10px] text-blue-400 hover:text-blue-300">编辑清单</button></>)} />}
                {activeTab === 'scripts' && <SimpleListEditor title="催费话术场景库" items={scripts} onAdd={() => setEditingScript({id: Date.now().toString(), title: '', steps: [{label: '', content: ''}]})} onDelete={(id: string) => deleteItem('script', id)} renderItem={(item: ScriptScenario) => (<><div className="font-bold text-white text-sm mb-1">{item.title}</div><div className="text-xs text-slate-500">{item.steps?.length || 0} 个对话步骤</div><button onClick={() => setEditingScript(JSON.parse(JSON.stringify(item)))} className="mt-2 text-[10px] text-blue-400 hover:text-blue-300">编辑话术</button></>)} />}
                {activeTab === 'sop' && <SimpleListEditor title="紧急情况 SOP 预案" items={sops} onAdd={() => setEditingSOP({id: Date.now().toString(), title: '', level: 'MEDIUM', steps: '', tips: ''})} onDelete={(id: string) => deleteItem('sop', id)} renderItem={(item: EmergencySOP) => (<><div className="flex items-center gap-2 mb-1"><span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${item.level === 'HIGH' ? 'bg-red-500 text-white' : 'bg-orange-500 text-white'}`}>{item.level}</span><span className="font-bold text-white text-sm">{item.title}</span></div><div className="text-xs text-slate-500 line-clamp-1">{item.tips}</div><button onClick={() => setEditingSOP({id: item.id, title: item.title, level: item.level, steps: item.steps.join('\n'), tips: item.tips})} className="mt-2 text-[10px] text-blue-400 hover:text-blue-300">编辑预案</button></>)} />}
                {activeTab === 'renovation' && <div className="bg-[#12151c] p-6 rounded-3xl border border-slate-800"><div className="flex justify-between items-center mb-6"><h3 className="font-bold text-white text-lg">装修违规巡查项配置</h3><div className="flex gap-2"><input id="new-reno-item" placeholder="输入新检查项" className="bg-black/40 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white w-64" /><button onClick={() => { const val = (document.getElementById('new-reno-item') as HTMLInputElement).value; if(val.trim()){ const n = [...renovationItems, val.trim()]; setRenovationItems(n); db.saveRenovationChecklist(n); (document.getElementById('new-reno-item') as HTMLInputElement).value = ''; } }} className="bg-orange-500 px-4 py-2 rounded-xl text-white text-xs font-bold">添加</button></div></div><div className="space-y-2">{renovationItems.map((item, idx) => (<div key={idx} className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/5">{editingRenovationItem?.idx === idx ? (<div className="flex gap-2 w-full"><input autoFocus value={editingRenovationItem.text} onChange={e => setEditingRenovationItem({...editingRenovationItem, text: e.target.value})} className="flex-1 bg-black/40 border border-slate-600 rounded-lg px-2 py-1 text-sm text-white" /><button onClick={() => { const n = [...renovationItems]; n[idx] = editingRenovationItem.text; setRenovationItems(n); db.saveRenovationChecklist(n); setEditingRenovationItem(null); }} className="text-green-500"><Check size={16}/></button></div>) : (<div className="flex items-center gap-2"><span className="text-slate-500 text-xs font-mono mr-2">{idx + 1}.</span><span className="text-white text-sm">{item}</span><button onClick={() => setEditingRenovationItem({idx, text: item})} className="ml-2 text-slate-600 hover:text-slate-400"><Edit3 size={12}/></button></div>)}<button onClick={() => { const n = renovationItems.filter((_, i) => i !== idx); setRenovationItems(n); db.saveRenovationChecklist(n); }} className="text-slate-500 hover:text-red-500"><Trash2 size={16}/></button></div>))}</div></div>}
            </>
        )}

        {activeTab === 'resources' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-[#12151c] border border-slate-800 rounded-[2.5rem] p-8">
              <h3 className="text-lg font-black text-white mb-6 flex items-center gap-2">
                 <Smartphone className="text-orange-500" size={20}/> 登录与注册配置
              </h3>
              {/* ... (Login config code same as before) ... */}
              <div className="flex items-center justify-between bg-white/5 p-5 rounded-2xl border border-white/5 mb-4">
                 <div>
                    <div className="font-bold text-white text-sm">启用手机号验证码登录</div>
                    <div className="text-xs text-slate-500 mt-1">用户可使用手机号+验证码登录</div>
                 </div>
                 <button 
                   onClick={() => handleConfigChange({ enablePhoneLogin: !systemConfig.enablePhoneLogin })}
                   className={`w-12 h-6 rounded-full transition-colors relative ${systemConfig.enablePhoneLogin ? 'bg-orange-500' : 'bg-slate-700'}`}
                 >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${systemConfig.enablePhoneLogin ? 'left-7' : 'left-1'}`}></div>
                 </button>
              </div>
              <div className="space-y-4">
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 ml-1 flex items-center gap-2"><PhoneCall size={14}/> 律师专线号码配置</label>
                    <input 
                      type="text"
                      value={systemConfig.lawyerPhoneNumber || ''}
                      onChange={(e) => handleConfigChange({ lawyerPhoneNumber: e.target.value })}
                      placeholder="例如：400-888-9999"
                      className="w-full bg-black/40 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-300 focus:border-orange-500 outline-none"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 ml-1">AI 助手欢迎语</label>
                    <textarea 
                      value={systemConfig.welcomeMessage}
                      onChange={(e) => handleConfigChange({ welcomeMessage: e.target.value })}
                      className="w-full bg-black/40 border border-slate-800 rounded-xl p-4 text-sm text-slate-300 h-24 focus:border-orange-500 outline-none resize-none"
                    />
                 </div>
              </div>
            </div>

            <div className="bg-[#12151c] border border-slate-800 rounded-[2.5rem] p-8">
               <h3 className="text-lg font-black text-white mb-6 flex items-center gap-2">
                  <ImageIcon className="text-orange-500" size={20}/> 品牌开屏页设置
               </h3>
               {/* ... (Splash config code same as before) ... */}
               <div className="flex items-center justify-between bg-white/5 p-5 rounded-2xl border border-white/5 mb-6">
                 <div>
                    <div className="font-bold text-white text-sm">启用品牌开屏页</div>
                    <div className="text-xs text-slate-500 mt-1">开启后 App 启动时展示品牌页面</div>
                 </div>
                 <button 
                   onClick={() => handleConfigChange({ enableSplashScreen: !systemConfig.enableSplashScreen })}
                   className={`w-12 h-6 rounded-full transition-colors relative ${systemConfig.enableSplashScreen !== false ? 'bg-orange-500' : 'bg-slate-700'}`}
                 >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${systemConfig.enableSplashScreen !== false ? 'left-7' : 'left-1'}`}></div>
                 </button>
               </div>
               <div className="flex gap-6 items-start">
                  <div className="w-32 aspect-[9/16] bg-black rounded-xl border border-slate-800 overflow-hidden relative group shadow-lg">
                      {splashImage ? (
                          <img src={splashImage} className="w-full h-full object-cover" alt="Splash" />
                      ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 bg-slate-900">
                             <div className="text-[9px] font-bold">默认开屏</div>
                          </div>
                      )}
                  </div>
                  <div className="flex-1 space-y-4 pt-2">
                      <p className="text-xs text-slate-500 leading-relaxed">自定义应用启动时的开屏画面。</p>
                      <div className="flex gap-3">
                         <button onClick={() => splashInputRef.current?.click()} className="px-5 py-2.5 bg-white text-black rounded-xl text-xs font-black hover:bg-slate-200 transition-colors flex items-center gap-2"><Upload size={14}/> 上传图片</button>
                         {splashImage && <button onClick={handleResetSplash} className="px-5 py-2.5 bg-red-500/10 text-red-500 rounded-xl text-xs font-black">恢复默认</button>}
                         <input type="file" ref={splashInputRef} onChange={handleSplashUpload} accept="image/*" className="hidden" />
                      </div>
                  </div>
               </div>
            </div>

            <div className="bg-[#12151c] border border-slate-800 rounded-[2.5rem] p-8">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-white text-lg">物业公司库</h3>
                    <div className="flex gap-2">
                        <input value={newCompanyName} onChange={e => setNewCompanyName(e.target.value)} placeholder="输入公司全称" className="bg-black/40 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white" />
                        <button onClick={handleAddCompany} className="bg-orange-500 px-4 py-2 rounded-xl text-white text-xs font-bold">添加</button>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    {enterprises.map(ent => (
                        <div key={ent} className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-xl border border-white/5">
                            <span className="text-white font-bold text-xs">{ent}</span>
                            <button onClick={() => handleDeleteCompany(ent)} className="text-slate-500 hover:text-red-500"><X size={12}/></button>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-[#12151c] border border-slate-800 rounded-[2.5rem] p-8">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-white text-lg">海报背景模版</h3>
                    <button onClick={() => posterFileRef.current?.click()} className="bg-blue-600 px-4 py-2 rounded-xl text-white text-xs font-bold flex items-center gap-2"><Plus size={14}/> 上传</button>
                    <input type="file" ref={posterFileRef} onChange={handlePosterImageUpload} className="hidden" accept="image/*" />
                </div>
                <div className="grid grid-cols-4 gap-4">
                    {customPosters.map(p => (
                        <div key={p.id} className="relative aspect-[3/4] rounded-xl overflow-hidden group">
                            <img src={p.imageBase64} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => deleteItem('poster', p.id)} className="bg-red-500 p-2 rounded-full text-white"><Trash2 size={16}/></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* --- UPDATED QR SECTION --- */}
            <div className="bg-[#12151c] border border-slate-800 rounded-[2.5rem] p-8">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="font-bold text-white text-lg">企业微信/顾问二维码配置</h3>
                        <p className="text-xs text-slate-500 mt-1">用于前端「联系顾问」及「专项服务申请」弹窗随机展示</p>
                    </div>
                    <button onClick={() => qrFileRef.current?.click()} className="bg-green-600 px-4 py-2 rounded-xl text-white text-xs font-bold flex items-center gap-2"><Plus size={14}/> 上传</button>
                    <input type="file" ref={qrFileRef} onChange={handleQRImageUpload} className="hidden" accept="image/*" />
                </div>
                <div className="grid grid-cols-4 gap-4">
                    {contactQRs.map(qr => (
                        <div key={qr.id} className="bg-white p-2 rounded-xl flex flex-col items-center gap-2 relative group">
                            <img src={qr.imageBase64} className="w-full aspect-square object-contain" />
                            <span className="text-black text-[10px] font-bold">{qr.name}</span>
                            <button onClick={() => deleteItem('qr', qr.id)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={10}/></button>
                        </div>
                    ))}
                </div>
            </div>
          </div>
        )}

        {/* ... (Rights, Users tabs unchanged) ... */}
        {activeTab === 'rights' && (
             <div className="max-w-4xl mx-auto space-y-6">
                 {/* ... (Existing Rights content) ... */}
                 <div className="bg-[#12151c] border border-slate-800 rounded-[2.5rem] p-8">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-black text-white flex items-center gap-2">
                           <TrendingUp className="text-orange-500" size={20} /> 企业运营数据录入
                        </h3>
                        {/* ... (Existing selector and inputs) ... */}
                        <div className="flex items-center gap-3">
                            <label className="text-xs font-bold text-slate-500">选择需配置的企业</label>
                            <select value={targetEnterprise} onChange={(e) => setTargetEnterprise(e.target.value)} className="bg-black/40 border border-slate-700 text-white text-xs font-bold rounded-xl px-4 py-2 outline-none focus:border-orange-500">
                                <option value="" disabled>-- 请选择 --</option>
                                {enterprises.map(e => <option key={e} value={e}>{e}</option>)}
                            </select>
                        </div>
                    </div>
                    
                    {!targetEnterprise ? (
                        <div className="p-8 text-center text-slate-500 bg-white/5 rounded-2xl border border-dashed border-slate-800">
                            请先在右上方选择一个物业公司进行数据配置
                        </div>
                    ) : (
                        <div className="space-y-6 animate-fade-in">
                            {/* ... (Vip Level Preview) ... */}
                            {(() => {
                                const { current, next } = getCurrentVipInfo();
                                return (
                                    <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-4 border border-slate-700 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-3 rounded-full bg-[#FFD700]/10 text-[#FFD700]"><Crown size={20} fill="#FFD700" /></div>
                                            <div>
                                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">实时预估 VIP 等级 (自动联动)</div>
                                                <div className="text-base font-black text-white mt-0.5 flex items-center gap-2">{current ? current.name : '普通会员'}<span className="text-[9px] bg-white/10 px-2 py-0.5 rounded text-slate-300 font-normal">{current ? current.label : '未达标'}</span></div>
                                            </div>
                                        </div>
                                        {next && (<div className="flex items-center gap-3 opacity-60"><ArrowRight size={16} className="text-slate-500" /><div className="text-right"><div className="text-[10px] text-slate-400 font-bold uppercase">下一级目标</div><div className="text-xs font-bold text-slate-300">{next.name} (还需 {(next.thresholdAmount - entStats.totalEntrustedAmount).toLocaleString()})</div></div></div>)}
                                    </div>
                                );
                            })()}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white/5 p-5 rounded-2xl border border-white/5"><label className="text-xs font-bold text-slate-500 block mb-2">累计委托金额 (Total Entrusted)</label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">¥</span><input type="number" value={entStats.totalEntrustedAmount} onChange={e => handleStatChange('totalEntrustedAmount', parseInt(e.target.value) || 0)} className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-6 pr-4 py-3 text-white font-bold"/></div><p className="text-[9px] text-slate-500 mt-2">修改此数值将自动触发企业 VIP 等级升降。</p></div>
                                <div className="bg-white/5 p-5 rounded-2xl border border-white/5"><label className="text-xs font-bold text-slate-500 block mb-2">累计追回金额 (Total Recovered)</label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">¥</span><input type="number" value={entStats.totalRecoveredAmount} onChange={e => handleStatChange('totalRecoveredAmount', parseInt(e.target.value) || 0)} className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-6 pr-4 py-3 text-white font-bold"/></div></div>
                            </div>
                            <div className="col-span-2 text-right"><span className="text-[10px] text-green-500 flex items-center justify-end gap-1"><Check size={12}/> 数据将自动保存至「{targetEnterprise}」</span></div>
                        </div>
                    )}
                 </div>
                 {/* ... (VIP Levels Config) ... */}
                 <div className="bg-[#12151c] border border-slate-800 rounded-[2.5rem] p-8">
                    <h3 className="text-lg font-black text-white mb-6 flex items-center gap-2"><Crown className="text-orange-500" size={20} /> VIP 等级标准 (全局通用)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {vipLevels.map(lvl => (
                             <div key={lvl.id} className="bg-white/5 p-5 rounded-2xl border border-white/5 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-white/5 to-transparent rounded-bl-full pointer-events-none"></div>
                                <h4 className="font-bold text-white text-sm mb-1">{lvl.name}</h4>
                                <div className="space-y-2 mt-3">
                                  <div><label className="text-[10px] text-slate-500 block mb-1">解锁金额 (元)</label><input type="number" value={lvl.thresholdAmount} onChange={e => handleLevelUpdate(lvl.id, 'thresholdAmount', parseInt(e.target.value) || 0)} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-orange-400 font-black text-xs"/></div>
                                  <div><label className="text-[10px] text-slate-500 block mb-1">专项服务可选数量</label><input type="number" value={lvl.selectableProjectsCount || 0} onChange={e => handleLevelUpdate(lvl.id, 'selectableProjectsCount', parseInt(e.target.value) || 0)} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-blue-400 font-black text-xs"/></div>
                                </div>
                             </div>
                        ))}
                    </div>
                 </div>
                 {/* ... (Quota Config) ... */}
                 <div className="bg-[#12151c] border border-slate-800 rounded-[2.5rem] p-8"><h3 className="text-lg font-black text-white mb-6">人工干预额度 (手动充值)</h3><div className="space-y-3">{users.filter(u => u.role !== UserRole.ADMIN).map(u => (<div key={u.id} className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/5"><div><div className="font-bold text-white text-sm">{u.username} <span className="text-[10px] text-slate-500 bg-slate-800 px-1 rounded ml-1">{u.role}</span></div><div className="text-xs text-slate-500 mt-0.5">{u.enterpriseName}</div></div><div className="flex gap-6 items-center"><div className="text-right"><div className="text-[9px] text-slate-500 uppercase">律师函</div><div className="font-bold text-orange-400 text-sm">{u.quota?.lawyerLetters || 0}</div></div><div className="text-right"><div className="text-[9px] text-slate-500 uppercase">咨询</div><div className="font-bold text-blue-400 text-sm">{u.quota?.consultations || 0}</div></div><button onClick={() => { const newQuota = { ...u.quota, lawyerLetters: (u.quota?.lawyerLetters || 0) + 5, consultations: (u.quota?.consultations || 0) + 20 } as any; db.updateUser(u.id, { quota: newQuota }); refreshData(); }} className="bg-slate-700 hover:bg-orange-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">充值</button></div></div>))}</div></div>
             </div>
        )}

        {/* ... (Users tab unchanged) ... */}
        {activeTab === 'users' && (
          <div className="space-y-6">
             {users.some(u => u.approvalStatus === 'PENDING') && (<div className="bg-orange-500/10 border border-orange-500/30 rounded-3xl p-6"><h4 className="font-bold text-orange-500 flex items-center gap-2 mb-4 text-sm"><UserCheck size={16} /> 待审核注册申请</h4><div className="space-y-2">{users.filter(u => u.approvalStatus === 'PENDING').map(u => (<div key={u.id} className="bg-[#12151c] rounded-xl p-3 flex items-center justify-between border border-slate-800"><div className="flex items-center gap-3"><div className="bg-slate-800 p-2 rounded-lg text-slate-400"><UserPlus size={16} /></div><div><div className="text-white font-bold text-sm">{u.username} <span className="text-slate-500 font-normal text-xs ml-2">{u.phoneNumber}</span></div><div className="text-xs text-orange-400 mt-0.5">申请加入：{u.enterpriseName}</div></div></div><div className="flex gap-2"><button onClick={() => handleApproveUser(u.id)} className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-lg text-xs font-bold flex items-center gap-1"><Check size={12}/> 批准</button><button onClick={() => handleRejectUser(u.id)} className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white rounded-lg text-xs font-bold flex items-center gap-1"><X size={12}/> 拒绝</button></div></div>))}</div></div>)}
             <div className="bg-[#12151c] rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
               <div className="p-4 border-b border-slate-800 bg-white/5 flex justify-between items-center"><h4 className="font-bold text-white text-sm">用户列表</h4><button onClick={() => setEditingUser({ id: Date.now().toString(), username: '', password: '123', role: UserRole.EMPLOYEE, isCertified: true, approvalStatus: 'APPROVED', enterpriseName: '', quota: { lawyerLetters: 0, consultations: 0 } })} className="bg-orange-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1"><Plus size={14}/> 新增用户</button></div>
               <table className="w-full text-left border-collapse"><thead><tr className="text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-800"><th className="p-4">用户</th><th className="p-4">角色</th><th className="p-4">所属公司</th><th className="p-4 text-right">操作</th></tr></thead><tbody className="divide-y divide-slate-800">{users.filter(u => u.approvalStatus !== 'PENDING').map(u => (<tr key={u.id} className="hover:bg-white/5 transition-colors group"><td className="p-4 font-bold text-white text-sm"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs text-slate-400 shrink-0">{u.username.slice(0, 1).toUpperCase()}</div><div><div>{u.username}</div><div className="text-xs text-slate-500 font-normal">{u.phoneNumber || '无手机号'}</div></div></div></td><td className="p-4 text-xs text-slate-400">{u.role}</td><td className="p-4 text-xs text-slate-400">{u.enterpriseName || '-'}</td><td className="p-4 text-right"><div className="flex justify-end gap-2 opacity-50 group-hover:opacity-100 transition-all"><button onClick={() => setEditingUser({...u})} className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white"><Edit3 size={14}/></button><button onClick={() => deleteItem('user', u.id)} className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white"><Trash2 size={14}/></button></div></td></tr>))}</tbody></table>
            </div>
          </div>
        )}
        
      </main>

      {/* User Editor Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/80 backdrop-blur-sm animate-fade-in">
          <form onSubmit={handleSaveUser} className="bg-[#12151c] w-full max-w-md rounded-[2rem] border border-slate-800 p-8 shadow-2xl relative overflow-hidden">
             <h3 className="font-black text-white text-xl mb-6">账户管理</h3>
             <div className="space-y-4">
                <div className="space-y-1"><label className="text-xs text-slate-500 font-bold">用户名</label><input value={editingUser.username} onChange={e => setEditingUser({...editingUser, username: e.target.value})} className="w-full bg-black/40 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white" required /></div>
                <div className="space-y-1"><label className="text-xs text-slate-500 font-bold">手机号码</label><input value={editingUser.phoneNumber || ''} onChange={e => setEditingUser({...editingUser, phoneNumber: e.target.value})} className="w-full bg-black/40 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white" /></div>
                <div className="space-y-1"><label className="text-xs text-slate-500 font-bold">密码</label><input value={editingUser.password} onChange={e => setEditingUser({...editingUser, password: e.target.value})} className="w-full bg-black/40 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white" required /></div>
                <div className="space-y-1"><label className="text-xs text-slate-500 font-bold">角色权限</label><select value={editingUser.role} onChange={e => setEditingUser({...editingUser, role: e.target.value as any})} className="w-full bg-black/40 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white"><option value={UserRole.ADMIN}>超级管理员 (系统后台)</option><option value={UserRole.EXECUTIVE}>物业高管/老板</option><option value={UserRole.MANAGER}>项目负责人</option><option value={UserRole.EMPLOYEE}>普通员工</option></select></div>
                {editingUser.role !== UserRole.ADMIN && (<div className="space-y-1"><label className="text-xs text-slate-500 font-bold">所属公司</label><select value={editingUser.enterpriseName || ''} onChange={e => setEditingUser({...editingUser, enterpriseName: e.target.value})} className="w-full bg-black/40 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white" required><option value="">-- 请选择 --</option>{enterprises.map(ent => (<option key={ent} value={ent}>{ent}</option>))}</select></div>)}
             </div>
             <div className="mt-8 flex gap-3"><button type="button" onClick={() => setEditingUser(null)} className="flex-1 py-3 rounded-xl text-xs font-black bg-slate-800 text-slate-500 hover:text-white transition-colors">取消</button><button type="submit" className="flex-1 bg-orange-500 text-white py-3 rounded-xl text-xs font-black hover:bg-orange-600 transition-colors">保存</button></div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
