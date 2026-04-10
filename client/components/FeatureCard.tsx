
import React from 'react';

interface FeatureCardProps {
  title: string;
  icon: React.ReactNode;
  onClick: () => void;
  colorClass?: string;
  bgClass?: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ 
  title, 
  icon, 
  onClick, 
  colorClass = "text-orange-500",
  bgClass = "bg-orange-50"
}) => {
  return (
    <div 
      onClick={onClick}
      className="group relative bg-white/70 backdrop-blur-md rounded-[2rem] p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex flex-col items-center justify-center gap-4 active:scale-95 transition-all duration-300 h-36 w-full border border-white/50 hover:border-orange-200 overflow-hidden"
    >
      {/* 装饰性背景光晕 */}
      <div className={`absolute -top-10 -right-10 w-24 h-24 ${bgClass} rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity`}></div>
      
      {/* 图标容器 */}
      <div className={`${colorClass} ${bgClass} p-3.5 rounded-2xl shadow-sm relative z-10 group-hover:scale-110 transition-transform duration-300`}>
        {icon}
      </div>
      
      {/* 标题 */}
      <span className="font-black text-slate-700 text-[13px] text-center tracking-tight leading-none relative z-10 group-hover:text-slate-900">
        {title}
      </span>
    </div>
  );
};

export default FeatureCard;
