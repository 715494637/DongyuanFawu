import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { api } from '../services/apiService';

interface PreloadData {
  agreement: string | null;
  enablePhoneLogin: boolean;
  enterprises: string[];
  splashImage: string | null;
  docs: any[];      // 文档列表
  laws: any[];      // 法条列表
  loaded: boolean;
  loading: boolean;
  error: string | null;
}

interface PreloadContextType {
  data: PreloadData;
  refresh: () => Promise<void>;
}

const PreloadContext = createContext<PreloadContextType | null>(null);

export const usePreload = () => {
  const context = useContext(PreloadContext);
  if (!context) {
    throw new Error('usePreload must be used within PreloadProvider');
  }
  return context;
};

// 独立的预加载函数，可在任何地方调用
export const preloadLoginData = async (): Promise<PreloadData> => {
  const result: PreloadData = {
    agreement: null,
    enablePhoneLogin: true,
    enterprises: [],
    splashImage: null,
    docs: [],
    laws: [],
    loaded: false,
    loading: true,
    error: null
  };

  try {
    // 并行请求所有登录页需要的数据（包括搜索用的文档和法条）
    const [agreementRes, configRes, enterprisesRes, splashRes, docsRes, lawsRes] = await Promise.allSettled([
      api.getAgreement(),
      api.getConfig(),
      api.getEnterprises(),
      api.getSplashImage(),
      api.getDocuments(),
      api.getCivilCode()
    ]);

    // 处理协议
    if (agreementRes.status === 'fulfilled') {
      result.agreement = agreementRes.value.agreement;
    }

    // 处理配置
    if (configRes.status === 'fulfilled') {
      result.enablePhoneLogin = configRes.value.enable_phone_login ?? true;
    }

    // 处理企业列表
    if (enterprisesRes.status === 'fulfilled') {
      result.enterprises = enterprisesRes.value;
    }

    // 处理启动图
    if (splashRes.status === 'fulfilled') {
      result.splashImage = splashRes.value.splash_image;
    }

    // 处理文档列表（用于搜索）
    if (docsRes.status === 'fulfilled') {
      result.docs = Array.isArray(docsRes.value) ? docsRes.value : [];
    }

    // 处理法条列表（用于搜索）
    if (lawsRes.status === 'fulfilled') {
      result.laws = Array.isArray(lawsRes.value) ? lawsRes.value : [];
    }

    result.loaded = true;
  } catch (err) {
    result.error = err instanceof Error ? err.message : '预加载失败';
    // 使用默认值
    result.agreement = '【东元法务通 · 用户服务协议及免责声明】\n1. 本平台提供的所有法律建议、文书模板（含AI生成内容）仅供参考，不构成具有法律效力的正式法律意见书。\n2. 涉及重大财产处分、人身安全及诉讼程序的，请务必咨询专业律师。\n3. 用户应确保录入的业务数据（如欠费金额、业主信息）的真实性，因数据错误导致的法律后果由用户自行承担。\n4. 禁止利用本平台从事任何违法违规活动。';
    result.enterprises = ['东元示范物业', '万科物业', '碧桂园服务'];
    result.loaded = true;
  } finally {
    result.loading = false;
  }

  return result;
};

interface PreloadProviderProps {
  children: React.ReactNode;
  // 可选：传入已预加载的数据（从 App.tsx 传递）
  initialData?: PreloadData | null;
}

export const PreloadProvider: React.FC<PreloadProviderProps> = ({ children, initialData }) => {
  const [data, setData] = useState<PreloadData>(() => ({
    agreement: null,
    enablePhoneLogin: true,
    enterprises: [],
    splashImage: null,
    docs: [],
    laws: [],
    loaded: false,
    loading: true,
    error: null,
    ...initialData
  }));

  const refresh = async () => {
    const newData = await preloadLoginData();
    setData(newData);
  };

  return (
    <PreloadContext.Provider value={{ data, refresh }}>
      {children}
    </PreloadContext.Provider>
  );
};
