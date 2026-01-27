
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
  AI_DOC_GEN = 'AI_DOC_GEN',
  COLLECTION_CRM = 'COLLECTION_CRM',
  // LAW_EYE_CAMERA REMOVED
  RENOVATION_CHECK = 'RENOVATION_CHECK',
  SCRIPT_KIT = 'SCRIPT_KIT',
  EMERGENCY_SOP = 'EMERGENCY_SOP',
  LAWYER_VIDEO = 'LAWYER_VIDEO',
  RIGHTS_CENTER = 'RIGHTS_CENTER',
  LEGAL_HEALTH_CHECK = 'LEGAL_HEALTH_CHECK'
}

export enum UserRole {
  ADMIN = 'ADMIN',        
  EXECUTIVE = 'EXECUTIVE', 
  MANAGER = 'MANAGER',    
  EMPLOYEE = 'EMPLOYEE',  
  USER = 'USER'           
}

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface UserQuota {
  lawyerLetters: number; 
  consultations: number; 
}

export interface User {
  id: string;
  username: string;
  password?: string;
  phoneNumber?: string;
  role: UserRole;
  enterpriseName?: string;
  isCertified: boolean;
  avatarUrl?: string;
  approvalStatus?: ApprovalStatus;
  quota?: UserQuota; 
  selectedProjects?: string[]; // IDs of selected special projects
}

export interface EnterpriseStats {
  totalRecoveredAmount: number; // 累计追回金额
  totalEntrustedAmount: number; // 累计委托金额 (用于解锁权益)
  entrustedCount: number;       // 累计委托户数
}

export interface VipRight {
  title: string;
  desc?: string;
}

export interface SpecialProject {
  id: string;
  title: string;
  description: string;
}

export interface ServiceRequest {
  id: string;
  userId: string;
  username: string;
  enterpriseName: string;
  requestType: 'ADD_PROJECT' | 'SELECT_PROJECT' | 'OTHER';
  title: string;
  content: string;
  status: 'PENDING' | 'PROCESSED' | 'REJECTED';
  priority?: string;
  timestamp: number;
}

export interface VipLevelConfig {
  id: string;
  name: string;
  thresholdAmount: number; // 解锁门槛 (元)
  label: string;
  desc: string;
  rights: VipRight[];
  selectableProjectsCount: number; // How many special projects can be selected
}

export interface RightsConfig {
  unlockThreshold: number; 
  rewardLetters: number;   
  rewardConsultations: number; 
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
  id: string;
  label?: string; 
  risk?: 'High' | 'Medium' | 'Low'; 
  content?: string; 
  title?: string; 
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

export interface SystemConfig {
  enablePhoneLogin: boolean;
  welcomeMessage?: string;
  enableSplashScreen?: boolean;
  lawyerPhoneNumber?: string;
}

// Collection CRM Types
export interface CollectionRecord {
  id: string;
  ownerName: string;
  roomNumber: string;
  amount: number;
  history: CollectionAction[];
}

export interface CollectionAction {
  id: string;
  date: number;
  type: 'REMINDER' | 'LETTER' | 'LEGAL' | 'PHONE';
  note: string;
}

// Script Kit Types
export interface ScriptScenario {
  id: string;
  title: string;
  icon?: any;
  steps: {
    label: string;
    content: string;
    action?: string;
  }[];
}

// SOP Types
export interface EmergencySOP {
  id: string;
  title: string;
  level: 'HIGH' | 'MEDIUM';
  steps: string[];
  tips: string;
}

// Renovation Check Types
export interface RenovationRecord {
  id: string;
  roomNo: string;
  manager: string;
  checks: Record<number, boolean>;
  signature: string; // base64
  date: number; // timestamp
}

// Health Check Types
export interface HealthCheckSection {
  id: string;
  title: string;
  questions: string[];
}

// New: Usage Logs for Statistics
export interface UsageLog {
  id: string;
  userId: string;
  username: string;
  enterpriseName: string;
  featureId: string; // e.g., 'CALCULATOR', 'LAWYER_CALL'
  featureName: string;
  timestamp: number;
}
