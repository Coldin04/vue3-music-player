import pkg from 'electron';
const { app, BrowserWindow, ipcMain } = pkg;
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import isDev from 'electron-is-dev';
import { spawn } from 'child_process';
import os from 'os';


// 定义 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


let backendProcess;
let mainWindow;

function createWindow() {
  //const preloadPath = path.join(__dirname, './preload.mjs');
  //console.log(`Preload 路径: ${preloadPath}`)
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    //transparent: true,
    //frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: true,
    },
  });

  mainWindow.setMenu(null);
  //app.disableHardwareAcceleration();

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  const platform = os.platform();
  const isWin = platform === 'win32';

  const backendExeName = isWin ? 'back_music_x64.exe' : 'back_music_amd64';

  let backendPath = '';
  if (!isDev) {
    backendPath = path.join(process.resourcesPath, 'bin', backendExeName);
  } else {
    backendPath = path.join(__dirname, 'bin', backendExeName);
  }

  // 启动后端服务
  try {
    backendProcess = spawn(backendPath, {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, LANG: 'zh_CN.UTF-8' },
    });
  } catch (error) {
    console.error('后端进程启动失败:', error);
  }

  let buffer = '';

  // 监听后端的标准输出
  backendProcess.stdout.on('data', (data) => {
    const output = data.toString('utf8').trim();
    console.log(`后端输出: ${output}`);

    buffer += output;

    // 使用正则表达式提取端口号
    const match = buffer.match(/PORT:\s*(\d+)/i);
    if (match) {
      const port = match[1];
      console.log(`检测到后端端口: ${port}`);

        if (mainWindow) {
            setTimeout(() => {
                mainWindow.webContents.send('backend-port', port);
                console.log(`已发送端口号 ${port} 给渲染进程`);
            }, 3000); // 延迟3秒发送
        }

      // 清空缓冲区
      buffer = '';
    }

    // 保留部分未匹配的数据，防止端口号被拆分
    if (buffer.length > 100) {
      buffer = buffer.slice(-100);
    }
  });

  // 监听后端的标准错误输出
  backendProcess.stderr.on('data', (data) => {
    console.error(`后端错误: ${data.toString('utf8')}`);
  });

  // 监听后端进程关闭
  backendProcess.on('close', (code) => {
    console.log(`后端退出，代码: ${code}`);
    backendProcess = null;
  });
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

// 处理所有窗口关闭事件
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 当应用程序即将退出时，确保后端进程被终止
app.on('will-quit', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
});