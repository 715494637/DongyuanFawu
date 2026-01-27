
import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard, Users, BookOpen, BrainCircuit,
  Plus, Trash2, ShieldCheck, UserPlus,
  Edit3, X, Camera, Save, Image as ImageIcon, Headphones, Settings, Smartphone, Check, UserCheck, Crown, Upload, TrendingUp,
  FileText, MessageSquare, AlertTriangle, ClipboardList, Star, Activity, Inbox, ArrowRight, PhoneCall, BarChart2, Calendar
} from 'lucide-react';
import { api } from '../services/apiService';
import { imageUploadService } from '../services/imageUploadService';
import { cache, CACHE_KEYS } from '../services/DataCacheContext';
import { DocumentItem, RiskScenario, User, UserRole, EvidenceGroup, LawArticle, CustomPosterTemplate, ContactQRCode, SystemConfig, RightsConfig, EnterpriseStats, VipLevelConfig, ScriptScenario, EmergencySOP, SpecialProject, ServiceRequest, UsageLog } from '../types';

// 工具函数：API响应转换（snake_case -> camelCase）
const transformUser = (apiUser: any): User => ({
  id: apiUser.id,
  username: apiUser.username,
  password: apiUser.password,
  phoneNumber: apiUser.phone_number,
  role: apiUser.role as UserRole,
  enterpriseName: apiUser.enterprise_name,
  isCertified: apiUser.is_certified ?? apiUser.isCertified ?? false,
  avatarUrl: apiUser.avatar_url,
  approvalStatus: apiUser.approval_status || apiUser.approvalStatus || 'APPROVED',
  quota: apiUser.quota || { lawyerLetters: 0, consultations: 0 },
  selectedProjects: apiUser.selected_projects || apiUser.selectedProjects || []
});

// 工具函数：VIP等级数据转换（后端 snake_case -> 前端 camelCase）
const transformVipLevel = (apiLevel: any): VipLevelConfig => ({
  id: apiLevel.id,
  name: apiLevel.level_name || apiLevel.name || '',
  thresholdAmount: apiLevel.min_amount ? parseFloat(apiLevel.min_amount) : (apiLevel.thresholdAmount || 0),
  label: apiLevel.level_code || apiLevel.label || '',
  desc: '',
  rights: Array.isArray(apiLevel.benefits) ? apiLevel.benefits : (apiLevel.rights || []),
  selectableProjectsCount: apiLevel.selectable_projects_count ?? apiLevel.selectableProjectsCount ?? 0
});

const AdminDashboard: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
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
  const [targetEnterprise, setTargetEnterprise] = useState<string>('');
  const [entStats, setEntStats] = useState<EnterpriseStats>({ totalRecoveredAmount: 0, totalEntrustedAmount: 0, entrustedCount: 0 });
  const [vipLevels, setVipLevels] = useState<VipLevelConfig[]>([]);

  // Pending changes states (for save button feature)
  const [pendingStatsChanges, setPendingStatsChanges] = useState<EnterpriseStats | null>(null);
  const [pendingLevelChanges, setPendingLevelChanges] = useState<{ [levelId: string]: { [field: string]: any } }>({});
  const [isSaving, setIsSaving] = useState(false);

  // Stats Filtering
  const [statsPeriod, setStatsPeriod] = useState<'month' | 'quarter' | 'year'>('month');

  // Service Requests - Expanded enterprises
  const [expandedEnterprises, setExpandedEnterprises] = useState<Set<string>>(new Set());

  // Config States
  const [splashImage, setSplashImage] = useState<string | null>(null);
  const splashInputRef = useRef<HTMLInputElement>(null);

  // Document Categories
  const [docCategories, setDocCategories] = useState<string[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [activeDocCategory, setActiveDocCategory] = useState('全部');

  // Modals / Editing States
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingDoc, setEditingDoc] = useState<DocumentItem | null>(null);
  const [editingLaw, setEditingLaw] = useState<LawArticle | null>(null);
  const [editingRenovationItem, setEditingRenovationItem] = useState<{ idx: number, text: string } | null>(null);
  const [editingProject, setEditingProject] = useState<SpecialProject | null>(null);

  // New Editors for Modules
  const [editingRisk, setEditingRisk] = useState<{ id: string, title: string, questions: string } | null>(null);
  const [editingEvidence, setEditingEvidence] = useState<{ id: string, title: string, items: string } | null>(null);
  const [editingScript, setEditingScript] = useState<ScriptScenario | null>(null);
  const [editingSOP, setEditingSOP] = useState<{ id: string, title: string, level: 'HIGH' | 'MEDIUM', steps: string, tips: string } | null>(null);

  const [newCompanyName, setNewCompanyName] = useState('');

  // Helper refs
  const posterFileRef = useRef<HTMLInputElement>(null);
  const qrFileRef = useRef<HTMLInputElement>(null);

  // Loading state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get token
  const getToken = () => localStorage.getItem('token') || sessionStorage.getItem('token') || '';

  // Load initial data from API
  useEffect(() => {
    const loadData = async () => {
      const token = getToken();
      if (!token) {
        setError('未找到登录令牌，请重新登录');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // 并行加载所有数据
        const [
          kbRes,
          healthPromptRes,
          docsRes,
          catsRes,
          risksRes,
          evidenceRes,
          lawsRes,
          scriptsRes,
          sopsRes,
          specialRes,
          requestsRes,
          configRes,
          postersRes,
          qrsRes,
          splashRes,
          enterprisesRes,
          usersRes,
          vipRes,
          healthCheckRes
        ] = await Promise.all([
          api.getAIKB().catch(() => ({ ai_kb: '' })),
          api.getHealthCheckPrompt().catch(() => ({ prompt: '' })),
          api.getDocuments().catch(() => []),
          api.getDocCategories().catch(() => ["全部", "前介承接", "违规整改", "内部管理", "风险防范", "催收增收"]),
          api.getRisks().catch(() => []),
          api.getEvidence().catch(() => []),
          api.getCivilCode().catch(() => []),
          api.getAdminScripts(token).catch(() => []),
          api.getSOPs().catch(() => []),
          api.getSpecialProjects().catch(() => []),
          api.getAllServiceRequests(token).catch(() => []),
          api.getConfig().catch(() => ({ enable_phone_login: true, enable_splash_screen: true, welcome_message: '', lawyer_phone_number: '' })),
          api.getPosters().catch(() => []),
          api.getContactQR().catch(() => []),
          api.getSplashImage().catch(() => ({ splash_image: null })),
          api.getEnterprises().catch(() => []),
          api.getUsers(token).catch(() => []),
          api.getVipLevels().catch(() => []),
          api.getHealthCheck().catch(() => [])
        ]);

        // 设置数据
        setKbText(kbRes.ai_kb || '');
        setHealthCheckPrompt(healthPromptRes.prompt || '');
        setDocs(docsRes);
        setDocCategories(Array.isArray(catsRes) ? catsRes : ["全部", "前介承接", "违规整改", "内部管理", "风险防范", "催收增收"]);
        setRiskScenarios(risksRes);
        setEvidenceList(evidenceRes);
        setLawArticles(lawsRes);
        setScripts(scriptsRes);
        setSops(sopsRes);
        setSpecialProjects(specialRes);
        setServiceRequests(requestsRes);
        setSystemConfig({
          enablePhoneLogin: configRes.enable_phone_login ?? true,
          enableSplashScreen: configRes.enable_splash_screen ?? true,
          welcomeMessage: configRes.welcome_message || '',
          lawyerPhoneNumber: configRes.lawyer_phone_number || ''
        });
        setCustomPosters(postersRes);
        setContactQRs(qrsRes);
        setSplashImage(splashRes.splash_image || null);
        setEnterprises(enterprisesRes);
        setUsers(usersRes.map(transformUser));
        setVipLevels(vipRes.map(transformVipLevel));

        // 从API加载装修巡查项配置
        const renovationItemsRes = await api.getRenovationItems().catch(() => []);
        setRenovationItems(renovationItemsRes);

        // 设置默认企业
        if (enterprisesRes.length > 0 && !targetEnterprise) {
          setTargetEnterprise(enterprisesRes[0]);
        }

      } catch (err: any) {
        console.error('加载数据失败:', err);
        setError(err.message || '加载数据失败');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // When target enterprise changes, reload its specific stats
  useEffect(() => {
    if (targetEnterprise) {
      loadEnterpriseStats(targetEnterprise);
    }
  }, [targetEnterprise]);

  const loadEnterpriseStats = async (enterpriseName: string) => {
    try {
      const token = getToken();
      // 管理员通过企业名称获取指定企业的统计数据
      const statsRes = await api.getEnterpriseStatsByName(enterpriseName, token);
      // 使用API返回的统计数据
      setEntStats({
        totalRecoveredAmount: statsRes.total_recovered_amount || 0,
        totalEntrustedAmount: statsRes.total_entrusted_amount || 0,
        entrustedCount: statsRes.entrusted_count || 0
      });
    } catch (err) {
      console.error('加载企业统计数据失败:', err);
      // 如果获取失败，设置空数据
      setEntStats({
        totalRecoveredAmount: 0,
        totalEntrustedAmount: 0,
        entrustedCount: 0
      });
    }
  };

  const refreshData = async () => {
    const token = getToken();
    try {
      const [docsRes, risksRes, evidenceRes, lawsRes, scriptsRes, sopsRes, specialRes, requestsRes, usersRes, enterprisesRes, docCatsRes] = await Promise.all([
        api.getDocuments().catch(() => []),
        api.getRisks().catch(() => []),
        api.getEvidence().catch(() => []),
        api.getCivilCode().catch(() => []),
        api.getAdminScripts(token).catch(() => []),
        api.getSOPs().catch(() => []),
        api.getSpecialProjects().catch(() => []),
        api.getAllServiceRequests(token).catch(() => []),
        api.getUsers(token).catch(() => []),
        api.getEnterprises().catch(() => []),
        api.getDocCategories().catch(() => [])
      ]);

      setDocs(docsRes);
      setRiskScenarios(risksRes);
      setEvidenceList(evidenceRes);
      setLawArticles(lawsRes);
      setScripts(scriptsRes);
      setSops(sopsRes);
      setSpecialProjects(specialRes);
      setServiceRequests(requestsRes);
      setUsers(usersRes.map(transformUser));
      setEnterprises(enterprisesRes);
      setDocCategories(docCatsRes || []);

      if (targetEnterprise) {
        await loadEnterpriseStats(targetEnterprise);
      }
    } catch (err: any) {
      console.error('刷新数据失败:', err);
    }
  };

  // --- Statistics Logic ---
  const getAggregatedStats = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentQuarter = Math.floor(currentMonth / 3);

    const filteredLogs = usageLogs.filter(log => {
      const logDate = new Date((log.timestamp || 0) * 1000);
      if (statsPeriod === 'month') {
        return logDate.getMonth() === currentMonth && logDate.getFullYear() === currentYear;
      } else if (statsPeriod === 'quarter') {
        return Math.floor(logDate.getMonth() / 3) === currentQuarter && logDate.getFullYear() === currentYear;
      } else {
        return logDate.getFullYear() === currentYear;
      }
    });

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

    return { aggregation, features: Array.from(allFeatures) };
  };

  const saveKB = async () => {
    try {
      const token = getToken();
      await api.updateAIKB({ ai_kb: kbText }, token);
      await api.updateHealthCheckPrompt({ prompt: healthCheckPrompt }, token);
      alert('AI 知识库及指令配置已更新');
    } catch (err: any) {
      alert('保存失败: ' + err.message);
    }
  };

  const handleConfigChange = async (newConfig: Partial<SystemConfig>) => {
    try {
      const updated = { ...systemConfig, ...newConfig };
      setSystemConfig(updated);
      const token = getToken();
      await api.updateConfig({
        enable_phone_login: updated.enablePhoneLogin,
        enable_splash_screen: updated.enableSplashScreen,
        welcome_message: updated.welcomeMessage,
        lawyer_phone_number: updated.lawyerPhoneNumber
      }, token);
    } catch (err: any) {
      alert('更新配置失败: ' + err.message);
    }
  };

  const handleStatChange = (key: keyof EnterpriseStats, val: number | null) => {
    // 只更新本地状态和待保存状态，不立即调用API
    const updated = { ...entStats, [key]: val ?? 0 };
    setEntStats(updated);
    setPendingStatsChanges(updated);
  };

  const handleLevelUpdate = (id: string, field: string, val: number | null) => {
    // 只更新本地状态和待保存状态，不立即调用API
    const newLevels = vipLevels.map(l => l.id === id ? { ...l, [field]: val ?? 0 } : l);
    setVipLevels(newLevels);

    // 记录待保存的变更
    setPendingLevelChanges(prev => ({
      ...prev,
      [id]: {
        ...(prev[id] || {}),
        [field]: val
      }
    }));
  };

  // 保存所有待保存的变更
  const handleSaveAllChanges = async () => {
    setIsSaving(true);
    const token = getToken();
    let hasError = false;

    try {
      // 保存企业统计数据
      if (pendingStatsChanges && targetEnterprise) {
        await api.updateEnterpriseStats({
          enterprise_name: targetEnterprise,
          total_recovered_amount: pendingStatsChanges.totalRecoveredAmount,
          total_entrusted_amount: pendingStatsChanges.totalEntrustedAmount,
          entrusted_count: pendingStatsChanges.entrustedCount
        }, token);
        setPendingStatsChanges(null);
      }

      // 保存VIP等级配置（将前端字段名转换为后端字段名）
      for (const [levelId, changes] of Object.entries(pendingLevelChanges)) {
        try {
          // 字段名转换：camelCase -> snake_case
          const backendChanges: any = {};

          if (changes.name !== undefined) {
            backendChanges.level_name = changes.name;
          }
          if (changes.thresholdAmount !== undefined) {
            backendChanges.min_amount = changes.thresholdAmount;
          }
          if (changes.selectableProjectsCount !== undefined) {
            backendChanges.selectable_projects_count = changes.selectableProjectsCount;
          }

          await api.updateVipLevel(levelId, backendChanges, token);
        } catch (err) {
          console.error(`保存VIP等级 ${levelId} 失败:`, err);
          hasError = true;
        }
      }
      setPendingLevelChanges({});

      if (!hasError) {
        alert('保存成功！');
      } else {
        alert('部分保存失败，请检查控制台');
      }
    } catch (err) {
      console.error('保存失败:', err);
      alert('保存失败: ' + (err as any).message);
    } finally {
      setIsSaving(false);
    }
  };

  // 检查是否有未保存的变更
  const hasPendingChanges = () => {
    return pendingStatsChanges !== null || Object.keys(pendingLevelChanges).length > 0;
  };

  // 根据版本标签返回不同的颜色样式
  const getVersionColor = (label: string): string => {
    if (!label) return 'bg-slate-500/20 text-slate-400';

    if (label.includes('基础版')) {
      return 'bg-slate-500/20 text-slate-400';  // 灰色 - 未达标
    } else if (label.includes('合规基石版')) {
      return 'bg-orange-500/20 text-orange-400';  // 橙色 - VIP 会员
    } else if (label.includes('稳盘运营版')) {
      return 'bg-blue-500/20 text-blue-400';  // 蓝色 - 尊享 VIP
    } else if (label.includes('战略护航版')) {
      return 'bg-purple-500/20 text-purple-400';  // 紫色 - 至尊 VIP
    } else {
      return 'bg-orange-500/20 text-orange-400';  // 默认橙色
    }
  };

  // 处理数字输入 - 允许空字符串，正确处理数字
  const handleNumberInput = (value: string, onChange: (val: number | null) => void) => {
    if (value === '' || value === '-') {
      onChange(null);
    } else {
      const num = parseFloat(value);
      if (!isNaN(num)) {
        onChange(num);
      }
    }
  };

  // 显示数字或空字符串
  const displayNumber = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return '';
    return value.toString();
  };

  const getCurrentVipInfo = () => {
    // 按门槛金额升序排列
    const sortedLevels = [...vipLevels].sort((a, b) => a.thresholdAmount - b.thresholdAmount);
    let current = null;  // 默认没有当前等级（注册会员）
    let next = sortedLevels[0] || null;  // 第一个等级是升级目标

    for (let i = 0; i < sortedLevels.length; i++) {
      if (entStats.totalEntrustedAmount >= sortedLevels[i].thresholdAmount) {
        current = sortedLevels[i];  // 满足门槛，设置当前等级
        // 检查是否还有下一个等级
        next = sortedLevels[i + 1] || null;
      } else {
        // 找到第一个不满足门槛的等级
        next = sortedLevels[i];
        break;
      }
    }
    return { current, next };
  };

  const handleSplashUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = ev.target?.result as string;
        // 上传到 ImageBB 获取 URL
        const imageUrl = await imageUploadService.uploadImage(base64);
        const token = getToken();
        await api.uploadSplashImage({ splash_image: imageUrl }, token);
        setSplashImage(base64);
        alert('开屏图已上传到图床');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetSplash = async () => {
    if (confirm('确认恢复默认开屏？')) {
      try {
        const token = getToken();
        await api.deleteSplashImage(token);
        setSplashImage(null);
      } catch (err: any) {
        alert('删除失败: ' + err.message);
      }
    }
  };

  const handleApproveUser = async (id: string) => {
    try {
      const token = getToken();
      await api.approveUser(id, token);
      await refreshData();
    } catch (err: any) {
      alert('审批失败: ' + err.message);
    }
  };

  const handleRejectUser = async (id: string) => {
    try {
      const token = getToken();
      await api.updateUser(id, { approval_status: 'REJECTED' }, token);
      await refreshData();
    } catch (err: any) {
      alert('拒绝失败: ' + err.message);
    }
  };

  const handleAddCompany = async () => {
    if (!newCompanyName.trim()) return;
    try {
      const token = getToken();
      await api.createEnterprise(newCompanyName.trim(), token);
      await refreshData();
      setNewCompanyName('');
    } catch (err: any) {
      alert('添加失败: ' + err.message);
    }
  };

  const handleDeleteCompany = async (name: string) => {
    if (confirm('确定删除该物业公司？')) {
      try {
        const token = getToken();
        await api.deleteEnterprise(name, token);
        await refreshData();
      } catch (err: any) {
        alert('删除失败: ' + err.message);
      }
    }
  };

  // 跟踪编辑时密码是否被修改
  const [editingUserOriginalPwd, setEditingUserOriginalPwd] = useState<string | null>(null);

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const token = getToken();
      if (editingUser.id && !editingUser.id.startsWith('temp_')) {
        // 更新用户 - 构建更新数据对象
        const updateData: any = {
          username: editingUser.username,
          phone_number: editingUser.phoneNumber,
          role: editingUser.role,
          enterprise_name: editingUser.enterpriseName,
          is_certified: editingUser.isCertified,
          approval_status: editingUser.approvalStatus,
          quota: editingUser.quota
        };

        // 只有当密码被修改过（且不是哈希化的密码）时才更新密码
        // 如果 editingUser.password 和原始密码一样，说明没有修改，不传password
        // 如果 editingUser.password 是空的，也不传password
        if (editingUser.password && editingUser.password !== editingUserOriginalPwd) {
          // 检查是否是已哈希的密码（通常以 $2b$ 开头，长度约60字符）
          if (!editingUser.password.startsWith('$2b$') && editingUser.password.length < 60) {
            updateData.password = editingUser.password;
          }
        }

        await api.updateUser(editingUser.id, updateData, token);
      } else {
        // 创建新用户
        await api.createUserByAdmin({
          username: editingUser.username,
          password: editingUser.password || '123456',
          phone_number: editingUser.phoneNumber,
          role: editingUser.role,
          enterprise_name: editingUser.enterpriseName
        }, token);
      }
      await refreshData();
      setEditingUser(null);
      setEditingUserOriginalPwd(null);
    } catch (err: any) {
      alert('保存失败: ' + err.message);
    }
  };

  const handleProcessRequest = async (id: string, status: 'PROCESSED' | 'REJECTED') => {
    try {
      const token = getToken();
      await api.updateServiceRequestStatus(id, status, '', token);
      await refreshData();
    } catch (err: any) {
      alert('处理失败: ' + err.message);
    }
  };

  const handleCleanRejectedRequests = async () => {
    const rejectedCount = serviceRequests.filter(r => r.status === 'REJECTED').length;
    if (rejectedCount === 0) {
      alert('暂无已驳回的申请记录');
      return;
    }
    if (!confirm(`确定要删除 ${rejectedCount} 条已驳回的申请记录吗？此操作不可恢复。`)) {
      return;
    }
    try {
      const token = getToken();
      await api.deleteRejectedRequests(token);
      alert('已清理完成');
      await refreshData();
    } catch (err: any) {
      alert('清理失败: ' + err.message);
    }
  };

  const handlePosterImageUpload = async (e: any) => {
    const f = e.target.files?.[0];
    if (f) {
      const r = new FileReader();
      r.onload = async (ev) => {
        const base64 = ev.target?.result as string;
        // 上传到 ImageBB 获取 URL
        const imageUrl = await imageUploadService.uploadImage(base64);
        const token = getToken();
        await api.createPoster({ name: '自定义海报', image_url: imageUrl }, token);
        await refreshData();
      };
      r.readAsDataURL(f);
    }
  };

  const handleQRImageUpload = async (e: any) => {
    const f = e.target.files?.[0];
    if (f) {
      const r = new FileReader();
      r.onload = async (ev) => {
        const base64 = ev.target?.result as string;
        // 上传到 ImageBB 获取 URL
        const imageUrl = await imageUploadService.uploadImage(base64);
        const token = getToken();
        await api.createContactQR({ name: '新顾问', image_url: imageUrl }, token);
        await refreshData();
      };
      r.readAsDataURL(f);
    }
  };

  const deleteItem = async (t: string, id: string) => {
    if (!confirm('确定删除该项？')) return;
    const token = getToken();

    try {
      switch (t) {
        case 'user':
          await api.deleteUser(id, token);
          break;
        case 'poster':
          await api.deletePoster(id, token);
          break;
        case 'qr':
          await api.deleteContactQR(id, token);
          break;
        case 'doc':
          await api.deleteDocument(id, token);
          break;
        case 'law':
          await api.deleteCivilCode(id, token);
          break;
        case 'project':
          await api.deleteSpecialProject(id, token);
          break;
        case 'risk':
          await api.deleteRisk(id, token);
          break;
        case 'evidence':
          await api.deleteEvidence(id, token);
          break;
        case 'script':
          await api.deleteAdminScript(id, token);
          break;
        case 'sop':
          await api.deleteSOP(id, token);
          break;
      }
      await refreshData();
    } catch (err: any) {
      alert('删除失败: ' + err.message);
    }
  };

  const handleSaveDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc) return;

    try {
      const token = getToken();
      if (editingDoc.id && !editingDoc.id.startsWith('temp_')) {
        await api.updateDocument(editingDoc.id, editingDoc, token);
      } else {
        await api.createDocument(editingDoc, token);
      }
      await refreshData();
      setEditingDoc(null);
    } catch (err: any) {
      alert('保存失败: ' + err.message);
    }
  };

  // 添加分类
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      alert('请输入分类名称');
      return;
    }
    try {
      const token = getToken();
      await api.createDocCategory(newCategoryName.trim(), token);
      setShowAddCategory(false);
      setNewCategoryName('');
      await refreshData();
      alert('分类创建成功');
    } catch (err: any) {
      alert(err.message || '创建分类失败');
    }
  };

  // 删除分类
  const handleDeleteCategory = async (category: string) => {
    if (!confirm(`确定要删除分类 "${category}" 吗？`)) return;
    try {
      const token = getToken();
      await api.deleteDocCategory(category, token);
      await refreshData();
      alert('分类删除成功');
    } catch (err: any) {
      alert(err.message || '删除分类失败');
    }
  };

  const handleSaveLaw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLaw) return;

    try {
      const token = getToken();
      if (editingLaw.id && !editingLaw.id.startsWith('temp_')) {
        await api.updateCivilCode(editingLaw.id, editingLaw, token);
      } else {
        await api.createCivilCode(editingLaw, token);
      }
      await refreshData();
      setEditingLaw(null);
    } catch (err: any) {
      alert('保存失败: ' + err.message);
    }
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
      if (editingProject.id.startsWith('temp_')) {
        // 新建
        await api.createSpecialProject({
          title: editingProject.title,
          description: editingProject.description
        }, token);
      } else {
        // 更新
        await api.updateSpecialProject(editingProject.id, {
          title: editingProject.title,
          description: editingProject.description
        }, token);
      }
      await refreshData();
      setEditingProject(null);
    } catch (err) {
      console.error('保存专项服务失败:', err);
      alert('保存失败: ' + (err as any).message);
    }
  };

  const handleSaveRisk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRisk) return;

    try {
      const token = getToken();
      const qs = editingRisk.questions.split('\n').filter(l => l.trim());
      const nRisk = { id: editingRisk.id, title: editingRisk.title, questions: qs, risk_level: 'Medium', content: '' };

      if (editingRisk.id && !editingRisk.id.startsWith('temp_')) {
        await api.updateRisk(editingRisk.id, nRisk, token);
      } else {
        await api.createRisk(nRisk, token);
      }
      await refreshData();
      setEditingRisk(null);
    } catch (err: any) {
      alert('保存失败: ' + err.message);
    }
  };

  const handleSaveEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvidence) return;

    try {
      const token = getToken();
      const is = editingEvidence.items.split('\n').filter(l => l.trim());
      const nEv = { id: editingEvidence.id, title: editingEvidence.title, items: is };

      if (editingEvidence.id && !editingEvidence.id.startsWith('temp_')) {
        await api.updateEvidence(editingEvidence.id, nEv, token);
      } else {
        await api.createEvidence(nEv, token);
      }
      await refreshData();
      setEditingEvidence(null);
    } catch (err: any) {
      alert('保存失败: ' + err.message);
    }
  };

  const handleSaveSOP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSOP) return;

    try {
      const token = getToken();
      const ss = editingSOP.steps.split('\n').filter(l => l.trim());
      const nSop = { id: editingSOP.id, title: editingSOP.title, level: editingSOP.level, steps: ss, tips: editingSOP.tips };

      if (editingSOP.id && !editingSOP.id.startsWith('temp_')) {
        await api.updateSOP(editingSOP.id, nSop, token);
      } else {
        await api.createSOP(nSop, token);
      }
      await refreshData();
      setEditingSOP(null);
    } catch (err: any) {
      alert('保存失败: ' + err.message);
    }
  };

  const handleSaveScript = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingScript) return;

    try {
      const token = getToken();
      const steps = editingScript.steps.filter(s => (s.label?.trim() || s.content?.trim()));
      const scriptData = { id: editingScript.id, title: editingScript.title, steps };

      if (editingScript.id && !editingScript.id.startsWith('temp_')) {
        await api.updateAdminScript(editingScript.id, scriptData, token);
      } else {
        await api.createAdminScript(scriptData, token);
      }
      await refreshData();
      setEditingScript(null);
    } catch (err: any) {
      alert('保存失败: ' + err.message);
    }
  };

  // Generic Simple List Manager
  const SimpleListEditor = ({ title, items, onAdd, onDelete, renderItem }: any) => (
    <div className="bg-[#12151c] p-6 rounded-3xl border border-slate-800">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-white text-lg">{title}</h3>
        <button onClick={onAdd} className="bg-orange-500 text-white p-2 rounded-lg text-xs font-bold flex items-center gap-1"><Plus size={14} /> 添加</button>
      </div>
      <div className="space-y-2">
        {items.map((item: any, idx: number) => (
          <div key={item.id || idx} className="bg-white/5 p-4 rounded-xl border border-white/5 flex justify-between items-start">
            <div className="flex-1">{renderItem(item)}</div>
            <button onClick={() => onDelete(item.id || idx)} className="text-slate-500 hover:text-red-500 p-1"><Trash2 size={16} /></button>
          </div>
        ))}
        {items.length === 0 && <div className="text-slate-500 text-xs text-center py-4">暂无数据</div>}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0c10] text-slate-300 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0c10] text-slate-300 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">{error}</div>
          <button onClick={onLogout} className="bg-orange-500 text-white px-6 py-2 rounded-xl">重新登录</button>
        </div>
      </div>
    );
  }

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
                  <button onClick={() => setStatsPeriod('month')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${statsPeriod === 'month' ? 'bg-orange-500 text-white' : 'text-slate-500 hover:text-white'}`}>本月</button>
                  <button onClick={() => setStatsPeriod('quarter')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${statsPeriod === 'quarter' ? 'bg-orange-500 text-white' : 'text-slate-500 hover:text-white'}`}>本季度</button>
                  <button onClick={() => setStatsPeriod('year')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${statsPeriod === 'year' ? 'bg-orange-500 text-white' : 'text-slate-500 hover:text-white'}`}>本年度</button>
                </div>
              </div>

              <div className="overflow-x-auto">
                {(() => {
                  const { aggregation, features } = getAggregatedStats();
                  const companies = Object.keys(aggregation);

                  if (companies.length === 0) {
                    return <div className="text-center py-20 text-slate-500">暂无数据记录</div>;
                  }

                  return (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-xs font-bold text-slate-500 uppercase tracking-widest">
                          <th className="p-4 pl-0">物业公司</th>
                          {features.map(f => (<th key={f} className="p-4 text-center">{f}</th>))}
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
                                  {aggregation[company][f] ? (<span className="bg-orange-500/10 text-orange-500 px-2 py-1 rounded font-bold">{aggregation[company][f]}</span>) : '-'}
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

        {/* === TAB: AI Knowledge Base === */}
        {activeTab === 'kb' && (
          <div className="flex flex-col h-full gap-6">
            <div className="bg-[#12151c] p-8 rounded-3xl border border-slate-800 flex flex-col flex-1">
              <div className="flex justify-between mb-4">
                <h3 className="font-bold text-white flex items-center gap-2"><BrainCircuit size={18} /> 智能助手核心 Prompt (System Instruction)</h3>
                <button onClick={saveKB} className="bg-orange-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2"><Save size={14} /> 保存所有配置</button>
              </div>
              <p className="text-xs text-slate-500 mb-2">配置主聊天界面的 AI 角色设定与知识边界。</p>
              <textarea value={kbText} onChange={e => setKbText(e.target.value)} className="flex-1 bg-black/40 border border-slate-800 rounded-2xl p-6 text-slate-400 font-mono text-sm leading-relaxed outline-none focus:border-orange-500/30 transition-all resize-none mb-4" />
            </div>

            <div className="bg-[#12151c] p-8 rounded-3xl border border-slate-800 flex flex-col flex-1">
              <h3 className="font-bold text-white flex items-center gap-2 mb-2"><Activity size={18} /> 企业体检报告生成指令</h3>
              <p className="text-xs text-slate-500 mb-4">配置"企业法务体检"功能中生成深度报告的 AI 提示词。<br /><span className="text-orange-500">注意：必须包含 <code>{`{{RISK_POINTS}}`}</code> 占位符，系统将自动替换为用户的风险项数据。</span></p>
              <textarea value={healthCheckPrompt} onChange={e => setHealthCheckPrompt(e.target.value)} className="flex-1 bg-black/40 border border-slate-800 rounded-2xl p-6 text-slate-400 font-mono text-sm leading-relaxed outline-none focus:border-orange-500/30 transition-all resize-none" style={{ minHeight: '300px' }} />
            </div>
          </div>
        )}

        {/* === TAB: Service Requests === */}
        {activeTab === 'requests' && (
          <div className="space-y-6">
            <div className="bg-[#12151c] p-6 rounded-3xl border border-slate-800">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                  <Inbox className="text-orange-500" /> 服务申请审批
                </h3>
                {serviceRequests.some(r => r.status === 'REJECTED') && (
                  <button
                    onClick={handleCleanRejectedRequests}
                    className="text-xs text-slate-400 hover:text-red-400 flex items-center gap-1 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <Trash2 size={12} /> 清理已驳回
                  </button>
                )}
              </div>

              {/* 按企业分组的服务请求列表 */}
              {(() => {
                // 按企业分组
                const groupedRequests: { [key: string]: ServiceRequest[] } = {};
                serviceRequests.forEach(req => {
                  const enterprise = req.enterpriseName || '未知企业';
                  if (!groupedRequests[enterprise]) {
                    groupedRequests[enterprise] = [];
                  }
                  groupedRequests[enterprise].push(req);
                });

                // 排序：待处理优先，然后按时间倒序
                const sortRequests = (requests: ServiceRequest[]) => {
                  return [...requests].sort((a, b) => {
                    // 待处理优先
                    if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
                    if (b.status === 'PENDING' && a.status !== 'PENDING') return 1;
                    // 按时间倒序
                    return b.timestamp - a.timestamp;
                  });
                };

                // 计算每个企业的待处理数量
                const getPendingCount = (requests: ServiceRequest[]) => {
                  return requests.filter(r => r.status === 'PENDING').length;
                };

                // 按待处理数量排序企业
                const sortedEnterprises = Object.keys(groupedRequests).sort((a, b) => {
                  const pendingA = getPendingCount(groupedRequests[a]);
                  const pendingB = getPendingCount(groupedRequests[b]);
                  return pendingB - pendingA;
                });

                const toggleEnterprise = (enterprise: string) => {
                  setExpandedEnterprises(prev => {
                    const next = new Set(prev);
                    if (next.has(enterprise)) {
                      next.delete(enterprise);
                    } else {
                      next.add(enterprise);
                    }
                    return next;
                  });
                };

                return sortedEnterprises.length === 0 ? (
                  <div className="text-center py-10 text-slate-500 text-sm">暂无服务申请</div>
                ) : (
                  <div className="space-y-3">
                    {sortedEnterprises.map(enterprise => {
                      const requests = groupedRequests[enterprise];
                      const sortedRequests = sortRequests(requests);
                      const isExpanded = expandedEnterprises.has(enterprise);
                      const pendingCount = getPendingCount(requests);

                      return (
                        <div key={enterprise} className="border border-slate-800 rounded-2xl overflow-hidden">
                          {/* 企业标题栏 - 可点击展开 */}
                          <button
                            onClick={() => toggleEnterprise(enterprise)}
                            className="w-full px-5 py-4 bg-white/5 hover:bg-white/10 flex items-center justify-between transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-white font-bold text-sm">{enterprise}</span>
                              {pendingCount > 0 && (
                                <span className="bg-orange-500/20 text-orange-500 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                  {pendingCount} 待处理
                                </span>
                              )}
                              <span className="text-slate-500 text-xs">共 {requests.length} 申请</span>
                            </div>
                            <ArrowRight
                              size={16}
                              className={`text-slate-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                            />
                          </button>

                          {/* 展开后显示该企业的所有申请 */}
                          {isExpanded && (
                            <div className="bg-black/20">
                              {sortedRequests.map(req => (
                                <div key={req.id} className="border-t border-white/5 p-4">
                                  <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                      <span className="text-slate-400 text-xs">{req.username}</span>
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                        req.status === 'PENDING' ? 'bg-orange-500/20 text-orange-500' :
                                          req.status === 'PROCESSED' ? 'bg-green-500/20 text-green-500' :
                                            'bg-red-500/20 text-red-500'
                                      }`}>
                                        {req.status === 'PENDING' ? '待处理' : req.status === 'PROCESSED' ? '已通过' : '已驳回'}
                                      </span>
                                    </div>
                                    <span className="text-[10px] text-slate-500">
                                      {new Date(req.timestamp * 1000).toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="text-xs text-slate-300 mb-2">{req.title || req.content}</div>
                                  {req.status === 'PENDING' && (
                                    <div className="flex gap-2 justify-end">
                                      <button
                                        onClick={() => handleProcessRequest(req.id, 'PROCESSED')}
                                        className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                                      >
                                        <Check size={12} /> 通过
                                      </button>
                                      <button
                                        onClick={() => handleProcessRequest(req.id, 'REJECTED')}
                                        className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white rounded-lg text-xs font-bold flex items-center gap-1"
                                      >
                                        <X size={12} /> 驳回
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* === TAB: Special Projects === */}
        {activeTab === 'special' && (
          <SimpleListEditor
            title="专项法律服务库"
            items={specialProjects}
            onAdd={() => setEditingProject({ id: `temp_${Date.now()}`, title: '', description: '' })}
            onDelete={(id: string) => deleteItem('project', id)}
            renderItem={(item: SpecialProject) => (
              <>
                <div className="font-bold text-white text-sm mb-1">{item.title}</div>
                <div className="text-xs text-slate-500">{item.description}</div>
                <button onClick={() => setEditingProject({ ...item })} className="mt-2 text-[10px] text-blue-400 hover:text-blue-300">编辑</button>
              </>
            )}
          />
        )}

        {/* === Other Tabs: Docs, Laws, Risk, Evidence, Scripts, SOP, Renovation === */}
        {['docs', 'laws', 'risk', 'evidence', 'scripts', 'sop', 'renovation'].includes(activeTab) && (
          <>
            {activeTab === 'docs' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center bg-[#12151c] p-6 rounded-3xl border border-slate-800">
                  <h3 className="font-bold text-white">文档模板管理</h3>
                  <button onClick={() => setEditingDoc({ id: `temp_${Date.now()}`, title: '', category: '全部', description: '', content: '' })} className="bg-orange-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1"><Plus size={14} /> 新增文档</button>
                </div>
                {/* 分类筛选/管理栏 */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {docCategories.map(cat => (
                    <div key={cat} className="relative group">
                      <button
                        onClick={() => setActiveDocCategory(cat)}
                        className={`px-3 py-1.5 pr-8 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                          activeDocCategory === cat
                            ? 'bg-orange-500 text-white'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {cat}
                      </button>
                      {cat !== '全部' && (
                        <button
                          onClick={() => handleDeleteCategory(cat)}
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-slate-700 text-slate-400 hover:bg-red-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          title="删除分类"
                        >
                          <X size={10} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => setShowAddCategory(true)}
                    className="px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors bg-orange-500/20 text-orange-500 hover:bg-orange-500 hover:text-white border border-orange-500/50"
                  >
                    + 新增分类
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(activeDocCategory === '全部' ? docs : docs.filter(d => d.category === activeDocCategory)).map(doc => (
                    <div key={doc.id} className="bg-[#12151c] p-5 rounded-2xl border border-slate-800 hover:border-orange-500/30 transition-colors group">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-white text-sm">{doc.title}</h4>
                        <span className="text-[9px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded">{doc.category}</span>
                      </div>
                      <p className="text-xs text-slate-500 mb-4 line-clamp-2">{doc.description}</p>
                      <div className="flex justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setEditingDoc({ ...doc })} className="p-2 bg-slate-800 rounded-lg text-slate-300 hover:text-white"><Edit3 size={14} /></button>
                        <button onClick={() => deleteItem('doc', doc.id)} className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {activeTab === 'laws' && <SimpleListEditor title="民法典法规库" items={lawArticles} onAdd={() => setEditingLaw({ id: `temp_${Date.now()}`, title: '', content: '' })} onDelete={(id: string) => deleteItem('law', id)} renderItem={(item: LawArticle) => (<><div className="font-bold text-white text-sm mb-1">{item.title}</div><div className="text-xs text-slate-500 line-clamp-2">{item.content}</div><button onClick={() => setEditingLaw({ ...item })} className="mt-2 text-[10px] text-blue-400 hover:text-blue-300">编辑内容</button></>)} />}
            {activeTab === 'risk' && <SimpleListEditor title="风控自查场景管理" items={riskScenarios} onAdd={() => setEditingRisk({ id: `temp_${Date.now()}`, title: '', questions: '' })} onDelete={(id: string) => deleteItem('risk', id)} renderItem={(item: RiskScenario) => (<><div className="font-bold text-white text-sm mb-1">{item.title}</div><div className="text-xs text-slate-500">{(item.questions || []).length} 个检查项</div><button onClick={() => setEditingRisk({ id: item.id || '', title: item.title || '', questions: (item.questions || []).join('\n') })} className="mt-2 text-[10px] text-blue-400 hover:text-blue-300">编辑问题清单</button></>)} />}
            {activeTab === 'evidence' && <SimpleListEditor title="取证清单配置" items={evidenceList} onAdd={() => setEditingEvidence({ id: `temp_${Date.now()}`, title: '', items: '' })} onDelete={(id: string) => deleteItem('evidence', id)} renderItem={(item: EvidenceGroup) => (<><div className="font-bold text-white text-sm mb-1">{item.title}</div><div className="text-xs text-slate-500">{(item.items || []).length} 个证据点</div><button onClick={() => setEditingEvidence({ id: item.id, title: item.title, items: (item.items || []).join('\n') })} className="mt-2 text-[10px] text-blue-400 hover:text-blue-300">编辑清单</button></>)} />}
            {activeTab === 'scripts' && <SimpleListEditor title="催费话术场景库" items={scripts} onAdd={() => setEditingScript({ id: `temp_${Date.now()}`, title: '', steps: [{ label: '', content: '' }] })} onDelete={(id: string) => deleteItem('script', id)} renderItem={(item: ScriptScenario) => (<><div className="font-bold text-white text-sm mb-1">{item.title}</div><div className="text-xs text-slate-500">{(item.steps || []).length} 个对话步骤</div><button onClick={() => setEditingScript(JSON.parse(JSON.stringify(item)))} className="mt-2 text-[10px] text-blue-400 hover:text-blue-300">编辑话术</button></>)} />}
            {activeTab === 'sop' && <SimpleListEditor title="紧急情况 SOP 预案" items={sops} onAdd={() => setEditingSOP({ id: `temp_${Date.now()}`, title: '', level: 'MEDIUM', steps: '', tips: '' })} onDelete={(id: string) => deleteItem('sop', id)} renderItem={(item: EmergencySOP) => (<><div className="flex items-center gap-2 mb-1"><span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${item.level === 'HIGH' ? 'bg-red-500 text-white' : 'bg-orange-500 text-white'}`}>{item.level}</span><span className="font-bold text-white text-sm">{item.title}</span></div><div className="text-xs text-slate-500 line-clamp-1">{item.tips}</div><button onClick={() => setEditingSOP({ id: item.id, title: item.title, level: item.level, steps: (item.steps || []).join('\n'), tips: item.tips || '' })} className="mt-2 text-[10px] text-blue-400 hover:text-blue-300">编辑预案</button></>)} />}
            {activeTab === 'renovation' && (
              <div className="bg-[#12151c] p-6 rounded-3xl border border-slate-800">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-white text-lg">装修违规巡查项配置</h3>
                  <div className="flex gap-2">
                    <input id="new-reno-item" placeholder="输入新检查项" className="bg-black/40 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white w-64" />
                    <button onClick={async () => { const val = (document.getElementById('new-reno-item') as HTMLInputElement).value; if (val.trim()) { const n = [...renovationItems, val.trim()]; setRenovationItems(n); try { await api.updateRenovationItems(n, getToken()); } catch { alert('保存失败'); } (document.getElementById('new-reno-item') as HTMLInputElement).value = ''; } }} className="bg-orange-500 px-4 py-2 rounded-xl text-white text-xs font-bold">添加</button>
                  </div>
                </div>
                <div className="space-y-2">
                  {renovationItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/5">
                      {editingRenovationItem?.idx === idx ? (
                        <div className="flex gap-2 w-full">
                          <input autoFocus value={editingRenovationItem.text} onChange={e => setEditingRenovationItem({ ...editingRenovationItem, text: e.target.value })} className="flex-1 bg-black/40 border border-slate-600 rounded-lg px-2 py-1 text-sm text-white" />
                          <button onClick={async () => { const n = [...renovationItems]; n[idx] = editingRenovationItem.text; setRenovationItems(n); try { await api.updateRenovationItems(n, getToken()); } catch { alert('保存失败'); } setEditingRenovationItem(null); }} className="text-green-500"><Check size={16} /></button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 text-xs font-mono mr-2">{idx + 1}.</span>
                          <span className="text-white text-sm">{item}</span>
                          <button onClick={() => setEditingRenovationItem({ idx, text: item })} className="ml-2 text-slate-600 hover:text-slate-400"><Edit3 size={12} /></button>
                        </div>
                      )}
                      <button onClick={async () => { const n = renovationItems.filter((_, i) => i !== idx); setRenovationItems(n); try { await api.updateRenovationItems(n, getToken()); } catch { alert('保存失败'); } }} className="text-slate-500 hover:text-red-500"><Trash2 size={16} /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* === TAB: Resources === */}
        {activeTab === 'resources' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-[#12151c] border border-slate-800 rounded-[2.5rem] p-8">
              <h3 className="text-lg font-black text-white mb-6 flex items-center gap-2">
                <Smartphone className="text-orange-500" size={20} /> 登录与注册配置
              </h3>
              <div className="flex items-center justify-between bg-white/5 p-5 rounded-2xl border border-white/5 mb-4">
                <div>
                  <div className="font-bold text-white text-sm">启用手机号验证码登录</div>
                  <div className="text-xs text-slate-500 mt-1">用户可使用手机号+验证码登录</div>
                </div>
                <button onClick={() => handleConfigChange({ enablePhoneLogin: !systemConfig.enablePhoneLogin })} className={`w-12 h-6 rounded-full transition-colors relative ${systemConfig.enablePhoneLogin ? 'bg-orange-500' : 'bg-slate-700'}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${systemConfig.enablePhoneLogin ? 'left-7' : 'left-1'}`}></div>
                </button>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 ml-1 flex items-center gap-2"><PhoneCall size={14} /> 律师专线号码配置</label>
                  <input type="text" value={systemConfig.lawyerPhoneNumber || ''} onChange={(e) => handleConfigChange({ lawyerPhoneNumber: e.target.value })} placeholder="例如：400-888-9999" className="w-full bg-black/40 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-300 focus:border-orange-500 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 ml-1">AI 助手欢迎语</label>
                  <textarea value={systemConfig.welcomeMessage} onChange={(e) => handleConfigChange({ welcomeMessage: e.target.value })} className="w-full bg-black/40 border border-slate-800 rounded-xl p-4 text-sm text-slate-300 h-24 focus:border-orange-500 outline-none resize-none" />
                </div>
              </div>
            </div>

            <div className="bg-[#12151c] border border-slate-800 rounded-[2.5rem] p-8">
              <h3 className="text-lg font-black text-white mb-6 flex items-center gap-2">
                <ImageIcon className="text-orange-500" size={20} /> 品牌开屏页设置
              </h3>
              <div className="flex items-center justify-between bg-white/5 p-5 rounded-2xl border border-white/5 mb-6">
                <div>
                  <div className="font-bold text-white text-sm">启用品牌开屏页</div>
                  <div className="text-xs text-slate-500 mt-1">开启后 App 启动时展示品牌页面</div>
                </div>
                <button onClick={() => handleConfigChange({ enableSplashScreen: !systemConfig.enableSplashScreen })} className={`w-12 h-6 rounded-full transition-colors relative ${systemConfig.enableSplashScreen !== false ? 'bg-orange-500' : 'bg-slate-700'}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${systemConfig.enableSplashScreen !== false ? 'left-7' : 'left-1'}`}></div>
                </button>
              </div>
              <div className="flex gap-6 items-start">
                <div className="w-32 aspect-[9/16] bg-black rounded-xl border border-slate-800 overflow-hidden relative group shadow-lg">
                  {splashImage ? <img src={splashImage} className="w-full h-full object-cover" alt="Splash" /> : <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 bg-slate-900"><div className="text-[9px] font-bold">默认开屏</div></div>}
                </div>
                <div className="flex-1 space-y-4 pt-2">
                  <p className="text-xs text-slate-500 leading-relaxed">自定义应用启动时的开屏画面。</p>
                  <div className="flex gap-3">
                    <button onClick={() => splashInputRef.current?.click()} className="px-5 py-2.5 bg-white text-black rounded-xl text-xs font-black hover:bg-slate-200 transition-colors flex items-center gap-2"><Upload size={14} /> 上传图片</button>
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
                    <button onClick={() => handleDeleteCompany(ent)} className="text-slate-500 hover:text-red-500"><X size={12} /></button>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#12151c] border border-slate-800 rounded-[2.5rem] p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-white text-lg">海报背景模版</h3>
                <button onClick={() => posterFileRef.current?.click()} className="bg-blue-600 px-4 py-2 rounded-xl text-white text-xs font-bold flex items-center gap-2"><Plus size={14} /> 上传</button>
                <input type="file" ref={posterFileRef} onChange={handlePosterImageUpload} className="hidden" accept="image/*" />
              </div>
              <div className="grid grid-cols-4 gap-4">
                {customPosters.map(p => (
                  <div key={p.id} className="relative aspect-[3/4] rounded-xl overflow-hidden group">
                    <img src={p.imageBase64 || p.image_url} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => deleteItem('poster', p.id)} className="bg-red-500 p-2 rounded-full text-white"><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#12151c] border border-slate-800 rounded-[2.5rem] p-8">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-bold text-white text-lg">企业微信/顾问二维码配置</h3>
                  <p className="text-xs text-slate-500 mt-1">用于前端「联系顾问」及「专项服务申请」弹窗随机展示</p>
                </div>
                <button onClick={() => qrFileRef.current?.click()} className="bg-green-600 px-4 py-2 rounded-xl text-white text-xs font-bold flex items-center gap-2"><Plus size={14} /> 上传</button>
                <input type="file" ref={qrFileRef} onChange={handleQRImageUpload} className="hidden" accept="image/*" />
              </div>
              <div className="grid grid-cols-4 gap-4">
                {contactQRs.map(qr => (
                  <div key={qr.id} className="bg-white p-2 rounded-xl flex flex-col items-center gap-2 relative group">
                    <img src={qr.imageBase64 || qr.image_url} className="w-full aspect-square object-contain" />
                    <span className="text-black text-[10px] font-bold">{qr.name}</span>
                    <button onClick={() => deleteItem('qr', qr.id)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={10} /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* === TAB: Rights === */}
        {activeTab === 'rights' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-[#12151c] border border-slate-800 rounded-[2.5rem] p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <TrendingUp className="text-orange-500" size={20} /> 企业运营数据录入
                </h3>
                <div className="flex items-center gap-3">
                  <label className="text-xs font-bold text-slate-500">选择需配置的企业</label>
                  <select value={targetEnterprise} onChange={(e) => setTargetEnterprise(e.target.value)} className="bg-black/40 border border-slate-700 text-white text-xs font-bold rounded-xl px-4 py-2 outline-none focus:border-orange-500">
                    <option value="" disabled>-- 请选择 --</option>
                    {enterprises.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
              </div>

              {!targetEnterprise ? (
                <div className="p-8 text-center text-slate-500 bg-white/5 rounded-2xl border border-dashed border-slate-800">请先在右上方选择一个物业公司进行数据配置</div>
              ) : (
                <div className="space-y-6 animate-fade-in">
                  {(() => {
                    const { current, next } = getCurrentVipInfo();
                    const isRegisteredMember = !current; // 未达到任何VIP等级门槛

                    if (isRegisteredMember) {
                      // 注册会员（未达到VIP门槛）
                      return (
                        <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-4 border border-slate-700 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-3 rounded-full bg-slate-700/50 text-slate-400"><Crown size={20} /></div>
                            <div>
                              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">当前等级</div>
                              <div className="text-base font-black text-white mt-0.5 flex items-center gap-2">
                                注册会员
                                <span className={`text-[9px] ${getVersionColor('基础版')} px-2 py-0.5 rounded`}>基础版</span>
                              </div>
                            </div>
                          </div>
                          {next && (<div className="flex items-center gap-3 opacity-60"><ArrowRight size={16} className="text-slate-500" /><div className="text-right"><div className="text-[10px] text-slate-400 font-bold uppercase">升级目标</div><div className="text-xs font-bold text-slate-300">{next.name} (还需 {(next.thresholdAmount - entStats.totalEntrustedAmount).toLocaleString()})</div></div></div>)}
                        </div>
                      );
                    }

                    // VIP会员及以上的显示
                    return (
                      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-4 border border-slate-700 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-3 rounded-full bg-[#FFD700]/10 text-[#FFD700]"><Crown size={20} fill="#FFD700" /></div>
                          <div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">实时预估 VIP 等级 (自动联动)</div>
                            <div className="text-base font-black text-white mt-0.5 flex items-center gap-2">
                              {current ? current.name : '普通会员'}
                              {current && current.label && (
                                <span className={`text-[9px] ${getVersionColor(current.label)} px-2 py-0.5 rounded`}>{current.label}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        {next && (<div className="flex items-center gap-3 opacity-60"><ArrowRight size={16} className="text-slate-500" /><div className="text-right"><div className="text-[10px] text-slate-400 font-bold uppercase">下一级目标</div><div className="text-xs font-bold text-slate-300">{next.name} (还需 {(next.thresholdAmount - entStats.totalEntrustedAmount).toLocaleString()})</div></div></div>)}
                      </div>
                    );
                  })()}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
                      <label className="text-xs font-bold text-slate-500 block mb-2">累计委托金额 (Total Entrusted)</label>
                      <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">¥</span><input type="number" placeholder="0" value={displayNumber(entStats.totalEntrustedAmount)} onChange={e => handleNumberInput(e.target.value, (val) => handleStatChange('totalEntrustedAmount', val))} className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-6 pr-4 py-3 text-white font-bold" /></div>
                      <p className="text-[9px] text-slate-500 mt-2">修改此数值将自动触发企业 VIP 等级升降。</p>
                    </div>
                    <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
                      <label className="text-xs font-bold text-slate-500 block mb-2">累计追回金额 (Total Recovered)</label>
                      <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">¥</span><input type="number" placeholder="0" value={displayNumber(entStats.totalRecoveredAmount)} onChange={e => handleNumberInput(e.target.value, (val) => handleStatChange('totalRecoveredAmount', val))} className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-6 pr-4 py-3 text-white font-bold" /></div>
                    </div>
                  </div>
                  <div className="col-span-2 text-right">
                    {hasPendingChanges() ? (
                      <button
                        onClick={handleSaveAllChanges}
                        disabled={isSaving}
                        className="bg-orange-500 hover:bg-orange-600 disabled:bg-slate-600 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 ml-auto transition-colors"
                      >
                        <Save size={14} />
                        {isSaving ? '保存中...' : '保存配置'}
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-500 flex items-center justify-end gap-1"><Check size={12} /> 已保存</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-[#12151c] border border-slate-800 rounded-[2.5rem] p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-black text-white flex items-center gap-2"><Crown className="text-orange-500" size={20} /> VIP 等级标准 (全局通用)</h3>
                {/* 快捷保存VIP等级变更 */}
                {Object.keys(pendingLevelChanges).length > 0 && (
                  <button
                    onClick={handleSaveAllChanges}
                    disabled={isSaving}
                    className="bg-blue-500 hover:bg-blue-600 disabled:bg-slate-600 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 transition-colors"
                  >
                    <Save size={14} />
                    {isSaving ? '保存中...' : `保存 ${Object.keys(pendingLevelChanges).length} 项变更`}
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {vipLevels.map(lvl => (
                  <div key={lvl.id} className="bg-white/5 p-5 rounded-2xl border border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-white/5 to-transparent rounded-bl-full pointer-events-none"></div>
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-bold text-white text-sm">{lvl.name}</h4>
                      {lvl.label && <span className={`text-[9px] ${getVersionColor(lvl.label)} px-2 py-0.5 rounded`}>{lvl.label}</span>}
                    </div>
                    <div className="space-y-2 mt-3">
                      <div><label className="text-[10px] text-slate-500 block mb-1">解锁金额 (元)</label><input type="number" placeholder="0" value={displayNumber(lvl.thresholdAmount)} onChange={e => handleNumberInput(e.target.value, (val) => handleLevelUpdate(lvl.id, 'thresholdAmount', val))} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-orange-400 font-black text-xs" /></div>
                      <div><label className="text-[10px] text-slate-500 block mb-1">专项服务可选数量</label><input type="number" placeholder="0" value={displayNumber(lvl.selectableProjectsCount)} onChange={e => handleNumberInput(e.target.value, (val) => handleLevelUpdate(lvl.id, 'selectableProjectsCount', val))} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-blue-400 font-black text-xs" /></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#12151c] border border-slate-800 rounded-[2.5rem] p-8">
              <h3 className="text-lg font-black text-white mb-6">人工干预额度 (手动设置)</h3>
              <div className="space-y-3">
                {users.filter(u => u.role !== UserRole.ADMIN).map(u => (
                  <QuotaEditor key={u.id} user={u} onUpdate={async () => await refreshData()} token={getToken()} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* === TAB: Users === */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {users.some(u => u.approvalStatus === 'PENDING') && (
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-3xl p-6">
                <h4 className="font-bold text-orange-500 flex items-center gap-2 mb-4 text-sm"><UserCheck size={16} /> 待审核注册申请</h4>
                <div className="space-y-2">
                  {users.filter(u => u.approvalStatus === 'PENDING').map(u => (
                    <div key={u.id} className="bg-[#12151c] rounded-xl p-3 flex items-center justify-between border border-slate-800">
                      <div className="flex items-center gap-3">
                        <div className="bg-slate-800 p-2 rounded-lg text-slate-400"><UserPlus size={16} /></div>
                        <div>
                          <div className="text-white font-bold text-sm">{u.username} <span className="text-slate-500 font-normal text-xs ml-2">{u.phoneNumber}</span></div>
                          <div className="text-xs text-orange-400 mt-0.5">申请加入：{u.enterpriseName}</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleApproveUser(u.id)} className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-lg text-xs font-bold flex items-center gap-1"><Check size={12} /> 批准</button>
                        <button onClick={() => handleRejectUser(u.id)} className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white rounded-lg text-xs font-bold flex items-center gap-1"><X size={12} /> 拒绝</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="bg-[#12151c] rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
              <div className="p-4 border-b border-slate-800 bg-white/5 flex justify-between items-center">
                <h4 className="font-bold text-white text-sm">用户列表</h4>
                <button onClick={() => setEditingUser({ id: `temp_${Date.now()}`, username: '', password: '123456', role: UserRole.EMPLOYEE, isCertified: true, approvalStatus: 'APPROVED', enterpriseName: '', quota: { lawyerLetters: 0, consultations: 0 } })} className="bg-orange-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1"><Plus size={14} /> 新增用户</button>
              </div>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-800">
                    <th className="p-4">用户</th>
                    <th className="p-4">角色</th>
                    <th className="p-4">所属公司</th>
                    <th className="p-4 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {users.filter(u => u.approvalStatus !== 'PENDING').map(u => (
                    <tr key={u.id} className="hover:bg-white/5 transition-colors group">
                      <td className="p-4 font-bold text-white text-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs text-slate-400 shrink-0">{u.username.slice(0, 1).toUpperCase()}</div>
                          <div>
                            <div>{u.username}</div>
                            <div className="text-xs text-slate-500 font-normal">{u.phoneNumber || '无手机号'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-xs text-slate-400">{u.role}</td>
                      <td className="p-4 text-xs text-slate-400">{u.enterpriseName || '-'}</td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2 opacity-50 group-hover:opacity-100 transition-all">
                          <button onClick={() => { setEditingUser({ ...u, password: '' }); setEditingUserOriginalPwd(u.password || null); }} className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white"><Edit3 size={14} /></button>
                          <button onClick={() => deleteItem('user', u.id)} className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-bold">用户名</label>
                <input value={editingUser.username} onChange={e => setEditingUser({ ...editingUser, username: e.target.value })} className="w-full bg-black/40 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white" required />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-bold">手机号码</label>
                <input value={editingUser.phoneNumber || ''} onChange={e => setEditingUser({ ...editingUser, phoneNumber: e.target.value })} className="w-full bg-black/40 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-bold">
                  密码 {editingUser.id?.startsWith('temp_') ? '' : '(留空则不修改)'}
                </label>
                <input
                  type="password"
                  value={editingUser.password || ''}
                  onChange={e => setEditingUser({ ...editingUser, password: e.target.value })}
                  placeholder={editingUser.id?.startsWith('temp_') ? '请输入密码' : '留空保持原密码'}
                  className="w-full bg-black/40 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-bold">角色权限</label>
                <select value={editingUser.role} onChange={e => setEditingUser({ ...editingUser, role: e.target.value as any })} className="w-full bg-black/40 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white">
                  <option value={UserRole.ADMIN}>超级管理员 (系统后台)</option>
                  <option value={UserRole.EXECUTIVE}>物业高管/老板</option>
                  <option value={UserRole.MANAGER}>项目负责人</option>
                  <option value={UserRole.EMPLOYEE}>普通员工</option>
                </select>
              </div>
              {editingUser.role !== UserRole.ADMIN && (
                <div className="space-y-1">
                  <label className="text-xs text-slate-500 font-bold">所属公司</label>
                  <select value={editingUser.enterpriseName || ''} onChange={e => setEditingUser({ ...editingUser, enterpriseName: e.target.value })} className="w-full bg-black/40 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white" required>
                    <option value="">-- 请选择 --</option>
                    {enterprises.map(ent => <option key={ent} value={ent}>{ent}</option>)}
                  </select>
                </div>
              )}
            </div>
            <div className="mt-8 flex gap-3">
              <button type="button" onClick={() => { setEditingUser(null); setEditingUserOriginalPwd(null); }} className="flex-1 py-3 rounded-xl text-xs font-black bg-slate-800 text-slate-500 hover:text-white transition-colors">取消</button>
              <button type="submit" className="flex-1 bg-orange-500 text-white py-3 rounded-xl text-xs font-black hover:bg-orange-600 transition-colors">保存</button>
            </div>
          </form>
        </div>
      )}

      {/* Doc Editor Modal */}
      {editingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#12151c] w-full max-w-lg rounded-[2rem] border border-slate-800 p-8 shadow-2xl">
            <h3 className="font-black text-white text-xl mb-4">文档编辑</h3>

            <form onSubmit={handleSaveDoc} className="space-y-4">
              <div><label className="text-xs text-slate-500 font-bold">标题</label><input value={editingDoc.title} onChange={e => setEditingDoc({ ...editingDoc, title: e.target.value })} className="w-full bg-black/40 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white" required /></div>
              <div>
                <label className="text-xs text-slate-500 font-bold">分类</label>
                <select
                  value={editingDoc.category}
                  onChange={e => setEditingDoc({ ...editingDoc, category: e.target.value })}
                  className="w-full bg-black/40 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white"
                >
                  {docCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div><label className="text-xs text-slate-500 font-bold">描述</label><input value={editingDoc.description} onChange={e => setEditingDoc({ ...editingDoc, description: e.target.value })} className="w-full bg-black/40 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white" /></div>
              <div><label className="text-xs text-slate-500 font-bold">内容</label><textarea value={editingDoc.content} onChange={e => setEditingDoc({ ...editingDoc, content: e.target.value })} className="w-full bg-black/40 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white h-32 resize-none" /></div>
              <div className="mt-6 flex gap-3">
                <button type="button" onClick={() => setEditingDoc(null)} className="flex-1 py-3 rounded-xl text-xs font-black bg-slate-800 text-slate-500">取消</button>
                <button type="submit" className="flex-1 bg-orange-500 text-white py-3 rounded-xl text-xs font-black">保存</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Law Editor Modal */}
      {editingLaw && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/80 backdrop-blur-sm">
          <form onSubmit={handleSaveLaw} className="bg-[#12151c] w-full max-w-lg rounded-[2rem] border border-slate-800 p-8">
            <h3 className="font-black text-white text-xl mb-6">法规编辑</h3>
            <div className="space-y-4">
              <div><label className="text-xs text-slate-500 font-bold">标题</label><input value={editingLaw.title} onChange={e => setEditingLaw({ ...editingLaw, title: e.target.value })} className="w-full bg-black/40 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white" required /></div>
              <div><label className="text-xs text-slate-500 font-bold">内容</label><textarea value={editingLaw.content} onChange={e => setEditingLaw({ ...editingLaw, content: e.target.value })} className="w-full bg-black/40 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white h-48 resize-none" /></div>
            </div>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setEditingLaw(null)} className="flex-1 py-3 rounded-xl text-xs font-black bg-slate-800 text-slate-500">取消</button>
              <button type="submit" className="flex-1 bg-orange-500 text-white py-3 rounded-xl text-xs font-black">保存</button>
            </div>
          </form>
        </div>
      )}

      {/* Risk Editor Modal */}
      {editingRisk && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/80 backdrop-blur-sm">
          <form onSubmit={handleSaveRisk} className="bg-[#12151c] w-full max-w-lg rounded-[2rem] border border-slate-800 p-8">
            <h3 className="font-black text-white text-xl mb-6">风险场景编辑</h3>
            <div className="space-y-4">
              <div><label className="text-xs text-slate-500 font-bold">标题</label><input value={editingRisk.title} onChange={e => setEditingRisk({ ...editingRisk, title: e.target.value })} className="w-full bg-black/40 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white" required /></div>
              <div><label className="text-xs text-slate-500 font-bold">检查问题 (每行一个)</label><textarea value={editingRisk.questions} onChange={e => setEditingRisk({ ...editingRisk, questions: e.target.value })} className="w-full bg-black/40 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white h-48 resize-none" placeholder="每行输入一个检查问题" /></div>
            </div>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setEditingRisk(null)} className="flex-1 py-3 rounded-xl text-xs font-black bg-slate-800 text-slate-500">取消</button>
              <button type="submit" className="flex-1 bg-orange-500 text-white py-3 rounded-xl text-xs font-black">保存</button>
            </div>
          </form>
        </div>
      )}

      {/* Evidence Editor Modal */}
      {editingEvidence && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/80 backdrop-blur-sm">
          <form onSubmit={handleSaveEvidence} className="bg-[#12151c] w-full max-w-lg rounded-[2rem] border border-slate-800 p-8">
            <h3 className="font-black text-white text-xl mb-6">取证清单编辑</h3>
            <div className="space-y-4">
              <div><label className="text-xs text-slate-500 font-bold">标题</label><input value={editingEvidence.title} onChange={e => setEditingEvidence({ ...editingEvidence, title: e.target.value })} className="w-full bg-black/40 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white" required /></div>
              <div><label className="text-xs text-slate-500 font-bold">证据项 (每行一个)</label><textarea value={editingEvidence.items} onChange={e => setEditingEvidence({ ...editingEvidence, items: e.target.value })} className="w-full bg-black/40 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white h-48 resize-none" placeholder="每行输入一个证据项" /></div>
            </div>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setEditingEvidence(null)} className="flex-1 py-3 rounded-xl text-xs font-black bg-slate-800 text-slate-500">取消</button>
              <button type="submit" className="flex-1 bg-orange-500 text-white py-3 rounded-xl text-xs font-black">保存</button>
            </div>
          </form>
        </div>
      )}

      {/* SOP Editor Modal */}
      {editingSOP && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/80 backdrop-blur-sm">
          <form onSubmit={handleSaveSOP} className="bg-[#12151c] w-full max-w-lg rounded-[2rem] border border-slate-800 p-8">
            <h3 className="font-black text-white text-xl mb-6">SOP 预案编辑</h3>
            <div className="space-y-4">
              <div><label className="text-xs text-slate-500 font-bold">标题</label><input value={editingSOP.title} onChange={e => setEditingSOP({ ...editingSOP, title: e.target.value })} className="w-full bg-black/40 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white" required /></div>
              <div><label className="text-xs text-slate-500 font-bold">紧急程度</label><select value={editingSOP.level} onChange={e => setEditingSOP({ ...editingSOP, level: e.target.value as any })} className="w-full bg-black/40 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white"><option value="HIGH">高</option><option value="MEDIUM">中</option></select></div>
              <div><label className="text-xs text-slate-500 font-bold">处理步骤 (每行一个)</label><textarea value={editingSOP.steps} onChange={e => setEditingSOP({ ...editingSOP, steps: e.target.value })} className="w-full bg-black/40 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white h-32 resize-none" /></div>
              <div><label className="text-xs text-slate-500 font-bold">注意事项</label><textarea value={editingSOP.tips} onChange={e => setEditingSOP({ ...editingSOP, tips: e.target.value })} className="w-full bg-black/40 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white h-20 resize-none" /></div>
            </div>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setEditingSOP(null)} className="flex-1 py-3 rounded-xl text-xs font-black bg-slate-800 text-slate-500">取消</button>
              <button type="submit" className="flex-1 bg-orange-500 text-white py-3 rounded-xl text-xs font-black">保存</button>
            </div>
          </form>
        </div>
      )}

      {/* Project Editor Modal */}
      {editingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/80 backdrop-blur-sm">
          <form onSubmit={handleSaveProject} className="bg-[#12151c] w-full max-w-lg rounded-[2rem] border border-slate-800 p-8">
            <h3 className="font-black text-white text-xl mb-6">专项服务编辑</h3>
            <div className="space-y-4">
              <div><label className="text-xs text-slate-500 font-bold">标题</label><input value={editingProject.title} onChange={e => setEditingProject({ ...editingProject, title: e.target.value })} className="w-full bg-black/40 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white" required /></div>
              <div><label className="text-xs text-slate-500 font-bold">描述</label><textarea value={editingProject.description || ''} onChange={e => setEditingProject({ ...editingProject, description: e.target.value })} className="w-full bg-black/40 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white h-32 resize-none" /></div>
            </div>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setEditingProject(null)} className="flex-1 py-3 rounded-xl text-xs font-black bg-slate-800 text-slate-500">取消</button>
              <button type="submit" className="flex-1 bg-orange-500 text-white py-3 rounded-xl text-xs font-black">保存</button>
            </div>
          </form>
        </div>
      )}

      {/* Script Editor Modal */}
      {editingScript && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/80 backdrop-blur-sm">
          <form onSubmit={handleSaveScript} className="bg-[#12151c] w-full max-w-lg rounded-[2rem] border border-slate-800 p-8">
            <h3 className="font-black text-white text-xl mb-6">话术编辑</h3>
            <div className="space-y-4">
              <div><label className="text-xs text-slate-500 font-bold">标题</label><input value={editingScript.title} onChange={e => setEditingScript({ ...editingScript, title: e.target.value })} className="w-full bg-black/40 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white" required /></div>
              <div>
                <label className="text-xs text-slate-500 font-bold">对话步骤</label>
                {(editingScript.steps || []).map((step, idx) => (
                  <div key={idx} className="flex gap-2 mt-2">
                    <input value={step.label} onChange={e => { const n = [...editingScript.steps]; n[idx] = { ...n[idx], label: e.target.value }; setEditingScript({ ...editingScript, steps: n }); }} placeholder="标签" className="flex-1 bg-black/40 border border-slate-800 rounded-xl py-2 px-3 text-sm text-white" />
                    <input value={step.content} onChange={e => { const n = [...editingScript.steps]; n[idx] = { ...n[idx], content: e.target.value }; setEditingScript({ ...editingScript, steps: n }); }} placeholder="内容" className="flex-[2] bg-black/40 border border-slate-800 rounded-xl py-2 px-3 text-sm text-white" />
                    <button type="button" onClick={() => { const n = editingScript.steps.filter((_, i) => i !== idx); setEditingScript({ ...editingScript, steps: n }); }} className="text-red-500"><X size={16} /></button>
                  </div>
                ))}
                <button type="button" onClick={() => setEditingScript({ ...editingScript, steps: [...(editingScript.steps || []), { label: '', content: '' }] })} className="mt-2 text-xs text-orange-500 font-bold">+ 添加步骤</button>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setEditingScript(null)} className="flex-1 py-3 rounded-xl text-xs font-black bg-slate-800 text-slate-500">取消</button>
              <button type="submit" className="flex-1 bg-orange-500 text-white py-3 rounded-xl text-xs font-black">保存</button>
            </div>
          </form>
        </div>
      )}

      {/* 新增分类弹窗 */}
      {showAddCategory && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#12151c] w-full max-w-sm rounded-3xl border border-slate-800 p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-black text-white">新增分类</h3>
              <button onClick={() => setShowAddCategory(false)} className="p-1 bg-slate-800 rounded-full text-slate-500 hover:text-white">
                <X size={16} />
              </button>
            </div>
            <input
              type="text"
              value={newCategoryName}
              onChange={e => setNewCategoryName(e.target.value)}
              placeholder="请输入分类名称"
              className="w-full bg-black/40 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white focus:border-orange-500 focus:outline-none"
              maxLength={20}
              onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
              autoFocus
            />
            <p className="text-[10px] text-slate-500 mt-2">分类名称最多20个字符</p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowAddCategory(false)}
                className="flex-1 py-3 rounded-xl text-xs font-black bg-slate-800 text-slate-500"
              >
                取消
              </button>
              <button
                onClick={handleAddCategory}
                className="flex-1 bg-orange-500 text-white py-3 rounded-xl text-xs font-black hover:bg-orange-600"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 人工干预额度编辑器组件
const QuotaEditor: React.FC<{ user: User; onUpdate: () => Promise<void>; token: string }> = ({ user, onUpdate, token }) => {
  const [lawyerLetters, setLawyerLetters] = useState(user.quota?.lawyerLetters || 0);
  const [consultations, setConsultations] = useState(user.quota?.consultations || 0);
  const [status, setStatus] = useState<'idle' | 'modified' | 'saving' | 'success' | 'error'>('idle');

  // 原始值，用于检测修改
  const originalLawyerLetters = user.quota?.lawyerLetters || 0;
  const originalConsultations = user.quota?.consultations || 0;
  const hasChanges = lawyerLetters !== originalLawyerLetters || consultations !== originalConsultations;

  // 当用户数据更新时，同步本地状态
  useEffect(() => {
    setLawyerLetters(user.quota?.lawyerLetters || 0);
    setConsultations(user.quota?.consultations || 0);
    setStatus('idle');
  }, [user.quota]);

  // 输入处理：移除前导零，只允许数字
  const handleNumberInput = (value: string, setter: (n: number) => void) => {
    const cleaned = value.replace(/\D/g, '');
    const num = cleaned === '' ? 0 : parseInt(cleaned, 10);
    setter(Math.max(0, num));
    if (status === 'idle' || status === 'success') setStatus('modified');
  };

  // 手动保存
  const handleSave = async () => {
    if (!hasChanges || !token) return;
    setStatus('saving');
    try {
      await api.updateUserQuota(user.id, { lawyerLetters, consultations }, token);
      // 清除用户信息缓存，确保下次获取最新数据
      cache.invalidate(CACHE_KEYS.USER_INFO);
      // 广播到其他标签页，通知刷新用户数据
      localStorage.setItem('quota-updated', Date.now().toString());
      // 派发自定义事件，通知当前标签页刷新
      window.dispatchEvent(new CustomEvent('quota-updated'));
      setStatus('success');
      await onUpdate();
      setTimeout(() => setStatus('idle'), 2000);
    } catch (err) {
      console.error('保存额度失败:', err);
      setStatus('error');
      // 回滚到原值
      setLawyerLetters(user.quota?.lawyerLetters || 0);
      setConsultations(user.quota?.consultations || 0);
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  // 保存按钮样式
  const getSaveButtonClass = () => {
    if (status === 'saving') return 'bg-slate-600 opacity-50 cursor-wait';
    if (status === 'success') return 'bg-green-600';
    if (status === 'error') return 'bg-red-600';
    if (hasChanges) return 'bg-orange-500 hover:bg-orange-600';
    return 'bg-slate-700 opacity-50 cursor-not-allowed';
  };

  return (
    <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/5">
      <div>
        <div className="font-bold text-white text-sm">{user.username} <span className="text-[10px] text-slate-500 bg-slate-800 px-1 rounded ml-1">{user.role}</span></div>
        <div className="text-xs text-slate-500 mt-0.5">{user.enterpriseName}</div>
      </div>
      <div className="flex gap-6 items-center">
        <div className="text-right">
          <div className="text-[9px] text-slate-500 uppercase mb-1">律师函</div>
          <input
            type="text"
            inputMode="numeric"
            value={lawyerLetters}
            onChange={e => handleNumberInput(e.target.value, setLawyerLetters)}
            className="w-20 bg-black/40 border border-orange-500/30 rounded-lg px-2 py-1 text-sm text-orange-400 font-bold text-center focus:border-orange-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>
        <div className="text-right">
          <div className="text-[9px] text-slate-500 uppercase mb-1">咨询</div>
          <input
            type="text"
            inputMode="numeric"
            value={consultations}
            onChange={e => handleNumberInput(e.target.value, setConsultations)}
            className="w-20 bg-black/40 border border-blue-500/30 rounded-lg px-2 py-1 text-sm text-blue-400 font-bold text-center focus:border-blue-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>
        <button
          onClick={handleSave}
          disabled={!hasChanges || status === 'saving'}
          className={`px-4 py-2 rounded-lg text-white text-sm font-medium transition-all ${getSaveButtonClass()}`}
        >
          {status === 'saving' ? '保存中...' :
           status === 'success' ? '✓ 已保存' :
           status === 'error' ? '失败' : '保存'}
        </button>
      </div>
    </div>
  );
};

// 人工干预额度编辑器组件

export default AdminDashboard;
