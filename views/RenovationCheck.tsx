
import React, { useState, useRef, useEffect } from 'react';
import { ClipboardList, CheckSquare, Square, PenTool, Share2, X, Eraser, Check, FileText, Download, Printer, History, Clock, ArrowLeft } from 'lucide-react';
import { db } from '../services/dbService';
import { RenovationRecord } from '../types';

const RenovationCheck: React.FC = () => {
  const [viewMode, setViewMode] = useState<'form' | 'history'>('form');
  const [historyList, setHistoryList] = useState<RenovationRecord[]>([]);
  const [checklistItems, setChecklistItems] = useState<string[]>([]);

  const [checks, setChecks] = useState<Record<number, boolean>>({});
  const [signature, setSignature] = useState<string | null>(null);
  const [showSignPad, setShowSignPad] = useState(false);
  const [showReport, setShowReport] = useState(false);
  
  // Form State
  const [roomNo, setRoomNo] = useState('');
  const [manager, setManager] = useState('');
  
  // Canvas Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const lastPos = useRef<{x: number, y: number}>({ x: 0, y: 0 });

  useEffect(() => {
    refreshHistory();
    setChecklistItems(db.getRenovationChecklist());
  }, []);

  const refreshHistory = () => {
    setHistoryList(db.getRenovationRecords());
  };

  const toggleCheck = (idx: number) => {
    setChecks(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  // --- Signature Logic ---
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    isDrawing.current = true;
    const pos = getPos(e);
    lastPos.current = pos;
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing.current || !canvasRef.current) return;
    // WeChat Fix: Prevent scrolling when drawing
    if (e.type === 'touchmove') {
       e.preventDefault(); 
    }
    
    const ctx = canvasRef.current.getContext('2d');
    const pos = getPos(e);
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    }
    lastPos.current = pos;
  };

  const stopDrawing = () => { isDrawing.current = false; };

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const clearCanvas = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  const saveSignature = () => {
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      setSignature(dataUrl);
      setShowSignPad(false);
    }
  };

  const handlePreview = () => {
    if (!roomNo.trim() || !manager.trim()) {
        alert("请填写完整的房号和施工负责人姓名");
        return;
    }
    if (!signature) {
        alert("请先完成电子签名确认。");
        return;
    }
    setShowReport(true);
  };

  const handleConfirmArchive = () => {
      const newRecord: RenovationRecord = {
          id: Date.now().toString(),
          roomNo,
          manager,
          checks,
          signature: signature || '',
          date: Date.now()
      };
      
      db.addRenovationRecord(newRecord);
      alert("✅ 单据已归档成功！\n您可以在“巡查记录”中查看历史单据。");
      
      refreshHistory();
      setShowReport(false);
      
      // Reset Form
      setRoomNo('');
      setManager('');
      setChecks({});
      setSignature(null);
  };

  const loadRecord = (rec: RenovationRecord) => {
      setRoomNo(rec.roomNo);
      setManager(rec.manager);
      setChecks(rec.checks);
      setSignature(rec.signature);
      setShowReport(true); // Open directly in preview mode
  };

  return (
    <div className="p-6 pb-24 space-y-6 animate-fade-in bg-slate-50 min-h-full">
      
      {/* Header */}
      <div className="bg-orange-600 rounded-3xl p-6 text-white shadow-xl flex justify-between items-start">
        <div>
            <h2 className="text-xl font-black mb-1 flex items-center gap-2">
            <ClipboardList size={24} /> 装修巡查电子单
            </h2>
            <p className="text-[10px] text-orange-100 opacity-80 uppercase tracking-widest">规范施工管理 · 规避连带责任</p>
        </div>
        <button 
            onClick={() => setViewMode(viewMode === 'form' ? 'history' : 'form')}
            className="flex flex-col items-center gap-1 opacity-90 hover:opacity-100 transition-opacity"
        >
            <div className="p-2 bg-white/20 rounded-full">
                {viewMode === 'form' ? <History size={20} /> : <ClipboardList size={20} />}
            </div>
            <span className="text-[9px] font-bold">{viewMode === 'form' ? '巡查记录' : '新开单'}</span>
        </button>
      </div>

      {viewMode === 'history' ? (
          <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-2 mb-2">
                 <button onClick={() => setViewMode('form')} className="text-slate-400"><ArrowLeft size={16}/></button>
                 <h3 className="font-bold text-slate-700">历史归档记录 ({historyList.length})</h3>
              </div>
              
              {historyList.length === 0 ? (
                  <div className="py-20 text-center text-slate-400">
                      <History size={48} className="mx-auto mb-4 opacity-20"/>
                      <p className="text-xs">暂无历史归档记录</p>
                  </div>
              ) : (
                  historyList.map(rec => (
                      <div key={rec.id} onClick={() => loadRecord(rec)} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center active:scale-[0.98] transition-all">
                          <div>
                              <div className="flex items-center gap-2 mb-1">
                                  <span className="font-black text-slate-800">{rec.roomNo}</span>
                                  <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">{rec.manager}</span>
                              </div>
                              <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                  <Clock size={10}/> {new Date(rec.date).toLocaleString()}
                              </div>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-500">
                              <FileText size={16}/>
                          </div>
                      </div>
                  ))
              )}
          </div>
      ) : (
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
                    {checklistItems.length === 0 && (
                        <div className="text-center text-xs text-slate-400 py-4">
                            暂无检查项，请联系管理员在后台配置。
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 flex items-center justify-between">
                <div className="flex-1">
                    <div className="text-sm font-bold text-slate-800">电子签名确认</div>
                    {signature ? (
                        <div className="mt-2 relative group w-32 h-16 border border-dashed border-green-200 rounded-lg bg-green-50/50">
                            <img src={signature} alt="Signed" className="w-full h-full object-contain" />
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <span className="text-[9px] text-green-600 bg-white/80 px-1 rounded backdrop-blur-sm shadow-sm">已签署</span>
                            </div>
                        </div>
                    ) : (
                        <div className="text-xs text-red-500 mt-1">需装修负责人现场签字</div>
                    )}
                </div>
                <button 
                    onClick={() => setShowSignPad(true)} 
                    className={`p-3 rounded-xl transition-all active:scale-95 ${signature ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600 animate-pulse'}`}
                >
                    <PenTool size={20}/>
                </button>
            </div>

            <button onClick={handlePreview} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-slate-900/20 active:scale-95 transition-all">
                <Share2 size={16}/> 生成单据预览
            </button>
        </div>
      )}

      {/* Signature Modal */}
      {showSignPad && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white w-full max-w-md rounded-[2rem] p-4 flex flex-col shadow-2xl animate-fade-in-up">
                <div className="flex justify-between items-center mb-4 px-2">
                    <h3 className="font-black text-lg text-slate-800">请在此处签名</h3>
                    <button onClick={() => setShowSignPad(false)} className="p-2 bg-slate-100 rounded-full text-slate-500"><X size={20}/></button>
                </div>
                
                <div className="relative w-full h-64 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl overflow-hidden touch-none">
                    <canvas
                        ref={canvasRef}
                        width={600} 
                        height={400}
                        // WeChat Optimization: touchAction none prevents page scrolling
                        style={{ touchAction: 'none' }}
                        className="w-full h-full cursor-crosshair"
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                    />
                    <div className="absolute bottom-2 right-2 text-[10px] text-slate-300 pointer-events-none select-none">East Capital Electronic Sign</div>
                </div>

                <div className="flex gap-3 mt-4">
                    <button onClick={clearCanvas} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs flex items-center justify-center gap-2">
                        <Eraser size={16}/> 重写
                    </button>
                    <button onClick={saveSignature} className="flex-[2] py-3 bg-orange-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-500/30">
                        <Check size={16}/> 确认签名
                    </button>
                </div>
            </div>
        </div>
      )}

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
                     <div className="bg-white p-8 shadow-sm min-h-[500px] relative text-slate-800 flex flex-col">
                         {/* Watermark */}
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
                                                 {checks[i] ? <span className="text-red-500">异常</span> : <span className="text-green-500">合格</span>}
                                             </td>
                                         </tr>
                                     ))}
                                 </tbody>
                             </table>
                         </div>

                         <div className="flex justify-end mt-4 mb-8">
                             <div className="text-center">
                                 <div className="text-xs font-bold text-slate-400 mb-2">负责人确认签字</div>
                                 <div className="w-32 h-16 border-b border-black flex items-center justify-center">
                                     {signature && <img src={signature} alt="Sign" className="max-h-full max-w-full" />}
                                 </div>
                             </div>
                         </div>
                         
                         {/* Disclaimer Footer - UPDATED STRICT */}
                         <div className="mt-auto pt-4 border-t border-dashed border-slate-300">
                            <p className="text-[9px] text-slate-400 leading-relaxed text-justify">
                                <span className="text-slate-600 font-bold">法律效力免责声明：</span>
                                本单据仅作为物业服务中心开展日常装修管理的<span className="font-bold text-slate-700">“内部巡查记录”</span>，旨在督促相关方进行违规整改，<span className="font-bold text-slate-700">不具备行政执法效力，亦不直接作为司法认定的法律证据</span>。如需进行司法鉴定、行政处罚或诉讼，应以政府行政主管部门（如住建局、城管执法局）出具的正式法律文书或具备资质的第三方鉴定机构出具的报告为准。
                            </p>
                         </div>
                     </div>
                 </div>

                 {/* Footer Actions */}
                 <div className="p-4 bg-white border-t border-gray-100 flex gap-3">
                     <button onClick={() => alert('已调用系统打印机')} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs flex items-center justify-center gap-2">
                         <Printer size={16}/> 打印
                     </button>
                     <button onClick={handleConfirmArchive} className="flex-[2] py-3 bg-slate-900 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg">
                         <Download size={16}/> 确认并归档
                     </button>
                 </div>
             </div>
         </div>
      )}
    </div>
  );
};

export default RenovationCheck;
