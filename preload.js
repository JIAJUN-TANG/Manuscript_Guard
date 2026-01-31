const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // 路径工具
  getDefaultBackupPath: () => ipcRenderer.invoke('get-default-path'),
  openFolderDialog: (defaultPath) => ipcRenderer.invoke('dialog:openDirectory', defaultPath),
  
  // 文件操作
  updateBackupLocation: (paths) => ipcRenderer.invoke('update-backup-location', paths),
  saveMetadata: (filePath, content) => ipcRenderer.invoke('save-data', { filePath, content }),
  loadMetadata: (filePath) => ipcRenderer.invoke('load-data', filePath),
  saveFile: (data) => ipcRenderer.invoke('save-file', data),
  saveFileContent: (data) => ipcRenderer.invoke('save-file-content', data),
  deleteFile: (filePath) => ipcRenderer.invoke('delete-file', filePath),
  openPath: (path) => ipcRenderer.invoke('shell:openPath', path),
  
  // 路径拼接辅助
  joinPaths: (...args) => args.join('/')
});