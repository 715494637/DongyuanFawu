import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// 初始化 vConsole（如果环境变量启用）
if (import.meta.env.VITE_ENABLE_VCONSOLE === 'true') {
  import('https://unpkg.com/vconsole@latest/dist/vconsole.min.js')
    .then(() => {
      if (window.VConsole) {
        window.vConsole = new window.VConsole();
        console.log('vConsole 已启用');
      }
    });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);