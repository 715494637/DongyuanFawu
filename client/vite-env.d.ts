/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GEMINI_BASE_URL?: string
  readonly VITE_GEMINI_API_KEY?: string
  readonly VITE_ENABLE_VCONSOLE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// vConsole 类型
declare global {
  interface Window {
    VConsole?: new () => { [key: string]: any };
    vConsole?: any;
  }
}