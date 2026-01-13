
import { DocumentItem, RiskScenario, User, UserRole, EvidenceGroup, LawArticle, CustomPosterTemplate, ContactQRCode, SystemConfig, ApprovalStatus, CollectionRecord, ScriptScenario, EmergencySOP, RightsConfig, EnterpriseStats, VipLevelConfig, RenovationRecord, SpecialProject, HealthCheckSection, ServiceRequest, UsageLog } from '../types';

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
  SYSTEM_CONFIG: 'dy_system_config',
  COLLECTIONS: 'dy_collections',
  SCRIPTS: 'dy_scripts',
  SOPS: 'dy_sops',
  RIGHTS_CONFIG: 'dy_rights_config',
  ENT_STATS: 'dy_ent_stats', // Legacy Key
  ENT_STATS_MAP: 'dy_ent_stats_map', // New Key for Multi-Enterprise Support
  VIP_LEVELS: 'dy_vip_levels',
  RENOVATION_RECORDS: 'dy_renovation_records',
  RENOVATION_CHECKLIST: 'dy_renovation_checklist',
  SPECIAL_PROJECTS: 'dy_special_projects',
  HEALTH_CHECK: 'dy_health_check',
  HEALTH_CHECK_PROMPT: 'dy_health_check_prompt',
  SERVICE_REQUESTS: 'dy_service_requests',
  USAGE_LOGS: 'dy_usage_logs' // New Key
};

const DEFAULT_WELCOME = '您好！我是东元物业法务助手。我可以为您提供《民法典》咨询、文书草拟及风险建议。（回答仅供参考）';

const DEFAULT_HEALTH_CHECK_PROMPT = `你是一位资深物业法律顾问。用户完成了一份法律体检，以下是存在的风险点（回答为“否”或“不清楚”的项目）：
{{RISK_POINTS}}

请生成一份深度的《企业合规诊断报告》，包含以下部分：
1. 【总体风险评级】（高/中/低）及简短评语。
2. 【核心法律风险分析】针对上述风险点，引用《民法典》或《物业管理条例》说明可能导致的法律后果（如诉讼败诉、行政处罚）。
3. 【整改行动指南】给出3-5条具体的、可落地的整改建议。
4. 【东元工具推荐】根据风险类型，推荐“东元法物”系统内的工具（如：催收助手、装修巡查单、SOP、文书生成）作为解决方案。

要求：语气专业、严肃、切中痛点。`;

const SEED_DATA = {
  DOCS: [
    { id: '1', title: '物业服务合同（示范文本）', category: '前介承接', description: '住建部推荐的标准物业服务合同范本，适用于住宅小区。', content: '甲方（建设单位）：___\n乙方（物业服务企业）：___\n根据《民法典》及相关法规...' },
    { id: '2', title: '装修违规整改通知书', category: '业户服务', description: '针对业主擅自拆改承重墙、违规施工的整改通知。', content: '致___业主：\n经巡查发现，您在装修过程中存在以下违规行为：___\n请于___日内整改完毕。' },
    { id: '3', title: '律师催款函（标准版）', category: '纠纷告知', description: '用于催缴物业费的正式律师函模板。', content: '致___：\n本律师受___物业委托，就您拖欠物业费一事函告如下...' }
  ],
  RISK: [
    { id: '1', title: '消防安全合规自查', questions: ['消防控制室是否24小时双人持证值班？', '楼道、疏散通道是否无杂物堆放？', '灭火器是否在有效期内且压力正常？', '消防栓是否能正常出水？'] },
    { id: '2', title: '电梯管理风险排查', questions: ['电梯是否张贴有效的特种设备使用标志？', '轿厢内紧急呼叫按钮是否接通监控室？', '维保记录是否按期更新并公示？'] }
  ],
  EVIDENCE: [
    { id: '1', title: '欠费诉讼证据链', items: ['物业服务合同原件', '业主房产证复印件/查档单', '历年欠费明细表（盖章）', '催缴记录（短信/录音/快递单）', '催费函及送达证明'] },
    { id: '2', title: '高空抛物侵权取证', items: ['落物现场照片（多角度）', '监控录像提取视频', '受损物品清单及价值评估', '报警记录/出警回执'] }
  ],
  SCRIPTS: [
    { id: '1', title: '业主拒交物业费（通用）', steps: [{ label: '倾听', content: '您好，我非常理解您的心情。请问具体是对我们哪方面服务不满意呢？' }, { label: '解释', content: '关于您提到的保洁问题，我们已经安排了专项整改。不过物业费是维持小区设备运行的基础...' }, { label: '法规', content: '根据《民法典》第944条，业主不得以未接受或者无需接受相关物业服务为由拒绝支付物业费。' }] }
  ],
  SOPS: [
    { id: '1', title: '电梯困人应急处置', level: 'HIGH', steps: ['安抚被困人员，告知已联系维保', '通知电梯维保单位立即赶赴', '在基站设置警戒围挡', '配合维保人员实施救援'], tips: '严禁未经培训的物业人员擅自使用三角钥匙开门放人，防止坠井事故。' }
  ],
  LAWS: [
    { id: '1', title: '民法典 第944条', content: '业主应当按照约定向物业服务人支付物业费。物业服务人已经按照约定和有关规定提供服务的，业主不得以未接受或者无需接受相关物业服务为由拒绝支付物业费。' },
    { id: '2', title: '民法典 第1254条', content: '禁止从建筑物中抛掷物品。从建筑物中抛掷物品或者从建筑物上坠落的物品造成他人损害的，由侵权人依法承担侵权责任...' }
  ],
  RENOVATION_CHECKLIST: [
    '是否擅自变动建筑主体和承重结构',
    '是否将没有防水要求的房间改为卫生间/厨房间',
    '是否擅自改变住宅外立面/开设门窗',
    '是否损坏房屋原有节能设施/降低节能效果',
    '施工人员是否佩戴出入证/穿戴反光背心',
    '装修垃圾是否袋装并堆放在指定区域'
  ],
  SPECIAL_PROJECTS: [
    { id: '1', title: '项目保盘法律策略', desc: '针对业委会换届或续聘，提供远程策略指导及《续聘法律应对SOP》。' },
    { id: '2', title: '物业费调价法律辅导', desc: '提供调价程序的合规性审查及《致业主调价告知书》修改建议。' },
    { id: '3', title: '业委会换届指导', desc: '提供《业委会沟通函件范本》及合规履职应对策略。' },
    { id: '4', title: '维修资金提取合规指引', desc: '指导准备申请材料，解决“提取难”痛点。' },
    { id: '5', title: '停车位管理专项风控', desc: '针对车位权属纠纷、临停收费合规性提供方案。' },
    { id: '6', title: '二次供水安全责任规避', desc: '清洗台账、水质检测公示流程合规化审查。' },
    { id: '7', title: '垃圾分类执法应对', desc: '协助建立符合当地条例的分类管理制度。' },
    { id: '8', title: '高空抛物技防法律建议', desc: '监控布点合规性及隐私保护平衡建议。' },
    { id: '9', title: '电动车进楼充电整治', desc: '强制清理行动的法律依据与风险预案。' },
    { id: '10', title: '创优评级合规辅导', desc: '协助审查“国优/省优”申报材料的合规性。' },
    { id: '11', title: '经营用房租赁风控', desc: '公共收益租赁合同审查与违约条款设计。' },
    { id: '12', title: '装修管理专项整顿', desc: '承重墙破坏等重大违规行为的法律介入流程。' },
    { id: '13', title: '劳动用工风险排查', desc: '保安保洁外包、退休返聘人员的用工协议审查。' }
  ],
  HEALTH_CHECK: [
    {
      id: '1', title: '物业费收缴与债权管理', 
      questions: [
        '贵司是否保存了所有业主完整的身份信息复印件（身份证/房产证）？',
        '针对欠费业主，是否建立了每6个月至少一次的书面/短信催缴记录，并成功保留了证据？',
        '是否对欠费超过2年的款项进行了专门标注，并采取了中断诉讼时效的法律措施？',
        '物业服务合同中，是否明确约定了逾期缴纳物业费的违约金/滞纳金计算标准？',
        '对于空置房的物业费收取标准，是否取得了当地物价部门或业委会的书面确认文件？',
        '在催收过程中，是否拥有标准的催收话术SOP，以避免因言语不当引发的侵权投诉？'
      ]
    },
    {
      id: '2', title: '基础合同与印章管理',
      questions: [
        '贵司目前使用的《物业服务合同》版本，是否在近两年内经过专业律师根据《民法典》进行过修订？',
        '对外签署的采购、外包等合同，是否每一份都经过了法务或律师的审核？',
        '公司是否建立了严格的合同归档制度，确保合同原件在合同履行完毕后仍能保存3年以上？',
        '用印申请是否实现了线上化留痕，且严禁业务人员携带公章外出而不受监管？',
        '与第三方（如电梯维保、清洁公司）签署的合同中，是否明确转嫁了因其工作失误导致的安全事故责任？',
        '是否拥有防范“表见代理”风险的机制（如离职员工未收回授权委托书或工牌）？'
      ]
    },
    {
      id: '3', title: '劳资人事合规',
      questions: [
        '贵司是否与所有全职员工（包括保洁、保安）在入职30日内签订了书面劳动合同？',
        '对于退休返聘人员（超过法定退休年龄），是否签订了《劳务协议》而非《劳动合同》？',
        '是否为所有符合条件的员工依法缴纳了社会保险？',
        '公司的《员工手册》或规章制度，在发布前是否经过了民主程序（如职工代表大会讨论）并保留了签字证据？',
        '是否建立了完善的加班审批制度，以避免员工离职时索要巨额加班费？',
        '对于辞退违纪员工，是否能够提供充分的、经员工签字确认的违纪证据链？'
      ]
    },
    {
      id: '4', title: '现场安全与侵权责任',
      questions: [
        '小区内是否存在高空抛物监控盲区？如有，是否已张贴足够的警示标语并定期巡查拍照留底？',
        '消防设施是否每月进行检查，并保留了完整的、无涂改的《消防巡查记录表》？',
        '电梯等特种设备是否严格按期年检，并保存了维保单位的每一次维保单据？',
        '贵司是否购买了足额的“物业管理责任险（公众责任险）”，且明确保额覆盖了电梯、高空坠物等高风险场景？',
        '小区内的水系、道路坑洼、施工区域，是否设置了清晰可见的围挡和警示标志？',
        '针对台风、暴雨、火灾等突发事件，是否制定了应急预案并每年至少组织一次演练？'
      ]
    },
    {
      id: '5', title: '装修与违建管理',
      questions: [
        '业主装修前，是否签署了《装修管理服务协议》并缴纳了装修押金？',
        '物业人员在装修巡查中发现违规拆改承重墙等行为时，是否当场下达了《整改通知书》并拍照留证？',
        '对于拒不整改的违规装修，是否已向城管或住建部门书面报告并保留了回执？',
        '装修工人的出入证管理是否严格，是否强制要求购买了意外伤害保险？',
        '是否明确告知业主装修垃圾的堆放地点和清运标准，并留有书面确认？',
        '对于业主在公共区域（楼道、天台）的违章搭建，是否定期进行了清理告知并留痕？'
      ]
    },
    {
      id: '6', title: '数据合规与业委会关系',
      questions: [
        '贵司收集的业主信息（人脸识别、车牌、家庭成员），是否获得了业主的书面授权同意？',
        '是否定期公示了公共收益（电梯广告、停车费）的收支明细，且数据经得起审计？',
        '面对业委会成立或换届，是否拥有合法的介入和沟通机制，而非被动等待？',
        '是否建立了应对媒体曝光或网络负面舆情的危机公关处理机制？',
        '公司的微信公众号、宣传海报使用的图片/字体，是否确认拥有合法版权？',
        '是否建立了廉洁反腐机制，严禁项目经理在采购或外包中收受回扣？'
      ]
    }
  ]
};

export const db = {
  init: () => {
    // 1. Users Initialization
    let users: User[] = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
    const defaultUsers: User[] = [
      { 
        id: '1', username: 'admin', password: 'admin', role: UserRole.ADMIN, isCertified: true, approvalStatus: 'APPROVED', phoneNumber: '13800000000' 
      },
      { 
        id: '2', username: 'boss', password: '123', role: UserRole.EXECUTIVE, enterpriseName: '东元示范物业', isCertified: true, approvalStatus: 'APPROVED', phoneNumber: '13900000001',
        quota: { lawyerLetters: 10, consultations: 5 }, selectedProjects: []
      },
      { 
        id: '3', username: 'manager', password: '123', role: UserRole.MANAGER, enterpriseName: '东元示范物业', isCertified: true, approvalStatus: 'APPROVED', phoneNumber: '13900000002',
        quota: { lawyerLetters: 5, consultations: 20 }, selectedProjects: [] // Updated default quota for Manager to 20
      },
      { 
        id: '4', username: 'staff', password: '123', role: UserRole.EMPLOYEE, enterpriseName: '东元示范物业', isCertified: true, approvalStatus: 'APPROVED', phoneNumber: '13900000003',
        quota: { lawyerLetters: 0, consultations: 0 }, selectedProjects: []
      }
    ];

    if (users.length === 0) {
      localStorage.setItem(KEYS.USERS, JSON.stringify(defaultUsers));
    }

    // 2. Stats Migration (From single object to Map)
    // Check if new map exists
    const statsMap = localStorage.getItem(KEYS.ENT_STATS_MAP);
    if (!statsMap) {
        // Migration: Move old stats to "东元示范物业" key
        const oldStats = localStorage.getItem(KEYS.ENT_STATS);
        const initialMap: Record<string, EnterpriseStats> = {};
        if (oldStats) {
            initialMap['东元示范物业'] = JSON.parse(oldStats);
        } else {
            initialMap['东元示范物业'] = { totalRecoveredAmount: 1258000, totalEntrustedAmount: 680000, entrustedCount: 142 };
        }
        localStorage.setItem(KEYS.ENT_STATS_MAP, JSON.stringify(initialMap));
    }

    // 3. VIP Levels
    if (!localStorage.getItem(KEYS.VIP_LEVELS)) {
        const levels: VipLevelConfig[] = [
            {
                id: 'vip', name: 'VIP 会员', thresholdAmount: 500000, label: '合规基石版',
                desc: '解决“裸奔”问题，提供标准化的法律底座。',
                selectableProjectsCount: 0,
                rights: [
                   { title: '人工法律咨询 (10次/月)', desc: '线上律师快速响应，解答日常物业管理纠纷。' },
                   { title: 'SaaS 催收赋能工具 (永久免费)', desc: '解锁欠费计算器、催收进度看板、自动生成催款单功能。' },
                   { title: '劳动用工风险基础包', desc: '含标准版《劳动合同》、《员工手册》及入职风险提示函。' },
                   { title: '物业服务合同通用库', desc: '含《前期物业服务合同》、《临时管理规约》等标准模板。' },
                   { title: '外包供应商合同严选库', desc: '含保安、保洁、绿化外包合同模板，明确违约责任与赔偿条款。' }
                ]
            },
            { 
                id: 'premium', name: '尊享 VIP', thresholdAmount: 3000000, label: '稳盘运营版', 
                desc: '解决“运营痛点”，重点在于防范业委会风险。', 
                selectableProjectsCount: 2,
                rights: [
                   { title: '人工法律咨询 (50次/月)', desc: '大幅增加咨询频次，满足项目经理高频请示需求。' },
                   { title: '合同“轻定制”服务 (1次/季度)', desc: '律师远程审改一份现有合同（如补充协议、分包合同），堵塞漏洞。' },
                   { title: '律师函发送额度 (5封/月)', desc: '针对恶意欠费或侵权行为，由东元律所出具正式律师函。' },
                   { title: '日常运营法律风险指引', desc: '提供公区管理、装修巡查等日常场景的合规操作指引。' },
                   { title: '案件委托优先受理权', desc: '发生诉讼案件时，享受优先立案与律师选派权益。' }
                ] 
            },
            { 
                id: 'supreme', name: '至尊 VIP', thresholdAmount: 8000000, label: '战略护航版', 
                desc: '深度介入“风控与决策”，解决重大危机。', 
                selectableProjectsCount: 5,
                rights: [
                   { title: '无限次人工法律咨询', desc: '律师团队 7×24小时 响应，支持电话/视频远程会议。' },
                   { title: '重大危机公关法律支持', desc: '针对网络舆情、重大安全事故，律师亲自代写《澄清声明》并指导应对。' },
                   { title: '企业年度法律风险体检', desc: '律所远程审计企业全年合同、制度，出具《年度法律风险体检报告》。' },
                   { title: '高层决策法律参谋', desc: '针对企业并购、股权变更等重大事项提供法律意见。' },
                   { title: '线下培训 (1次/年)', desc: '资深律师赴企业进行物业法律知识专题培训 (差旅费另计)。' }
                ] 
            }
        ];
        localStorage.setItem(KEYS.VIP_LEVELS, JSON.stringify(levels));
    }

    // 4. Special Projects Seed
    if (!localStorage.getItem(KEYS.SPECIAL_PROJECTS)) {
        localStorage.setItem(KEYS.SPECIAL_PROJECTS, JSON.stringify(SEED_DATA.SPECIAL_PROJECTS));
    }

    // 5. Health Check Seed
    if (!localStorage.getItem(KEYS.HEALTH_CHECK)) {
        localStorage.setItem(KEYS.HEALTH_CHECK, JSON.stringify(SEED_DATA.HEALTH_CHECK));
    }

    // 6. Seed Content Data if empty
    if (!localStorage.getItem(KEYS.DOCS)) localStorage.setItem(KEYS.DOCS, JSON.stringify(SEED_DATA.DOCS));
    if (!localStorage.getItem(KEYS.CHECK_DATA)) localStorage.setItem(KEYS.CHECK_DATA, JSON.stringify(SEED_DATA.RISK));
    if (!localStorage.getItem(KEYS.EVIDENCE)) localStorage.setItem(KEYS.EVIDENCE, JSON.stringify(SEED_DATA.EVIDENCE));
    if (!localStorage.getItem(KEYS.SCRIPTS)) localStorage.setItem(KEYS.SCRIPTS, JSON.stringify(SEED_DATA.SCRIPTS));
    if (!localStorage.getItem(KEYS.SOPS)) localStorage.setItem(KEYS.SOPS, JSON.stringify(SEED_DATA.SOPS));
    if (!localStorage.getItem(KEYS.CIVIL_CODE)) localStorage.setItem(KEYS.CIVIL_CODE, JSON.stringify(SEED_DATA.LAWS));
    if (!localStorage.getItem(KEYS.RENOVATION_CHECKLIST)) localStorage.setItem(KEYS.RENOVATION_CHECKLIST, JSON.stringify(SEED_DATA.RENOVATION_CHECKLIST));

    if (!localStorage.getItem(KEYS.DOC_CATS)) localStorage.setItem(KEYS.DOC_CATS, JSON.stringify(["全部", "前介承接", "业户服务", "外包管理", "纠纷告知"]));
    if (!localStorage.getItem(KEYS.AI_KB)) localStorage.setItem(KEYS.AI_KB, "东元法务助手...");
    if (!localStorage.getItem(KEYS.ENTERPRISES)) localStorage.setItem(KEYS.ENTERPRISES, JSON.stringify(["东元示范物业", "万科物业", "碧桂园服务"]));
    if (!localStorage.getItem(KEYS.SYSTEM_CONFIG)) {
        localStorage.setItem(KEYS.SYSTEM_CONFIG, JSON.stringify({ 
            enablePhoneLogin: true, 
            enableSplashScreen: true, 
            welcomeMessage: DEFAULT_WELCOME,
            lawyerPhoneNumber: '400-888-9999' 
        }));
    } else {
        // Migration for existing users: Ensure lawyerPhoneNumber exists
        const cfg = JSON.parse(localStorage.getItem(KEYS.SYSTEM_CONFIG) || '{}');
        if (!cfg.lawyerPhoneNumber) {
            cfg.lawyerPhoneNumber = '400-888-9999';
            localStorage.setItem(KEYS.SYSTEM_CONFIG, JSON.stringify(cfg));
        }
    }
    if (!localStorage.getItem(KEYS.RENOVATION_RECORDS)) localStorage.setItem(KEYS.RENOVATION_RECORDS, JSON.stringify([]));
    if (!localStorage.getItem(KEYS.USAGE_LOGS)) localStorage.setItem(KEYS.USAGE_LOGS, JSON.stringify([]));
  },

  getUsers: (): User[] => JSON.parse(localStorage.getItem(KEYS.USERS) || '[]'),
  saveUsers: (users: User[]) => localStorage.setItem(KEYS.USERS, JSON.stringify(users)),
  updateUser: (id: string, updates: Partial<User>): User | null => {
    const users = db.getUsers();
    const idx = users.findIndex(u => u.id === id);
    if (idx > -1) { users[idx] = { ...users[idx], ...updates }; db.saveUsers(users); return users[idx]; }
    return null;
  },
  deleteUser: (id: string) => { const users = db.getUsers().filter(u => u.id !== id); db.saveUsers(users); },
  registerUser: (newUser: User) => {
    const users = db.getUsers();
    if (users.some(u => u.username === newUser.username)) throw new Error('用户名已存在');
    if (newUser.phoneNumber && users.some(u => u.phoneNumber === newUser.phoneNumber)) throw new Error('手机号已被注册');
    newUser.quota = { lawyerLetters: 0, consultations: 0 };
    newUser.selectedProjects = [];
    users.push(newUser); db.saveUsers(users);
  },
  
  setSession: (userId: string, remember: boolean = true) => { if (remember) localStorage.setItem(KEYS.SESSION_USER, userId); else sessionStorage.setItem(KEYS.SESSION_USER, userId); },
  getSession: (): string | null => localStorage.getItem(KEYS.SESSION_USER) || sessionStorage.getItem(KEYS.SESSION_USER),
  clearSession: () => { localStorage.removeItem(KEYS.SESSION_USER); sessionStorage.removeItem(KEYS.SESSION_USER); },
  getUserById: (id: string) => db.getUsers().find(u => u.id === id),
  getUserByPhone: (phone: string) => db.getUsers().find(u => u.phoneNumber === phone),
  
  getEnterprises: (): string[] => JSON.parse(localStorage.getItem(KEYS.ENTERPRISES) || '[]'),
  saveEnterprises: (list: string[]) => localStorage.setItem(KEYS.ENTERPRISES, JSON.stringify(list)),
  addEnterprise: (name: string) => { const list = db.getEnterprises(); if (!list.includes(name)) { list.push(name); db.saveEnterprises(list); } },
  deleteEnterprise: (name: string) => { db.saveEnterprises(db.getEnterprises().filter(n => n !== name)); },
  getSystemConfig: (): SystemConfig => {
      const cfg = JSON.parse(localStorage.getItem(KEYS.SYSTEM_CONFIG) || '{}');
      return {
          enablePhoneLogin: true, 
          enableSplashScreen: true, 
          lawyerPhoneNumber: '400-888-9999',
          ...cfg
      };
  },
  saveSystemConfig: (config: SystemConfig) => localStorage.setItem(KEYS.SYSTEM_CONFIG, JSON.stringify(config)),
  
  getDocs: (): DocumentItem[] => JSON.parse(localStorage.getItem(KEYS.DOCS) || '[]'),
  saveDocs: (docs: DocumentItem[]) => localStorage.setItem(KEYS.DOCS, JSON.stringify(docs)),
  
  getCategories: (): string[] => JSON.parse(localStorage.getItem(KEYS.DOC_CATS) || '["全部"]'),
  saveCategories: (cats: string[]) => localStorage.setItem(KEYS.DOC_CATS, JSON.stringify(cats)),
  
  getCheckScenarios: (): RiskScenario[] => JSON.parse(localStorage.getItem(KEYS.CHECK_DATA) || '[]'),
  saveCheckScenarios: (items: RiskScenario[]) => localStorage.setItem(KEYS.CHECK_DATA, JSON.stringify(items)),
  
  getEvidenceList: (): EvidenceGroup[] => JSON.parse(localStorage.getItem(KEYS.EVIDENCE) || '[]'),
  saveEvidenceList: (items: EvidenceGroup[]) => localStorage.setItem(KEYS.EVIDENCE, JSON.stringify(items)),
  
  getCivilCode: (): LawArticle[] => JSON.parse(localStorage.getItem(KEYS.CIVIL_CODE) || '[]'),
  saveCivilCode: (items: LawArticle[]) => localStorage.setItem(KEYS.CIVIL_CODE, JSON.stringify(items)),
  
  getAIKB: (): string => localStorage.getItem(KEYS.AI_KB) || "",
  saveAIKB: (text: string) => localStorage.setItem(KEYS.AI_KB, text),
  getEnterpriseLogo: (): string | null => localStorage.getItem(KEYS.ENTERPRISE_LOGO),
  saveEnterpriseLogo: (base64: string) => localStorage.setItem(KEYS.ENTERPRISE_LOGO, base64),
  getSplashImage: (): string | null => localStorage.getItem(KEYS.SPLASH_IMAGE),
  saveSplashImage: (base64: string | null) => { if (base64) localStorage.setItem(KEYS.SPLASH_IMAGE, base64); else localStorage.removeItem(KEYS.SPLASH_IMAGE); },
  getCustomPosters: (): CustomPosterTemplate[] => JSON.parse(localStorage.getItem(KEYS.CUSTOM_POSTERS) || '[]'),
  addCustomPoster: (item: CustomPosterTemplate) => { const items = db.getCustomPosters(); items.unshift(item); localStorage.setItem(KEYS.CUSTOM_POSTERS, JSON.stringify(items)); },
  deleteCustomPoster: (id: string) => { localStorage.setItem(KEYS.CUSTOM_POSTERS, JSON.stringify(db.getCustomPosters().filter(i => i.id !== id))); },
  getContactQRCodes: (): ContactQRCode[] => JSON.parse(localStorage.getItem(KEYS.CONTACT_QRS) || '[]'),
  addContactQRCode: (item: ContactQRCode) => { const items = db.getContactQRCodes(); items.push(item); localStorage.setItem(KEYS.CONTACT_QRS, JSON.stringify(items)); },
  deleteContactQRCode: (id: string) => { localStorage.setItem(KEYS.CONTACT_QRS, JSON.stringify(db.getContactQRCodes().filter(i => i.id !== id))); },
  
  getCollections: (): CollectionRecord[] => JSON.parse(localStorage.getItem(KEYS.COLLECTIONS) || '[]'),
  saveCollections: (list: CollectionRecord[]) => localStorage.setItem(KEYS.COLLECTIONS, JSON.stringify(list)),
  addCollectionRecord: (item: CollectionRecord) => { const list = db.getCollections(); list.unshift(item); db.saveCollections(list); },
  
  getScripts: (): ScriptScenario[] => JSON.parse(localStorage.getItem(KEYS.SCRIPTS) || '[]'),
  saveScripts: (items: ScriptScenario[]) => localStorage.setItem(KEYS.SCRIPTS, JSON.stringify(items)),

  getSOPs: (): EmergencySOP[] => JSON.parse(localStorage.getItem(KEYS.SOPS) || '[]'),
  saveSOPs: (items: EmergencySOP[]) => localStorage.setItem(KEYS.SOPS, JSON.stringify(items)),

  getRightsConfig: (): RightsConfig => JSON.parse(localStorage.getItem(KEYS.RIGHTS_CONFIG) || '{"unlockThreshold": 50, "rewardLetters": 5, "rewardConsultations": 1}'),
  saveRightsConfig: (cfg: RightsConfig) => localStorage.setItem(KEYS.RIGHTS_CONFIG, JSON.stringify(cfg)),
  
  // Updated Stats Management
  getEnterpriseStats: (enterpriseName: string = '东元示范物业'): EnterpriseStats => {
      const map = JSON.parse(localStorage.getItem(KEYS.ENT_STATS_MAP) || '{}');
      return map[enterpriseName] || { totalRecoveredAmount: 0, totalEntrustedAmount: 0, entrustedCount: 0 };
  },
  saveEnterpriseStats: (stats: EnterpriseStats, enterpriseName: string = '东元示范物业') => {
      const map = JSON.parse(localStorage.getItem(KEYS.ENT_STATS_MAP) || '{}');
      map[enterpriseName] = stats;
      localStorage.setItem(KEYS.ENT_STATS_MAP, JSON.stringify(map));
  },
  
  getVipLevels: (): VipLevelConfig[] => JSON.parse(localStorage.getItem(KEYS.VIP_LEVELS) || '[]'),
  saveVipLevels: (levels: VipLevelConfig[]) => localStorage.setItem(KEYS.VIP_LEVELS, JSON.stringify(levels)),

  getRenovationRecords: (): RenovationRecord[] => JSON.parse(localStorage.getItem(KEYS.RENOVATION_RECORDS) || '[]'),
  addRenovationRecord: (rec: RenovationRecord) => { 
      const list = db.getRenovationRecords(); 
      list.unshift(rec); 
      localStorage.setItem(KEYS.RENOVATION_RECORDS, JSON.stringify(list)); 
  },
  getRenovationChecklist: (): string[] => JSON.parse(localStorage.getItem(KEYS.RENOVATION_CHECKLIST) || '[]'),
  saveRenovationChecklist: (items: string[]) => localStorage.setItem(KEYS.RENOVATION_CHECKLIST, JSON.stringify(items)),

  // New Methods for Special Projects
  getSpecialProjects: (): SpecialProject[] => JSON.parse(localStorage.getItem(KEYS.SPECIAL_PROJECTS) || '[]'),
  saveSpecialProjects: (items: SpecialProject[]) => localStorage.setItem(KEYS.SPECIAL_PROJECTS, JSON.stringify(items)),

  // New Methods for Service Requests
  getServiceRequests: (): ServiceRequest[] => JSON.parse(localStorage.getItem(KEYS.SERVICE_REQUESTS) || '[]'),
  addServiceRequest: (req: ServiceRequest) => {
      const list = db.getServiceRequests();
      list.unshift(req);
      localStorage.setItem(KEYS.SERVICE_REQUESTS, JSON.stringify(list));
  },
  updateServiceRequest: (id: string, updates: Partial<ServiceRequest>) => {
      const list = db.getServiceRequests();
      const idx = list.findIndex(r => r.id === id);
      if (idx > -1) {
          list[idx] = { ...list[idx], ...updates };
          localStorage.setItem(KEYS.SERVICE_REQUESTS, JSON.stringify(list));
      }
  },

  // New Methods for Health Check
  getHealthCheck: (): HealthCheckSection[] => JSON.parse(localStorage.getItem(KEYS.HEALTH_CHECK) || '[]'),
  getHealthCheckPrompt: (): string => localStorage.getItem(KEYS.HEALTH_CHECK_PROMPT) || DEFAULT_HEALTH_CHECK_PROMPT,
  saveHealthCheckPrompt: (text: string) => localStorage.setItem(KEYS.HEALTH_CHECK_PROMPT, text),

  // New Methods for Usage Logs
  logUsage: (featureId: string, featureName: string) => {
      const userId = db.getSession();
      if (!userId) return;
      const user = db.getUserById(userId);
      if (!user) return;

      const logs: UsageLog[] = JSON.parse(localStorage.getItem(KEYS.USAGE_LOGS) || '[]');
      logs.push({
          id: Date.now().toString() + Math.random().toString().slice(2, 6),
          userId: user.id,
          username: user.username,
          enterpriseName: user.enterpriseName || '未知企业',
          featureId,
          featureName,
          timestamp: Date.now()
      });
      localStorage.setItem(KEYS.USAGE_LOGS, JSON.stringify(logs));
  },
  
  getUsageLogs: (): UsageLog[] => JSON.parse(localStorage.getItem(KEYS.USAGE_LOGS) || '[]'),

  getAgreement: (): string => {
    return `【东元法务通 · 用户服务协议及免责声明】\n1. 本平台提供的所有法律建议、文书模板（含AI生成内容）仅供参考，不构成具有法律效力的正式法律意见书。\n2. 涉及重大财产处分、人身安全及诉讼程序的，请务必咨询专业律师。\n3. 用户应确保录入的业务数据（如欠费金额、业主信息）的真实性，因数据错误导致的法律后果由用户自行承担。\n4. 禁止利用本平台从事任何违法违规活动。`;
  }
};
