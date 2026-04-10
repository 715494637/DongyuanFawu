
import React, { useState, useRef, useEffect } from 'react';
import { Camera, Edit2, Check, X, LogOut, ShieldCheck, User as UserIcon, Crown } from 'lucide-react';
import { User, UserRole } from '../types';
import { api, cachedApi } from '../services/apiService';
import { CACHE_KEYS, useCache } from '../services/DataCacheContext';

interface ProfileProps {
  user: User;
  setUser: (user: User) => void;
  onLogout: () => void;
}

const Profile: React.FC<ProfileProps> = ({ user, setUser, onLogout }) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(user.username);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cache = useCache();

  // 同步 tempName 与 user.username
  useEffect(() => {
    setTempName(user.username);
  }, [user.username]);

  const getToken = () => localStorage.getItem('token') || sessionStorage.getItem('token') || '';

  const handleUpdateName = async () => {
    if (!tempName.trim()) return;
    try {
      const token = getToken();
      await api.updateUser(user.id, { username: tempName }, token);

      const updatedUser = { ...user, username: tempName };
      setUser(updatedUser);
      setIsEditingName(false);

      // 同步更新缓存
      cache.setCache(CACHE_KEYS.USER_INFO, {
        ...updatedUser,
        phone_number: user.phoneNumber,
        role: user.role,
        enterprise_name: user.enterpriseName,
        is_certified: user.isCertified,
        approval_status: user.approvalStatus,
        quota: user.quota,
        selected_projects: user.selectedProjects
      });

      // 通知其他组件用户已更新
      window.dispatchEvent(new CustomEvent('user-updated'));
    } catch (err) {
      console.error('更新用户名失败:', err);
      alert('更新失败: ' + (err as any).message);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      try {
        const token = getToken();
        await api.updateUser(user.id, { avatar_url: base64 }, token);

        const updatedUser = { ...user, avatarUrl: base64 };
        setUser(updatedUser);

        // 同步更新缓存
        cache.setCache(CACHE_KEYS.USER_INFO, {
          ...updatedUser,
          phone_number: user.phoneNumber,
          role: user.role,
          enterprise_name: user.enterpriseName,
          is_certified: user.isCertified,
          approval_status: user.approvalStatus,
          quota: user.quota,
          selected_projects: user.selectedProjects
        });

        // 通知其他组件用户已更新
        window.dispatchEvent(new CustomEvent('user-updated'));
      } catch (err) {
        console.error('更新头像失败:', err);
        alert('更新失败: ' + (err as any).message);
      }
    };
    reader.readAsDataURL(file);
  };

  const getRoleName = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN: return '超级管理员';
      case UserRole.EXECUTIVE: return '物业高管/老板';
      case UserRole.MANAGER: return '项目负责人';
      case UserRole.EMPLOYEE: return '普通员工';
      default: return '普通用户';
    }
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
               <span className="text-sm font-bold text-gray-700">{getRoleName(user.role)}</span>
             </div>
             <div className="flex flex-col text-right">
               <span className="text-[10px] text-gray-400 font-bold uppercase">UID</span>
               <span className="text-xs font-mono text-gray-500">{user.id.slice(0, 8)}</span>
             </div>
          </div>
          
          {(user.role === UserRole.EXECUTIVE || user.role === UserRole.MANAGER) && (
              <div className="flex items-center justify-between p-4 bg-orange-50 rounded-2xl border border-orange-100">
                  <span className="text-xs font-bold text-orange-600 flex items-center gap-2"><Crown size={14}/> 您的权益</span>
                  <div className="text-right">
                      <div className="text-[10px] text-orange-400">函: {user.quota?.lawyerLetters || 0} / 询: {user.quota?.consultations || 0}</div>
                  </div>
              </div>
          )}

          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-3 py-4 bg-white border border-red-100 text-red-500 rounded-2xl font-bold text-sm hover:bg-red-50 transition-colors active:scale-[0.98]"
          >
            <LogOut size={18} /> 退出当前登录
          </button>
        </div>
      </div>
      
      <p className="text-center text-[10px] text-gray-400 mt-8 font-medium uppercase tracking-[0.2em]">
        Dongyuan Property Legal Link v4.2.0
      </p>
    </div>
  );
};

export default Profile;
