const { app, BrowserWindow } = require('electron');
const path = require('path');
const isDev = !app.isPackaged;

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 600,
    minHeight: 600,
    titleBarStyle: 'hidden', // Mac style seamless title bar
    titleBarOverlay: {
      color: '#ffffff',
      symbolColor: '#334155'
    },
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // For simple demo purposes; use preload in prod
      webSecurity: false // Allow loading local files easily in dev
    },
    icon: path.join(__dirname, 'assets/icon.ico')
  });

  if (isDev) {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, 'dist/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  // IPC to get user data path
  const { ipcMain } = require('electron');
  ipcMain.handle('get-user-data-path', () => {
    return app.getPath('userData');
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});