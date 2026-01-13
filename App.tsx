
import React, { useState, useEffect, useRef } from 'react';
import { ViewState, User, UserRole } from './types';
import { db } from './services/dbService';
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

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(() => {
      // Safe sync check for splash config
      try {
          const stored = localStorage.getItem('dy_system_config');
          if (stored) {
              const cfg = JSON.parse(stored);
              return cfg.enableSplashScreen !== false; // Default true
          }
      } catch(e) {}
      return true;
  });
  
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.HOME);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. 初始化数据库
    db.init();
    
    // 2. 检查会话持久化 (Auto Login)
    const sessionId = db.getSession();
    if (sessionId) {
      const savedUser = db.getUserById(sessionId);
      if (savedUser) {
        setUser(savedUser);
        if (savedUser.role === UserRole.ADMIN) {
          setCurrentView(ViewState.ADMIN_DASHBOARD);
        } else {
          setCurrentView(ViewState.HOME);
        }
      }
    }

    // 3. 设置开屏页显示时间 (2.5秒)
    if (showSplash) {
        const timer = setTimeout(() => {
          setShowSplash(false);
        }, 2500);
        return () => clearTimeout(timer);
    }
  }, [showSplash]);

  // 监听视图变化，自动回滚到顶部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [currentView]);

  const handleLogin = (loggedInUser: User, remember: boolean) => {
    setUser(loggedInUser);
    db.setSession(loggedInUser.id, remember); // 根据用户选择保存会话
    if (loggedInUser.role === UserRole.ADMIN) {
      setCurrentView(ViewState.ADMIN_DASHBOARD);
    } else {
      setCurrentView(ViewState.HOME);
    }
  };

  const handleLogout = () => {
    setUser(null);
    db.clearSession(); // 清除会话
    setCurrentView(ViewState.HOME);
  };

  // 1. 优先显示开屏页
  if (showSplash) {
    return <SplashScreen />;
  }

  // 2. 显示登录页 (如果没有用户且不在开屏)
  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  // 3. 显示管理员后台
  if (user.role === UserRole.ADMIN && currentView === ViewState.ADMIN_DASHBOARD) {
    return <AdminDashboard onLogout={handleLogout} />;
  }

  // 4. 显示主应用视图
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
      // LAW_EYE_CAMERA REMOVED
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
    <Layout currentView={currentView} setCurrentView={setCurrentView} scrollRef={scrollRef}>
      {renderView()}
    </Layout>
  );
};

export default App;
