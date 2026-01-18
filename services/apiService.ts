const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

import { CACHE_KEYS, getCacheTTL, cache, type CacheContextValue } from './DataCacheContext';

// 默认法务体检提示词
const DEFAULT_HEALTH_CHECK_PROMPT = `你是一位资深物业法律顾问。用户完成了一份法律体检，以下是存在的风险点（回答为"否"或"不清楚"的项目）：
{{RISK_POINTS}}

请生成一份深度的《企业合规诊断报告》，包含以下部分：
1. 【总体风险评级】（高/中/低）及简短评语。
2. 【核心法律风险分析】针对上述风险点，引用《民法典》或《物业管理条例》说明可能导致的法律后果（如诉讼败诉、行政处罚）。
3. 【整改行动指南】给出3-5条具体的、可落地的整改建议。
4. 【东元工具推荐】根据风险类型，推荐"东元法物"系统内的工具（如：催收助手、装修巡查单、SOP、文书生成）作为解决方案。

要求：语气专业、严肃、切中痛点。`;

// 统一的错误处理函数
const handleApiError = async (response: Response) => {
  // 如果响应状态是401，说明Token无效或过期
  if (response.status === 401) {
    // 清除本地存储的token
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');

    // 抛出特殊错误，前端组件可以监听这个错误并执行退出登录
    const error = new Error('Token已失效，请重新登录');
    (error as any).isAuthError = true;
    throw error;
  }

  // 对于其他HTTP错误，也尝试解析错误信息
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.detail || errorData.message || `请求失败: ${response.status}`);
    throw error;
  }

  return response.json();
};

// 封装fetch请求，添加统一错误处理
const fetchWithErrorHandler = async (url: string, options?: RequestInit) => {
  const response = await fetch(url, options);
  return handleApiError(response);
};

export const api = {
  // 登录
  async login(username: string, password: string) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    return res.json();
  },

  // 发送短信
  async sendSms(phone: string) {
    const res = await fetch(`${API_BASE}/auth/send-sms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone })
    });
    return res.json();
  },

  // 注册
  async register(userData: any) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return res.json();
  },

  // 获取当前登录用户信息
  async getCurrentUser(token: string) {
    return fetchWithErrorHandler(`${API_BASE}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
  },

  // 获取用户列表
  async getUsers(token: string) {
    return fetchWithErrorHandler(`${API_BASE}/users`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
  },

  // 审批用户
  async approveUser(userId: string, token: string) {
    return fetchWithErrorHandler(`${API_BASE}/users/${userId}/approve`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    });
  },

  // 删除用户
  async deleteUser(userId: string, token: string) {
    return fetchWithErrorHandler(`${API_BASE}/users/${userId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
  },

  // 更新用户信息
  async updateUser(userId: string, userData: any, token: string) {
    return fetchWithErrorHandler(`${API_BASE}/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(userData)
    });
  },

  // 更新用户额度
  async updateUserQuota(userId: string, quota: { lawyerLetters: number; consultations: number }, token: string) {
    return fetchWithErrorHandler(`${API_BASE}/users/${userId}/quota`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        operation: 'set',
        lawyer_letters: quota.lawyerLetters,
        consultations: quota.consultations
      })
    });
  },

  // 管理员创建用户
  async createUserByAdmin(userData: any, token: string) {
    return fetchWithErrorHandler(`${API_BASE}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(userData)
    });
  },

  // 获取文档列表
  async getDocuments() {
    const res = await fetch(`${API_BASE}/documents`);
    return res.json();
  },

  // 获取文档分类
  async getDocCategories() {
    const res = await fetch(`${API_BASE}/documents/categories`);
    return res.json();
  },

  // 创建文档
  async createDocument(docData: any, token: string) {
    return fetchWithErrorHandler(`${API_BASE}/documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(docData)
    });
  },

  // 更新文档
  async updateDocument(docId: string, docData: any, token: string) {
    return fetchWithErrorHandler(`${API_BASE}/documents/${docId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(docData)
    });
  },

  // 删除文档
  async deleteDocument(docId: string, token: string) {
    return fetchWithErrorHandler(`${API_BASE}/documents/${docId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
  },

  // 获取风险场景列表
  async getRisks() {
    const res = await fetch(`${API_BASE}/risks`);
    return res.json();
  },

  // 创建风险场景
  async createRisk(riskData: any, token: string) {
    return fetchWithErrorHandler(`${API_BASE}/risks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(riskData)
    });
  },

  // 更新风险场景
  async updateRisk(riskId: string, riskData: any, token: string) {
    return fetchWithErrorHandler(`${API_BASE}/risks/${riskId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(riskData)
    });
  },

  // 删除风险场景
  async deleteRisk(riskId: string, token: string) {
    return fetchWithErrorHandler(`${API_BASE}/risks/${riskId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
  },

  // 获取证据清单
  async getEvidence() {
    const res = await fetch(`${API_BASE}/evidence`);
    return res.json();
  },

  // 创建证据清单
  async createEvidence(evidenceData: any, token: string) {
    return fetchWithErrorHandler(`${API_BASE}/evidence`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(evidenceData)
    });
  },

  // 更新证据清单
  async updateEvidence(evidenceId: string, evidenceData: any, token: string) {
    return fetchWithErrorHandler(`${API_BASE}/evidence/${evidenceId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(evidenceData)
    });
  },

  // 删除证据清单
  async deleteEvidence(evidenceId: string, token: string) {
    return fetchWithErrorHandler(`${API_BASE}/evidence/${evidenceId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
  },

  // 获取民法典
  async getCivilCode() {
    const res = await fetch(`${API_BASE}/civil-code`);
    return res.json();
  },

  // 创建民法典条文
  async createCivilCode(articleData: any, token: string) {
    return fetchWithErrorHandler(`${API_BASE}/civil-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(articleData)
    });
  },

  // 更新民法典条文
  async updateCivilCode(articleId: string, articleData: any, token: string) {
    return fetchWithErrorHandler(`${API_BASE}/civil-code/${articleId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(articleData)
    });
  },

  // 删除民法典条文
  async deleteCivilCode(articleId: string, token: string) {
    return fetchWithErrorHandler(`${API_BASE}/civil-code/${articleId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
  },

  // 获取物业公司列表
  async getEnterprises() {
    const res = await fetch(`${API_BASE}/enterprises`);
    return res.json();
  },

  // 创建物业公司
  async createEnterprise(name: string, token: string) {
    return fetchWithErrorHandler(`${API_BASE}/enterprises`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ name })
    });
  },

  // 删除物业公司
  async deleteEnterprise(name: string, token: string) {
    return fetchWithErrorHandler(`${API_BASE}/enterprises/${name}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
  },

  // 获取系统配置
  async getConfig() {
    const res = await fetch(`${API_BASE}/config`);
    return res.json();
  },

  // 更新系统配置
  async updateConfig(configData: any, token: string) {
    return fetchWithErrorHandler(`${API_BASE}/config`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(configData)
    });
  },

  // 获取自定义海报
  async getPosters() {
    const res = await fetch(`${API_BASE}/posters`);
    return res.json();
  },

  // 创建自定义海报
  async createPoster(posterData: { name: string; image_url: string }, token: string) {
    return fetchWithErrorHandler(`${API_BASE}/posters`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(posterData)
    });
  },

  // 删除自定义海报
  async deletePoster(posterId: string, token: string) {
    return fetchWithErrorHandler(`${API_BASE}/posters/${posterId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
  },

  // 获取联系二维码
  async getContactQR() {
    const res = await fetch(`${API_BASE}/contact-qr`);
    return res.json();
  },

  // 创建联系二维码
  async createContactQR(qrData: { name: string; image_url: string }, token: string) {
    return fetchWithErrorHandler(`${API_BASE}/contact-qr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(qrData)
    });
  },

  // 删除联系二维码
  async deleteContactQR(qrId: string, token: string) {
    return fetchWithErrorHandler(`${API_BASE}/contact-qr/${qrId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
  },

  // 获取开屏图
  async getSplashImage() {
    const res = await fetch(`${API_BASE}/config/splash-image`);
    return res.json();
  },

  // 上传开屏图
  async uploadSplashImage(imageData: { splash_image: string }, token: string) {
    return fetchWithErrorHandler(`${API_BASE}/config/splash-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(imageData)
    });
  },

  // 删除开屏图
  async deleteSplashImage(token: string) {
    return fetchWithErrorHandler(`${API_BASE}/config/splash-image`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
  },

  // ============ 欠费催收记录 ============
  async getCollections(token: string) {
    return fetchWithErrorHandler(`${API_BASE}/collections`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
  },

  async getCollection(recordId: string, token: string) {
    return fetchWithErrorHandler(`${API_BASE}/collections/${recordId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
  },

  async createCollection(data: any, token: string) {
    return fetchWithErrorHandler(`${API_BASE}/collections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
  },

  async updateCollection(recordId: string, data: any, token: string) {
    return fetchWithErrorHandler(`${API_BASE}/collections/${recordId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
  },

  async deleteCollection(recordId: string, token: string) {
    return fetchWithErrorHandler(`${API_BASE}/collections/${recordId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
  },

  async addCollectionAction(recordId: string, action: any, token: string) {
    return fetchWithErrorHandler(`${API_BASE}/collections/${recordId}/actions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(action)
    });
  },

  // ============ 企业统计数据 ============
  async getEnterpriseStats(token: string) {
    return fetchWithErrorHandler(`${API_BASE}/vip/stats`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
  },

  // 获取指定企业的统计数据（管理员用）
  async getEnterpriseStatsByName(enterpriseName: string, token: string) {
    return fetchWithErrorHandler(`${API_BASE}/vip/stats/${encodeURIComponent(enterpriseName)}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
  },

  // ============ VIP 等级 ============
  async getVipLevels() {
    const res = await fetch(`${API_BASE}/vip/levels`);
    return res.json();
  },

  // 更新VIP等级
  async updateVipLevel(levelId: string, data: any, token: string) {
    return fetchWithErrorHandler(`${API_BASE}/vip/levels/${levelId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
  },

  // ============ 企业统计数据 ============
  async updateEnterpriseStats(data: {
    enterprise_name: string;
    total_recovered_amount: number;
    total_entrusted_amount: number;
    entrusted_count: number;
  }, token: string) {
    return fetchWithErrorHandler(`${API_BASE}/vip/stats`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
  },

  // 选择专项服务
  async selectProjects(projectIds: string[], token: string) {
    return fetchWithErrorHandler(`${API_BASE}/vip/select-projects`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ project_ids: projectIds })
    });
  },

  // ============ 话术库 - 管理端 ============
  async getAdminScripts(token: string) {
    return fetchWithErrorHandler(`${API_BASE}/admin/scripts`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
  },

  async createAdminScript(data: any, token: string) {
    return fetchWithErrorHandler(`${API_BASE}/admin/scripts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
  },

  async updateAdminScript(scriptId: string, data: any, token: string) {
    return fetchWithErrorHandler(`${API_BASE}/admin/scripts/${scriptId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
  },

  async deleteAdminScript(scriptId: string, token: string) {
    return fetchWithErrorHandler(`${API_BASE}/admin/scripts/${scriptId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
  },

  // ============ 话术库 - 用户端（只读） ============
  async getCollectionScripts() {
    const res = await fetch(`${API_BASE}/collection-scripts`);
    return res.json();
  },

  // ============ 应急预案 ============
  async getSOPs() {
    const res = await fetch(`${API_BASE}/sops`);
    return res.json();
  },

  async createSOP(data: any, token: string) {
    return fetchWithErrorHandler(`${API_BASE}/sops`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
  },

  async updateSOP(sopId: string, data: any, token: string) {
    return fetchWithErrorHandler(`${API_BASE}/sops/${sopId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
  },

  async deleteSOP(sopId: string, token: string) {
    return fetchWithErrorHandler(`${API_BASE}/sops/${sopId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
  },

  // ============ 法务体检 ============
  async getHealthCheck() {
    const res = await fetch(`${API_BASE}/health-check`);
    return res.json();
  },

  // ============ 装修巡查 ============

  // 获取装修巡查项配置
  async getRenovationItems() {
    try {
      const res = await fetch(`${API_BASE}/config/renovation-items`);
      const data = await res.json();
      return data.items || [];
    } catch {
      return [];
    }
  },

  // 保存装修巡查项配置
  async updateRenovationItems(items: string[], token: string) {
    return fetchWithErrorHandler(`${API_BASE}/config/renovation-items`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ items })
    });
  },

  async getRenovationRecords(token: string) {
    return fetchWithErrorHandler(`${API_BASE}/renovation`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
  },

  async getRenovationRecord(recordId: string, token: string) {
    return fetchWithErrorHandler(`${API_BASE}/renovation/${recordId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
  },

  async createRenovationRecord(data: any, token: string) {
    return fetchWithErrorHandler(`${API_BASE}/renovation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
  },

  async updateRenovationRecord(recordId: string, data: any, token: string) {
    return fetchWithErrorHandler(`${API_BASE}/renovation/${recordId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
  },

  async deleteRenovationRecord(recordId: string, token: string) {
    return fetchWithErrorHandler(`${API_BASE}/renovation/${recordId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
  },

  // ============ 服务请求 ============
  async getServiceRequests(token: string) {
    return fetchWithErrorHandler(`${API_BASE}/service-requests`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
  },

  async getServiceRequest(requestId: string, token: string) {
    return fetchWithErrorHandler(`${API_BASE}/service-requests/${requestId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
  },

  async createServiceRequest(data: any, token: string) {
    return fetchWithErrorHandler(`${API_BASE}/service-requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
  },

  async updateServiceRequest(requestId: string, data: any, token: string) {
    return fetchWithErrorHandler(`${API_BASE}/service-requests/${requestId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
  },

  async deleteServiceRequest(requestId: string, token: string) {
    return fetchWithErrorHandler(`${API_BASE}/service-requests/${requestId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
  },

  // 管理端 - 获取所有服务请求
  async getAllServiceRequests(token: string) {
    return fetchWithErrorHandler(`${API_BASE}/service-requests/admin/all`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
  },

  // 管理端 - 更新服务请求状态
  async updateServiceRequestStatus(requestId: string, status: string, adminResponse: string, token: string) {
    return fetchWithErrorHandler(`${API_BASE}/service-requests/admin/${requestId}/status?status=${status}&admin_response=${encodeURIComponent(adminResponse)}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    });
  },

  // 管理端 - 批量删除已驳回的申请
  async deleteRejectedRequests(token: string) {
    return fetchWithErrorHandler(`${API_BASE}/service-requests/admin/rejected`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
  },

  // ============ 专项服务 ============
  async getSpecialProjects() {
    const res = await fetch(`${API_BASE}/special-projects`);
    return res.json();
  },

  async createSpecialProject(data: { title: string; description?: string }, token: string) {
    return fetchWithErrorHandler(`${API_BASE}/special-projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
  },

  async updateSpecialProject(projectId: string, data: { title: string; description?: string }, token: string) {
    return fetchWithErrorHandler(`${API_BASE}/special-projects/${projectId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
  },

  async deleteSpecialProject(projectId: string, token: string) {
    return fetchWithErrorHandler(`${API_BASE}/special-projects/${projectId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
  },

  // ============ 用户协议 ============
  async getAgreement() {
    const res = await fetch(`${API_BASE}/auth/agreement`);
    return res.json();
  },

  // ============ AI 知识库 ============
  async getAIKB() {
    const res = await fetch(`${API_BASE}/ai-kb`);
    return res.json();
  },

  async updateAIKB(data: { ai_kb: string }, token: string) {
    return fetchWithErrorHandler(`${API_BASE}/ai-kb`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
  },

  // ============ 法务体检提示词 ============
  async getHealthCheckPrompt() {
    // 从 AI 知识库中提取体检提示词
    try {
      const res = await fetch(`${API_BASE}/ai-kb`);
      const data = await res.json();
      // 从 ai_kb 中提取体检提示词部分，如果没有则返回默认
      const aiKb = data.ai_kb || '';
      // 尝试从 AI 知识库内容中提取体检提示词格式的内容
      if (aiKb.includes('你是一位资深物业法律顾问') || aiKb.includes('企业合规诊断报告')) {
        return { prompt: aiKb };
      }
      // 否则返回默认提示词
      return { prompt: DEFAULT_HEALTH_CHECK_PROMPT };
    } catch (err) {
      return { prompt: DEFAULT_HEALTH_CHECK_PROMPT };
    }
  },

  async updateHealthCheckPrompt(data: { prompt: string }, token: string) {
    // 保存到 AI 知识库（完整内容）
    return fetchWithErrorHandler(`${API_BASE}/ai-kb`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ ai_kb: data.prompt })
    });
  },
};

// ============================================================================
// 全局缓存实例（供非组件代码使用）
// ============================================================================

let globalCache: CacheContextValue | null = null;

/**
 * 设置全局缓存实例（由 CacheProvider 在挂载时调用）
 */
export const setGlobalCache = (c: CacheContextValue) => {
  globalCache = c;
};

/**
 * 获取全局缓存实例
 */
const getGlobalCache = (): CacheContextValue => {
  if (globalCache) return globalCache;
  // 如果全局缓存未初始化，返回一个不操作的对象
  return {
    getCache: () => null,
    setCache: () => {},
    invalidate: () => {},
    invalidateUser: () => {},
    clear: () => {},
  };
};

// ============================================================================
// 带缓存的 API 调用
// ============================================================================

/**
 * 带缓存的 API 封装
 * 自动管理 API 响应缓存，减少重复请求
 */
export const cachedApi = {
  /**
   * 获取当前登录用户信息（5分钟缓存）
   */
  async getCurrentUser(token: string) {
    const cache = getGlobalCache();
    const cached = cache.getCache<any>(CACHE_KEYS.USER_INFO);
    if (cached) return cached;

    const data = await fetchWithErrorHandler(`${API_BASE}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    cache.setCache(CACHE_KEYS.USER_INFO, data, getCacheTTL('USER_INFO'));
    return data;
  },

  /**
   * 获取当前登录用户信息（绕过缓存）
   * 用于强制刷新用户数据，如管理员修改额度后
   */
  async getCurrentUserWithoutCache(token: string) {
    return await fetchWithErrorHandler(`${API_BASE}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
  },

  /**
   * 获取企业统计数据（2分钟缓存）
   */
  async getEnterpriseStats(token: string) {
    const cache = getGlobalCache();
    const cached = cache.getCache<any>(CACHE_KEYS.ENTERPRISE_STATS);
    if (cached) return cached;

    const data = await fetchWithErrorHandler(`${API_BASE}/vip/stats`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    cache.setCache(CACHE_KEYS.ENTERPRISE_STATS, data, getCacheTTL('ENTERPRISE_STATS'));
    return data;
  },

  /**
   * 获取 VIP 等级配置（30分钟缓存）
   */
  async getVipLevels() {
    const cache = getGlobalCache();
    const cached = cache.getCache<any[]>(CACHE_KEYS.VIP_LEVELS);
    if (cached) return cached;

    const res = await fetch(`${API_BASE}/vip/levels`);
    const data = await res.json();

    cache.setCache(CACHE_KEYS.VIP_LEVELS, data, getCacheTTL('VIP_LEVELS'));
    return data;
  },

  /**
   * 获取文档列表（5分钟缓存）
   */
  async getDocuments() {
    const cache = getGlobalCache();
    const cached = cache.getCache<any[]>(CACHE_KEYS.DOCUMENTS);
    if (cached) return cached;

    const res = await fetch(`${API_BASE}/documents`);
    const data = await res.json();

    cache.setCache(CACHE_KEYS.DOCUMENTS, data, getCacheTTL('DOCUMENTS'));
    return data;
  },

  /**
   * 获取文档分类（5分钟缓存）
   */
  async getDocCategories() {
    const cache = getGlobalCache();
    const cached = cache.getCache<any[]>(CACHE_KEYS.DOC_CATEGORIES);
    if (cached) return cached;

    const res = await fetch(`${API_BASE}/documents/categories`);
    const data = await res.json();

    cache.setCache(CACHE_KEYS.DOC_CATEGORIES, data, getCacheTTL('DOCUMENTS'));
    return data;
  },

  /**
   * 获取风控场景列表（5分钟缓存）
   */
  async getRisks() {
    const cache = getGlobalCache();
    const cached = cache.getCache<any[]>(CACHE_KEYS.RISKS);
    if (cached) return cached;

    const res = await fetch(`${API_BASE}/risks`);
    const data = await res.json();

    cache.setCache(CACHE_KEYS.RISKS, data, getCacheTTL('RISKS'));
    return data;
  },

  /**
   * 获取证据清单（5分钟缓存）
   */
  async getEvidence() {
    const cache = getGlobalCache();
    const cached = cache.getCache<any[]>(CACHE_KEYS.EVIDENCE);
    if (cached) return cached;

    const res = await fetch(`${API_BASE}/evidence`);
    const data = await res.json();

    cache.setCache(CACHE_KEYS.EVIDENCE, data, getCacheTTL('EVIDENCE'));
    return data;
  },

  /**
   * 获取法条数据（30分钟缓存）
   */
  async getCivilCode() {
    const cache = getGlobalCache();
    const cached = cache.getCache<any[]>(CACHE_KEYS.CIVIL_CODE);
    if (cached) return cached;

    const res = await fetch(`${API_BASE}/civil-code`);
    const data = await res.json();

    cache.setCache(CACHE_KEYS.CIVIL_CODE, data, getCacheTTL('CIVIL_CODE'));
    return data;
  },

  /**
   * 获取物业公司列表（5分钟缓存）
   */
  async getEnterprises() {
    const cache = getGlobalCache();
    const cached = cache.getCache<any[]>(CACHE_KEYS.ENTERPRISES);
    if (cached) return cached;

    const res = await fetch(`${API_BASE}/enterprises`);
    const data = await res.json();

    cache.setCache(CACHE_KEYS.ENTERPRISES, data, getCacheTTL('DOCUMENTS'));
    return data;
  },

  /**
   * 获取系统配置（5分钟缓存）
   */
  async getConfig() {
    const cache = getGlobalCache();
    const cached = cache.getCache<any>(CACHE_KEYS.CONFIG);
    if (cached) return cached;

    const res = await fetch(`${API_BASE}/config`);
    const data = await res.json();

    cache.setCache(CACHE_KEYS.CONFIG, data, getCacheTTL('DOCUMENTS'));
    return data;
  },

  /**
   * 强制刷新用户信息（清除缓存后重新请求）
   */
  async refreshCurrentUser(token: string) {
    const cache = getGlobalCache();
    cache.invalidate(CACHE_KEYS.USER_INFO);
    return this.getCurrentUser(token);
  },

  /**
   * 清除用户相关缓存
   */
  clearUserCache() {
    const cache = getGlobalCache();
    cache.invalidateUser();
  },

  /**
   * 获取催收话术库（5分钟缓存，用户端只读）
   */
  async getCollectionScripts() {
    const cache = getGlobalCache();
    const cached = cache.getCache<any[]>(CACHE_KEYS.COLLECTION_SCRIPTS);
    if (cached) return cached;

    const res = await fetch(`${API_BASE}/collection-scripts`);
    const data = await res.json();

    cache.setCache(CACHE_KEYS.COLLECTION_SCRIPTS, data, getCacheTTL('SCRIPTS'));
    return data;
  },

  // ============ 使用日志 ============
  async getUsageLogs(token: string, enterprise?: string, feature?: string) {
    let url = `${API_BASE}/usage-logs`;
    const params = new URLSearchParams();
    if (enterprise) params.append('enterprise', enterprise);
    if (feature) params.append('feature', feature);
    if (params.toString()) url += '?' + params.toString();

    return fetchWithErrorHandler(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
  }
};