
import { DocumentItem, RiskScenario, User, UserRole, EvidenceGroup, LawArticle, CustomPosterTemplate, ContactQRCode, SystemConfig, ApprovalStatus } from '../types';

const KEYS = {
  USERS: 'dy_users',
  DOCS: 'dy_docs',
  DIAGNOSIS: 'dy_diagnosis', 
  AI_KB: 'dy_ai_kb',
  DOC_CATS: 'dy_doc_cats',
  CHECK_DATA: 'dy_check_scenarios', 
  EVIDENCE: 'dy_evidence',
  CIVIL_CODE: 'dy_civil_code',
  ENTERPRISE_LOGO: 'dy_enterprise_logo',
  CUSTOM_POSTERS: 'dy_custom_posters',
  CONTACT_QRS: 'dy_contact_qrs',
  SPLASH_IMAGE: 'dy_splash_image',
  SESSION_USER: 'dy_session_user', 
  ENTERPRISES: 'dy_enterprises',
  SYSTEM_CONFIG: 'dy_system_config'
};

const DEFAULT_WELCOME = '您好！我是东元物业法务助手。我可以为您提供《民法典》咨询、文书草拟及风险建议。（回答仅供参考）';

export const db = {
  init: () => {
    // 1. Users Initialization
    let users: User[] = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
    const defaultUsers: User[] = [
      { id: '1', username: 'admin', password: 'admin', role: UserRole.ADMIN, isCertified: true, approvalStatus: 'APPROVED', phoneNumber: '13800000000' },
      { id: '2', username: 'user1', password: '123', role: UserRole.USER, enterpriseName: '东元示范物业', isCertified: true, approvalStatus: 'APPROVED', phoneNumber: '13900000000' },
      { id: '3', username: 'zmh123', password: '123456', role: UserRole.USER, enterpriseName: '东元示范物业', isCertified: true, approvalStatus: 'APPROVED', phoneNumber: '13700000000' }
    ];

    if (users.length === 0) {
      localStorage.setItem(KEYS.USERS, JSON.stringify(defaultUsers));
    } else {
      // 兼容旧数据
      const updatedUsers: User[] = users.map(u => ({
        ...u,
        approvalStatus: (u.approvalStatus || 'APPROVED') as ApprovalStatus
      }));
      
      const hasZmh = updatedUsers.some(u => u.username === 'zmh123');
      if (!hasZmh) {
        updatedUsers.push(defaultUsers[2]);
      }
      localStorage.setItem(KEYS.USERS, JSON.stringify(updatedUsers));
    }

    // 2. Doc Categories
    if (!localStorage.getItem(KEYS.DOC_CATS)) {
      localStorage.setItem(KEYS.DOC_CATS, JSON.stringify(["全部", "前介承接", "业户服务", "外包管理", "纠纷告知"]));
    }

    // 3. Documents
    if (!localStorage.getItem(KEYS.DOCS)) {
      const initialDocs: DocumentItem[] = [
        { 
          id: '1', 
          title: '前期物业服务合同', 
          category: '前介承接', 
          description: '含承接查验及交房环节的关键风险防控条款',
          content: '【前期物业服务合同】\n第一条 委托方(建设单位)：[单位名称]\n第二条 受托方(物业服务人)：[公司名称]\n...\n[此处为东元法务部审核的标准化条款]...'
        },
        { 
          id: '2', 
          title: '催缴物业费律师函', 
          category: '纠纷告知', 
          description: '由东元律师团审核，具备司法证据效力的正式告知函',
          content: '【律师函：限期缴纳告知】\n致[业主姓名/房号]：\n根据《民法典》第九百四十四条规定，业主应当按照约定向物业服务人支付物业费...\n如逾期未缴纳，我司将依法提起诉讼...'
        }
      ];
      localStorage.setItem(KEYS.DOCS, JSON.stringify(initialDocs));
    }

    // 4. Risk Check Scenarios
    if (!localStorage.getItem(KEYS.CHECK_DATA)) {
      const initialChecks: RiskScenario[] = [
        { 
          id: 's1', 
          title: '保安外包合规性自查',
          questions: [
            '保安服务合同是否明确约定了造成第三方损失的赔偿责任主体？',
            '是否已留存外包保安人员的无犯罪记录证明复印件？',
            '是否约定了保安人员的年龄上限及健康状况要求？',
            '是否有对外包公司定期的履约评价记录？'
          ]
        },
        { 
          id: 's2', 
          title: '电梯维保合同风险筛查',
          questions: [
            '维保合同是否包含年度年检费用的承担方？',
            '是否明确了困人故障的到达现场时限？',
            '是否有关于配件更换价格的预先约定清单？'
          ]
        },
        { 
          id: 's3', 
          title: '节前小区安全隐患排查', 
          questions: [
            '消防泵房/消火栓是否处于正常工作状态并有巡检记录？',
            '公共区域及应急逃生通道是否已清理杂物且无电动车停放？',
            '化粪池、雨污水管道是否已进行节前清掏或排查？',
            '节日期间值班表是否已公示并确认关键岗位人员在岗？'
          ] 
        }
      ];
      localStorage.setItem(KEYS.CHECK_DATA, JSON.stringify(initialChecks));
    }

    // 5. Evidence Data
    if (!localStorage.getItem(KEYS.EVIDENCE)) {
      const initialEvidence: EvidenceGroup[] = [
        {
          id: 'e1',
          title: "物业费追缴（个人）",
          items: [
            "房产所有权证明/购房合同复印件",
            "《物业服务合同》（需含收费标准条款）",
            "欠费明细清单（加盖财务公章）",
            "律师函/催费通知单的送达凭证（如挂号信回执）",
            "公示记录照片（如小区公告栏催费公示）"
          ]
        },
        {
          id: 'e2',
          title: "违章装修/改变外立面",
          items: [
            "《装修管理协议》签署原件",
            "现场违章施工照片（多角度且包含时间水印）",
            "《整改通知书》及拒绝签收记录",
            "原始建筑设计图纸（对比违规部分）",
            "劝阻过程的录音录像资料"
          ]
        },
        {
          id: 'e3',
          title: "高空抛物侵权",
          items: [
            "公共区域监控视频拷贝",
            "现场血迹/损坏物品封存照片",
            "派出所报警回执/询问笔录",
            "物业已尽安全保障义务证明（如警示标识照片、巡检记录）",
            "证人证言及其联系方式"
          ]
        }
      ];
      localStorage.setItem(KEYS.EVIDENCE, JSON.stringify(initialEvidence));
    }

    // 6. Civil Code Data
    if (!localStorage.getItem(KEYS.CIVIL_CODE)) {
      const initialLaws: LawArticle[] = [
        { id: '271', title: '第二百七十一条', content: '业主对建筑物内的住宅、经营性用房等专有部分享有所有权，对专有部分以外的共有部分享有共有和共同管理的权利。' },
        { id: '277', title: '第二百七十七条', content: '业主可以设立业主大会，选举业主委员会。地方人民政府有关部门、居民委员会应当对设立业主大会和选举业主委员会给予指导和协助。' },
        { id: '284', title: '第二百八十四条', content: '业主可以自行管理建筑物及其附属设施，也可以委托物业服务企业或者其他管理人管理。对建设单位聘请的物业服务企业或者其他管理人，业主有权依法更换。' },
        { id: '937', title: '第九百三十七条', content: '物业服务合同是物业服务人在物业服务区域内，为业主提供建筑物及其附属设施的维修养护、环境卫生和相关秩序的管理维护等物业服务，业主支付物业费的合同。' },
        { id: '944', title: '第九百四十四条', content: '业主应当按照约定向物业服务人支付物业费。物业服务人已经按照约定和有关规定提供服务的，业主不得以未接受或者无需接受相关物业服务为由拒绝支付物业费。' }
      ];
      localStorage.setItem(KEYS.CIVIL_CODE, JSON.stringify(initialLaws));
    }

    // 7. AI KB
    if (!localStorage.getItem(KEYS.AI_KB)) {
      localStorage.setItem(KEYS.AI_KB, "东元法务助手：遵循《民法典》。专注于物业费收缴、违章装修、公共部位纠纷。回复专业、严谨。");
    }

    // 8. Enterprises
    if (!localStorage.getItem(KEYS.ENTERPRISES)) {
      localStorage.setItem(KEYS.ENTERPRISES, JSON.stringify(["东元示范物业", "万科物业", "碧桂园服务", "龙湖智慧服务"]));
    }

    // 9. System Config
    if (!localStorage.getItem(KEYS.SYSTEM_CONFIG)) {
      localStorage.setItem(KEYS.SYSTEM_CONFIG, JSON.stringify({ 
        enablePhoneLogin: true,
        welcomeMessage: DEFAULT_WELCOME
      }));
    } else {
      // 数据迁移：确保 welcomeMessage 字段存在
      const config = JSON.parse(localStorage.getItem(KEYS.SYSTEM_CONFIG) || '{}');
      if (!config.welcomeMessage) {
        config.welcomeMessage = DEFAULT_WELCOME;
        localStorage.setItem(KEYS.SYSTEM_CONFIG, JSON.stringify(config));
      }
    }
  },

  // Users
  getUsers: (): User[] => JSON.parse(localStorage.getItem(KEYS.USERS) || '[]'),
  saveUsers: (users: User[]) => localStorage.setItem(KEYS.USERS, JSON.stringify(users)),
  updateUser: (id: string, updates: Partial<User>): User | null => {
    const users = db.getUsers();
    const idx = users.findIndex(u => u.id === id);
    if (idx > -1) {
      users[idx] = { ...users[idx], ...updates };
      db.saveUsers(users);
      return users[idx];
    }
    return null;
  },
  deleteUser: (id: string) => {
    const users = db.getUsers();
    const updated = users.filter(u => u.id !== id);
    db.saveUsers(updated);
  },
  // 注册用户
  registerUser: (newUser: User) => {
    const users = db.getUsers();
    if (users.some(u => u.username === newUser.username)) {
      throw new Error('用户名已存在');
    }
    if (newUser.phoneNumber && users.some(u => u.phoneNumber === newUser.phoneNumber)) {
      throw new Error('手机号已被注册');
    }
    users.push(newUser);
    db.saveUsers(users);
  },
  
  // Session Management (Updated for Auto Login)
  setSession: (userId: string, remember: boolean = true) => {
    if (remember) {
      localStorage.setItem(KEYS.SESSION_USER, userId);
      sessionStorage.removeItem(KEYS.SESSION_USER); // 清理临时会话
    } else {
      sessionStorage.setItem(KEYS.SESSION_USER, userId);
      localStorage.removeItem(KEYS.SESSION_USER); // 清理持久会话
    }
  },
  getSession: (): string | null => {
    return localStorage.getItem(KEYS.SESSION_USER) || sessionStorage.getItem(KEYS.SESSION_USER);
  },
  clearSession: () => {
    localStorage.removeItem(KEYS.SESSION_USER);
    sessionStorage.removeItem(KEYS.SESSION_USER);
  },
  getUserById: (id: string): User | undefined => {
    const users = db.getUsers();
    return users.find(u => u.id === id);
  },
  getUserByPhone: (phone: string): User | undefined => {
    const users = db.getUsers();
    return users.find(u => u.phoneNumber === phone);
  },

  // Enterprises Management
  getEnterprises: (): string[] => JSON.parse(localStorage.getItem(KEYS.ENTERPRISES) || '[]'),
  saveEnterprises: (list: string[]) => localStorage.setItem(KEYS.ENTERPRISES, JSON.stringify(list)),
  addEnterprise: (name: string) => {
    const list = db.getEnterprises();
    if (!list.includes(name)) {
      list.push(name);
      db.saveEnterprises(list);
    }
  },
  deleteEnterprise: (name: string) => {
    const list = db.getEnterprises();
    const updated = list.filter(n => n !== name);
    db.saveEnterprises(updated);
  },

  // System Config
  getSystemConfig: (): SystemConfig => JSON.parse(localStorage.getItem(KEYS.SYSTEM_CONFIG) || '{"enablePhoneLogin": true}'),
  saveSystemConfig: (config: SystemConfig) => localStorage.setItem(KEYS.SYSTEM_CONFIG, JSON.stringify(config)),

  // Docs
  getDocs: (): DocumentItem[] => JSON.parse(localStorage.getItem(KEYS.DOCS) || '[]'),
  saveDocs: (docs: DocumentItem[]) => localStorage.setItem(KEYS.DOCS, JSON.stringify(docs)),
  getCategories: (): string[] => JSON.parse(localStorage.getItem(KEYS.DOC_CATS) || '["全部"]'),
  saveCategories: (cats: string[]) => localStorage.setItem(KEYS.DOC_CATS, JSON.stringify(cats)),

  // Risk Check Scenarios
  getCheckScenarios: (): RiskScenario[] => JSON.parse(localStorage.getItem(KEYS.CHECK_DATA) || '[]'),
  saveCheckScenarios: (items: RiskScenario[]) => localStorage.setItem(KEYS.CHECK_DATA, JSON.stringify(items)),

  // Evidence List
  getEvidenceList: (): EvidenceGroup[] => JSON.parse(localStorage.getItem(KEYS.EVIDENCE) || '[]'),
  saveEvidenceList: (items: EvidenceGroup[]) => localStorage.setItem(KEYS.EVIDENCE, JSON.stringify(items)),

  // Civil Code
  getCivilCode: (): LawArticle[] => JSON.parse(localStorage.getItem(KEYS.CIVIL_CODE) || '[]'),
  saveCivilCode: (items: LawArticle[]) => localStorage.setItem(KEYS.CIVIL_CODE, JSON.stringify(items)),

  // AI & Logo
  getAIKB: (): string => localStorage.getItem(KEYS.AI_KB) || "",
  saveAIKB: (text: string) => localStorage.setItem(KEYS.AI_KB, text),
  
  getEnterpriseLogo: (): string | null => localStorage.getItem(KEYS.ENTERPRISE_LOGO),
  saveEnterpriseLogo: (base64: string) => localStorage.setItem(KEYS.ENTERPRISE_LOGO, base64),
  
  // Splash Screen
  getSplashImage: (): string | null => localStorage.getItem(KEYS.SPLASH_IMAGE),
  saveSplashImage: (base64: string | null) => {
    if (base64) localStorage.setItem(KEYS.SPLASH_IMAGE, base64);
    else localStorage.removeItem(KEYS.SPLASH_IMAGE);
  },

  // Custom Posters
  getCustomPosters: (): CustomPosterTemplate[] => JSON.parse(localStorage.getItem(KEYS.CUSTOM_POSTERS) || '[]'),
  addCustomPoster: (item: CustomPosterTemplate) => {
    const items = db.getCustomPosters();
    items.unshift(item);
    localStorage.setItem(KEYS.CUSTOM_POSTERS, JSON.stringify(items));
  },
  deleteCustomPoster: (id: string) => {
    const items = db.getCustomPosters();
    const filtered = items.filter(i => i.id !== id);
    localStorage.setItem(KEYS.CUSTOM_POSTERS, JSON.stringify(filtered));
  },

  // Contact QR Codes
  getContactQRCodes: (): ContactQRCode[] => JSON.parse(localStorage.getItem(KEYS.CONTACT_QRS) || '[]'),
  addContactQRCode: (item: ContactQRCode) => {
    const items = db.getContactQRCodes();
    items.push(item);
    localStorage.setItem(KEYS.CONTACT_QRS, JSON.stringify(items));
  },
  deleteContactQRCode: (id: string) => {
    const items = db.getContactQRCodes();
    const filtered = items.filter(i => i.id !== id);
    localStorage.setItem(KEYS.CONTACT_QRS, JSON.stringify(filtered));
  },

  // Service Agreement
  getAgreement: (): string => {
    return `
【东元法务通 · 用户服务协议及免责声明】

版本日期：2025年3月1日

一、服务内容
本平台（以下简称“本系统”）由东元法务中心开发，旨在为物业管理人员提供数字化的法律辅助工具，包括但不限于法律法规查询、文书模版生成、合规风险自查及 AI 智能问答服务。

二、用户账号安全
1. 用户应当妥善保管账号及密码，不得将账号出借、转让或与他人共享。
2. 因用户个人原因导致的账号泄露或企业数据丢失，本系统不承担责任。
3. 请务必对上传至“我的企业”中的内部数据（如欠费清单、业主隐私信息）进行脱敏处理。

三、特别免责声明（重要风险提示）
1. AI 辅助建议属性：
   本系统中的“AI 法务助手”、“AI 文书定制”及“纠纷快诊”功能，均基于人工智能大模型技术生成。AI 回复内容仅供参考，不代表东元律师事务所或任何执业律师的正式法律意见。
   
2. 非正式法律咨询：
   本系统提供的建议不能替代专业律师的线下咨询。对于涉及重大经济利益（如金额超过 5 万元的诉讼）、人身伤害、刑事责任或复杂产权纠纷的案件，请务必使用系统内的“一键咨询”功能联系人工律师，或寻求线下专业法律服务。

3. 结果使用责任：
   用户基于本系统生成的文书（如律师函、公告）、计算结果（如滞纳金）或建议采取的行动，均由用户自行承担最终法律后果。本系统不对因使用 AI 建议而产生的任何直接或间接损失承担赔偿责任。

四、知识产权
本系统内的所有源代码、界面设计、独家文书模版及法律知识库内容的知识产权归东元法物所有，未经授权不得进行反向工程或商业售卖。

五、协议生效
当您勾选“我已阅读并同意”或点击“授权登录”按钮时，即视为您已完全理解并接受本协议的全部条款。
    `;
  }
};
