
import React, { useState, useEffect } from 'react';
import { Camera, Book, FileCheck, ChevronRight, Image as ImageIcon, Sparkles, PenTool, HardHat, MessageSquare, AlertTriangle, ShieldCheck, Activity, Lock } from 'lucide-react';
import { ViewState, UserRole } from '../types';
import { db } from '../services/dbService';

interface ToolboxProps {
  setCurrentView: (view: ViewState) => void;
}

const TOOLS = [
  { id: 'health', title: '企业法务体检', desc: '全维度合规评分与风险诊断', icon: Activity, color: 'text-rose-500', bg: 'bg-rose-50', view: ViewState.LEGAL_HEALTH_CHECK, restricted: true },
  { id: 'notice', title: '危机公关公告', desc: '含停水/危机处理标准通告', icon: FileCheck, color: 'text-green-500', bg: 'bg-green-50', view: ViewState.NOTICE_GENERATOR },
  { id: 'renovation', title: '装修巡查单', desc: '电子化记录违规装修证据', icon: HardHat, color: 'text-orange-500', bg: 'bg-orange-50', view: ViewState.RENOVATION_CHECK },
  { id: 'script', title: '催费话术锦囊', desc: '高情商+合法的冲突应对', icon: MessageSquare, color: 'text-indigo-500', bg: 'bg-indigo-50', view: ViewState.SCRIPT_KIT },
  { id: 'sop', title: '紧急情况 SOP', desc: '突发事件红按钮操作指引', icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50', view: ViewState.EMERGENCY_SOP },
  { id: 'evidence', title: '标准取证清单', desc: '法律诉讼必备证据闭环', icon: Camera, color: 'text-blue-500', bg: 'bg-blue-50', view: ViewState.EVIDENCE_LIST },
  { id: 'risk', title: '合规风险自查', desc: '年度项目法律体检表', icon: ShieldCheck, color: 'text-slate-500', bg: 'bg-slate-100', view: ViewState.RISK_CHECK },
  { id: 'legal', title: '民法典速查', desc: '物业章节核心法条解读', icon: Book, color: 'text-purple-500', bg: 'bg-purple-50', view: ViewState.CIVIL_CODE },
  { id: 'poster', title: 'AI 海报生成', desc: '秒级生成警示宣传画', icon: ImageIcon, color: 'text-pink-500', bg: 'bg-pink-50', special: true, view: ViewState.POSTER_GENERATOR },
  { id: 'aidoc', title: 'AI 文书定制', desc: '智能撰写专属法律函件', icon: PenTool, color: 'text-indigo-500', bg: 'bg-indigo-50', special: true, view: ViewState.AI_DOC_GEN }
];

const Toolbox: React.FC<ToolboxProps> = ({ setCurrentView }) => {
  const [role, setRole] = useState<UserRole>(UserRole.USER);

  useEffect(() => {
      const userId = db.getSession();
      if(userId) {
          const u = db.getUserById(userId);
          if(u) setRole(u.role);
      }
  }, []);

  const handleToolClick = (tool: any) => {
      if (tool.restricted) {
          if (role !== UserRole.EXECUTIVE && role !== UserRole.ADMIN) {
              alert("权限管控：该功能仅限【高管/老板】账号访问。");
              return;
          }
      }
      setCurrentView(tool.view);
  };

  return (
    <div className="p-6 pb-24 space-y-6 animate-fade-in">
      <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
        <div className="relative z-10">
          <h2 className="text-2xl font-black tracking-tight">数字化工具箱</h2>
          <p className="text-xs text-indigo-200 mt-2 opacity-80 leading-relaxed">赋能项目日常风控，让物业服务更具法律温度与深度。</p>
        </div>
        <div className="absolute right-[-40px] top-[-20px] opacity-10">
          <Sparkles size={200} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {TOOLS.map((tool) => {
          const isLocked = tool.restricted && role !== UserRole.EXECUTIVE && role !== UserRole.ADMIN;
          return (
            <button 
                key={tool.id}
                onClick={() => handleToolClick(tool)}
                className={`bg-white rounded-[2rem] p-5 flex items-center justify-between border border-gray-100 shadow-sm active:scale-[0.98] transition-all hover:border-orange-200 group ${isLocked ? 'opacity-70 grayscale-[0.5]' : ''}`}
            >
                <div className="flex items-center gap-5">
                <div className={`${tool.bg} ${tool.color} p-4 rounded-2xl shadow-inner group-hover:scale-110 transition-transform`}>
                    <tool.icon size={28} />
                </div>
                <div className="text-left">
                    <div className="flex items-center gap-2">
                    <h4 className="font-black text-gray-800 text-base">{tool.title}</h4>
                    {tool.special && <span className="bg-pink-100 text-pink-500 text-[8px] font-black px-1.5 py-0.5 rounded uppercase">AI Power</span>}
                    {isLocked && <Lock size={12} className="text-slate-400" />}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 font-medium">{tool.desc}</p>
                </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-orange-50 group-hover:text-orange-500 transition-colors">
                <ChevronRight size={20} />
                </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Toolbox;
