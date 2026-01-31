const { app, BrowserWindow, dialog, ipcMain } = require('electron');
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
    win.loadURL('http://localhost:5173'); // 匹配你的 Vite 配置
  } else {
    win.loadFile(path.join(__dirname, 'dist/index.html'));
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
    fs.writeFileSync(destPath, content, 'utf-8');
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