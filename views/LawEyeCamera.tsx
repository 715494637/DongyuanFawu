
import React, { useState, useRef, useEffect } from 'react';
import { Camera, MapPin, Clock, AlertTriangle, ArrowLeft, Save, RefreshCw } from 'lucide-react';

const LawEyeCamera: React.FC = () => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [location, setLocation] = useState('定位中...');
  const [time, setTime] = useState('');

  useEffect(() => {
    // 1. Simulating Location
    setTimeout(() => setLocation('东元示范小区 · 3号楼北侧公共区域'), 1000);
    
    // 2. Timer
    const t = setInterval(() => {
        const now = new Date();
        setTime(`${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2,'0')}-${now.getDate()} ${now.toTimeString().split(' ')[0]}`);
    }, 1000);

    // 3. Camera Access (Will fail in non-secure context, so we handle error)
    const startCamera = async () => {
        try {
            const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            setStream(s);
            if (videoRef.current) videoRef.current.srcObject = s;
        } catch (e) {
            console.error("Camera access failed:", e);
        }
    };
    startCamera();

    return () => {
        if (stream) stream.getTracks().forEach(track => track.stop());
        clearInterval(t);
    };
  }, []);

  const capture = () => {
    if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(video, 0, 0);
            
            // Draw Watermark
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(20, canvas.height - 180, canvas.width - 40, 160);
            
            ctx.fillStyle = 'white';
            ctx.font = 'bold 32px sans-serif';
            ctx.fillText(time, 40, canvas.height - 130);
            
            ctx.font = '28px sans-serif';
            ctx.fillText(location, 40, canvas.height - 90);
            
            ctx.fillStyle = '#FFA500'; // Orange
            ctx.font = '24px sans-serif';
            ctx.fillText('⚠️ 法律风险留痕 · 仅限内部取证使用', 40, canvas.height - 40);

            setImage(canvas.toDataURL('image/png'));
        }
    } else {
        // Fallback for demo if camera fails
        setImage('https://placehold.co/600x800/1e293b/FFF?text=Demo+Capture');
    }
  };

  const handleSave = () => {
    alert("证据照片已加密上传至云端存证库。\n元数据包含：时间戳、GPS坐标、设备指纹。");
    setImage(null);
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
        {!image ? (
            <>
                <div className="relative flex-1 bg-black overflow-hidden">
                    <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
                    {!stream && (
                        <div className="absolute inset-0 flex items-center justify-center text-white/50 text-xs">
                           (模拟相机预览 - 若无画面请检查权限或HTTPS)
                        </div>
                    )}
                    
                    {/* Watermark Overlay UI */}
                    <div className="absolute bottom-8 left-4 right-4 bg-black/40 backdrop-blur-md rounded-2xl p-4 border-l-4 border-orange-500">
                        <div className="text-white font-mono font-bold text-lg mb-1">{time || '00:00:00'}</div>
                        <div className="flex items-center gap-2 text-white/90 text-sm mb-2">
                            <MapPin size={14} className="text-orange-400"/> {location}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-orange-300 font-bold uppercase tracking-wider">
                            <AlertTriangle size={12}/> 法律合规取证模式
                        </div>
                    </div>

                    <button onClick={() => window.history.back()} className="absolute top-6 left-6 p-2 bg-black/20 backdrop-blur rounded-full text-white"><ArrowLeft/></button>
                </div>
                <div className="h-32 bg-black flex items-center justify-center">
                    <button onClick={capture} className="w-20 h-20 bg-white rounded-full border-4 border-gray-300 active:scale-95 transition-transform"></button>
                </div>
            </>
        ) : (
            <div className="flex-1 flex flex-col bg-slate-900">
                <img src={image} className="flex-1 object-contain bg-black" alt="Captured" />
                <div className="p-6 flex gap-4">
                    <button onClick={() => setImage(null)} className="flex-1 py-4 bg-slate-800 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2"><RefreshCw size={18}/> 重拍</button>
                    <button onClick={handleSave} className="flex-1 py-4 bg-orange-500 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20"><Save size={18}/> 上传存证</button>
                </div>
            </div>
        )}
        <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default LawEyeCamera;
