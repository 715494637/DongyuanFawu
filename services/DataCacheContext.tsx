import React, { createContext, useContext, useCallback, useRef, useEffect, type ReactNode } from 'react';

// ============================================================================
// 全局缓存变量（非组件环境使用）
// ============================================================================

let globalCacheInstance: CacheContextValue | null = null;

/**
 * 设置全局缓存实例（由 CacheProvider 在挂载时调用）
 */
export const setGlobalCache = (cache: CacheContextValue) => {
  globalCacheInstance = cache;
};

/**
 * 获取全局缓存实例
 */
const getGlobalCache = (): CacheContextValue => {
  if (!globalCacheInstance) {
    return {
      getCache: () => null,
      setCache: () => {},
      invalidate: () => {},
      invalidateUser: () => {},
      clear: () => {},
    };
  }
  return globalCacheInstance;
};

// ============================================================================
// 类型定义
// ============================================================================

/**
 * 缓存条目接口
 */
interface CacheEntry<T = unknown> {
  /** 缓存数据 */
  data: T;
  /** 缓存时间戳 */
  timestamp: number;
  /** 缓存有效期(毫秒) */
  ttl: number;
}

/**
 * 缓存配置
 */
interface CacheConfig {
  /** 用户信息缓存时间(5分钟) */
  USER_INFO: number;
  /** 企业统计数据缓存时间(2分钟) */
  ENTERPRISE_STATS: number;
  /** VIP等级缓存时间(30分钟) */
  VIP_LEVELS: number;
  /** 文档列表缓存时间(5分钟) */
  DOCUMENTS: number;
  /** 风控场景缓存时间(5分钟) */
  RISKS: number;
  /** 证据列表缓存时间(5分钟) */
  EVIDENCE: number;
  /** 法条数据缓存时间(30分钟) */
  CIVIL_CODE: number;
  /** 每日锦囊缓存时间(24小时) */
  DAILY_TIP: number;
  /** 默认缓存时间(5分钟) */
  DEFAULT: number;
}

/**
 * 缓存上下文值
 */
interface CacheContextValue {
  /** 获取缓存数据 */
  getCache<T>(key: string): T | null;
  /** 设置缓存数据 */
  setCache<T>(key: string, data: T, ttl?: number): void;
  /** 清除指定缓存 */
  invalidate(key: string): void;
  /** 清除用户相关缓存 */
  invalidateUser(): void;
  /** 清除所有缓存 */
  clear(): void;
}

// ============================================================================
// 缓存配置
// ============================================================================

const CACHE_CONFIG: CacheConfig = {
  USER_INFO: 5 * 60 * 1000,        // 5分钟
  ENTERPRISE_STATS: 2 * 60 * 1000, // 2分钟
  VIP_LEVELS: 30 * 60 * 1000,      // 30分钟
  DOCUMENTS: 5 * 60 * 1000,        // 5分钟
  RISKS: 5 * 60 * 1000,            // 5分钟
  EVIDENCE: 5 * 60 * 1000,         // 5分钟
  CIVIL_CODE: 30 * 60 * 1000,      // 30分钟
  DAILY_TIP: 24 * 60 * 60 * 1000,  // 24小时
  DEFAULT: 5 * 60 * 1000,          // 5分钟默认
};

// ============================================================================
// 缓存键常量
// ============================================================================

export const CACHE_KEYS = {
  USER_INFO: 'user-info',
  ENTERPRISE_STATS: 'enterprise-stats',
  VIP_LEVELS: 'vip-levels',
  DOCUMENTS: 'documents',
  DOC_CATEGORIES: 'doc-categories',
  RISKS: 'risks',
  EVIDENCE: 'evidence',
  CIVIL_CODE: 'civil-code',
  ENTERPRISES: 'enterprises',
  CONFIG: 'config',
  DAILY_TIP: 'daily-tip',
  COLLECTION_SCRIPTS: 'collection-scripts',
} as const;

// ============================================================================
// Context 创建
// ============================================================================

const CacheContext = createContext<CacheContextValue | null>(null);

// ============================================================================
// Provider 组件
// ============================================================================

interface CacheProviderProps {
  children: ReactNode;
}

/**
 * 缓存 Provider 组件
 * 提供全局数据缓存管理功能
 */
export const CacheProvider: React.FC<CacheProviderProps> = ({ children }) => {
  // 使用 ref 存储缓存，避免触发重渲染
  const cacheRef = useRef<Map<string, CacheEntry>>(new Map());

  /**
   * 获取缓存数据
   */
  const getCache = useCallback(<T,>(key: string): T | null => {
    const entry = cacheRef.current.get(key);

    if (!entry) {
      return null;
    }

    // 检查是否过期
    if (Date.now() - entry.timestamp > entry.ttl) {
      cacheRef.current.delete(key);
      return null;
    }

    return entry.data as T;
  }, []);

  /**
   * 设置缓存数据
   */
  const setCache = useCallback(<T,>(key: string, data: T, ttl?: number): void => {
    cacheRef.current.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl ?? CACHE_CONFIG.DEFAULT,
    });

    // 发布缓存更新事件
    window.dispatchEvent(new CustomEvent('cache-updated', {
      detail: { key }
    }));
  }, []);

  /**
   * 清除指定缓存
   */
  const invalidate = useCallback((key: string): void => {
    cacheRef.current.delete(key);

    // 发布缓存失效事件
    window.dispatchEvent(new CustomEvent('cache-invalidated', {
      detail: { key }
    }));
  }, []);

  /**
   * 清除用户相关缓存
   */
  const invalidateUser = useCallback((): void => {
    invalidate(CACHE_KEYS.USER_INFO);
    invalidate(CACHE_KEYS.ENTERPRISE_STATS);

    // 发布用户更新事件
    window.dispatchEvent(new CustomEvent('user-updated'));
  }, [invalidate]);

  /**
   * 清除所有缓存
   */
  const clear = useCallback((): void => {
    cacheRef.current.clear();

    // 发布缓存清除事件
    window.dispatchEvent(new CustomEvent('cache-cleared'));
  }, []);

  const value: CacheContextValue = {
    getCache,
    setCache,
    invalidate,
    invalidateUser,
    clear,
  };

  // 设置全局缓存实例，供非组件代码使用（仅首次渲染时执行）
  useEffect(() => {
    setGlobalCache(value);
  }, [value]);

  return (
    <CacheContext.Provider value={value}>
      {children}
    </CacheContext.Provider>
  );
};

// ============================================================================
// Hook
// ============================================================================

/**
 * 使用缓存上下文
 * @returns 缓存管理方法
 */
export const useCache = (): CacheContextValue => {
  const context = useContext(CacheContext);

  if (!context) {
    throw new Error('useCache must be used within a CacheProvider');
  }

  return context;
};

// ============================================================================
// 便捷函数
// ============================================================================

/**
 * 获取缓存的配置时间
 * @param key 缓存键
 * @returns 缓存时间(毫秒)
 */
export const getCacheTTL = (key: keyof typeof CACHE_KEYS): number => {
  const ttlMap: Record<string, number> = {
    [CACHE_KEYS.USER_INFO]: CACHE_CONFIG.USER_INFO,
    [CACHE_KEYS.ENTERPRISE_STATS]: CACHE_CONFIG.ENTERPRISE_STATS,
    [CACHE_KEYS.VIP_LEVELS]: CACHE_CONFIG.VIP_LEVELS,
    [CACHE_KEYS.DOCUMENTS]: CACHE_CONFIG.DOCUMENTS,
    [CACHE_KEYS.RISKS]: CACHE_CONFIG.RISKS,
    [CACHE_KEYS.EVIDENCE]: CACHE_CONFIG.EVIDENCE,
    [CACHE_KEYS.CIVIL_CODE]: CACHE_CONFIG.CIVIL_CODE,
    [CACHE_KEYS.DAILY_TIP]: CACHE_CONFIG.DAILY_TIP,
    [CACHE_KEYS.COLLECTION_SCRIPTS]: CACHE_CONFIG.DOCUMENTS,
  };

  return ttlMap[key] ?? CACHE_CONFIG.DEFAULT;
};

// ============================================================================
// 全局缓存对象（用于非组件环境）
// ============================================================================

/**
 * 全局缓存管理对象
 * 可在非 React 组件环境中使用，如 API 服务层
 */
export const cache = {
  /** 获取缓存数据 */
  getCache: <T,>(key: string): T | null => {
    return getGlobalCache().getCache(key);
  },

  /** 设置缓存数据 */
  setCache: <T,>(key: string, data: T, ttl?: number): void => {
    getGlobalCache().setCache(key, data, ttl);
  },

  /** 清除指定缓存 */
  invalidate: (key: string): void => {
    getGlobalCache().invalidate(key);
  },

  /** 清除用户相关缓存 */
  invalidateUser: (): void => {
    getGlobalCache().invalidateUser();
  },

  /** 清除所有缓存 */
  clear: (): void => {
    getGlobalCache().clear();
  }
};

export default CacheContext;
