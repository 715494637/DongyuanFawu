
import React, { useState, useEffect, useRef } from 'react';
import { ViewState, User, UserRole } from './types';
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

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true); // 控制开屏页状态
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.HOME);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. 检查会话持久化 (Auto Login)
    const sessionId = localStorage.getItem('dy_session_user') || sessionStorage.getItem('dy_session_user');
    if (sessionId) {
      // 从localStorage获取保存的用户信息
      const savedUserStr = localStorage.getItem('dy_saved_user');
      if (savedUserStr) {
        try {
          const savedUser = JSON.parse(savedUserStr);
          if (savedUser.id === sessionId) {
            setUser(savedUser);
            if (savedUser.role === UserRole.ADMIN) {
              setCurrentView(ViewState.ADMIN_DASHBOARD);
            } else {
              setCurrentView(ViewState.HOME);
            }
          }
        } catch (error) {
          console.error('Failed to parse saved user:', error);
        }
      }
    }

    // 2. 设置开屏页显示时间 (2.5秒)
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  // 监听视图变化，自动回滚到顶部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [currentView]);

  const handleLogin = (loggedInUser: User, remember: boolean) => {
    setUser(loggedInUser);

    // 保存会话信息
    if (remember) {
      localStorage.setItem('dy_session_user', loggedInUser.id);
      localStorage.setItem('dy_saved_user', JSON.stringify(loggedInUser));
      sessionStorage.removeItem('dy_session_user');
    } else {
      sessionStorage.setItem('dy_session_user', loggedInUser.id);
      sessionStorage.setItem('dy_saved_user', JSON.stringify(loggedInUser));
      localStorage.removeItem('dy_session_user');
    }

    if (loggedInUser.role === UserRole.ADMIN) {
      setCurrentView(ViewState.ADMIN_DASHBOARD);
    } else {
      setCurrentView(ViewState.HOME);
    }
  };

  const handleLogout = () => {
    setUser(null);
    // 清除会话
    localStorage.removeItem('dy_session_user');
    localStorage.removeItem('dy_saved_user');
    sessionStorage.removeItem('dy_session_user');
    sessionStorage.removeItem('dy_saved_user');
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
