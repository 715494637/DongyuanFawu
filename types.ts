
export enum ViewState {
  HOME = 'HOME',
  CALCULATOR = 'CALCULATOR',
  DIAGNOSIS = 'DIAGNOSIS',
  DOCUMENTS = 'DOCUMENTS',
  RISK_CHECK = 'RISK_CHECK',
  AI_CHAT = 'AI_CHAT',
  MY_ENTERPRISE = 'MY_ENTERPRISE',
  TOOLBOX = 'TOOLBOX',
  LOGIN = 'LOGIN',
  ADMIN_DASHBOARD = 'ADMIN_DASHBOARD',
  POSTER_GENERATOR = 'POSTER_GENERATOR',
  EVIDENCE_LIST = 'EVIDENCE_LIST',
  CIVIL_CODE = 'CIVIL_CODE',
  NOTICE_GENERATOR = 'NOTICE_GENERATOR',
  AI_DOC_GEN = 'AI_DOC_GEN'
}

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER'
}

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface User {
  id: string;
  username: string;
  password?: string;
  phone_number?: string; // 手机号（与后端字段名一致）
  role: UserRole;
  enterprise_name?: string; // 物业公司名称（与后端字段名一致）
  is_certified: boolean; // 认证状态（与后端字段名一致）
  avatar_url?: string; // 头像URL（与后端字段名一致）
  approval_status?: ApprovalStatus; // 审批状态（与后端字段名一致）

  // 前端兼容性属性（可选，用于向后兼容旧代码）
  phoneNumber?: string;
  enterpriseName?: string;
  isCertified?: boolean;
  avatarUrl?: string;
  approvalStatus?: ApprovalStatus;
}

export interface DocumentItem {
  id: string;
  title: string;
  category: string;
  description: string;
  content: string;
  fileUrl?: string;
}

export interface RiskScenario {
  id?: string;
  title?: string;
  risk_level?: 'High' | 'Medium' | 'Low' | string;
  content?: string;
  questions?: string[];
}

export interface EvidenceGroup {
  id: string;
  title: string;
  items: string[];
}

export interface LawArticle {
  id: string;
  title: string;
  content: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  isStreaming?: boolean;
}

export interface CustomPosterTemplate {
  id: string;
  name: string;
  imageBase64: string;
  createdAt: number;
}

export interface ContactQRCode {
  id: string;
  name: string; 
  imageBase64: string;
  createdAt: number;
}

// 新增：系统全局配置接口
export interface SystemConfig {
  enablePhoneLogin: boolean;
  welcomeMessage?: string; // 新增：AI 欢迎语
}
