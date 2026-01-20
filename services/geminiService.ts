
import { GoogleGenAI, Modality } from "@google/genai";
import { api } from "./apiService";

const getSystemInstruction = async () => {
  const kb = await api.getAIKB();
  return `
你现在是"东元物业法务助手"（智能辅助工具，非人类律师）。
身份定位：你是一个辅助物业经理进行法律决策的智能助手。
核心原则：
1. 你的回答仅供参考，不构成正式法律意见。
2. 回复必须遵循《中华人民共和国民法典》及相关物业法规。
3. 遇到复杂、高风险（如涉及人身伤害、重大金额赔偿、刑事责任）的问题，必须在回复末尾明确提示："该情况风险较高，建议使用'一键咨询'功能获取东元律师团队的人工服务。"

管理员设定的业务规则：
"${kb}"

回复风格：
- 结构化、专业但有亲和力。
- 引用法律条文。
- 明确区分"通用法规"与"个案建议"。
`;
};

export const sendMessageToAI = async (message: string, useSearch: boolean = false, isComplex: boolean = false): Promise<string> => {
  const ai = new GoogleGenAI({
    apiKey: import.meta.env.VITE_GEMINI_API_KEY || '',
    httpOptions: {
      baseUrl: import.meta.env.VITE_GEMINI_BASE_URL || '',
    },
  });
  // 复杂诊断使用 Pro 模型，日常对话使用 Flash 模型
  const modelName = isComplex ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
  
  try {
    const systemInstruction = await getSystemInstruction();
    const response = await ai.models.generateContent({
      model: modelName,
      contents: message,
      config: {
        systemInstruction: systemInstruction,
        tools: useSearch ? [{ googleSearch: {} }] : undefined,
      },
    });
    return response.text || "抱歉，法律智脑暂时未生成有效回复，请重试。";
  } catch (error) {
    console.error("Gemini API Error:", error);
    const errorMsg = error instanceof Error ? error.message : "未知错误";
    
    // Friendly error messages for common issues
    if (errorMsg.includes('429') || errorMsg.includes('quota')) {
        return "当前咨询人数过多，AI 助手暂时繁忙。请等待 1-2 分钟后重试。";
    }
    if (errorMsg.includes('400') || errorMsg.includes('invalid')) {
        return "系统配置更新中，请联系管理员检查 API 密钥设置。";
    }
    
    return `系统处理中遇到问题，请稍后重试。`;
  }
};

export const generateImage = async (prompt: string): Promise<string | null> => {
  const ai = new GoogleGenAI({
    apiKey: import.meta.env.VITE_GEMINI_API_KEY || '',
    httpOptions: {
      baseUrl: import.meta.env.VITE_GEMINI_BASE_URL || '',
    },
  });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: `物业管理海报需求：${prompt}。风格要求：商务、严肃、现代。如果是宣传类则温馨大气。` }],
      },
    });
    
    for (const part of response.candidates?.[0]?.content.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Image Generation Error:", error);
    return null;
  }
};

export const textToSpeech = async (text: string): Promise<Uint8Array | null> => {
  const ai = new GoogleGenAI({
    apiKey: import.meta.env.VITE_GEMINI_API_KEY || '',
    httpOptions: {
      baseUrl: import.meta.env.VITE_GEMINI_BASE_URL || '',
    },
  });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `请用专业、稳重的法律顾问语气朗读：${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return decodeBase64(base64Audio);
    }
    return null;
  } catch (error) {
    console.error("TTS Error:", error);
    return null;
  }
};

function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

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
