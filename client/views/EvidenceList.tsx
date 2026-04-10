
import React, { useState, useEffect } from 'react';
import { CheckCircle2, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { cachedApi } from '../services/apiService';
import { EvidenceGroup } from '../types';

const EvidenceList: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const [evidenceData, setEvidenceData] = useState<EvidenceGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvidence = async () => {
      try {
        // 使用带缓存的 API
        const data = await cachedApi.getEvidence();
        setEvidenceData(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('获取证据清单失败:', err);
        setEvidenceData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchEvidence();
  }, []);

  return (
    <div className="p-6 pb-24 space-y-4 animate-fade-in bg-slate-50 min-h-full">
      <div className="bg-blue-600 rounded-3xl p-6 text-white mb-6">
        <h2 className="text-xl font-black mb-2 flex items-center gap-2">
          <ShieldCheck size={24} /> 闭环取证指引
        </h2>
        <p className="text-[10px] text-blue-100 opacity-80 uppercase tracking-widest">依照《最高法民事诉讼证据规定》整理</p>
      </div>

      <div className="space-y-3">
        {evidenceData.map((group, idx) => (
          <div key={group.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <button 
              onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
              className="w-full px-6 py-4 flex justify-between items-center hover:bg-slate-50 transition-colors"
            >
              <span className="font-bold text-gray-800 text-sm">{group.title}</span>
              {openIdx === idx ? <ChevronUp size={18} className="text-blue-500" /> : <ChevronDown size={18} className="text-gray-300" />}
            </button>
            {openIdx === idx && (
              <div className="px-6 pb-6 pt-2 space-y-3 border-t border-dashed border-gray-100">
                {group.items.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-blue-50/50 rounded-xl">
                    <CheckCircle2 size={16} className="text-blue-500 shrink-0 mt-0.5" />
                    <span className="text-xs text-gray-600 font-medium leading-relaxed">{item}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="p-4 bg-white rounded-2xl border border-dashed border-gray-200 mt-6">
        <p className="text-[10px] text-gray-400 leading-relaxed text-center italic">
          注：所有电子类证据（如视频、微信记录）建议在起诉前通过“区块链存证”或公证处进行保全。
        </p>
      </div>
    </div>
  );
};

export default EvidenceList;
