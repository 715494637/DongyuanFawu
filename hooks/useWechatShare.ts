/**
 * 微信公众号分享 Hook
 *
 * 用于配置微信内置浏览器的分享功能，支持自定义缩略图
 */

import { useEffect } from 'react';

// 微信 JS-SDK 类型定义
interface WeChatConfig {
  appId: string;
  timestamp: string;
  nonceStr: string;
  signature: string;
}

interface WeChatShareData {
  title: string;
  desc: string;
  link: string;
  imgUrl: string;
}

declare global {
  interface Window {
    wx: {
      config: (config: {
        debug?: boolean;
        appId: string;
        timestamp: number;
        nonceStr: string;
        signature: string;
        jsApiList: string[];
      }) => void;
      ready: (callback: () => void) => void;
      error: (callback: (res: any) => void) => void;
      updateAppMessageShareData: (data: WeChatShareData, callback?: () => void) => void;
      updateTimelineShareData: (data: WeChatShareData, callback?: () => void) => void;
      onMenuShareAppMessage: (data: WeChatShareData) => void;
      onMenuShareTimeline: (data: WeChatShareData) => void;
    };
  }
}

/**
 * 检测是否在微信浏览器中
 */
const isWechatBrowser = (): boolean => {
  const ua = navigator.userAgent.toLowerCase();
  return ua.includes('micromessenger');
};

/**
 * 获取当前页面的完整 URL（不包含 # 及其后面部分）
 */
const getCurrentUrl = (): string => {
  const url = window.location.href.split('#')[0];
  return url;
};

/**
 * 从后端获取微信 JS-SDK 配置
 */
const fetchWechatConfig = async (url: string): Promise<WeChatConfig> => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const response = await fetch(`${apiUrl}/api/v1/wechat/jsapi-config?url=${encodeURIComponent(url)}`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || '获取微信配置失败');
  }

  return response.json();
};

/**
 * 微信分享 Hook
 *
 * @param options - 分享配置选项
 * @param options.title - 分享标题
 * @param options.desc - 分享描述
 * @param options.imgUrl - 分享缩略图 URL
 */
export const useWechatShare = (options: {
  title?: string;
  desc?: string;
  imgUrl?: string;
}): void => {
  useEffect(() => {
    // 如果不在微信浏览器中，直接返回
    if (!isWechatBrowser()) {
      console.log('不在微信浏览器中，跳过微信分享配置');
      return;
    }

    // 如果微信 JS-SDK 未加载，直接返回
    if (!window.wx) {
      console.warn('微信 JS-SDK 未加载');
      return;
    }

    const { title = '东元法物 - 数字化物业法律工具', desc = '专业的物业法律工具，为您提供法律咨询、文书生成等服务', imgUrl = '/favicon.png' } = options;

    const configureWechatShare = async () => {
      try {
        const url = getCurrentUrl();
        const config = await fetchWechatConfig(url);

        // 配置微信 JS-SDK
        window.wx.config({
          debug: false, // 生产环境设为 false
          appId: config.appId,
          timestamp: parseInt(config.timestamp),
          nonceStr: config.nonceStr,
          signature: config.signature,
          jsApiList: [
            'updateAppMessageShareData', // 分享给朋友
            'updateTimelineShareData', // 分享到朋友圈
            'onMenuShareAppMessage', // 兼容旧版
            'onMenuShareTimeline' // 兼容旧版
          ]
        });

        // 配置成功回调
        window.wx.ready(() => {
          console.log('微信 JS-SDK 配置成功');

          const shareData: WeChatShareData = {
            title,
            desc,
            link: window.location.href,
            imgUrl
          };

          // 分享给朋友（新接口）
          window.wx.updateAppMessageShareData(shareData, () => {
            console.log('分享给朋友配置成功');
          });

          // 分享到朋友圈（新接口）
          window.wx.updateTimelineShareData(shareData, () => {
            console.log('分享到朋友圈配置成功');
          });

          // 兼容旧版微信（分享给朋友）
          window.wx.onMenuShareAppMessage(shareData);

          // 兼容旧版微信（分享到朋友圈）
          window.wx.onMenuShareTimeline({
            title,
            link: window.location.href,
            imgUrl
          });
        });

        // 配置失败回调
        window.wx.error((res: any) => {
          console.error('微信 JS-SDK 配置失败:', res);
        });

      } catch (error) {
        console.error('配置微信分享失败:', error);
      }
    };

    configureWechatShare();
  }, [options]);
};