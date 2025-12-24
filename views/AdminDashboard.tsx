
import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard, Users, BookOpen, BrainCircuit,
  Plus, Trash2, ShieldCheck, UserPlus,
  Edit3, X, ListFilter, Camera, Scale, Save, Image as ImageIcon, Upload, Headphones, Settings, MonitorPlay, Building, Smartphone, Check, UserCheck, XCircle, MessageSquare
} from 'lucide-react';
import { api } from '../services/apiService';
import { DocumentItem, RiskScenario, User, UserRole, EvidenceGroup, LawArticle, CustomPosterTemplate, ContactQRCode, SystemConfig } from '../types';

const AdminDashboard: React.FC<{onLogout: () => void}> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<'kb' | 'docs' | 'risk' | 'evidence' | 'laws' | 'users' | 'companies' | 'posters' | 'contact' | 'config'>('kb');

  // 获取token的辅助函数
  const getToken = () => {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  };
  
  // Data States
  const [kbText, setKbText] = useState('');
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [riskScenarios, setRiskScenarios] = useState<RiskScenario[]>([]);
  const [evidenceList, setEvidenceList] = useState<EvidenceGroup[]>([]);
  const [lawArticles, setLawArticles] = useState<LawArticle[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [enterprises, setEnterprises] = useState<string[]>([]); 
  const [customPosters, setCustomPosters] = useState<CustomPosterTemplate[]>([]);
  const [contactQRs, setContactQRs] = useState<ContactQRCode[]>([]);
  const [systemConfig, setSystemConfig] = useState<SystemConfig>({ enablePhoneLogin: true, welcomeMessage: '' });
  
  // Config States
  const [splashImage, setSplashImage] = useState<string | null>(null);
  const splashInputRef = useRef<HTMLInputElement>(null);
  
  // Modals / Editing States
  const [editingDoc, setEditingDoc] = useState<DocumentItem | null>(null);
  const [editingRisk, setEditingRisk] = useState<RiskScenario | null>(null);
  const [editingEvidence, setEditingEvidence] = useState<EvidenceGroup | null>(null);
  const [editingLaw, setEditingLaw] = useState<LawArticle | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPosterModal, setShowPosterModal] = useState(false);
  
  // Companies Modal
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');

  // Poster Upload State
  const [newPosterName, setNewPosterName] = useState('');
  const [newPosterImage, setNewPosterImage] = useState<string | null>(null);
  const posterFileRef = useRef<HTMLInputElement>(null);

  // Contact QR Upload State
  const [showQRModal, setShowQRModal] = useState(false);
  const [newQRName, setNewQRName] = useState('');
  const [newQRImage, setNewQRImage] = useState<string | null>(null);
  const qrFileRef = useRef<HTMLInputElement>(null);
  
  // Category Manager State
  const [showCatManager, setShowCatManager] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      // 并行获取所有数据
      const [
        configData,
        docsData,
        risksData,
        evidenceData,
        lawsData,
        usersData,
        enterprisesData,
        postersData,
        qrData
      ] = await Promise.all([
        api.getConfig(),
        api.getDocuments(),
        api.getRisks(),
        api.getEvidence(),
        api.getCivilCode(),
        api.getUsers(token!),
        api.getEnterprises(),
        api.getPosters(),
        api.getContactQR()
      ]);

      setSystemConfig({
        enable_phone_login: configData.enable_phone_login,
        welcome_message: configData.welcome_message
      });
      setKbText(configData.ai_knowledge_base || '');

      // 设置开屏图
      if (configData.splash_image) {
        setSplashImage(configData.splash_image);
      }
      setDocs(docsData);
      setRiskScenarios(risksData);
      setEvidenceList(evidenceData);
      setLawArticles(lawsData);
      setUsers(usersData);
      setEnterprises(enterprisesData);
      setCustomPosters(postersData);
      setContactQRs(qrData);

      // 从文档中提取分类
      const uniqueCategories = Array.from(new Set(docsData.map((doc: any) => doc.category)));
      setCategories(['全部', ...uniqueCategories]);

    } catch (error) {
      console.error('加载数据失败:', error);
      alert('加载数据失败，请重新登录');
    }
  };

  const saveKB = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      await api.updateConfig({ ai_knowledge_base: kbText }, token!);
      alert('AI 知识库与系统指令已同步成功。');
    } catch (error) {
      alert('保存失败，请重试');
    }
  };

  const handleConfigChange = async (newConfig: Partial<SystemConfig>) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const updated = { ...systemConfig, ...newConfig };
      await api.updateConfig(updated, token!);
      setSystemConfig(updated);
    } catch (error) {
      alert('配置更新失败，请重试');
    }
  };

  // --- Splash Config Logic ---
  const handleSplashUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = ev.target?.result as string;
        try {
          const token = localStorage.getItem('token') || sessionStorage.getItem('token');
          await api.uploadSplashImage({ splash_image: base64 }, token!);
          setSplashImage(base64);
          alert('开屏图已更新，下次启动应用时生效。');
        } catch (error) {
          console.error('Failed to upload splash image:', error);
          alert('上传开屏图失败，请重试。');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetSplash = async () => {
    if (confirm('确定要恢复默认的品牌开屏动画吗？')) {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        await api.deleteSplashImage(token!);
        setSplashImage(null);
        alert('开屏图已恢复默认。');
      } catch (error) {
        console.error('Failed to delete splash image:', error);
        alert('恢复默认开屏图失败，请重试。');
      }
    }
  };

  // --- User Approval Logic ---
  const handleApproveUser = async (userId: string) => {
    if (confirm('确定批准该用户注册申请吗？')) {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        await api.approveUser(userId, token!);
        refreshData();
      } catch (error) {
        alert('审批失败，请重试');
      }
    }
  };

  const handleRejectUser = async (userId: string) => {
    if (confirm('确定拒绝该用户注册申请吗？')) {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        await api.deleteUser(userId, token!);
        refreshData();
      } catch (error) {
        alert('删除用户失败，请重试');
      }
    }
  };

  // ... (保留原有的 handleSaveDoc, handleAddCategory, handleAddCompany, etc. 逻辑不变，为了节省篇幅略去重复函数，仅需确保逻辑存在)
  // --- Document Logic ---
  const handleSaveDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc) return;

    try {
      const token = getToken();
      if (!token) {
        alert('请先登录');
        return;
      }

      const docData = {
        title: editingDoc.title,
        category: editingDoc.category,
        description: editingDoc.description,
        content: editingDoc.content
      };

      if (editingDoc.id) {
        // 更新现有文档
        await api.updateDocument(editingDoc.id, docData, token);
      } else {
        // 创建新文档
        await api.createDocument(docData, token);
      }

      refreshData();
      setEditingDoc(null);
    } catch (error) {
      console.error('保存文档失败:', error);
      alert('保存文档失败，请重试');
    }
  };

  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    if (categories.includes(newCatName.trim())) {
      alert('分类已存在');
      return;
    }
    const updated = [...categories, newCatName.trim()];
    // 注意：后端目前没有_categories独立的API，分类存储在文档中
    // 这里先在前端维护，后续可以考虑添加分类管理API
    setCategories(updated);
    setNewCatName('');
  };

  const handleDeleteCategory = (cat: string) => {
    if (cat === '全部') {
      alert('无法删除"全部"分类');
      return;
    }
    if (confirm(`确定删除分类"${cat}"吗？`)) {
      const updated = categories.filter(c => c !== cat);
      // 注意：后端目前没有_categories独立的API，分类存储在文档中
      // 这里先在前端维护，后续可以考虑添加分类管理API
      setCategories(updated);
    }
  };

  // --- Enterprise Logic ---
  const handleAddCompany = async () => {
    if (!newCompanyName.trim()) return;
    if (enterprises.includes(newCompanyName.trim())) {
      alert('该公司名称已存在');
      return;
    }

    try {
      const token = getToken();
      if (!token) {
        alert('请先登录');
        return;
      }

      await api.createEnterprise(newCompanyName.trim(), token);
      refreshData();
      setNewCompanyName('');
      setShowCompanyModal(false);
    } catch (error) {
      console.error('添加公司失败:', error);
      alert('添加公司失败，请重试');
    }
  };

  const handleDeleteCompany = async (name: string) => {
    if (confirm(`确定删除物业公司"${name}"吗？\n删除后，隶属于该公司的员工账号可能显示异常。`)) {
      try {
        const token = getToken();
        if (!token) {
          alert('请先登录');
          return;
        }

        await api.deleteEnterprise(name, token);
        refreshData();
      } catch (error) {
        console.error('删除公司失败:', error);
        alert('删除公司失败，请重试');
      }
    }
  };

  // --- Risk Logic ---
  const handleSaveRisk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRisk) return;

    try {
      const token = getToken();
      if (!token) {
        alert('请先登录');
        return;
      }

      const riskData = {
        title: editingRisk.title,
        risk_level: editingRisk.risk_level,
        content: editingRisk.content,
        questions: editingRisk.questions || []
      };

      if (editingRisk.id) {
        // 更新现有风险场景
        await api.updateRisk(editingRisk.id, riskData, token);
      } else {
        // 创建新风险场景
        await api.createRisk(riskData, token);
      }

      refreshData();
      setEditingRisk(null);
    } catch (error) {
      console.error('保存风险场景失败:', error);
      alert('保存风险场景失败，请重试');
    }
  };

  // --- Evidence Logic ---
  const handleSaveEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvidence) return;

    try {
      const token = getToken();
      if (!token) {
        alert('请先登录');
        return;
      }

      const evidenceData = {
        title: editingEvidence.title,
        items: editingEvidence.items || []
      };

      if (editingEvidence.id) {
        // 更新现有证据清单
        await api.updateEvidence(editingEvidence.id, evidenceData, token);
      } else {
        // 创建新证据清单
        await api.createEvidence(evidenceData, token);
      }

      refreshData();
      setEditingEvidence(null);
    } catch (error) {
      console.error('保存证据清单失败:', error);
      alert('保存证据清单失败，请重试');
    }
  };

  // --- Law Logic ---
  const handleSaveLaw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLaw) return;

    try {
      const token = getToken();
      if (!token) {
        alert('请先登录');
        return;
      }

      const lawData = {
        title: editingLaw.title,
        content: editingLaw.content
      };

      if (editingLaw.id) {
        // 更新现有民法典条文
        await api.updateCivilCode(editingLaw.id, lawData, token);
      } else {
        // 创建新民法典条文
        await api.createCivilCode(lawData, token);
      }

      refreshData();
      setEditingLaw(null);
    } catch (error) {
      console.error('保存民法典条文失败:', error);
      alert('保存民法典条文失败，请重试');
    }
  };

  // --- User Logic ---
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    if (editingUser.role === UserRole.USER && !editingUser.enterpriseName) {
      alert('请选择该员工所属的物业公司');
      return;
    }

    try {
      const token = getToken();
      if (!token) {
        alert('请先登录');
        return;
      }

      const userData = {
        username: editingUser.username,
        phone_number: editingUser.phone_number,
        enterprise_name: editingUser.enterpriseName,
        approval_status: editingUser.approval_status,
        is_certified: editingUser.is_certified
      };

      if (editingUser.id) {
        // 更新现有用户
        await api.updateUser(editingUser.id, userData, token);
      } else {
        // 注意：新用户创建应该通过注册流程，这里只做更新
        alert('新用户请通过注册流程创建');
        return;
      }

      refreshData();
      setEditingUser(null);
    } catch (error) {
      console.error('保存用户失败:', error);
      alert('保存用户失败，请重试');
    }
  };
  
  // --- Poster Logic ---
  const handlePosterImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setNewPosterImage(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSavePoster = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPosterName.trim() || !newPosterImage) return;

    try {
      const token = getToken();
      if (!token) {
        alert('请先登录');
        return;
      }

      const posterData = {
        name: newPosterName.trim(),
        image_base64: newPosterImage
      };

      await api.createPoster(posterData, token);

      refreshData();
      setNewPosterName('');
      setNewPosterImage(null);
      setShowPosterModal(false);
    } catch (error) {
      console.error('保存海报失败:', error);
      alert('保存海报失败，请重试');
    }
  };

  // --- QR Code Logic ---
  const handleQRImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setNewQRImage(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveQR = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQRName.trim() || !newQRImage) return;

    try {
      const token = getToken();
      if (!token) {
        alert('请先登录');
        return;
      }

      const qrData = {
        name: newQRName.trim(),
        image_base64: newQRImage
      };

      await api.createContactQR(qrData, token);

      refreshData();
      setNewQRName('');
      setNewQRImage(null);
      setShowQRModal(false);
    } catch (error) {
      console.error('保存二维码失败:', error);
      alert('保存二维码失败，请重试');
    }
  };

  const deleteItem = async (type: 'doc'|'risk'|'evidence'|'law'|'user'|'poster'|'qr', id: string) => {
    if (!confirm('确定删除此项吗？')) return;

    try {
      const token = getToken();
      if (!token) {
        alert('请先登录');
        return;
      }

      if (type === 'doc') {
        await api.deleteDocument(id, token);
      } else if (type === 'risk') {
        await api.deleteRisk(id, token);
      } else if (type === 'evidence') {
        await api.deleteEvidence(id, token);
      } else if (type === 'law') {
        await api.deleteCivilCode(id, token);
      } else if (type === 'user') {
        await api.deleteUser(id, token);
      } else if (type === 'poster') {
        await api.deletePoster(id, token);
      } else if (type === 'qr') {
        await api.deleteContactQR(id, token);
      }

      refreshData();
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败，请重试');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0c10] text-slate-300 flex font-sans overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 bg-[#12151c] border-r border-slate-800 flex flex-col shadow-2xl">
        <div className="p-8 border-b border-slate-800 flex items-center gap-3">
          <div className="bg-orange-500 p-2 rounded-xl"><ShieldCheck className="text-white" size={24} /></div>
          <div><h1 className="text-lg font-black text-white">东元后台</h1><p className="text-[8px] text-orange-500 uppercase font-bold tracking-widest">Legal OS v4.1</p></div>
        </div>
        
        <nav className="flex-1 p-6 space-y-2">
          {[
            { id: 'kb', icon: BrainCircuit, label: 'AI 知识引擎', desc: '训练语料与提示词配置' },
            { id: 'config', icon: Settings, label: '系统外观配置', desc: '开屏、登录与全局设置' },
            { id: 'users', icon: Users, label: '员工账号体系', desc: '审批注册与权限管理' },
            { id: 'companies', icon: Building, label: '物业公司管理', desc: '企业主体与组织架构' },
            { id: 'docs', icon: BookOpen, label: '文书模版中心', desc: '合同/函件内容维护' },
            { id: 'risk', icon: LayoutDashboard, label: '合规自查表', desc: '风险场景与检查项' },
            { id: 'evidence', icon: Camera, label: '取证清单配置', desc: '标准证据闭环维护' },
            { id: 'laws', icon: Scale, label: '民法典数据库', desc: '法律条文更新' },
            { id: 'posters', icon: ImageIcon, label: '海报模板配置', desc: '上传自定义背景图' },
            { id: 'contact', icon: Headphones, label: '咨询通道配置', desc: '企业微信二维码管理' },
          ].map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`w-full text-left p-4 rounded-2xl border transition-all ${activeTab === item.id ? 'bg-orange-500/10 border-orange-500/40 text-white' : 'border-transparent hover:bg-white/5 text-slate-500'}`}>
              <div className="flex items-center gap-4">
                <item.icon size={20} className={activeTab === item.id ? 'text-orange-400' : ''} />
                <div><div className="font-bold text-sm">{item.label}</div><div className="text-[9px] opacity-40">{item.desc}</div></div>
              </div>
            </button>
          ))}
        </nav>
        
        <div className="p-6"><button onClick={onLogout} className="w-full py-4 bg-red-500/10 text-red-500 rounded-2xl font-bold text-xs">退出后台管理</button></div>
      </div>

      <main className="flex-1 overflow-y-auto p-10 bg-[#0a0c10] no-scrollbar">
        {/* KB Tab */}
        {activeTab === 'kb' && (
          <div className="grid grid-cols-2 gap-8 h-full">
            <div className="bg-[#12151c] p-8 rounded-3xl border border-slate-800 flex flex-col">
              <div className="flex justify-between mb-4"><h3 className="font-bold text-white flex items-center gap-2"><BrainCircuit size={18}/> 核心 Prompt (提示词)</h3><button onClick={saveKB} className="bg-orange-500 text-white px-4 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1"><Save size={12}/> 保存设置</button></div>
              <textarea value={kbText} onChange={e => setKbText(e.target.value)} className="flex-1 bg-black/40 border border-slate-800 rounded-2xl p-6 text-slate-400 font-mono text-sm leading-relaxed outline-none focus:border-orange-500/30 transition-all" />
            </div>
            <div className="bg-[#12151c] p-8 rounded-3xl border border-slate-800">
              <h3 className="font-bold text-white mb-4">Prompt 工程说明</h3>
              <div className="space-y-4 text-xs text-slate-500 leading-loose">
                <p>此处配置 AI 的核心人设（System Instruction）。所有前端 AI 功能（智能问答、文书生成、纠纷诊断）均会受此影响。</p>
                <p>建议包含：1. 身份定义（东元物业法务专家）；2. 法律依据（民法典）；3. 语言风格（严谨、专业）。</p>
              </div>
            </div>
          </div>
        )}

        {/* Config Tab (Splash Screen & System Settings) */}
        {activeTab === 'config' && (
          <div className="max-w-4xl mx-auto space-y-8">
             {/* 登录设置 */}
             <div className="bg-[#12151c] border border-slate-800 rounded-[2.5rem] p-10">
                <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3">
                   <Settings className="text-orange-500" /> 功能模块开关
                </h3>
                <div className="bg-white/5 p-6 rounded-2xl flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className="bg-blue-500/20 p-3 rounded-xl text-blue-400"><Smartphone size={24} /></div>
                      <div>
                         <div className="font-bold text-white">手机验证码登录</div>
                         <div className="text-xs text-slate-500 mt-1">开启后，登录页将显示“验证并登录”选项。</div>
                      </div>
                   </div>
                   <button 
                     onClick={() => handleConfigChange({ enablePhoneLogin: !systemConfig.enablePhoneLogin })}
                     className={`w-14 h-8 rounded-full p-1 transition-colors ${systemConfig.enablePhoneLogin ? 'bg-orange-500' : 'bg-slate-700'}`}
                   >
                      <div className={`w-6 h-6 bg-white rounded-full transition-transform ${systemConfig.enablePhoneLogin ? 'translate-x-6' : 'translate-x-0'}`}></div>
                   </button>
                </div>

                {/* AI 欢迎语配置 (新增加) */}
                <div className="mt-8">
                  <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                     <MessageSquare size={18} className="text-blue-400" /> AI 助手默认欢迎语
                  </h4>
                  <textarea 
                    value={systemConfig.welcomeMessage}
                    onChange={(e) => handleConfigChange({ welcomeMessage: e.target.value })}
                    className="w-full bg-white/5 border border-slate-700 rounded-2xl p-6 text-slate-300 text-sm leading-relaxed outline-none focus:border-orange-500/50 h-32 resize-none"
                    placeholder="配置用户进入 AI 咨询页面时看到的默认欢迎语..."
                  />
                  <div className="text-[10px] text-slate-500 mt-2">
                     修改后，用户下次进入“AI 法务助手”时生效。
                  </div>
                </div>
             </div>

             {/* 开屏页设置 */}
             <div className="bg-[#12151c] border border-slate-800 rounded-[2.5rem] p-10">
                <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3">
                   <MonitorPlay className="text-orange-500" /> App 开屏页配置
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   {/* 预览区 */}
                   <div className="space-y-4">
                      <div className="text-xs font-bold text-slate-500 uppercase">当前效果预览</div>
                      <div className="relative aspect-[9/16] bg-black rounded-3xl overflow-hidden border-4 border-slate-800 shadow-2xl flex items-center justify-center">
                         {splashImage ? (
                            <img src={splashImage} className="w-full h-full object-cover" alt="Splash Preview" />
                         ) : (
                            // 默认预览
                            <div className="w-full h-full bg-[#F38020] flex flex-col items-center justify-center text-white p-6 relative">
                               <div className="absolute inset-0 bg-gradient-to-br from-[#FF9800] via-[#F38020] to-[#E65100]"></div>
                               <h1 className="text-4xl font-bold relative z-10 tracking-tighter">eastcapital</h1>
                               <div className="text-sm font-bold mt-2 relative z-10 tracking-[0.2em]">东元法物</div>
                               <div className="absolute bottom-10 text-[8px] opacity-50 font-mono">DEFAULT PREVIEW</div>
                            </div>
                         )}
                         <div className="absolute top-0 w-32 h-6 bg-black rounded-b-xl z-20"></div>
                      </div>
                   </div>

                   {/* 操作区 */}
                   <div className="flex flex-col justify-center space-y-6">
                      <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-6">
                         <h4 className="font-bold text-orange-500 mb-2">配置说明</h4>
                         <p className="text-xs text-orange-200/60 leading-relaxed">
                            您可上传自定义的品牌宣传图作为 App 启动页。图片将全屏展示（建议尺寸 1080x1920，PNG/JPG 格式）。若不上传，系统将显示默认的“东元法物”橙色品牌动画。
                         </p>
                      </div>

                      <div className="space-y-3">
                         <button 
                           onClick={() => splashInputRef.current?.click()}
                           className="w-full py-4 bg-white text-black rounded-xl font-black text-sm hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                         >
                           <Upload size={18} /> 上传自定义开屏图
                         </button>
                         <input ref={splashInputRef} type="file" accept="image/*" className="hidden" onChange={handleSplashUpload} />

                         {splashImage && (
                           <button 
                             onClick={handleResetSplash}
                             className="w-full py-4 bg-slate-800 text-slate-400 rounded-xl font-bold text-sm hover:bg-red-500/10 hover:text-red-500 transition-colors flex items-center justify-center gap-2"
                           >
                             <Trash2 size={18} /> 恢复默认动画
                           </button>
                         )}
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}

        {/* Users Tab (Updated with Approval) */}
        {activeTab === 'users' && (
          <div className="space-y-8">
             
             {/* 待审核列表 */}
             {users.some(u => u.approvalStatus === 'PENDING') && (
               <div className="bg-orange-500/10 border border-orange-500/30 rounded-3xl p-6">
                 <h4 className="font-bold text-orange-500 flex items-center gap-2 mb-4"><UserCheck size={18} /> 待审核注册申请</h4>
                 <div className="space-y-3">
                    {users.filter(u => u.approvalStatus === 'PENDING').map(u => (
                      <div key={u.id} className="bg-[#12151c] rounded-2xl p-4 flex items-center justify-between border border-slate-800">
                         <div className="flex items-center gap-4">
                            <div className="bg-slate-800 p-2 rounded-lg text-slate-400"><UserPlus size={20} /></div>
                            <div>
                               <div className="text-white font-bold">{u.username} <span className="text-slate-500 font-normal text-xs ml-2">{u.phoneNumber}</span></div>
                               <div className="text-xs text-orange-400 mt-1">申请加入：{u.enterpriseName}</div>
                            </div>
                         </div>
                         <div className="flex gap-2">
                            <button onClick={() => handleApproveUser(u.id)} className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl text-xs font-bold flex items-center gap-1"><Check size={14}/> 批准</button>
                            <button onClick={() => handleRejectUser(u.id)} className="px-4 py-2 bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1"><X size={14}/> 拒绝</button>
                         </div>
                      </div>
                    ))}
                 </div>
               </div>
             )}

             <div className="bg-[#12151c] rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
               <div className="p-6 border-b border-slate-800 bg-black/20">
                  <h4 className="font-bold text-white text-sm">正式员工列表</h4>
               </div>
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="bg-black/20 text-[10px] font-black uppercase tracking-widest text-slate-600 border-b border-slate-800">
                     <th className="p-6">账号信息</th>
                     <th className="p-6">所属物业公司</th>
                     <th className="p-6">状态</th>
                     <th className="p-6 text-right">操作</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-800">
                   {users.filter(u => u.approvalStatus !== 'PENDING').map(u => (
                     <tr key={u.id} className="hover:bg-white/5 transition-colors group">
                       <td className="p-6 font-bold text-white text-sm">
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs text-slate-400 shrink-0">
                                {u.username.slice(0, 1).toUpperCase()}
                             </div>
                             <div>
                                <div>{u.username}</div>
                                <div className="text-xs text-slate-500 font-normal">{u.phoneNumber || '无手机号'}</div>
                             </div>
                          </div>
                       </td>
                       <td className="p-6 text-xs text-slate-400">
                          <span className={`px-2 py-1 rounded-md ${u.role === UserRole.ADMIN ? 'bg-purple-900/30 text-purple-400' : 'bg-slate-800 text-slate-300'}`}>
                             {u.role === UserRole.ADMIN ? '系统全局' : (u.enterpriseName || '未分配')}
                          </span>
                       </td>
                       <td className="p-6 text-xs">
                          {u.approvalStatus === 'REJECTED' ? (
                            <span className="text-red-500 flex items-center gap-1"><XCircle size={12}/> 已拒绝</span>
                          ) : (
                            <span className="text-green-500 flex items-center gap-1"><Check size={12}/> 正常</span>
                          )}
                       </td>
                       <td className="p-6 text-right">
                         <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                            <button onClick={() => setEditingUser({...u})} className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white"><Edit3 size={16}/></button>
                            <button onClick={() => deleteItem('user', u.id)} className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white"><Trash2 size={16}/></button>
                         </div>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
            </div>
            <button onClick={() => setEditingUser({ id: Date.now().toString(), username: '', password: '123', role: UserRole.USER, isCertified: true, approvalStatus: 'APPROVED', enterpriseName: '' })} className="bg-orange-500 text-white px-6 py-3 rounded-xl text-xs font-bold w-full">新增员工账号</button>
          </div>
        )}

        {/* ... (其他 Tab 内容保持不变) ... */}
        {/* Companies Tab */}
        {activeTab === 'companies' && (
           <div className="space-y-6">
             <div className="flex justify-between items-center bg-[#12151c] p-8 rounded-3xl border border-slate-800">
               <div>
                  <h3 className="font-black text-white text-xl">物业公司主体管理</h3>
                  <p className="text-xs text-slate-500 mt-2">创建公司后，可在“员工账号体系”中分配账号归属。</p>
               </div>
               <button onClick={() => setShowCompanyModal(true)} className="bg-orange-500 text-white px-8 py-3 rounded-xl text-xs font-bold flex items-center gap-2">
                 <Plus size={16} /> 新增公司
               </button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {enterprises.map(ent => (
                  <div key={ent} className="bg-[#12151c] border border-slate-800 rounded-3xl p-6 flex items-center justify-between group hover:border-orange-500/30 transition-all">
                    <div className="flex items-center gap-4">
                       <div className="bg-white/5 p-3 rounded-xl text-slate-300 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                          <Building size={24} />
                       </div>
                       <div>
                          <div className="font-bold text-white">{ent}</div>
                          <div className="text-[10px] text-slate-500 mt-1">
                             现有员工: {users.filter(u => u.enterpriseName === ent).length} 人
                          </div>
                       </div>
                    </div>
                    <button onClick={() => handleDeleteCompany(ent)} className="p-2 text-slate-600 hover:text-red-500 transition-colors">
                       <Trash2 size={16} />
                    </button>
                  </div>
                ))}
             </div>
           </div>
        )}
        
        {/* Generic List View for Docs/Evidence/Laws/Risk */}
        {activeTab !== 'kb' && activeTab !== 'config' && activeTab !== 'users' && activeTab !== 'companies' && activeTab !== 'posters' && activeTab !== 'contact' && (
          <div className="space-y-6">
            <div className="flex gap-2">
              <button 
                onClick={() => {
                   if (activeTab === 'docs') setEditingDoc({ id: Date.now().toString(), title: '', category: categories[1] || '全部', description: '', content: '' });
                   if (activeTab === 'risk') setEditingRisk({ id: Date.now().toString(), title: '新风险场景', questions: [] });
                   if (activeTab === 'evidence') setEditingEvidence({ id: Date.now().toString(), title: '新取证分类', items: [] });
                   if (activeTab === 'laws') setEditingLaw({ id: Date.now().toString(), title: '', content: '' });
                }}
                className="bg-orange-500 text-white px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-orange-600 transition-colors"
              >
                <Plus size={16}/> 新增项目
              </button>
              {activeTab === 'docs' && (
                <button onClick={() => setShowCatManager(true)} className="bg-slate-800 text-white px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-slate-700 transition-colors"><ListFilter size={16}/> 业务分类管理</button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {/* Docs Rendering */}
              {activeTab === 'docs' && docs.map(doc => (
                <div key={doc.id} className="bg-[#12151c] border border-slate-800 p-6 rounded-3xl group hover:border-orange-500/50 transition-all">
                  <div className="flex justify-between mb-4">
                    <span className="text-[9px] bg-slate-800 text-slate-400 px-2 py-1 rounded uppercase font-bold">{doc.category}</span>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setEditingDoc(doc)} className="text-slate-500 hover:text-white"><Edit3 size={16}/></button>
                      <button onClick={() => deleteItem('doc', doc.id)} className="text-slate-500 hover:text-red-500"><Trash2 size={16}/></button>
                    </div>
                  </div>
                  <h4 className="font-bold text-white mb-2">{doc.title}</h4>
                  <p className="text-[10px] text-slate-500 leading-relaxed line-clamp-2">{doc.description}</p>
                </div>
              ))}

              {/* Risk Rendering */}
              {activeTab === 'risk' && riskScenarios.map(r => (
                <div key={r.id} className="bg-[#12151c] border border-slate-800 p-6 rounded-3xl group hover:border-orange-500/50 transition-all">
                  <div className="flex justify-between mb-4">
                     <h4 className="font-bold text-white">{r.title}</h4>
                     <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setEditingRisk(r)} className="text-slate-500 hover:text-white"><Edit3 size={16}/></button>
                      <button onClick={() => deleteItem('risk', r.id)} className="text-slate-500 hover:text-red-500"><Trash2 size={16}/></button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {r.questions?.slice(0, 3).map((q, i) => (
                      <div key={i} className="text-[10px] text-slate-500 truncate">• {q}</div>
                    ))}
                    {(r.questions?.length || 0) > 3 && <div className="text-[9px] text-slate-600">...共 {r.questions?.length} 项</div>}
                  </div>
                </div>
              ))}

              {/* Evidence Rendering */}
              {activeTab === 'evidence' && evidenceList.map(e => (
                 <div key={e.id} className="bg-[#12151c] border border-slate-800 p-6 rounded-3xl group hover:border-orange-500/50 transition-all">
                  <div className="flex justify-between mb-4">
                     <h4 className="font-bold text-white">{e.title}</h4>
                     <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setEditingEvidence(e)} className="text-slate-500 hover:text-white"><Edit3 size={16}/></button>
                      <button onClick={() => deleteItem('evidence', e.id)} className="text-slate-500 hover:text-red-500"><Trash2 size={16}/></button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {e.items.slice(0, 3).map((item, i) => (
                      <div key={i} className="text-[10px] text-slate-500 truncate">• {item}</div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Law Rendering */}
              {activeTab === 'laws' && lawArticles.map(l => (
                 <div key={l.id} className="bg-[#12151c] border border-slate-800 p-6 rounded-3xl group hover:border-orange-500/50 transition-all">
                  <div className="flex justify-between mb-2">
                     <span className="text-xs font-black text-orange-500">{l.title}</span>
                     <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setEditingLaw(l)} className="text-slate-500 hover:text-white"><Edit3 size={16}/></button>
                      <button onClick={() => deleteItem('law', l.id)} className="text-slate-500 hover:text-red-500"><Trash2 size={16}/></button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">{l.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Posters Tab */}
        {activeTab === 'posters' && (
          <div className="space-y-6">
             <button onClick={() => setShowPosterModal(true)} className="bg-orange-500 text-white px-6 py-3 rounded-xl text-xs font-bold w-full flex items-center justify-center gap-2">
               <Upload size={16} /> 上传新海报模板 (背景图)
             </button>
             
             <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {customPosters.map(p => (
                  <div key={p.id} className="bg-[#12151c] border border-slate-800 rounded-3xl overflow-hidden group relative aspect-[3/4]">
                    <img src={p.imageBase64} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" alt={p.name} />
                    <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/90 to-transparent">
                      <div className="font-bold text-white text-xs mb-1">{p.name}</div>
                      <div className="text-[9px] text-slate-400">{new Date(p.createdAt).toLocaleDateString()}</div>
                    </div>
                    <button 
                      onClick={() => deleteItem('poster', p.id)} 
                      className="absolute top-2 right-2 p-2 bg-red-500/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
             </div>
          </div>
        )}

        {/* Contact QR Tab */}
        {activeTab === 'contact' && (
          <div className="space-y-6">
             <button onClick={() => setShowQRModal(true)} className="bg-orange-500 text-white px-6 py-3 rounded-xl text-xs font-bold w-full flex items-center justify-center gap-2">
               <Plus size={16} /> 新增企业微信二维码 (支持多张轮询)
             </button>
             
             <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {contactQRs.map(qr => (
                  <div key={qr.id} className="bg-[#12151c] border border-slate-800 rounded-3xl p-4 flex flex-col items-center group relative">
                    <div className="w-full aspect-square bg-white rounded-2xl p-2 mb-3">
                       <img src={qr.imageBase64} className="w-full h-full object-contain" alt={qr.name} />
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-white text-sm mb-1">{qr.name}</div>
                      <div className="text-[9px] text-slate-500">上传于 {new Date(qr.createdAt).toLocaleDateString()}</div>
                    </div>
                    <button 
                      onClick={() => deleteItem('qr', qr.id)} 
                      className="absolute top-2 right-2 p-2 bg-red-500/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
             </div>
          </div>
        )}

      </main>

      {/* --- EDIT MODALS --- */}
      
      {/* Category Manager Modal */}
      {showCatManager && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/80 backdrop-blur-sm animate-fade-in">
           <div className="bg-[#12151c] w-full max-w-md rounded-[2rem] border border-slate-800 p-8 shadow-2xl">
             <div className="flex justify-between items-center mb-6">
                <h3 className="font-black text-white text-xl">业务分类管理</h3>
                <button onClick={() => setShowCatManager(false)} className="text-slate-500 hover:text-white"><X size={20}/></button>
             </div>
             
             <div className="flex gap-2 mb-6">
                <input 
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white"
                  placeholder="新分类名称"
                />
                <button onClick={handleAddCategory} className="bg-orange-500 text-white px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap">添加</button>
             </div>

             <div className="space-y-2 max-h-60 overflow-y-auto no-scrollbar">
                {categories.map(cat => (
                  <div key={cat} className="flex justify-between items-center bg-white/5 px-4 py-3 rounded-xl border border-white/5">
                     <span className="text-sm text-slate-300 font-bold">{cat}</span>
                     {cat !== '全部' && (
                        <button onClick={() => handleDeleteCategory(cat)} className="text-slate-600 hover:text-red-500 transition-colors">
                           <Trash2 size={14} />
                        </button>
                     )}
                  </div>
                ))}
             </div>
           </div>
        </div>
      )}

      {/* Company Add Modal */}
      {showCompanyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/80 backdrop-blur-sm animate-fade-in">
           <div className="bg-[#12151c] w-full max-w-md rounded-[2rem] border border-slate-800 p-8 shadow-2xl">
             <div className="flex justify-between items-center mb-6">
                <h3 className="font-black text-white text-xl">新增物业公司</h3>
                <button onClick={() => setShowCompanyModal(false)} className="text-slate-500 hover:text-white"><X size={20}/></button>
             </div>
             
             <div className="space-y-4">
                <div className="space-y-2">
                   <label className="text-xs text-slate-500 font-bold">公司/项目名称</label>
                   <input 
                     value={newCompanyName}
                     onChange={(e) => setNewCompanyName(e.target.value)}
                     className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-orange-500/50 outline-none"
                     placeholder="例如：万科物业城市花园项目"
                   />
                </div>
                <button onClick={handleAddCompany} className="w-full bg-orange-500 text-white px-4 py-3 rounded-xl text-xs font-bold">立即创建</button>
             </div>
           </div>
        </div>
      )}

      {/* Poster Upload Modal */}
      {showPosterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/80 backdrop-blur-sm animate-fade-in">
           <form onSubmit={handleSavePoster} className="bg-[#12151c] w-full max-w-md rounded-[2rem] border border-slate-800 p-8 shadow-2xl">
             <h3 className="font-black text-white text-xl mb-6">上传海报背景</h3>
             <div className="space-y-4">
               <input 
                 value={newPosterName} 
                 onChange={e => setNewPosterName(e.target.value)} 
                 className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white" 
                 placeholder="模板名称 (如：节日促销)" 
                 required 
               />
               
               <div 
                 onClick={() => posterFileRef.current?.click()}
                 className="w-full aspect-[3/4] bg-slate-900 border border-dashed border-slate-700 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-800 transition-colors relative overflow-hidden"
               >
                 {newPosterImage ? (
                   <img src={newPosterImage} className="w-full h-full object-cover absolute inset-0" alt="Preview" />
                 ) : (
                   <>
                     <Upload size={24} className="text-slate-500 mb-2" />
                     <span className="text-xs text-slate-500">点击选择图片</span>
                   </>
                 )}
                 <input type="file" ref={posterFileRef} onChange={handlePosterImageUpload} className="hidden" accept="image/*" />
               </div>
             </div>
             <div className="mt-6 flex gap-3">
               <button type="button" onClick={() => setShowPosterModal(false)} className="flex-1 py-3 bg-slate-800 text-slate-500 rounded-xl text-xs font-bold">取消</button>
               <button type="submit" className="flex-1 py-3 bg-orange-500 text-white rounded-xl text-xs font-bold">保存模板</button>
             </div>
           </form>
        </div>
      )}

      {/* QR Upload Modal */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/80 backdrop-blur-sm animate-fade-in">
           <form onSubmit={handleSaveQR} className="bg-[#12151c] w-full max-w-md rounded-[2rem] border border-slate-800 p-8 shadow-2xl">
             <h3 className="font-black text-white text-xl mb-6">配置咨询通道</h3>
             <div className="space-y-4">
               <input 
                 value={newQRName} 
                 onChange={e => setNewQRName(e.target.value)} 
                 className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white" 
                 placeholder="联系人名称 (如：值班律师A)" 
                 required 
               />
               
               <div 
                 onClick={() => qrFileRef.current?.click()}
                 className="w-full aspect-square bg-slate-900 border border-dashed border-slate-700 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-800 transition-colors relative overflow-hidden"
               >
                 {newQRImage ? (
                   <img src={newQRImage} className="w-full h-full object-contain absolute inset-0 p-4" alt="Preview" />
                 ) : (
                   <>
                     <Upload size={24} className="text-slate-500 mb-2" />
                     <span className="text-xs text-slate-500">点击上传企业微信二维码</span>
                   </>
                 )}
                 <input type="file" ref={qrFileRef} onChange={handleQRImageUpload} className="hidden" accept="image/*" />
               </div>
             </div>
             <div className="mt-6 flex gap-3">
               <button type="button" onClick={() => setShowQRModal(false)} className="flex-1 py-3 bg-slate-800 text-slate-500 rounded-xl text-xs font-bold">取消</button>
               <button type="submit" className="flex-1 py-3 bg-orange-500 text-white rounded-xl text-xs font-bold">保存</button>
             </div>
           </form>
        </div>
      )}

      {/* Risk Editor */}
      {editingRisk && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/80 backdrop-blur-sm animate-fade-in">
          <form onSubmit={handleSaveRisk} className="bg-[#12151c] w-full max-w-xl rounded-3xl border border-slate-800 p-8 shadow-2xl max-h-[80vh] overflow-y-auto">
            <h3 className="font-black text-white text-xl mb-6">编辑自查场景</h3>
            <div className="space-y-4">
              <input value={editingRisk.title} onChange={e => setEditingRisk({...editingRisk, title: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white" placeholder="场景标题" required />
              <div className="space-y-2">
                 <label className="text-xs text-slate-500 font-bold">检查项 (每行一项)</label>
                 <textarea 
                   value={editingRisk.questions?.join('\n')} 
                   onChange={e => setEditingRisk({...editingRisk, questions: e.target.value.split('\n')})} 
                   className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-sm h-64 outline-none text-white" 
                 />
              </div>
            </div>
            <div className="mt-8 flex justify-end gap-3">
              <button type="button" onClick={() => setEditingRisk(null)} className="px-6 py-2 rounded-xl text-xs font-bold text-slate-500">取消</button>
              <button type="submit" className="bg-orange-500 text-white px-10 py-2 rounded-xl text-xs font-bold">保存</button>
            </div>
          </form>
        </div>
      )}

      {/* Evidence Editor */}
      {editingEvidence && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/80 backdrop-blur-sm animate-fade-in">
          <form onSubmit={handleSaveEvidence} className="bg-[#12151c] w-full max-w-xl rounded-3xl border border-slate-800 p-8 shadow-2xl max-h-[80vh] overflow-y-auto">
            <h3 className="font-black text-white text-xl mb-6">编辑取证清单</h3>
            <div className="space-y-4">
              <input value={editingEvidence.title} onChange={e => setEditingEvidence({...editingEvidence, title: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white" placeholder="清单标题" required />
              <div className="space-y-2">
                 <label className="text-xs text-slate-500 font-bold">所需证据 (每行一项)</label>
                 <textarea 
                   value={editingEvidence.items.join('\n')} 
                   onChange={e => setEditingEvidence({...editingEvidence, items: e.target.value.split('\n')})} 
                   className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-sm h-64 outline-none text-white" 
                 />
              </div>
            </div>
            <div className="mt-8 flex justify-end gap-3">
              <button type="button" onClick={() => setEditingEvidence(null)} className="px-6 py-2 rounded-xl text-xs font-bold text-slate-500">取消</button>
              <button type="submit" className="bg-orange-500 text-white px-10 py-2 rounded-xl text-xs font-bold">保存</button>
            </div>
          </form>
        </div>
      )}

      {/* Law Editor */}
      {editingLaw && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/80 backdrop-blur-sm animate-fade-in">
          <form onSubmit={handleSaveLaw} className="bg-[#12151c] w-full max-w-xl rounded-3xl border border-slate-800 p-8 shadow-2xl">
            <h3 className="font-black text-white text-xl mb-6">编辑法条</h3>
            <div className="space-y-4">
              <input value={editingLaw.title} onChange={e => setEditingLaw({...editingLaw, title: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white" placeholder="条款 (如：第九百四十四条)" required />
              <textarea value={editingLaw.content} onChange={e => setEditingLaw({...editingLaw, content: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-sm h-64 outline-none text-white" placeholder="正文内容" required />
            </div>
            <div className="mt-8 flex justify-end gap-3">
              <button type="button" onClick={() => setEditingLaw(null)} className="px-6 py-2 rounded-xl text-xs font-bold text-slate-500">取消</button>
              <button type="submit" className="bg-orange-500 text-white px-10 py-2 rounded-xl text-xs font-bold">保存</button>
            </div>
          </form>
        </div>
      )}

      {/* Doc Editor Reuse from Previous Logic */}
      {editingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/80 backdrop-blur-sm animate-fade-in">
          <form onSubmit={handleSaveDoc} className="bg-[#12151c] w-full max-w-4xl rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
             <div className="p-8 border-b border-slate-800 flex justify-between items-center">
               <h3 className="font-black text-white text-xl">文书模版编辑器</h3>
               <button type="button" onClick={() => setEditingDoc(null)} className="text-slate-500"><X size={24}/></button>
             </div>
             <div className="flex-1 overflow-y-auto p-10 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">标题</label>
                      <input value={editingDoc.title} onChange={e => setEditingDoc({...editingDoc, title: e.target.value})} className="w-full bg-black/40 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white" required />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">分类</label>
                      <select value={editingDoc.category} onChange={e => setEditingDoc({...editingDoc, category: e.target.value})} className="w-full bg-black/40 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white">
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                   </div>
                </div>
                <textarea value={editingDoc.content} onChange={e => setEditingDoc({...editingDoc, content: e.target.value})} className="flex-1 bg-black/40 border border-slate-800 rounded-2xl p-6 text-sm text-slate-300 font-mono h-80 outline-none" required />
             </div>
             <div className="p-8 border-t border-slate-800 flex justify-end"><button type="submit" className="bg-orange-500 text-white px-10 py-3 rounded-2xl font-black text-sm">保存文书数据</button></div>
          </form>
        </div>
      )}

      {/* User Editor (UPDATED: Company Select & Phone) */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/80 backdrop-blur-sm animate-fade-in">
          <form onSubmit={handleSaveUser} className="bg-[#12151c] w-full max-w-md rounded-[2rem] border border-slate-800 p-8 shadow-2xl relative overflow-hidden">
             <h3 className="font-black text-white text-xl mb-8">账户管理</h3>
             <div className="space-y-6">
                <div className="space-y-2">
                   <label className="text-xs text-slate-500 font-bold">工号/用户名</label>
                   <input value={editingUser.username} onChange={e => setEditingUser({...editingUser, username: e.target.value})} className="w-full bg-black/40 border border-slate-800 rounded-xl py-4 px-4 text-sm text-white" placeholder="用户名" required />
                </div>
                <div className="space-y-2">
                   <label className="text-xs text-slate-500 font-bold">手机号码 (登录/验证用)</label>
                   <input value={editingUser.phoneNumber || ''} onChange={e => setEditingUser({...editingUser, phoneNumber: e.target.value})} className="w-full bg-black/40 border border-slate-800 rounded-xl py-4 px-4 text-sm text-white" placeholder="11位手机号" />
                </div>
                <div className="space-y-2">
                   <label className="text-xs text-slate-500 font-bold">登录密码</label>
                   <input value={editingUser.password} onChange={e => setEditingUser({...editingUser, password: e.target.value})} className="w-full bg-black/40 border border-slate-800 rounded-xl py-4 px-4 text-sm text-white" placeholder="密码" required />
                </div>
                
                {/* 权限选择 */}
                <div className="space-y-2">
                   <label className="text-xs text-slate-500 font-bold">账号权限</label>
                   <select value={editingUser.role} onChange={e => setEditingUser({...editingUser, role: e.target.value as any})} className="w-full bg-black/40 border border-slate-800 rounded-xl py-4 px-4 text-sm text-white">
                        <option value={UserRole.USER}>普通员工</option>
                        <option value={UserRole.ADMIN}>超级管理员</option>
                   </select>
                </div>

                {/* 公司选择 (针对普通员工) */}
                {editingUser.role === UserRole.USER && (
                  <div className="space-y-2">
                     <label className="text-xs text-slate-500 font-bold">所属物业公司</label>
                     <select 
                       value={editingUser.enterpriseName || ''} 
                       onChange={e => setEditingUser({...editingUser, enterpriseName: e.target.value})} 
                       className="w-full bg-black/40 border border-slate-800 rounded-xl py-4 px-4 text-sm text-white focus:border-orange-500/50 outline-none"
                       required
                     >
                        <option value="">-- 请选择 --</option>
                        {enterprises.map(ent => (
                           <option key={ent} value={ent}>{ent}</option>
                        ))}
                     </select>
                     <div className="text-[10px] text-slate-600">
                        提示：若找不到公司，请先在“物业公司管理”中创建。
                     </div>
                  </div>
                )}
             </div>
             <div className="mt-8 flex gap-3">
               <button type="button" onClick={() => setEditingUser(null)} className="flex-1 py-4 rounded-xl text-xs font-black bg-slate-800 text-slate-500">取消</button>
               <button type="submit" className="flex-1 bg-orange-500 text-white py-4 rounded-xl text-xs font-black">保存</button>
             </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
