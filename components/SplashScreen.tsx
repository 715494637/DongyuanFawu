
import React, { useState, useEffect } from 'react';
import { api } from '../services/apiService';

const SplashScreen: React.FC = () => {
  const [customImage, setCustomImage] = useState<string | null>(null);

  useEffect(() => {
    // 从专门的开屏图API获取自定义开屏图
    const loadSplashImage = async () => {
      try {
        const response = await api.getSplashImage();
        if (response.splash_image) {
          setCustomImage(response.splash_image);
        }
      } catch (error) {
        console.error('Failed to load splash image:', error);
      }
    };

    loadSplashImage();
  }, []);

  if (customImage) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black overflow-hidden animate-fade-in">
        <img 
          src={customImage} 
          alt="Splash Screen" 
          className="w-full h-full object-cover animate-[zoomIn_3s_ease-out_forwards]" 
        />
        {/* 内联动画：Ken Burns 效果微缩放 */}
        <style>{`
          @keyframes zoomIn {
             from { transform: scale(1.05); }
             to { transform: scale(1); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#F38020] overflow-hidden">
      
      {/* 1. 背景动态光影 */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#FF9800] via-[#F38020] to-[#E65100]"></div>
      <div className="absolute top-[-20%] left-[-20%] w-[80vw] h-[80vw] bg-white opacity-10 rounded-full blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-black opacity-5 rounded-full blur-[120px]"></div>
      
      {/* 2. Logo 核心区域 - 复刻 eastcapital 东元法物 */}
      <div className="relative mb-8 animate-fade-in-up flex flex-col items-center justify-center transform scale-125">
        
        {/* CSS 构造的 Logo */}
        <div className="relative">
          {/* Logo 英文部分 */}
          <h1 className="text-6xl font-sans font-bold text-white tracking-tighter relative z-10" style={{ fontFamily: '"Helvetica Neue", Arial, sans-serif' }}>
            eastcapital
          </h1>
          
          {/* 弧形装饰 (Swoosh) */}
          <div className="absolute top-[-20%] left-[30%] w-[80%] h-[120%] z-0 pointer-events-none opacity-90">
             <svg viewBox="0 0 100 100" className="w-full h-full">
               <path 
                 d="M10,80 Q40,-20 90,20" 
                 fill="none" 
                 stroke="white" 
                 strokeWidth="2.5" 
                 strokeLinecap="round"
                 className="drop-shadow-sm"
               />
             </svg>
          </div>
        </div>

        {/* Logo 中文部分 */}
        <div className="mt-2 w-full flex justify-end">
          <h2 className="text-xl font-bold text-white tracking-[0.2em]">
            东元法物
          </h2>
        </div>

      </div>

      {/* 3. 底部加载条与版权 */}
      <div className="absolute bottom-12 w-full flex flex-col items-center space-y-4 animate-fade-in" style={{ animationDelay: '0.5s' }}>
        {/* 进度条 */}
        <div className="w-32 h-1 bg-black/10 rounded-full overflow-hidden">
          <div className="h-full bg-white w-full origin-left animate-[progress_2.5s_ease-in-out_forwards]"></div>
        </div>
        
        {/* 版权信息 */}
        <p className="text-[9px] text-white/40 font-mono tracking-widest uppercase">
          Powered by East Capital Legal OS
        </p>
      </div>

      {/* 内联动画样式 */}
      <style>{`
        @keyframes progress {
          0% { transform: scaleX(0); }
          100% { transform: scaleX(1); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
          opacity: 0;
          transform: translateY(20px);
        }
        @keyframes fadeInUp {
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;
