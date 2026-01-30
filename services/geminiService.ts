import { api } from "./apiService";

// 后端 API 地址（使用环境变量配置）
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

/**
 * AI 对话接口
 */
export const sendMessageToAI = async (
  message: string,
  useSearch: boolean = false,
  isComplex: boolean = false
): Promise<string> => {
  try {
    const response = await fetch(`${API_BASE}/ai/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        use_search: useSearch,
        is_complex: isComplex,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.response || "抱歉，法律智脑暂时未生成有效回复，请重试。";
  } catch (error) {
    console.error("AI Chat Error:", error);
    const errorMsg = error instanceof Error ? error.message : "未知错误";

    // Friendly error messages for common issues
    if (errorMsg.includes("429") || errorMsg.includes("quota") || errorMsg.includes("繁忙")) {
      return "当前咨询人数过多，AI 助手暂时繁忙。请等待 1-2 分钟后重试。";
    }
    if (errorMsg.includes("400") || errorMsg.includes("invalid") || errorMsg.includes("配置")) {
      return "系统配置更新中，请联系管理员检查 API 密钥设置。";
    }

    return `系统处理中遇到问题，请稍后重试。`;
  }
};

/**
 * AI 图片生成接口（海报）
 */
export const generateImage = async (prompt: string): Promise<string | null> => {
  try {
    const response = await fetch(`${API_BASE}/ai/image`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      console.error("Image generation failed:", response.statusText);
      return null;
    }

    const data = await response.json();
    return data.image || null;
  } catch (error) {
    console.error("Image Generation Error:", error);
    return null;
  }
}

/**
 * AI 语音合成接口
 */
export const textToSpeech = async (text: string): Promise<Uint8Array | null> => {
  try {
    const response = await fetch(`${API_BASE}/ai/tts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      console.error("TTS request failed:", response.statusText);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  } catch (error) {
    console.error("TTS Error:", error);
    return null;
  }
};

/**
 * 解码音频数据用于 Web Audio API
 */
export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
