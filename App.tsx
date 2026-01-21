import React, { useState, useEffect, useRef } from 'react';
import { ViewState, User, UserRole } from './types';
import { api, cachedApi } from './services/apiService';
import Layout from './components/Layout';
import Home from './views/Home';
import Calculator from './views/Calculator';
import Diagnosis from './views/Diagnosis';
import Documents from './views/Documents';
import RiskCheck from './views/RiskCheck';
import AIChat from './views/AIChat';
import Login from './views/Login';
import AdminDashboard from './views/AdminDashboard';
import Profile from './views/Profile';
import Toolbox from './views/Toolbox';
import PosterGenerator from './views/PosterGenerator';
import EvidenceList from './views/EvidenceList';
import CivilCodeSearch from './views/CivilCodeSearch';
import NoticeGenerator from './views/NoticeGenerator';
import AIDocGen from './views/AIDocGen';
import SplashScreen from './components/SplashScreen';
import CollectionHelper from './views/CollectionHelper';
import RenovationCheck from './views/RenovationCheck';
import ScriptKit from './views/ScriptKit';
import EmergencySOP from './views/EmergencySOP';
import LawyerVideo from './views/LawyerVideo';
import RightsCenter from './views/RightsCenter';
import LegalHealthCheck from './views/LegalHealthCheck';
import { PreloadProvider, preloadLoginData } from './views/PreloadContext';
import { PreloadData } from './views/PreloadContext';
import { CacheProvider } from './services/DataCacheContext';

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(() => {
      try {
          const stored = localStorage.getItem('dy_system_config');
          if (stored) {
              const cfg = JSON.parse(stored);
              return cfg.enable_splash_screen !== false;
          }
      } catch(e) {}
      return true;
  });

  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.HOME);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 预加载登录数据（在开屏期间并行请求）
  const [preloadedData, setPreloadedData] = useState<PreloadData | null>(null);

  useEffect(() => {
    const startPreload = async () => {
      try {
        const data = await preloadLoginData();
        setPreloadedData(data);
      } catch (err) {
        console.error('预加载登录数据失败:', err);
      }
    };
    startPreload();
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (token) {
        try {
          // 强制刷新用户数据（绕过缓存）以获取最新的 quota 信息
          const userData = await cachedApi.getCurrentUserWithoutCache(token);
          const savedUser: User = {
            id: userData.id,
            username: userData.username,
            phoneNumber: userData.phone_number,
            role: (userData.role as string)?.toUpperCase() as UserRole,
            enterpriseName: userData.enterprise_name,
            isCertified: userData.is_certified,
            approvalStatus: userData.approval_status,
            quota: userData.quota || { lawyerLetters: 0, consultations: 0 },
            selectedProjects: userData.selected_projects || []
          };
          setUser(savedUser);
          if (savedUser.role === UserRole.ADMIN) {
            setCurrentView(ViewState.ADMIN_DASHBOARD);
          } else {
            setCurrentView(ViewState.HOME);
          }
        } catch (err) {
          console.error('获取当前用户失败:', err);
          // Token 无效，清除存储
          localStorage.removeItem('token');
          sessionStorage.removeItem('token');
        }
      }
    };
    checkSession();
  }, []);

  // 监听管理员修改额度后的跨标签页刷新事件
  useEffect(() => {
    let isMounted = true;

    const handleQuotaUpdated = async () => {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token || !isMounted) return;
      try {
        // 绕过缓存获取最新用户数据
        const userData = await cachedApi.getCurrentUserWithoutCache(token);
        if (!isMounted) return;
        const updatedUser: User = {
          id: userData.id,
          username: userData.username,
          phoneNumber: userData.phone_number,
          role: (userData.role as string)?.toUpperCase() as UserRole,
          enterpriseName: userData.enterprise_name,
          isCertified: userData.is_certified,
          approvalStatus: userData.approval_status,
          quota: userData.quota || { lawyerLetters: 0, consultations: 0 },
          selectedProjects: userData.selected_projects || []
        };
        setUser(updatedUser);
      } catch (err) {
        console.error('刷新用户额度失败:', err);
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'quota-updated') {
        handleQuotaUpdated();
      }
    };

    window.addEventListener('quota-updated', handleQuotaUpdated);
    window.addEventListener('storage', handleStorage);

    return () => {
      isMounted = false;
      window.removeEventListener('quota-updated', handleQuotaUpdated);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // 根据预加载的配置更新开屏状态
  useEffect(() => {
    if (preloadedData?.enableSplashScreen !== undefined) {
      const shouldShowSplash = preloadedData.enableSplashScreen !== false;
      setShowSplash(shouldShowSplash);
    }
  }, [preloadedData]);

  useEffect(() => {
    if (showSplash) {
        const timer = setTimeout(() => {
          setShowSplash(false);
        }, 2500);
        return () => clearTimeout(timer);
    }
  }, [showSplash]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [currentView]);

  const handleLogin = (loggedInUser: User, remember: boolean) => {
    // 确保 role 类型正确（后端可能返回小写的 'admin'）
    const normalizedUser: User = {
      ...loggedInUser,
      role: (loggedInUser.role as string)?.toUpperCase() as UserRole
    };
    setUser(normalizedUser);
    // 保存用户到 localStorage（用于跨页面共享用户状态）
    try {
      const storedUsers = localStorage.getItem('dy_users');
      const users = storedUsers ? JSON.parse(storedUsers) : [];
      const existingIndex = users.findIndex((u: User) => u.id === normalizedUser.id);
      if (existingIndex >= 0) {
        users[existingIndex] = normalizedUser;
      } else {
        users.push(normalizedUser);
      }
      localStorage.setItem('dy_users', JSON.stringify(users));
      // 保存会话 ID
      if (remember) {
        localStorage.setItem('dy_session_user', normalizedUser.id);
      } else {
        sessionStorage.setItem('dy_session_user', normalizedUser.id);
      }
    } catch (e) {
      console.error('保存用户数据失败:', e);
    }
    if (normalizedUser.role === UserRole.ADMIN) {
      setCurrentView(ViewState.ADMIN_DASHBOARD);
    } else {
      setCurrentView(ViewState.HOME);
    }
  };

  const handleLogout = () => {
    setUser(null);
    // 清除 token
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    // 清除会话用户
    localStorage.removeItem('dy_session_user');
    sessionStorage.removeItem('dy_session_user');
    // 清除本地缓存数据
    localStorage.removeItem('dy_cached_user');
    localStorage.removeItem('dy_cached_stats');
    localStorage.removeItem('dy_cached_vip_levels');
    localStorage.removeItem('dy_cache_timestamp');
    // 清除报告上下文
    localStorage.removeItem('dy_report_context');
    setCurrentView(ViewState.HOME);
  };

  if (showSplash) {
    return <SplashScreen customImage={preloadedData?.splashImage ?? undefined} />;
  }

  if (!user) {
    return (
      <PreloadProvider initialData={preloadedData}>
        <Login onLogin={handleLogin} />
      </PreloadProvider>
    );
  }

  // 管理员始终显示后台管理页面
  if (user.role === UserRole.ADMIN) {
    return <AdminDashboard onLogout={handleLogout} />;
  }

  const renderView = () => {
    switch (currentView) {
      case ViewState.HOME:
        return <Home setCurrentView={setCurrentView} />;
      case ViewState.CALCULATOR:
        return <Calculator />;
      case ViewState.DIAGNOSIS:
        return <Diagnosis setCurrentView={setCurrentView} />;
      case ViewState.DOCUMENTS:
        return <Documents />;
      case ViewState.RISK_CHECK:
        return <RiskCheck />;
      case ViewState.AI_CHAT:
        return <AIChat onClose={() => setCurrentView(ViewState.HOME)} />;
      case ViewState.TOOLBOX:
        return <Toolbox setCurrentView={setCurrentView} />;
      case ViewState.POSTER_GENERATOR:
        return <PosterGenerator onBack={() => setCurrentView(ViewState.TOOLBOX)} />;
      case ViewState.EVIDENCE_LIST:
        return <EvidenceList />;
      case ViewState.CIVIL_CODE:
        return <CivilCodeSearch />;
      case ViewState.NOTICE_GENERATOR:
        return <NoticeGenerator />;
      case ViewState.AI_DOC_GEN:
        return <AIDocGen />;
      case ViewState.MY_ENTERPRISE:
        return (
          <Profile
            user={user}
            setUser={setUser}
            onLogout={handleLogout}
          />
        );
      case ViewState.COLLECTION_CRM:
        return <CollectionHelper />;
      case ViewState.RENOVATION_CHECK:
        return <RenovationCheck />;
      case ViewState.SCRIPT_KIT:
        return <ScriptKit />;
      case ViewState.EMERGENCY_SOP:
        return <EmergencySOP />;
      case ViewState.LAWYER_VIDEO:
        return <LawyerVideo />;
      case ViewState.RIGHTS_CENTER:
        return <RightsCenter setCurrentView={setCurrentView} />;
      case ViewState.LEGAL_HEALTH_CHECK:
        return <LegalHealthCheck setCurrentView={setCurrentView} />;
      default:
        return <Home setCurrentView={setCurrentView} />;
    }
  };

  return (
    <CacheProvider>
      <PreloadProvider initialData={preloadedData}>
        <Layout currentView={currentView} setCurrentView={setCurrentView} scrollRef={scrollRef}>
          {renderView()}
        </Layout>
      </PreloadProvider>
    </CacheProvider>
  );
};

export default App;
