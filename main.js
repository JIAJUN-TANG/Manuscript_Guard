const { app, BrowserWindow, dialog, ipcMain, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const isDev = !app.isPackaged;

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    titleBarStyle: 'hidden',
    titleBarOverlay: { color: '#ffffff', symbolColor: '#334155' },
  });

  if (isDev) {
    win.loadURL('http://localhost:5173');
    // 开发模式下自动打开开发者工具
    win.webContents.openDevTools();
    
    // 创建开发模式菜单
    const devMenu = Menu.buildFromTemplate([
      {
        label: '开发者工具',
        submenu: [
          {
            label: '切换开发者工具',
            accelerator: 'F12',
            click: () => {
              win.webContents.toggleDevTools();
            }
          },
          {
            label: '刷新',
            accelerator: 'CmdOrCtrl+R',
            click: () => {
              win.reload();
            }
          },
          {
            label: '强制刷新',
            accelerator: 'CmdOrCtrl+Shift+R',
            click: () => {
              win.webContents.reloadIgnoringCache();
            }
          }
        ]
      }
    ]);
    Menu.setApplicationMenu(devMenu);
  } else {
    win.loadFile(path.join(__dirname, 'dist/index.html'));
    Menu.setApplicationMenu(null);
  }
}

app.whenReady().then(createWindow);

// --- IPC 处理器 ---

ipcMain.handle('get-default-path', () => app.getPath('userData'));

ipcMain.handle('dialog:openDirectory', async (event, defaultPath) => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openDirectory', 'createDirectory'],
    defaultPath: defaultPath,
    title: '选择备份文件夹'
  });
  return canceled ? undefined : filePaths[0];
});

ipcMain.handle('update-backup-location', async (event, { oldPath, newPath }) => {
  try {
    const oldFilesDir = path.join(oldPath, 'files');
    const newFilesDir = path.join(newPath, 'files');
    const oldDataFile = path.join(oldPath, 'data.json');
    const newDataFile = path.join(newPath, 'data.json');

    // 创建新目录
    if (!fs.existsSync(newFilesDir)) {
      fs.mkdirSync(newFilesDir, { recursive: true });
    }

    // 搬运文件
    if (fs.existsSync(oldFilesDir)) {
      const files = fs.readdirSync(oldFilesDir);
      files.forEach(file => {
        fs.copyFileSync(path.join(oldFilesDir, file), path.join(newFilesDir, file));
        fs.unlinkSync(path.join(oldFilesDir, file));
      });
      // 仅在原路径是自定义路径时尝试删除旧目录
    }

    // 搬运元数据
    if (fs.existsSync(oldDataFile)) {
      fs.copyFileSync(oldDataFile, newDataFile);
      fs.unlinkSync(oldDataFile);
    }

    return { success: true };
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
});

// 通用元数据保存
ipcMain.handle('save-data', (event, { filePath, content }) => {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
  return true;
});

// 通用元数据读取
ipcMain.handle('load-data', (event, filePath) => {
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }
  return null;
});

ipcMain.handle('save-file', async (event, { sourcePath, destDir, fileName }) => {
  try {
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    const destPath = path.join(destDir, fileName);
    fs.copyFileSync(sourcePath, destPath);
    return destPath;
  } catch (error) {
    console.error('Save file error:', error);
    throw error;
  }
});

// 保存文件内容
ipcMain.handle('save-file-content', async (event, { content, destDir, fileName }) => {
  try {
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    const destPath = path.join(destDir, fileName);
    
    // 检查 content 类型，处理各种类型的内容
    if (content instanceof Buffer) {
      // 直接写入 Buffer
      fs.writeFileSync(destPath, content);
    } else if (typeof content === 'string') {
      // 写入文本内容
      fs.writeFileSync(destPath, content, 'utf-8');
    } else if (content && typeof content === 'object' && content.type === 'Buffer' && Array.isArray(content.data)) {
      // 处理从渲染进程传递的 Buffer 对象
      const buffer = Buffer.from(content.data);
      fs.writeFileSync(destPath, buffer);
    } else if (Array.isArray(content)) {
      // 处理从渲染进程传递的数字数组（Uint8Array 转换后的）
      const buffer = Buffer.from(content);
      fs.writeFileSync(destPath, buffer);
      console.log('文件内容保存成功（数组方式）:', destPath);
      return destPath;
    } else {
      throw new Error('不支持的内容类型：' + typeof content);
    }
    
    console.log('文件内容保存成功:', destPath);
    return destPath;
  } catch (error) {
    console.error('Save file content error:', error);
    throw error;
  }
});

ipcMain.handle('shell:openPath', async (event, filePath) => {
  const { shell } = require('electron');
  return await shell.openPath(filePath);
});

// 删除文件
ipcMain.handle('delete-file', async (event, filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('文件删除成功:', filePath);
      return true;
    } else {
      console.warn('文件不存在:', filePath);
      return false;
    }
  } catch (error) {
    console.error('删除文件失败:', error);
    throw error;
  }
});

// 下载文件
ipcMain.handle('download-file', async (event, { filePath, fileName }) => {
  try {
    const { dialog } = require('electron');
    
    // 显示保存对话框，不设置默认路径，让用户自由选择
    const result = await dialog.showSaveDialog({
      title: '保存文件',
      defaultPath: fileName,
      filters: [
        {
          name: 'All Files',
          extensions: ['*']
        }
      ]
    });
    
    // 检查用户是否取消了对话框
    if (result.canceled || !result.filePath) {
      return false;
    }
    
    const savePath = result.filePath;
    
    // 验证源文件存在
    if (!fs.existsSync(filePath)) {
      console.warn('源文件不存在:', filePath);
      throw new Error('源文件不存在，无法下载');
    }
    
    // 复制文件到目标位置
    try {
      fs.copyFileSync(filePath, savePath);
      console.log('文件下载成功:', savePath);
      return true;
    } catch (copyError) {
      console.error('复制文件失败:', copyError);
      // 提供更详细的错误信息
      if (copyError.code === 'EACCES') {
        throw new Error('没有权限在此位置保存文件，请选择其他位置（如桌面或文档文件夹）');
      } else if (copyError.code === 'EPERM') {
        throw new Error('权限被拒绝，请选择其他有写入权限的位置');
      } else {
        throw new Error('保存文件失败：' + copyError.message);
      }
    }
  } catch (error) {
    console.error('下载文件失败:', error);
    throw error;
  }
});