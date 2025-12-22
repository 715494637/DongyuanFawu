
import React from 'react';
import { Camera, Calendar, Book, FileCheck, ChevronRight, Image as ImageIcon, Sparkles, FileSearch, PenTool } from 'lucide-react';
import { ViewState } from '../types';

interface ToolboxProps {
  setCurrentView: (view: ViewState) => void;
}

const TOOLS = [
  { id: 'evidence', title: '标准取证清单', desc: '法律诉讼必备证据闭环', icon: Camera, color: 'text-blue-500', bg: 'bg-blue-50', view: ViewState.EVIDENCE_LIST },
  { id: 'legal', title: '民法典速查', desc: '物业章节核心法条解读', icon: Book, color: 'text-purple-500', bg: 'bg-purple-50', view: ViewState.CIVIL_CODE },
  { id: 'poster', title: 'AI 海报生成', desc: '秒级生成警示宣传画', icon: ImageIcon, color: 'text-pink-500', bg: 'bg-pink-50', special: true, view: ViewState.POSTER_GENERATOR },
  { id: 'notice', title: '公告格式生成', desc: '三步生成标准物业公告', icon: FileCheck, color: 'text-green-500', bg: 'bg-green-50', view: ViewState.NOTICE_GENERATOR },
  { id: 'aidoc', title: 'AI 文书定制', desc: '智能撰写专属法律函件', icon: PenTool, color: 'text-indigo-500', bg: 'bg-indigo-50', special: true, view: ViewState.AI_DOC_GEN }
];

const Toolbox: React.FC<ToolboxProps> = ({ setCurrentView }) => {
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
        {TOOLS.map((tool) => (
          <button 
            key={tool.id}
            onClick={() => setCurrentView(tool.view)}
            className="bg-white rounded-[2rem] p-5 flex items-center justify-between border border-gray-100 shadow-sm active:scale-[0.98] transition-all hover:border-orange-200 group"
          >
            <div className="flex items-center gap-5">
              <div className={`${tool.bg} ${tool.color} p-4 rounded-2xl shadow-inner group-hover:scale-110 transition-transform`}>
                <tool.icon size={28} />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <h4 className="font-black text-gray-800 text-base">{tool.title}</h4>
                  {tool.special && <span className="bg-pink-100 text-pink-500 text-[8px] font-black px-1.5 py-0.5 rounded uppercase">AI Power</span>}
                </div>
                <p className="text-xs text-gray-400 mt-0.5 font-medium">{tool.desc}</p>
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-orange-50 group-hover:text-orange-500 transition-colors">
              <ChevronRight size={20} />
            </div>
          </button>
        ))}
      </div>

      <div className="bg-slate-900 rounded-3xl p-6 text-white flex items-center justify-between">
        <div>
          <h4 className="font-bold text-sm">需要更多专业工具？</h4>
          <p className="text-[10px] text-slate-400 mt-1">联系东元技术中心定制专属模块</p>
        </div>
        <button className="bg-orange-500 text-white px-5 py-2 rounded-full text-[11px] font-black">立即反馈</button>
      </div>
    </div>
  );
};

export default Toolbox;
