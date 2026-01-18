
import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, User, Lock } from 'lucide-react';
import { UserRole } from '../types';

const LawyerVideo: React.FC = () => {
  const [status, setStatus] = useState('connecting'); // connecting, connected, ended

  useEffect(() => {
    // Permission check is now done in Home.tsx before navigation
    // We just simulate the connection flow here.
    const t1 = setTimeout(() => setStatus('connected'), 2500);
    return () => clearTimeout(t1);
  }, []);

  if (status === 'ended') {
      return (
          <div className="h-full flex items-center justify-center bg-slate-900 text-white flex-col gap-4">
              <h2 className="text-xl font-bold">通话已结束</h2>
              <button onClick={() => window.location.reload()} className="px-6 py-2 bg-slate-700 rounded-full text-sm">返回</button>
          </div>
      )
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 text-white flex flex-col">
        {/* Remote Video (Mock) */}
        <div className="flex-1 relative bg-black overflow-hidden">
             {status === 'connecting' ? (
                 <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
                     <div className="w-24 h-24 rounded-full bg-slate-800 animate-pulse flex items-center justify-center">
                        <User size={40} className="text-slate-500"/>
                     </div>
                     <p className="text-sm font-bold tracking-widest animate-pulse">呼叫东元值班律师...</p>
                 </div>
             ) : (
                 <>
                    <img src="https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&q=80&w=800" className="w-full h-full object-cover opacity-80" alt="Lawyer" />
                    <div className="absolute top-6 left-6 bg-black/40 backdrop-blur px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                        东元法律顾问 · 王律师
                    </div>
                 </>
             )}

             {/* Local Video (PiP) */}
             <div className="absolute top-6 right-6 w-24 h-32 bg-slate-800 rounded-xl border border-white/20 shadow-xl overflow-hidden">
                 <div className="w-full h-full bg-black flex items-center justify-center text-[10px] text-slate-500">本地预览</div>
             </div>
        </div>

        {/* Controls */}
        <div className="h-32 bg-slate-900 flex items-center justify-center gap-8 pb-8">
            <button className="p-4 bg-slate-800 rounded-full text-white hover:bg-slate-700"><MicOff size={24}/></button>
            <button className="p-4 bg-slate-800 rounded-full text-white hover:bg-slate-700"><Video size={24}/></button>
            <button onClick={() => setStatus('ended')} className="p-6 bg-red-500 rounded-full text-white shadow-lg shadow-red-500/40 hover:scale-105 transition-transform"><PhoneOff size={32}/></button>
        </div>
    </div>
  );
};

export default LawyerVideo;
