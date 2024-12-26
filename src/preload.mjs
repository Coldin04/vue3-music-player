import { contextBridge, ipcRenderer } from 'electron';

console.log('Preload script loaded');

ipcRenderer.on('backend-port', (event, port) => {
  console.log('preload.mjs: backend-port received:', port);
  // 使用 window.postMessage 发送自定义事件到渲染进程
  window.postMessage({ type: 'backend-port', port }, '*');
});

contextBridge.exposeInMainWorld('electronAPI', {
  onBackendPort: (callback) => ipcRenderer.on('backend-port', callback),
});