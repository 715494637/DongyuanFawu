
import React, { useState, useRef, useEffect } from 'react';
import { Palette, Download, Share2, Check, AlertTriangle, FileText, ImageIcon, ShieldAlert, Zap, Heart, Star } from 'lucide-react';
import { db } from '../services/dbService';
import { CustomPosterTemplate } from '../types';

interface PosterTemplate {
  id: string;
  name: string;
  renderBg: () => React.ReactNode;
  icon: any;
  defaultTitle: string;
  themeColor: string; // 用于选中状态
  textColorClass: string;
  accentColorClass: string;
  isCustom?: boolean;
}

const PRESET_TEMPLATES: PosterTemplate[] = [
  { 
    id: 'warning', 
    name: '雷霆警示', 
    themeColor: 'border-red-500 bg-red-50 text-red-600',
    textColorClass: 'text-white',
    accentColorClass: 'bg-red-600',
    icon: ShieldAlert, 
    defaultTitle: '严禁高空抛物',
    renderBg: () => (
      <>
        {/* 深色底 */}
        <div className="absolute inset-0 bg-slate-900"></div>
        {/* 红色放射光 */}
        <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[100%] bg-[radial-gradient(circle,rgba(220,38,38,0.4)_0%,rgba(15,23,42,0)_70%)]"></div>
        {/* 底部暗红渐变 */}
        <div className="absolute bottom-0 left-0 w-full h-2/3 bg-gradient-to-t from-red-950 via-slate-900/50 to-transparent"></div>
        {/* 警戒线条纹理 */}
        <div className="absolute top-0 right-0 w-full h-full opacity-10" 
             style={{backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 10px, transparent 10px, transparent 20px)'}}>
        </div>
        {/* 聚光灯效果 */}
        <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-64 h-64 bg-red-500 rounded-full blur-[100px] opacity-20"></div>
        {/* 噪点质感 */}
        <div className="absolute inset-0 opacity-20 pointer-events-none mix-blend-overlay"
             style={{backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.5'/%3E%3C/svg%3E")`}}>
        </div>
      </>
    )
  },
  { 
    id: 'notice', 
    name: '深蓝视界', 
    themeColor: 'border-blue-500 bg-blue-50 text-blue-600',
    textColorClass: 'text-white',
    accentColorClass: 'bg-blue-600',
    icon: FileText, 
    defaultTitle: '物业管理告知',
    renderBg: () => (
      <>
        {/* 极光蓝渐变底 */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900"></div>
        {/* 科技感光束 */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500 rounded-full blur-[120px] opacity-20 -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-500 rounded-full blur-[100px] opacity-10 -ml-20 -mb-20"></div>
        {/* 几何线条装饰 */}
        <div className="absolute inset-0 opacity-10">
           <svg width="100%" height="100%">
              <line x1="0" y1="0" x2="100%" y2="100%" stroke="white" strokeWidth="1" />
              <circle cx="80%" cy="20%" r="100" stroke="white" strokeWidth="1" fill="none" />
              <circle cx="10%" cy="90%" r="50" stroke="white" strokeWidth="1" fill="none" />
           </svg>
        </div>
        {/* 玻璃质感覆盖 */}
        <div className="absolute inset-4 bg-white/5 rounded-[2rem] border border-white/10 backdrop-blur-sm"></div>
      </>
    )
  },
  { 
    id: 'warm', 
    name: '晨曦暖阳', 
    themeColor: 'border-orange-500 bg-orange-50 text-orange-600',
    textColorClass: 'text-white',
    accentColorClass: 'bg-orange-500',
    icon: Heart, 
    defaultTitle: '温馨服务提醒',
    renderBg: () => (
      <>
        {/* 暖阳渐变 */}
        <div className="absolute inset-0 bg-gradient-to-bl from-orange-400 via-rose-400 to-amber-200"></div>
        {/* 柔光光斑 */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-yellow-100 rounded-full blur-2xl opacity-40"></div>
        <div className="absolute bottom-20 right-10 w-48 h-48 bg-white rounded-full blur-3xl opacity-30"></div>
        {/* 纸质纹理叠加 */}
        <div className="absolute inset-0 opacity-10 mix-blend-multiply"
             style={{backgroundImage: `url("data:image/svg+xml,%3Csvg width='4' height='4' viewBox='0 0 4 4' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 3h1v1H1V3zm2-2h1v1H3V1z' fill='%23000' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E")`}}>
        </div>
        {/* 装饰性波浪 */}
        <div className="absolute bottom-0 w-full">
           <svg viewBox="0 0 1440 320" className="w-full opacity-20">
              <path fill="#fff" fillOpacity="1" d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,224C672,245,768,267,864,261.3C960,256,1056,224,1152,197.3C1248,171,1344,149,1392,138.7L1440,128V320H1392C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320H0Z"></path>
           </svg>
        </div>
      </>
    )
  },
];

const PosterGenerator: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [allTemplates, setAllTemplates] = useState<PosterTemplate[]>(PRESET_TEMPLATES);
  const [selectedTpl, setSelectedTpl] = useState(PRESET_TEMPLATES[0]);
  const [title, setTitle] = useState(selectedTpl.defaultTitle);
  const [content, setContent] = useState('根据《民法典》及小区物业管理规约，请广大业主共同遵守维护。');
  const [enterprise, setEnterprise] = useState('东元物业服务中心');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const posterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Load Logo
    const savedLogo = db.getEnterpriseLogo();
    if (savedLogo) setLogoUrl(savedLogo);

    // 2. Load Custom Templates from DB
    const custom = db.getCustomPosters();
    if (custom && custom.length > 0) {
      const customTpls: PosterTemplate[] = custom.map(c => ({
        id: c.id,
        name: c.name,
        // 自定义模板使用图片作为背景
        renderBg: () => (
          <>
            <img src={c.imageBase64} className="absolute inset-0 w-full h-full object-cover" alt="bg" />
            <div className="absolute inset-0 bg-black/20"></div> {/* 增加遮罩确保文字可读 */}
          </>
        ),
        icon: Star, // 自定义模板默认星标图标
        defaultTitle: '物业通知',
        themeColor: 'border-purple-500 bg-purple-50 text-purple-600',
        textColorClass: 'text-white', // 默认白色文字
        accentColorClass: 'bg-white/20 backdrop-blur-md', // 透明磨砂强调色
        isCustom: true
      }));
      setAllTemplates([...customTpls, ...PRESET_TEMPLATES]);
    }
  }, []);

  const handleTplSelect = (tpl: PosterTemplate) => {
    setSelectedTpl(tpl);
    setTitle(tpl.defaultTitle);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64 = ev.target?.result as string;
        setLogoUrl(base64);
        db.saveEnterpriseLogo(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownload = () => {
    // 提示用户
    alert('海报高清渲染完成，请长按上方预览图进行“保存到相册”或“发送给朋友”。');
  };

  return (
    <div className="p-5 space-y-6 animate-fade-in pb-24">
      
      {/* 风格选择器 */}
      <div className="space-y-3">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">选择海报模版</label>
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
          {allTemplates.map(tpl => (
            <button
              key={tpl.id}
              onClick={() => handleTplSelect(tpl)}
              className={`flex-1 shrink-0 px-4 py-3 rounded-2xl border-2 transition-all flex items-center gap-2 shadow-sm ${
                selectedTpl.id === tpl.id ? `${tpl.themeColor} scale-105 shadow-md` : 'border-slate-100 bg-white text-slate-500 grayscale'
              }`}
            >
              <div className={`p-1.5 rounded-full ${selectedTpl.id === tpl.id ? 'bg-white/50' : 'bg-slate-100'}`}>
                <tpl.icon size={14} />
              </div>
              <span className="text-[11px] font-black">{tpl.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 海报预览核心区 */}
      <div className="flex flex-col items-center">
        <div 
          ref={posterRef}
          className="w-full aspect-[3/4] rounded-[2rem] relative overflow-hidden shadow-2xl flex flex-col transition-all duration-500"
        >
          {/* 渲染背景层 (支持自定义图片) */}
          {selectedTpl.renderBg()}
          
          {/* 内容层 - 使用 Flex 布局确保居中和分布 */}
          <div className="relative z-10 w-full h-full flex flex-col p-8">
            
            {/* 顶部：Logo 与 编号 */}
            <div className="flex justify-between items-start mb-8">
               <div className="h-10 px-2 py-1 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 flex items-center">
                 {logoUrl ? (
                   <img src={logoUrl} className="h-full object-contain" alt="Logo" />
                 ) : (
                   <span className="text-[10px] font-black text-white/80 px-2">企业 LOGO</span>
                 )}
               </div>
               <div className="flex flex-col items-end">
                  <div className="text-[8px] text-white/40 font-mono tracking-[0.2em] uppercase">NOTICE NO.</div>
                  <div className="text-[10px] text-white/80 font-mono font-bold">{new Date().getFullYear()}-{new Date().getDate().toString().padStart(2, '0')}</div>
               </div>
            </div>

            {/* 中部：核心信息 */}
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              {/* 图标容器 */}
              <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl backdrop-blur-sm border border-white/10 ${selectedTpl.accentColorClass} bg-opacity-80`}>
                <selectedTpl.icon size={48} className="text-white drop-shadow-md" />
              </div>
              
              {/* 标题 */}
              <h1 className={`text-4xl font-black mb-6 leading-tight tracking-tight drop-shadow-xl ${selectedTpl.textColorClass}`}>
                {title || '请输入标题'}
              </h1>
              
              {/* 装饰线 */}
              <div className="w-12 h-1.5 bg-white/30 rounded-full mb-8 backdrop-blur-md"></div>
              
              {/* 正文 */}
              <div className={`text-sm leading-7 font-medium px-2 tracking-wide drop-shadow-md opacity-90 ${selectedTpl.textColorClass}`}>
                {content || '请输入正文内容...'}
              </div>
            </div>

            {/* 底部：落款 */}
            <div className="mt-auto pt-8 flex flex-col items-center space-y-3">
              <div className="px-6 py-2.5 bg-white/10 backdrop-blur-xl rounded-full border border-white/10 shadow-lg">
                <span className={`text-[11px] font-black uppercase tracking-widest ${selectedTpl.textColorClass}`}>
                   {enterprise}
                </span>
              </div>
              <div className="text-[7px] text-white/30 font-bold uppercase tracking-[0.5em]">
                Verified by Dongyuan Legal OS
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* 编辑表单 */}
      <div className="bg-white rounded-[2rem] p-6 shadow-xl border border-gray-100 space-y-5">
        <div className="flex items-center gap-2 mb-2">
          <Palette size={18} className="text-slate-800" />
          <h3 className="font-black text-slate-800 text-sm">海报要素配置</h3>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-1.5">
             <div 
               onClick={() => fileInputRef.current?.click()}
               className="w-full bg-slate-50 border border-dashed border-slate-300 rounded-xl py-3 flex items-center justify-center gap-2 cursor-pointer hover:bg-slate-100 transition-colors"
             >
               <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
               <ImageIcon size={16} className="text-slate-400" />
               <span className="text-xs font-bold text-slate-500">{logoUrl ? '更换企业 Logo' : '上传企业 Logo (透明底最佳)'}</span>
             </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">海报大标题</label>
              <input 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-slate-200"
                placeholder="如：严禁占用消防通道"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">落款单位</label>
              <input 
                value={enterprise}
                onChange={(e) => setEnterprise(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>
          </div>
          
          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">正文内容</label>
            <textarea 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-medium h-20 outline-none focus:ring-2 focus:ring-slate-200 resize-none"
              placeholder="请输入法律条款或温馨提示语..."
            />
          </div>
        </div>

        <button 
          onClick={handleDownload}
          className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl"
        >
          <Download size={16} /> 保存高清海报到相册
        </button>
      </div>

    </div>
  );
};

export default PosterGenerator;
