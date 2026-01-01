
import React, { useState, useEffect } from 'react';
import { User, Lock, ArrowRight, CheckCircle2, Circle, X, FileText, ChevronRight, Smartphone, KeyRound, Building, UserPlus, Check } from 'lucide-react';
import { api } from '../services/apiService';
import { User as UserType, UserRole, ApprovalStatus } from '../types';

interface LoginProps {
  onLogin: (user: UserType, remember: boolean) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [loginMethod, setLoginMethod] = useState<'password' | 'phone'>('password');
  const [enablePhoneLogin, setEnablePhoneLogin] = useState(true);
  const [rememberMe, setRememberMe] = useState(true); // 默认为 true，提升体验

  // 获取token的辅助函数
  const getToken = () => {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  };

  // 密码登录状态
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // 手机登录状态
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [countdown, setCountdown] = useState(0);

  const [error, setError] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [isFocused, setIsFocused] = useState<'user' | 'pass' | 'phone' | 'code' | null>(null);
  
  // 协议弹窗状态
  const [showAgreement, setShowAgreement] = useState(false);
  const [agreementText, setAgreementText] = useState('');

  // 注册模态框
  const [showRegister, setShowRegister] = useState(false);
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEnterprise, setRegEnterprise] = useState('');
  const [enterprises, setEnterprises] = useState<string[]>([]);
  const [regError, setRegError] = useState('');

  useEffect(() => {
    // 获取系统配置
    const loadInitialData = async () => {
      try {
        const config = await api.getConfig();
        setEnablePhoneLogin(config.enablePhoneLogin);

        const enterprises = await api.getEnterprises();
        setEnterprises(enterprises);

        // 设置默认协议文本
        setAgreementText(`【东元法务通 · 用户服务协议及免责声明】

版本日期：2025年3月1日

一、服务内容
本平台（以下简称"本系统"）由东元法务中心开发，旨在为物业管理人员提供数字化的法律辅助工具，包括但不限于法律法规查询、文书模版生成、合规风险自查及 AI 智能问答服务。

二、用户账号安全
1. 用户应当妥善保管账号及密码，不得将账号出借、转让或与他人共享。
2. 因用户个人原因导致的账号泄露或企业数据丢失，本系统不承担责任。
3. 请务必对上传至"我的企业"中的内部数据（如欠费清单、业主隐私信息）进行脱敏处理。

三、特别免责声明（重要风险提示）
1. AI 辅助建议属性：
   本系统中的"AI 法务助手"、"AI 文书定制"及"纠纷快诊"功能，均基于人工智能大模型技术生成。AI 回复内容仅供参考，不代表东元律师事务所或任何执业律师的正式法律意见。

2. 非正式法律咨询：
   本系统提供的建议不能替代专业律师的线下咨询。对于涉及重大经济利益（如金额超过 5 万元的诉讼）、人身伤害、刑事责任或复杂产权纠纷的案件，请务必使用系统内的"一键咨询"功能联系人工律师，或寻求线下专业法律服务。

3. 结果使用责任：
   用户基于本系统生成的文书（如律师函、公告）、计算结果（如滞纳金）或建议采取的行动，均由用户自行承担最终法律后果。本系统不对因使用 AI 建议而产生的任何直接或间接损失承担赔偿责任。

四、知识产权
本系统内的所有源代码、界面设计、独家文书模版及法律知识库内容的知识产权归东元法物所有，未经授权不得进行反向工程或商业售卖。

五、协议生效
当您勾选"我已阅读并同意"或点击"授权登录"按钮时，即视为您已完全理解并接受本协议的全部条款。`);
      } catch (error) {
        console.error('Failed to load initial data:', error);
        // 设置默认值
        setEnablePhoneLogin(true);
        setEnterprises(['东元示范物业']);
      }
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const checkApprovalStatus = (user: UserType): boolean => {
    if (user.role === UserRole.ADMIN) return true;

    const status = user.approval_status || 'APPROVED';
    if (status === 'PENDING') {
      setError('账号正在审核中，请联系管理员审批');
      return false;
    }
    if (status === 'REJECTED') {
      setError('您的账号注册申请已被拒绝');
      return false;
    }
    return true;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      setError('请先阅读并同意服务协议');
      return;
    }

    try {
      let response;

      if (loginMethod === 'password') {
        response = await api.login(username.trim(), password.trim());
      } else {
        if (verifyCode !== '8888') {
          setError('验证码错误');
          return;
        }
        // 手机号登录使用特殊标识
        response = await api.login(phoneNumber.trim(), 'phone-login');
      }

      if (response.access_token) {
        // 存储token
        if (rememberMe) {
          localStorage.setItem('token', response.access_token);
        } else {
          sessionStorage.setItem('token', response.access_token);
        }
        onLogin(response.user, rememberMe);
      } else {
        setError(response.detail || '登录失败，请重试');
      }
    } catch (error) {
      setError('登录失败，请重试');
    }
  };

  const handleOneClickLogin = async () => {
    if (!agreed) {
        setError('请先阅读并同意服务协议');
        return;
    }

    try {
      const token = getToken();
      if (!token) {
        setError('请先登录');
        return;
      }

      // 使用API获取用户列表
      const users = await api.getUsers(token);
      let demoUser = users.find(u => u.phone_number === '13900000000');

      if (!demoUser) {
        demoUser = users.find(u => u.approval_status === 'APPROVED');
      }

      if (demoUser && checkApprovalStatus(demoUser)) {
        onLogin(demoUser, rememberMe);
      } else {
        setError('一键登录失败，请使用账号密码登录');
      }
    } catch (error) {
      setError('一键登录失败，请使用账号密码登录');
    }
  };

  const sendCode = async () => {
    if (!phoneNumber || phoneNumber.length !== 11) {
      setError('请输入有效的11位手机号');
      return;
    }
    try {
      await api.sendSms(phoneNumber.trim());
      setError('');
      setCountdown(60);
      alert('验证码已发送，请使用8888进行验证');
    } catch (error) {
      setError('发送验证码失败，请重试');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regUsername || !regPassword || !regPhone || !regEnterprise) {
      setRegError('请填写完整信息');
      return;
    }

    try {
      const response = await api.register({
        username: regUsername.trim(),
        password: regPassword.trim(),
        phone_number: regPhone.trim(),
        enterprise_name: regEnterprise
      });

      if (response.message) {
        alert('注册申请已提交！请等待管理员审核。');
        setShowRegister(false);
        setRegUsername('');
        setRegPassword('');
        setRegPhone('');
        setRegEnterprise('');
        setRegError('');
      } else {
        setRegError(response.detail || '注册失败');
      }
    } catch (err: any) {
      setRegError('注册失败，请重试');
    }
  };

  const openAgreement = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowAgreement(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#F38020]">
      
      {/* 1. 电影级动态光影背景 */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#FF9800] via-[#F38020] to-[#E65100]"></div>
        <div className="absolute top-[-30%] left-[-10%] w-[120%] h-[80%] bg-white opacity-10 blur-[120px] rounded-full animate-float"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[100%] h-[80%] bg-[#BF360C] opacity-30 blur-[100px] rounded-full"></div>
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay"
             style={{backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`}}>
        </div>
      </div>

      {/* 2. 主体内容区 */}
      <div className="relative z-10 w-full max-w-[340px] px-4 flex flex-col items-center">
        
        {/* Logo 区域 */}
        <div className="mb-8 flex flex-col items-center transform scale-105 animate-fade-in-up">
           <div className="relative">
              <h1 className="text-5xl font-sans font-bold text-white tracking-tighter relative z-10 drop-shadow-md" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
                eastcapital
              </h1>
              <div className="absolute top-[-15%] left-[28%] w-[80%] h-[120%] z-0 pointer-events-none opacity-90">
                 <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
                   <path 
                     d="M10,80 Q40,-20 90,20" 
                     fill="none" 
                     stroke="white" 
                     strokeWidth="3" 
                     strokeLinecap="round"
                     className="drop-shadow-sm"
                   />
                 </svg>
              </div>
           </div>
           <div className="mt-2 w-full flex justify-end px-1">
              <h2 className="text-lg font-bold text-white/90 tracking-[0.2em] drop-shadow-sm">
                东元法物
              </h2>
           </div>
        </div>

        {/* 登录框体 */}
        <div className="w-full animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          
          {/* Tab 切换 */}
          {enablePhoneLogin && (
            <div className="flex mb-6 bg-white/20 p-1 rounded-2xl">
              <button 
                onClick={() => { setLoginMethod('password'); setError(''); }}
                className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${loginMethod === 'password' ? 'bg-white text-orange-600 shadow-sm' : 'text-white/60 hover:text-white'}`}
              >
                密码登录
              </button>
              <button 
                onClick={() => { setLoginMethod('phone'); setError(''); }}
                className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${loginMethod === 'phone' ? 'bg-white text-orange-600 shadow-sm' : 'text-white/60 hover:text-white'}`}
              >
                手机登录
              </button>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            
            {loginMethod === 'password' ? (
              <>
                <div className={`group relative transition-all duration-300 ${isFocused === 'user' ? 'scale-[1.02]' : ''}`}>
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70">
                    <User size={18} />
                  </div>
                  <input 
                    type="text" 
                    value={username}
                    onFocus={() => setIsFocused('user')}
                    onBlur={() => setIsFocused(null)}
                    onChange={(e) => { setUsername(e.target.value); setError(''); }}
                    className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl py-4 pl-11 pr-4 text-sm font-bold text-white placeholder-white/50 outline-none focus:bg-white/20 focus:border-white/40 shadow-inner transition-all"
                    placeholder="账号"
                    required={loginMethod === 'password'}
                  />
                </div>
                <div className={`group relative transition-all duration-300 ${isFocused === 'pass' ? 'scale-[1.02]' : ''}`}>
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70">
                    <Lock size={18} />
                  </div>
                  <input 
                    type="password" 
                    value={password}
                    onFocus={() => setIsFocused('pass')}
                    onBlur={() => setIsFocused(null)}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl py-4 pl-11 pr-4 text-sm font-bold text-white placeholder-white/50 outline-none focus:bg-white/20 focus:border-white/40 shadow-inner transition-all"
                    placeholder="密码"
                    required={loginMethod === 'password'}
                  />
                </div>
              </>
            ) : (
              <>
                <div className={`group relative transition-all duration-300 ${isFocused === 'phone' ? 'scale-[1.02]' : ''}`}>
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70">
                    <Smartphone size={18} />
                  </div>
                  <input 
                    type="text" 
                    value={phoneNumber}
                    onFocus={() => setIsFocused('phone')}
                    onBlur={() => setIsFocused(null)}
                    onChange={(e) => { setPhoneNumber(e.target.value); setError(''); }}
                    className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl py-4 pl-11 pr-4 text-sm font-bold text-white placeholder-white/50 outline-none focus:bg-white/20 focus:border-white/40 shadow-inner transition-all"
                    placeholder="手机号码"
                    required={loginMethod === 'phone'}
                  />
                </div>
                <div className="flex gap-2">
                  <div className={`group relative transition-all duration-300 flex-1 ${isFocused === 'code' ? 'scale-[1.02]' : ''}`}>
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70">
                      <KeyRound size={18} />
                    </div>
                    <input 
                      type="text" 
                      value={verifyCode}
                      onFocus={() => setIsFocused('code')}
                      onBlur={() => setIsFocused(null)}
                      onChange={(e) => { setVerifyCode(e.target.value); setError(''); }}
                      className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl py-4 pl-11 pr-4 text-sm font-bold text-white placeholder-white/50 outline-none focus:bg-white/20 focus:border-white/40 shadow-inner transition-all"
                      placeholder="验证码"
                      required={loginMethod === 'phone'}
                    />
                  </div>
                  <button 
                    type="button" 
                    onClick={sendCode}
                    disabled={countdown > 0}
                    className="bg-white/20 backdrop-blur-md text-white border border-white/20 rounded-2xl px-4 text-xs font-bold whitespace-nowrap active:scale-95 transition-all disabled:opacity-50"
                  >
                    {countdown > 0 ? `${countdown}s` : '发送'}
                  </button>
                </div>
              </>
            )}

            {/* 错误提示 */}
            {error && (
              <div className="bg-red-500/20 backdrop-blur-md border border-red-200/30 text-white text-[10px] font-bold p-3 rounded-xl text-center animate-pulse flex items-center justify-center gap-2">
                <span className="w-1.5 h-1.5 bg-red-400 rounded-full"></span> {error}
              </div>
            )}
            
            {/* 自动登录 (Remember Me) 选项 - 新增功能 */}
            <div className="flex justify-between items-center px-2 mt-1">
               <div 
                 onClick={() => setRememberMe(!rememberMe)}
                 className="flex items-center gap-2 cursor-pointer opacity-80 hover:opacity-100 transition-opacity"
               >
                 <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all ${rememberMe ? 'bg-white border-white' : 'border-white/60 bg-transparent'}`}>
                    {rememberMe && <Check size={10} className="text-orange-500" strokeWidth={4} />}
                 </div>
                 <span className="text-[11px] font-bold text-white/90">自动登录</span>
               </div>
               <button type="button" className="text-[11px] font-bold text-white/60 hover:text-white transition-colors">忘记密码?</button>
            </div>

            {/* 登录按钮 */}
            <button 
              type="submit"
              disabled={!agreed}
              className={`w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-xl mt-2 ${
                agreed 
                ? 'bg-white text-[#F38020] hover:bg-white hover:scale-[1.02] active:scale-95 shadow-orange-900/20' 
                : 'bg-white/20 text-white/40 cursor-not-allowed border border-white/10'
              }`}
            >
              {loginMethod === 'password' ? '登 录' : '验证并登录'} <ArrowRight size={16} strokeWidth={3} />
            </button>

            {/* 一键登录按钮 (Only in phone mode) */}
            {loginMethod === 'phone' && (
                <button 
                  type="button"
                  onClick={handleOneClickLogin}
                  className={`w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all mt-3 border cursor-pointer active:scale-95 ${
                    agreed 
                    ? 'bg-white/10 text-white border-white/30 hover:bg-white/20' 
                    : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <Smartphone size={16} className={agreed ? "text-yellow-300" : "text-white/40"} /> 本机号码一键登录
                </button>
            )}

            {/* 注册链接 */}
            <div className="flex justify-center mt-4">
              <button 
                type="button" 
                onClick={() => setShowRegister(true)}
                className="text-white/70 text-xs font-bold hover:text-white transition-colors flex items-center gap-1"
              >
                没有账号？<span className="underline decoration-2 underline-offset-4">一键注册</span>
              </button>
            </div>

            {/* 协议勾选 */}
            <div 
              className="flex items-center justify-center gap-2 cursor-pointer group pt-2 select-none" 
              onClick={() => setAgreed(!agreed)}
            >
              <div className={`transition-all duration-300 ${agreed ? 'text-white scale-110' : 'text-white/40'}`}>
                {agreed ? <CheckCircle2 size={16} className="fill-white/20" /> : <Circle size={16} />}
              </div>
              <div className="text-[10px] text-white/60 font-medium">
                我已阅读并同意 
                <span 
                  className="text-white font-bold ml-1 hover:underline underline-offset-2 transition-all"
                  onClick={openAgreement}
                >
                  《用户服务协议》
                </span>
              </div>
            </div>

          </form>
        </div>
        
        <div className="absolute -bottom-20 w-full text-center opacity-40">
            <p className="text-[8px] text-white font-mono tracking-widest uppercase">Dongyuan Legal System v4.1</p>
        </div>
      </div>

      {/* 协议弹窗 */}
      {showAgreement && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white/90 backdrop-blur-xl w-full max-w-md max-h-[80vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-fade-in-up">
            <div className="bg-slate-50 p-5 flex justify-between items-center shrink-0 border-b border-gray-100">
              <div className="flex items-center gap-2 text-slate-800">
                 <FileText size={18} className="text-[#F38020]" />
                 <span className="font-black text-sm tracking-wide">服务协议与风险告知</span>
              </div>
              <button onClick={() => setShowAgreement(false)} className="p-2 bg-gray-100 rounded-full text-gray-400 hover:bg-gray-200 transition-colors"><X size={16} /></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 no-scrollbar bg-white">
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-xs text-slate-600 leading-loose">
                  {agreementText || '加载协议内容中...'}
                </pre>
              </div>
            </div>
            <div className="p-5 border-t border-gray-100 bg-slate-50 shrink-0">
              <button 
                onClick={() => { setShowAgreement(false); setAgreed(true); }}
                className="w-full bg-[#F38020] text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-orange-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                我已完全理解并同意 <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 注册弹窗 */}
      {showRegister && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden animate-fade-in-up p-8">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                   <UserPlus className="text-orange-500" /> 注册新账号
                </h3>
                <button onClick={() => setShowRegister(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
             </div>

             <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-1">
                   <label className="text-xs font-bold text-slate-500 ml-1">用户名/工号</label>
                   <input value={regUsername} onChange={e => setRegUsername(e.target.value)} className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-orange-500 outline-none" required />
                </div>
                <div className="space-y-1">
                   <label className="text-xs font-bold text-slate-500 ml-1">密码</label>
                   <input type="password" value={regPassword} onChange={e => setRegPassword(e.target.value)} className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-orange-500 outline-none" required />
                </div>
                <div className="space-y-1">
                   <label className="text-xs font-bold text-slate-500 ml-1">手机号码</label>
                   <input value={regPhone} onChange={e => setRegPhone(e.target.value)} className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-orange-500 outline-none" placeholder="用于身份验证" required />
                </div>
                <div className="space-y-1">
                   <label className="text-xs font-bold text-slate-500 ml-1">所属物业公司</label>
                   <select 
                     value={regEnterprise} 
                     onChange={e => setRegEnterprise(e.target.value)} 
                     className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-orange-500 outline-none"
                     required
                   >
                      <option value="">-- 请选择您的所属公司 --</option>
                      {enterprises.map(e => <option key={e} value={e}>{e}</option>)}
                   </select>
                </div>

                {regError && <p className="text-xs text-red-500 font-bold text-center bg-red-50 p-2 rounded-lg">{regError}</p>}

                <button type="submit" className="w-full bg-orange-500 text-white py-4 rounded-xl font-black text-sm shadow-xl shadow-orange-500/20 active:scale-95 transition-all mt-4">
                  提交注册申请
                </button>
                <p className="text-[10px] text-slate-400 text-center leading-relaxed">
                  提交后需等待管理员在后台审核通过方可登录。<br/>审批结果将通过短信通知（模拟）。
                </p>
             </form>
          </div>
        </div>
      )}

      {/* 内联动画 */}
      <style>{`
        .animate-fade-in-up {
          animation: fadeInUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
          opacity: 0;
          transform: translateY(20px);
        }
        @keyframes fadeInUp {
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default Login;
