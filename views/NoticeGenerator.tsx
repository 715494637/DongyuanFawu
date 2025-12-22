
import React, { useState, useEffect } from 'react';
import { FileEdit, Share2, Copy, Check, Info, Clock, MapPin, Zap, Trash2, ChevronRight, PlusCircle } from 'lucide-react';

interface FieldSpec {
  name: string;
  icon: any;
  placeholder: string;
  suggestions?: string[];
  type?: string; // Add input type support
}

interface Template {
  id: string;
  title: string;
  fields: FieldSpec[];
  render: (f: any) => string;
}

const TEMPLATES: Template[] = [
  {
    id: 'outage',
    title: '停水/停电通知',
    fields: [
      { name: '停产类型', icon: Zap, placeholder: '如：临时停电', suggestions: ['临时停水', '紧急停电', '计划性停电', '设备检修停水'] },
      { name: '影响范围', icon: MapPin, placeholder: '如：1-3号楼', suggestions: ['全区业主', '地下停车场', '商铺区域'] },
      { name: '开始时间', icon: Clock, placeholder: '选择开始时间', type: 'datetime-local' },
      { name: '预计结束时间', icon: Clock, placeholder: '选择结束时间', type: 'datetime-local' },
      { name: '原因', icon: Info, placeholder: '如：变压器扩容', suggestions: ['自来水管爆裂', '电网检修', '消防水箱清洗', '市政施工'] }
    ],
    render: (f: any) => {
        const start = f['开始时间'] ? new Date(f['开始时间']).toLocaleString() : '____';
        const end = f['预计结束时间'] ? new Date(f['预计结束时间']).toLocaleString() : '____';
        return `【紧急公告：${f['停产类型'] || '____'}通知】\n\n尊敬的业主：\n    因 ${f['原因'] || '____'}，物业中心拟定于 ${start} 至 ${end} 对 ${f['影响范围'] || '____'} 进行${f['停产类型'] || '____'}作业。请大家提前做好蓄水/准备工作。给您带来不便，敬请谅解。\n\n东元物业服务中心\n日期：[当前日期]`;
    }
  },
  {
    id: 'cleanup',
    title: '杂物清理告知',
    fields: [
      { name: '清理区域', icon: MapPin, placeholder: '如：楼道消防通道', suggestions: ['天台公共区域', '地下负二层', '非机动车车库'] },
      { name: '截止日期', icon: Clock, placeholder: '选择截止日期', type: 'date' }
    ],
    render: (f: any) => {
        const date = f['截止日期'] ? new Date(f['截止日期']).toLocaleDateString() : '____';
        return `【温馨提示：公共区域清理公告】\n\n各位业主：\n    为消除消防隐患，保持小区环境整洁，物业中心将于近日开展“春雷行动”。请于 ${date} 前将您放置在 ${f['清理区域'] || '____'} 的个人私人物品及时移走。逾期未清理的杂物将视为无主物进行集中处理。感谢您的配合与理解。`;
    }
  }
];

const NoticeGenerator: React.FC = () => {
  const [activeTpl, setActiveTpl] = useState(TEMPLATES[0]);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    // 切换模版时清空数据
    setFormData({});
  }, [activeTpl]);

  const resultText = activeTpl.render(formData).replace('[当前日期]', new Date().toLocaleDateString());

  const handleCopy = () => {
    const text = resultText;
    // Fallback copy method for non-secure contexts
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => setCopied(true));
    } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            setCopied(true);
        } catch (err) {
            console.error('Copy failed', err);
            alert('复制失败，请长按文本手动复制。');
        }
        document.body.removeChild(textArea);
    }
    setTimeout(() => setCopied(false), 2000);
  };

  const updateField = (name: string, val: string) => {
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 animate-fade-in overflow-hidden">
      
      {/* 顶部模版选择器 - 更加轻量化 */}
      <div className="px-6 py-4 bg-white flex gap-3 overflow-x-auto no-scrollbar border-b border-gray-100 shadow-sm shrink-0">
        {TEMPLATES.map(t => (
          <button 
            key={t.id}
            onClick={() => setActiveTpl(t)}
            className={`whitespace-nowrap px-5 py-2.5 rounded-2xl text-[11px] font-black transition-all border ${
              activeTpl.id === t.id 
                ? 'bg-orange-500 text-white border-orange-600 shadow-lg shadow-orange-500/20 scale-105' 
                : 'bg-slate-50 text-slate-400 border-slate-100'
            }`}
          >
            {t.title}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-5 pb-24 space-y-6">
        
        {/* 交互编辑区 */}
        <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-6 bg-slate-900 flex items-center justify-between">
             <div className="flex items-center gap-2">
                <FileEdit size={18} className="text-orange-400" />
                <h3 className="font-black text-white text-sm">快速草拟公告</h3>
             </div>
             <button 
               onClick={() => setFormData({})}
               className="text-[10px] font-bold text-slate-500 flex items-center gap-1 hover:text-white transition-colors"
             >
               <Trash2 size={12}/> 重置
             </button>
          </div>

          <div className="p-6 space-y-6">
            {activeTpl.fields.map((field) => (
              <div key={field.name} className="space-y-2">
                <div className="flex items-center justify-between mb-1 px-1">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <field.icon size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">{field.name}</span>
                  </div>
                  {formData[field.name] && (
                    <span className="text-[9px] text-green-500 font-bold bg-green-50 px-1.5 py-0.5 rounded">已填</span>
                  )}
                </div>
                
                <input 
                  type={field.type || 'text'}
                  value={formData[field.name] || ''}
                  onChange={(e) => updateField(field.name, e.target.value)}
                  onFocus={() => setFocusedField(field.name)}
                  placeholder={field.placeholder}
                  className={`w-full bg-slate-50 border-2 rounded-2xl px-5 py-4 text-sm font-medium transition-all outline-none ${
                    focusedField === field.name ? 'border-orange-500/30 ring-4 ring-orange-500/5 bg-white' : 'border-slate-50'
                  }`}
                />

                {/* 智能联想词条 - 针对性解决打字痛点 */}
                {field.suggestions && focusedField === field.name && (
                  <div className="flex flex-wrap gap-2 mt-2 px-1 animate-fade-in">
                    {field.suggestions.map(s => (
                      <button 
                        key={s}
                        onClick={() => updateField(field.name, s)}
                        className="bg-white border border-orange-100 text-orange-600 px-3 py-1.5 rounded-xl text-[10px] font-bold shadow-sm hover:bg-orange-50 active:scale-95 transition-all"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 实时预览区 - 采用文档纸张效果 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
               <span className="w-1.5 h-4 bg-orange-500 rounded-full"></span>
               公告预览
            </h3>
            <span className="text-[10px] text-slate-400 font-bold italic">点击下方一键复制发送</span>
          </div>

          <div className="bg-white rounded-[2rem] p-8 shadow-2xl border border-slate-100 min-h-[280px] relative">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
               <FileEdit size={120} />
            </div>
            <pre className="text-slate-700 font-medium text-xs leading-loose whitespace-pre-wrap break-all tracking-wide">
              {resultText}
            </pre>
          </div>
        </div>

        <button 
          onClick={handleCopy}
          disabled={Object.keys(formData).length < 2}
          className={`w-full py-5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl transition-all active:scale-95 ${
            Object.keys(formData).length < 2 
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
              : 'bg-orange-500 text-white shadow-orange-500/30 hover:bg-orange-600'
          }`}
        >
          {copied ? <><Check size={18} /> 文书已成功复制到剪贴板</> : <><Copy size={18} /> 复制全文 (微信/QQ可用)</>}
        </button>

        <div className="bg-orange-50 p-5 rounded-[2rem] border border-orange-100 flex gap-4">
           <div className="w-10 h-10 bg-orange-200 rounded-2xl flex items-center justify-center shrink-0 text-orange-600">
              <Info size={20} />
           </div>
           <div className="space-y-1">
              <p className="text-[11px] text-orange-800 font-black uppercase">法务贴士</p>
              <p className="text-[10px] text-orange-700 leading-relaxed font-medium">本工具提供的公告已由东元法务部审核合规。复制后建议直接粘贴至项目“业主服务群”或通过“微社区”发布。</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default NoticeGenerator;
