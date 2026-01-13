
import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, MessageCircle } from 'lucide-react';
import { db } from '../services/dbService';
import { ContactQRCode } from '../types';

interface ConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ConsultationModal: React.FC<ConsultationModalProps> = ({ isOpen, onClose }) => {
  const [activeQR, setActiveQR] = useState<ContactQRCode | null>(null);

  useEffect(() => {
    if (isOpen) {
      const qrs = db.getContactQRCodes();
      if (qrs.length > 0) {
        const randomIndex = Math.floor(Math.random() * qrs.length);
        setActiveQR(qrs[randomIndex]);
      } else {
        setActiveQR(null);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md animate-fade-in">
      
      {/* 模态框主体 */}
      <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col items-center animate-fade-in-up transition-all duration-300 scale-100">
        
        {/* 关闭按钮 */}
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center bg-slate-50 text-slate-300 rounded-full hover:bg-slate-100 hover:text-slate-500 transition-colors z-20"
        >
          <X size={16} />
        </button>

        {/* 顶部蓝色胶囊标题 (保留用户指定样式) */}
        <div className="w-full pt-10 pb-6 flex justify-center bg-gradient-to-b from-blue-50/50 to-transparent">
            <div className="bg-blue-50 text-blue-600 px-5 py-2.5 rounded-full flex items-center gap-2 shadow-sm border border-blue-100">
                <ChevronLeft size={14} className="text-blue-400" />
                <span className="font-black text-xs tracking-wide">扫码添加您的专属法律顾问</span>
                <ChevronRight size={14} className="text-blue-400" />
            </div>
        </div>

        {/* 二维码区域 */}
        <div className="px-8 pb-10 w-full flex flex-col items-center">
          {activeQR ? (
            <div className="w-full flex flex-col items-center">
              <div className="relative p-1.5 rounded-3xl border-2 border-dashed border-blue-100 bg-blue-50/20 mb-6 group">
                  <div className="bg-white p-3 rounded-2xl shadow-sm overflow-hidden">
                    <img 
                        src={activeQR.imageBase64} 
                        alt="Contact QR" 
                        className="w-56 h-56 object-contain rounded-lg group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
              </div>
              
              <div className="text-center space-y-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-600 rounded-lg text-[10px] font-black border border-green-100">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    在线顾问：{activeQR.name}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed font-medium">
                  添加时请注明 <span className="text-slate-600 font-bold">项目名称</span> + <span className="text-slate-600 font-bold">咨询事项</span>
                </p>
              </div>
            </div>
          ) : (
            <div className="w-full py-12 flex flex-col items-center justify-center text-center space-y-4 bg-slate-50 rounded-3xl border border-slate-100 border-dashed">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-slate-300">
                <MessageCircle size={24} />
              </div>
              <p className="text-xs font-bold text-slate-400">
                暂未配置咨询通道<br/>请联系管理员
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ConsultationModal;
