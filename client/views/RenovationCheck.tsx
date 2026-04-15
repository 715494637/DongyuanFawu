
import React, { useState, useRef, useEffect } from 'react';
import { ClipboardList, CheckSquare, Square, Share2, X, FileText, Download } from 'lucide-react';
import { api } from '../services/apiService';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const RenovationCheck: React.FC = () => {
  const [checklistItems, setChecklistItems] = useState<string[]>([]);
  const [checks, setChecks] = useState<Record<number, boolean>>({});
  const [showReport, setShowReport] = useState(false);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  // Form State
  const [roomNo, setRoomNo] = useState('');
  const [manager, setManager] = useState('');

  // PDF 内容区域 ref
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadRenovationItems();
  }, []);

  const loadRenovationItems = async () => {
    try {
      setLoading(true);
      const items = await api.getRenovationItems();
      setChecklistItems(Array.isArray(items) ? items : []);
    } catch (err) {
      console.error('加载装修巡查项配置失败:', err);
      // 使用默认配置作为后备
      setChecklistItems(['检查承重墙', '检查水电线路', '检查防水层', '检查消防通道', '检查噪音施工时间']);
    } finally {
      setLoading(false);
    }
  };

  const toggleCheck = (idx: number) => {
    setChecks(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handlePreview = () => {
    if (!roomNo.trim() || !manager.trim()) {
        alert("请填写完整的房号和施工负责人姓名");
        return;
    }
    setShowReport(true);
  };

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;

    // 下载前提醒签字
    if (!confirm('建议下载打印后签字归档，是否继续下载？')) {
      return;
    }

    try {
      setDownloading(true);

      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`装修巡查单_${roomNo}_${new Date().toLocaleDateString()}.pdf`);
    } catch (err) {
      console.error('PDF下载失败:', err);
      alert('PDF下载失败，请重试');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="p-6 pb-24 space-y-6 animate-fade-in bg-slate-50 min-h-full">

      {/* Header */}
      <div className="bg-orange-600 rounded-3xl p-6 text-white shadow-xl">
        <h2 className="text-xl font-black mb-1 flex items-center gap-2">
          <ClipboardList size={24} /> 装修巡查电子单
        </h2>
        <p className="text-[10px] text-orange-100 opacity-80 uppercase tracking-widest">规范施工管理 · 规避连带责任</p>
      </div>

      {/* Form */}
      <div className="animate-fade-in space-y-6">
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
          <div className="flex gap-4 mb-6 border-b border-gray-50 pb-4">
            <div className="flex-1">
              <label className="text-[10px] text-gray-400 font-bold uppercase">房号</label>
              <input
                value={roomNo}
                onChange={(e) => setRoomNo(e.target.value)}
                className="w-full bg-slate-50 p-2 rounded-lg text-sm font-bold mt-1 outline-none focus:ring-2 focus:ring-orange-200"
                placeholder="如 3-101"
              />
            </div>
            <div className="flex-1">
              <label className="text-[10px] text-gray-400 font-bold uppercase">施工方负责人</label>
              <input
                value={manager}
                onChange={(e) => setManager(e.target.value)}
                className="w-full bg-slate-50 p-2 rounded-lg text-sm font-bold mt-1 outline-none focus:ring-2 focus:ring-orange-200"
                placeholder="姓名"
              />
            </div>
          </div>

          <div className="space-y-3">
            {checklistItems.map((item, i) => (
              <div key={i} onClick={() => toggleCheck(i)} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer select-none">
                <div className={`mt-0.5 ${checks[i] ? 'text-green-500' : 'text-gray-300'}`}>
                  {checks[i] ? <CheckSquare size={20}/> : <Square size={20}/>}
                </div>
                <span className={`text-sm font-medium ${checks[i] ? 'text-gray-800' : 'text-gray-500'}`}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 提示信息 */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <div className="text-amber-500 mt-0.5 flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <p className="text-xs text-amber-700 leading-relaxed font-medium">
            建议下载打印后由施工负责人签字归档，作为物业日常装修管理的内部巡查记录。
          </p>
        </div>

        <button onClick={handlePreview} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-slate-900/20 active:scale-95 transition-all">
          <Share2 size={16}/> 生成单据预览
        </button>
      </div>

      {/* Report Preview Modal */}
      {showReport && (
         <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
             <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-fade-in-up">
                 {/* Preview Header */}
                 <div className="p-4 bg-slate-100 border-b border-gray-200 flex justify-between items-center">
                     <div className="flex items-center gap-2">
                         <FileText size={18} className="text-slate-700"/>
                         <span className="font-bold text-slate-700 text-sm">单据预览</span>
                     </div>
                     <button onClick={() => setShowReport(false)} className="p-2 bg-white rounded-full text-slate-500"><X size={18}/></button>
                 </div>

                 {/* Paper Content */}
                 <div className="flex-1 overflow-y-auto p-6 bg-slate-200">
                     <div ref={reportRef} className="bg-white p-8 shadow-sm min-h-[500px] relative text-slate-800 flex flex-col">
                         <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none rotate-[-15deg]">
                             <span className="text-6xl font-black uppercase">East Capital Legal</span>
                         </div>

                         <div className="text-center mb-6 border-b-2 border-black pb-4">
                             <h1 className="text-xl font-black tracking-widest mb-1">装修违规巡查整改通知单</h1>
                             <p className="text-[10px] font-mono">编号: EC-{Date.now().toString().slice(-6)}</p>
                         </div>

                         <div className="grid grid-cols-2 gap-4 mb-6 text-xs">
                             <div>
                                 <span className="text-slate-400 font-bold block mb-1">巡查房号</span>
                                 <span className="font-bold text-base border-b border-slate-200 block pb-1">{roomNo}</span>
                             </div>
                             <div>
                                 <span className="text-slate-400 font-bold block mb-1">施工负责人</span>
                                 <span className="font-bold text-base border-b border-slate-200 block pb-1">{manager}</span>
                             </div>
                             <div>
                                 <span className="text-slate-400 font-bold block mb-1">巡查日期</span>
                                 <span className="font-bold border-b border-slate-200 block pb-1">{new Date().toLocaleDateString()}</span>
                             </div>
                             <div>
                                 <span className="text-slate-400 font-bold block mb-1">巡查员</span>
                                 <span className="font-bold border-b border-slate-200 block pb-1">物业管家部</span>
                             </div>
                         </div>

                         <div className="mb-8 flex-1">
                             <h3 className="font-bold text-sm bg-slate-100 px-2 py-1 mb-2">巡查项核验结果</h3>
                             <table className="w-full text-xs border-collapse">
                                 <tbody>
                                     {checklistItems.map((item, i) => (
                                         <tr key={i} className="border-b border-slate-100">
                                             <td className="py-2 pr-2 text-slate-600">{i + 1}. {item}</td>
                                             <td className="py-2 w-12 text-center font-bold">
                                                 {checks[i] ? <span className="text-green-500">合格</span> : <span className="text-red-500">异常</span>}
                                             </td>
                                         </tr>
                                     ))}
                                 </tbody>
                             </table>
                         </div>

                         <div className="flex justify-end mt-4 mb-8">
                             <div className="text-center">
                                 <div className="text-xs font-bold text-slate-400 mb-2">负责人确认签字</div>
                                 <div className="w-40 h-16 border-b border-black flex items-center justify-center">
                                     <span className="text-[10px] text-slate-400 italic">（请下载打印后在此处签字）</span>
                                 </div>
                             </div>
                         </div>

                         <div className="mt-auto pt-4 border-t border-dashed border-slate-300">
                            <p className="text-[9px] text-slate-400 leading-relaxed text-justify">
                                <span className="text-slate-600 font-bold">法律效力免责声明：</span>
                                本单据仅作为物业服务中心开展日常装修管理的<span className="font-bold text-slate-700">"内部巡查记录"</span>，旨在督促相关方进行违规整改，<span className="font-bold text-slate-700">不具备行政执法效力，亦不直接作为司法认定的法律证据</span>。如需进行司法鉴定、行政处罚或诉讼，应以政府行政主管部门（如住建局、城管执法局）出具的正式法律文书或具备资质的第三方鉴定机构出具的报告为准。
                            </p>
                         </div>
                     </div>
                 </div>

                 {/* Footer Actions */}
                 <div className="p-4 bg-white border-t border-gray-100">
                     <button
                       onClick={handleDownloadPDF}
                       disabled={downloading}
                       className="w-full py-3 bg-orange-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-600/30 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                     >
                         <Download size={16}/> {downloading ? '正在生成PDF...' : '下载PDF'}
                     </button>
                 </div>
             </div>
         </div>
      )}
    </div>
  );
};

export default RenovationCheck;
