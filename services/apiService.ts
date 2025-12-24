const API_BASE = 'http://localhost:8000/api/v1';

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

  // 获取用户列表
  async getUsers(token: string) {
    const res = await fetch(`${API_BASE}/users`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
  },

  // 审批用户
  async approveUser(userId: string, token: string) {
    const res = await fetch(`${API_BASE}/users/${userId}/approve`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
  },

  // 删除用户
  async deleteUser(userId: string, token: string) {
    const res = await fetch(`${API_BASE}/users/${userId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
  },

  // 获取文档列表
  async getDocuments() {
    const res = await fetch(`${API_BASE}/documents`);
    return res.json();
  },

  // 创建文档
  async createDocument(docData: any, token: string) {
    const res = await fetch(`${API_BASE}/documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(docData)
    });
    return res.json();
  },

  // 更新文档
  async updateDocument(docId: string, docData: any, token: string) {
    const res = await fetch(`${API_BASE}/documents/${docId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(docData)
    });
    return res.json();
  },

  // 删除文档
  async deleteDocument(docId: string, token: string) {
    const res = await fetch(`${API_BASE}/documents/${docId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
  },

  // 获取风险场景列表
  async getRisks() {
    const res = await fetch(`${API_BASE}/risks`);
    return res.json();
  },

  // 创建风险场景
  async createRisk(riskData: any, token: string) {
    const res = await fetch(`${API_BASE}/risks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(riskData)
    });
    return res.json();
  },

  // 更新风险场景
  async updateRisk(riskId: string, riskData: any, token: string) {
    const res = await fetch(`${API_BASE}/risks/${riskId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(riskData)
    });
    return res.json();
  },

  // 删除风险场景
  async deleteRisk(riskId: string, token: string) {
    const res = await fetch(`${API_BASE}/risks/${riskId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
  },

  // 获取证据清单
  async getEvidence() {
    const res = await fetch(`${API_BASE}/evidence`);
    return res.json();
  },

  // 创建证据清单
  async createEvidence(evidenceData: any, token: string) {
    const res = await fetch(`${API_BASE}/evidence`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(evidenceData)
    });
    return res.json();
  },

  // 更新证据清单
  async updateEvidence(evidenceId: string, evidenceData: any, token: string) {
    const res = await fetch(`${API_BASE}/evidence/${evidenceId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(evidenceData)
    });
    return res.json();
  },

  // 删除证据清单
  async deleteEvidence(evidenceId: string, token: string) {
    const res = await fetch(`${API_BASE}/evidence/${evidenceId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
  },

  // 获取民法典
  async getCivilCode() {
    const res = await fetch(`${API_BASE}/civil-code`);
    return res.json();
  },

  // 创建民法典条文
  async createCivilCode(articleData: any, token: string) {
    const res = await fetch(`${API_BASE}/civil-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(articleData)
    });
    return res.json();
  },

  // 更新民法典条文
  async updateCivilCode(articleId: string, articleData: any, token: string) {
    const res = await fetch(`${API_BASE}/civil-code/${articleId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(articleData)
    });
    return res.json();
  },

  // 删除民法典条文
  async deleteCivilCode(articleId: string, token: string) {
    const res = await fetch(`${API_BASE}/civil-code/${articleId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
  },

  // 获取物业公司列表
  async getEnterprises() {
    const res = await fetch(`${API_BASE}/enterprises`);
    return res.json();
  },

  // 创建物业公司
  async createEnterprise(name: string, token: string) {
    const res = await fetch(`${API_BASE}/enterprises`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ name })
    });
    return res.json();
  },

  // 删除物业公司
  async deleteEnterprise(name: string, token: string) {
    const res = await fetch(`${API_BASE}/enterprises/${name}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
  },

  // 获取系统配置
  async getConfig() {
    const res = await fetch(`${API_BASE}/config`);
    return res.json();
  },

  // 更新系统配置
  async updateConfig(configData: any, token: string) {
    const res = await fetch(`${API_BASE}/config`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(configData)
    });
    return res.json();
  },

  // 获取自定义海报
  async getPosters() {
    const res = await fetch(`${API_BASE}/posters`);
    return res.json();
  },

  // 创建自定义海报
  async createPoster(posterData: any, token: string) {
    const res = await fetch(`${API_BASE}/posters`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(posterData)
    });
    return res.json();
  },

  // 删除自定义海报
  async deletePoster(posterId: string, token: string) {
    const res = await fetch(`${API_BASE}/posters/${posterId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
  },

  // 获取联系二维码
  async getContactQR() {
    const res = await fetch(`${API_BASE}/contact-qr`);
    return res.json();
  },

  // 创建联系二维码
  async createContactQR(qrData: any, token: string) {
    const res = await fetch(`${API_BASE}/contact-qr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(qrData)
    });
    return res.json();
  },

  // 删除联系二维码
  async deleteContactQR(qrId: string, token: string) {
    const res = await fetch(`${API_BASE}/contact-qr/${qrId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
  }
};