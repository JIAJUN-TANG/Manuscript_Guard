import { Project } from '../types';

let currentPath: string = '';

const getAPI = () => (window as any).electronAPI;

export const initStorage = async () => {
    try {
        const api = getAPI();
        if (!api) {
            console.warn("未检测到 Electron 环境，将使用 LocalStorage");
            return;
        }
        
        const savedPath = localStorage.getItem('custom_backup_path');
        currentPath = savedPath || await api.getDefaultBackupPath();
        
        console.log("存储系统初始化成功，路径为:", currentPath);
    } catch (e) {
        console.error("存储初始化失败:", e);
    }
};

export const saveSourceFile = async (file: File, versionId: string): Promise<string> => {
    const api = getAPI();
    // 如果不是 Electron 环境或 API 不可用，则无法保存到文件系统
    if (!api || !currentPath) return '';

    try {
        const filesDir = `${currentPath}/files`;
        const newFileName = `${versionId}_${file.name}`;

        // 首先尝试获取原始路径
        const originalPath = (file as any).path;
        
        if (originalPath) {
            // 如果有原始路径，使用文件复制方式
            const savedPath = await api.saveFile({
                sourcePath: originalPath,
                destDir: filesDir,
                fileName: newFileName
            });
            return savedPath;
        } else {
            // 如果没有原始路径（比如通过拖拽或文件选择器），使用文件内容方式
            console.log("没有检测到文件原始路径，将使用文件内容保存");
            
            // 读取文件内容
            const reader = new FileReader();
            const content = await new Promise<string>((resolve, reject) => {
                reader.onload = (e) => resolve(e.target?.result as string);
                reader.onerror = reject;
                reader.readAsText(file);
            });
            
            // 调用主进程保存文件内容
            const savedPath = await api.saveFileContent({
                content,
                destDir: filesDir,
                fileName: newFileName
            });
            return savedPath;
        }
    } catch (e) {
        console.error("Failed to save source file:", e);
        return '';
    }
};

export const getDefaultBackupPath = async (): Promise<string> => {
    const api = getAPI();
    if (!api) {
        throw new Error("Electron API 不可用");
    }
    return await api.getDefaultBackupPath();
};

export const updateBackupPath = async (newPath: string): Promise<void> => {
    const api = getAPI();
    if (!api) throw new Error("Electron API 不可用");

    try {
        // 调用主进程进行物理文件搬迁
        await api.updateBackupLocation({ oldPath: currentPath, newPath });
        
        // 更新内存状态和持久化记录
        currentPath = newPath;
        localStorage.setItem('custom_backup_path', newPath);
    } catch (e) {
        console.error("路径迁移失败:", e);
        throw e;
    }
};

export const getCurrentBackupPath = (): string => currentPath;

export const saveMetadata = async (projects: Project[]) => {
    const api = getAPI();
    if (!api) {
        localStorage.setItem('manuscript_guard_projects', JSON.stringify(projects));
        return;
    }
    const dataPath = `${currentPath}/data.json`;
    await api.saveMetadata(dataPath, projects);
};

export const loadMetadata = async (): Promise<Project[] | null> => {
    const api = getAPI();
    if (!api) {
        const saved = localStorage.getItem('manuscript_guard_projects');
        return saved ? JSON.parse(saved) : null;
    }
    const dataPath = `${currentPath}/data.json`;
    return await api.loadMetadata(dataPath);
};

export const deleteSourceFile = async (storedPath: string): Promise<boolean> => {
    const api = getAPI();
    if (!api) {
        console.warn("未检测到 Electron 环境，无法删除文件");
        return false;
    }

    try {
        await api.deleteFile(storedPath);
        return true;
    } catch (e) {
        console.error("删除文件失败:", e);
        return false;
    }
};