
import React, { useState, useRef } from 'react';
import { Camera, Edit2, Check, X, LogOut, ShieldCheck, User as UserIcon } from 'lucide-react';
import { User } from '../types';
import { db } from '../services/dbService';

interface ProfileProps {
  user: User;
  setUser: (user: User) => void;
  onLogout: () => void;
}

const Profile: React.FC<ProfileProps> = ({ user, setUser, onLogout }) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(user.username);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpdateName = () => {
    if (!tempName.trim()) return;
    const updated = db.updateUser(user.id, { username: tempName });
    if (updated) {
      setUser(updated);
      setIsEditingName(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      const updated = db.updateUser(user.id, { avatarUrl: base64 });
      if (updated) {
        setUser(updated);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="p-6 pb-24 animate-fade-in">
      <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 flex flex-col items-center relative overflow-hidden">
        {/* Background Accent */}
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-orange-400 to-orange-500 opacity-10"></div>
        
        {/* Avatar Section */}
        <div className="relative mt-8 group">
          <div className="w-32 h-32 bg-orange-100 text-[#FF7F00] rounded-full flex items-center justify-center border-4 border-white shadow-lg overflow-hidden font-black text-4xl uppercase">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              user.username.charAt(0)
            )}
          </div>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-1 right-1 bg-white p-2 rounded-full shadow-md text-orange-500 hover:scale-110 transition-transform border border-gray-100"
          >
            <Camera size={18} />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleAvatarChange} 
            className="hidden" 
            accept="image/*"
          />
        </div>

        {/* User Info Section */}
        <div className="mt-6 flex flex-col items-center w-full">
          {isEditingName ? (
            <div className="flex items-center gap-2 w-full max-w-xs">
              <input 
                type="text" 
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                className="flex-1 bg-gray-50 border border-orange-300 rounded-xl px-4 py-2 text-center font-bold text-gray-800 outline-none"
                autoFocus
              />
              <button onClick={handleUpdateName} className="p-2 bg-green-500 text-white rounded-full"><Check size={18} /></button>
              <button onClick={() => { setIsEditingName(false); setTempName(user.username); }} className="p-2 bg-gray-200 text-gray-500 rounded-full"><X size={18} /></button>
            </div>
          ) : (
            <div className="flex items-center gap-2 group">
              <h2 className="text-2xl font-black text-gray-800 tracking-tight">{user.username}</h2>
              <button onClick={() => setIsEditingName(true)} className="text-gray-300 group-hover:text-orange-400 transition-colors">
                <Edit2 size={16} />
              </button>
            </div>
          )}
          
          <div className="mt-2 flex items-center gap-2 px-4 py-1.5 bg-orange-50 rounded-full">
            <ShieldCheck size={14} className="text-orange-500" />
            <span className="text-xs font-bold text-orange-600 uppercase tracking-widest">
              {user.enterpriseName || '个人账户'}
            </span>
          </div>

          <div className={`mt-4 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${user.isCertified ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
            {user.isCertified ? '已通过企业实名认证' : '待完善企业资质'}
          </div>
        </div>

        {/* Detailed Stats / Menu */}
        <div className="w-full mt-10 space-y-3">
          <div className="flex justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
             <div className="flex flex-col">
               <span className="text-[10px] text-gray-400 font-bold uppercase">账户角色</span>
               <span className="text-sm font-bold text-gray-700">{user.role === 'ADMIN' ? '超级管理员' : '物业终端用户'}</span>
             </div>
             <div className="flex flex-col text-right">
               <span className="text-[10px] text-gray-400 font-bold uppercase">UID</span>
               <span className="text-xs font-mono text-gray-500">{user.id.slice(0, 8)}</span>
             </div>
          </div>
          
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-3 py-4 bg-white border border-red-100 text-red-500 rounded-2xl font-bold text-sm hover:bg-red-50 transition-colors active:scale-[0.98]"
          >
            <LogOut size={18} /> 退出当前登录
          </button>
        </div>
      </div>
      
      <p className="text-center text-[10px] text-gray-400 mt-8 font-medium uppercase tracking-[0.2em]">
        Dongyuan Property Legal Link v3.1.0
      </p>
    </div>
  );
};

export default Profile;
