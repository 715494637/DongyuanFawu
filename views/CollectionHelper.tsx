
import React, { useState, useEffect } from 'react';
import { Gavel, User, Plus, Clock, FileText, Send, Phone, ChevronRight, X, Briefcase, Calculator, Trash2 } from 'lucide-react';
import { api } from '../services/apiService';
import { CollectionRecord, CollectionAction } from '../types';

const CollectionHelper: React.FC = () => {
  const [debtors, setDebtors] = useState<CollectionRecord[]>([]);
  const [selectedDebtor, setSelectedDebtor] = useState<CollectionRecord | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New Debtor Form
  const [newName, setNewName] = useState('');
  const [newRoom, setNewRoom] = useState('');
  const [newAmount, setNewAmount] = useState('');

  // Embedded Calculator State
  const [showCalc, setShowCalc] = useState(false);
  const [calcDays, setCalcDays] = useState('30');
  const [calcRate, setCalcRate] = useState('0.05');
  const [calcResult, setCalcResult] = useState<{penalty: number, total: number} | null>(null);

  // 获取 token
  const getToken = () => {
    return sessionStorage.getItem('token') || localStorage.getItem('token') || '';
  };

  // 加载催收记录
  const loadCollections = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const data = await api.getCollections(token);
      setDebtors(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err: any) {
      console.error('加载催收记录失败:', err);
      setError(err.message || '加载失败');
      setDebtors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCollections();
  }, []);

  const handleAddDebtor = async () => {
    if (!newName || !newRoom || !newAmount) return;

    const newRec = {
      owner_name: newName,
      room_number: newRoom,
      amount: parseFloat(newAmount)
    };

    try {
      const token = getToken();
      await api.createCollection(newRec, token);
      await loadCollections();
      setShowAddModal(false);
      setNewName(''); setNewRoom(''); setNewAmount('');
    } catch (err: any) {
      alert('添加失败: ' + (err.message || '未知错误'));
    }
  };

  const handleDeleteDebtor = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('确定要删除该欠费记录吗？')) return;
    try {
      const token = getToken();
      await api.deleteCollection(id, token);
      await loadCollections();
      if (selectedDebtor?.id === id) setSelectedDebtor(null);
    } catch (err: any) {
      alert('删除失败: ' + (err.message || '未知错误'));
    }
  };

  const addAction = async (type: CollectionAction['type']) => {
    if (!selectedDebtor) return;

    const notes: Record<string, string> = {
        'PHONE': '电话催收，已录音',
        'REMINDER': '发送《温馨提示函》（阶段一）',
        'LETTER': '发送《律师催款函》（阶段二）',
        'LEGAL': '生成《支付令申请书》或准备起诉（阶段三）'
    };

    try {
      const token = getToken();
      await api.addCollectionAction(selectedDebtor.id, { type, note: notes[type] }, token);
      await loadCollections();
      // 重新获取更新后的记录
      const updatedData = await api.getCollection(selectedDebtor.id, token);
      setSelectedDebtor(updatedData);
    } catch (err: any) {
      console.error('添加操作记录失败:', err);
    }
  };

  const handleCalculatePenalty = () => {
    if (!selectedDebtor) return;
    const principal = selectedDebtor.amount || selectedDebtor.arrears_amount || 0;
    const days = parseInt(calcDays) || 0;
    const rate = parseFloat(calcRate) || 0;

    const penalty = principal * (rate / 100) * days;
    const total = principal + penalty;

    setCalcResult({
        penalty: parseFloat(penalty.toFixed(2)),
        total: parseFloat(total.toFixed(2))
    });
  };

  const generateLetter = (type: string) => {
    if (!selectedDebtor) return;
    const date = new Date().toLocaleDateString();
    let text = "";

    // Check if we have calculated penalty
    const hasPenalty = calcResult !== null;
    const amountStr = hasPenalty
        ? `${(selectedDebtor.amount || selectedDebtor.arrears_amount || 0)}元（另含违约金${calcResult?.penalty}元，共计${calcResult?.total}元）`
        : `${(selectedDebtor.amount || selectedDebtor.arrears_amount || 0)}元`;

    if (type === 'REMINDER') {
        text = `【温馨提示】尊敬的${selectedDebtor.ownerName}业主（房号${selectedDebtor.roomNumber}）：您好。截至${date}，您暂欠物业费${amountStr}。物业服务是维持小区运转的基础，请您尽快缴纳。`;
    } else if (type === 'LETTER') {
        text = `【律师催款函】\n致${selectedDebtor.ownerName}：\n本律师受东元物业委托，就您拖欠${selectedDebtor.roomNumber}物业费共计${amountStr}一事，郑重致函...\n请于3日内付清，否则将启动司法程序。`;
    } else {
        text = `【支付令申请书草稿】\n申请人：东元物业\n被申请人：${selectedDebtor.ownerName}\n请求事项：支付物业费${amountStr}...`;
    }

    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => alert('文书内容已复制，可发送给业主'));
    } else {
        alert('文书生成成功（模拟）：\n' + text);
    }

    addAction(type as any);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 animate-fade-in relative">
        {/* Header Summary */}
        <div className="bg-white p-6 pb-2 shadow-sm shrink-0">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-black text-slate-800">欠费催收助手</h2>
                <button onClick={() => setShowAddModal(true)} className="bg-orange-500 text-white p-2 rounded-full shadow-lg hover:scale-110 transition-transform"><Plus size={20}/></button>
            </div>
            {error && <div className="text-red-500 text-xs mb-2">{error}</div>}
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4">
                <div className="bg-orange-50 p-4 rounded-2xl min-w-[140px] border border-orange-100">
                    <span className="text-[10px] text-orange-400 font-bold uppercase">在管欠费户</span>
                    <div className="text-2xl font-black text-orange-600 mt-1">{loading ? '...' : debtors.length} <span className="text-xs">户</span></div>
                </div>
                <div className="bg-blue-50 p-4 rounded-2xl min-w-[140px] border border-blue-100">
                    <span className="text-[10px] text-blue-400 font-bold uppercase">总欠费金额</span>
                    <div className="text-2xl font-black text-blue-600 mt-1">¥ {(debtors.reduce((sum, d) => sum + ((d.amount || d.arrears_amount) || 0), 0) / 10000).toFixed(1)} <span className="text-xs">万</span></div>
                </div>
            </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24">
            {loading ? (
                <div className="text-center text-gray-400 py-8">加载中...</div>
            ) : debtors.length === 0 ? (
                <div className="text-center text-gray-400 py-8">暂无催收记录，点击右上角+添加</div>
            ) : (
                debtors.map(d => (
                    <div key={d.id} onClick={() => { setSelectedDebtor(d); setShowCalc(false); setCalcResult(null); }} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm active:scale-[0.98] transition-all relative">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                                <div className="bg-slate-100 p-2.5 rounded-full text-slate-500"><User size={20}/></div>
                                <div>
                                    <h4 className="font-bold text-slate-800">{d.room_number || d.roomNumber} {d.owner_name || d.debtor_name || d.ownerName}</h4>
                                    <p className="text-xs text-slate-400 mt-0.5">欠费: <span className="text-red-500 font-bold">¥{d.amount || d.arrears_amount || '0'}</span></p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={(e) => handleDeleteDebtor(e, d.id)} className="p-2 text-gray-300 hover:text-red-500 transition-colors">
                                    <Trash2 size={18}/>
                                </button>
                                <ChevronRight size={20} className="text-gray-300 mt-2"/>
                            </div>
                        </div>
                        {/* Last Action Indicator */}
                        {(d.history && d.history.length > 0) && (
                            <div className="mt-4 pt-3 border-t border-gray-50 flex items-center gap-2 text-[10px] text-gray-400">
                                <Clock size={12}/>
                                <span>最新进度: {new Date(d.history[0].date * 1000 || d.history[0].date).toLocaleDateString()} {d.history[0].note.split('（')[0]}</span>
                            </div>
                        )}
                    </div>
                ))
            )}
        </div>

        {/* Detail Modal */}
        {selectedDebtor && (
            <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col animate-fade-in-up">
                <div className="bg-white p-6 shadow-sm flex items-center gap-4 sticky top-0 z-10">
                    <button onClick={() => setSelectedDebtor(null)} className="p-2 bg-slate-100 rounded-full"><ChevronRight className="rotate-180" size={20}/></button>
                    <div>
                        <h3 className="font-black text-lg">{selectedDebtor.owner_name || selectedDebtor.debtor_name || selectedDebtor.ownerName}</h3>
                        <p className="text-xs text-slate-400">{selectedDebtor.room_number || selectedDebtor.roomNumber} · 欠费 ¥{selectedDebtor.amount || selectedDebtor.arrears_amount || '0'}</p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Penalty Calculator Integration */}
                    <div className="bg-white rounded-2xl border border-orange-100 p-4 shadow-sm">
                        <div
                            className="flex justify-between items-center cursor-pointer"
                            onClick={() => setShowCalc(!showCalc)}
                        >
                            <h4 className="flex items-center gap-2 text-orange-600 font-bold text-xs uppercase">
                                <Calculator size={14}/> 违约金计算器
                            </h4>
                            <ChevronRight size={14} className={`text-orange-400 transition-transform ${showCalc ? 'rotate-90' : ''}`}/>
                        </div>

                        {showCalc && (
                            <div className="mt-4 space-y-4 animate-fade-in">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] text-slate-400 font-bold block mb-1">逾期天数</label>
                                        <input
                                            value={calcDays}
                                            onChange={e => setCalcDays(e.target.value)}
                                            className="w-full bg-slate-50 rounded-lg p-2 text-sm font-bold border border-slate-200"
                                            type="number"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-slate-400 font-bold block mb-1">日费率 (%)</label>
                                        <input
                                            value={calcRate}
                                            onChange={e => setCalcRate(e.target.value)}
                                            className="w-full bg-slate-50 rounded-lg p-2 text-sm font-bold border border-slate-200"
                                            placeholder="0.05"
                                        />
                                    </div>
                                </div>
                                <button
                                    onClick={handleCalculatePenalty}
                                    className="w-full bg-orange-500 text-white py-2 rounded-lg text-xs font-bold"
                                >
                                    计算
                                </button>
                                {calcResult && (
                                    <div className="bg-orange-50 p-3 rounded-xl border border-orange-100 flex justify-between items-center">
                                        <div className="text-xs text-orange-700">违约金: <span className="font-bold">¥{calcResult.penalty}</span></div>
                                        <div className="text-sm text-orange-700 font-black">总计: ¥{calcResult.total}</div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Timeline */}
                    <div className="relative border-l-2 border-slate-200 ml-3 space-y-8 pl-6 py-2">
                        {(selectedDebtor.history || []).map((h, i) => (
                            <div key={h.id} className="relative">
                                <div className={`absolute -left-[31px] w-4 h-4 rounded-full border-2 border-white shadow-sm ${h.type === 'PHONE' ? 'bg-blue-400' : h.type === 'LEGAL' ? 'bg-red-500' : 'bg-orange-400'}`}></div>
                                <div className="text-[10px] text-slate-400 font-mono mb-1">{new Date(h.date * 1000 || h.date).toLocaleString()}</div>
                                <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm text-xs font-bold text-slate-700">
                                    {h.note}
                                </div>
                            </div>
                        ))}
                        {(selectedDebtor.history || []).length === 0 && <div className="text-xs text-slate-400 italic">暂无催收记录，请开始第一次行动。</div>}
                    </div>
                </div>

                {/* Actions */}
                <div className="bg-white p-6 border-t border-gray-100 pb-8 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-3 text-center">生成并发送文书 (自动记录留痕)</h4>
                    <div className="grid grid-cols-4 gap-2">
                        <button onClick={() => addAction('PHONE')} className="flex flex-col items-center gap-1 p-2 rounded-xl bg-slate-50 hover:bg-slate-100 active:scale-95">
                            <div className="w-10 h-10 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center"><Phone size={18}/></div>
                            <span className="text-[9px] font-bold text-slate-600">电话记录</span>
                        </button>
                        <button onClick={() => generateLetter('REMINDER')} className="flex flex-col items-center gap-1 p-2 rounded-xl bg-slate-50 hover:bg-slate-100 active:scale-95">
                            <div className="w-10 h-10 bg-green-100 text-green-500 rounded-full flex items-center justify-center"><Send size={18}/></div>
                            <span className="text-[9px] font-bold text-slate-600">温馨提示</span>
                        </button>
                        <button onClick={() => generateLetter('LETTER')} className="flex flex-col items-center gap-1 p-2 rounded-xl bg-slate-50 hover:bg-slate-100 active:scale-95">
                            <div className="w-10 h-10 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center"><FileText size={18}/></div>
                            <span className="text-[9px] font-bold text-slate-600">律师函</span>
                        </button>
                        <button onClick={() => generateLetter('LEGAL')} className="flex flex-col items-center gap-1 p-2 rounded-xl bg-slate-50 hover:bg-slate-100 active:scale-95">
                            <div className="w-10 h-10 bg-red-100 text-red-500 rounded-full flex items-center justify-center"><Briefcase size={18}/></div>
                            <span className="text-[9px] font-bold text-slate-600">起诉状</span>
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Add Modal */}
        {showAddModal && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
                <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 animate-fade-in-up">
                    <h3 className="font-black text-lg mb-4">录入欠费业主</h3>
                    <div className="space-y-3">
                        <input value={newName} onChange={e => setNewName(e.target.value)} className="w-full bg-slate-50 p-3 rounded-xl text-sm" placeholder="业主姓名" />
                        <input value={newRoom} onChange={e => setNewRoom(e.target.value)} className="w-full bg-slate-50 p-3 rounded-xl text-sm" placeholder="房号 (如 1-101)" />
                        <input value={newAmount} onChange={e => setNewAmount(e.target.value)} type="number" className="w-full bg-slate-50 p-3 rounded-xl text-sm" placeholder="欠费金额" />
                    </div>
                    <div className="flex gap-3 mt-6">
                        <button onClick={() => setShowAddModal(false)} className="flex-1 py-3 bg-slate-100 rounded-xl text-xs font-bold text-slate-500">取消</button>
                        <button onClick={handleAddDebtor} className="flex-1 py-3 bg-orange-500 text-white rounded-xl text-xs font-bold">保存</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default CollectionHelper;
