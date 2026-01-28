import { Project } from '../types';

// Electron/Node modules (dynamically imported to verify environment)
let fs: any;
let path: any;
let electron: any;

let userDataPath: string = '';
let filesDir: string = '';
let dataPath: string = '';

const isElectron = () => {
    return window && (window as any).process && (window as any).process.type;
};

export const initStorage = async () => {
    if (!isElectron()) {
        console.warn("Not running in Electron. Storage persistence limited to localStorage.");
        return;
    }

    try {
        fs = window.require('fs');
        path = window.require('path');
        electron = window.require('electron');
        const { ipcRenderer } = electron;

        userDataPath = await ipcRenderer.invoke('get-user-data-path');
        filesDir = path.join(userDataPath, 'files');
        dataPath = path.join(userDataPath, 'data.json');

        if (!fs.existsSync(filesDir)) {
            fs.mkdirSync(filesDir, { recursive: true });
        }

        console.log("Storage initialized at:", userDataPath);
    } catch (e) {
        console.error("Failed to initialize storage:", e);
    }
};

export const saveSourceFile = async (file: File, versionId: string): Promise<string> => {
    if (!isElectron() || !filesDir) return '';

    try {
        // file.path gives the original path in Electron
        const originalPath = (file as any).path;
        const extension = file.name.split('.').pop() || '';
        const newFileName = `${versionId}_${file.name}`; // Ensure unique
        const destPath = path.join(filesDir, newFileName);

        if (originalPath) {
            fs.copyFileSync(originalPath, destPath);
        } else {
            // Fallback if path not available (e.g. drag drop sometimes?), write bytes
            // Note: in FileReader w/ React, getting bytes is async. 
            // Ideally we leverage the original path. 
            console.warn("Original file path missing, cannot copy. Attempting write.");
        }

        return destPath;
    } catch (e) {
        console.error("Failed to save source file:", e);
        return '';
    }
};

export const saveMetadata = async (projects: Project[]) => {
    if (!isElectron() || !dataPath) {
        localStorage.setItem('manuscript_guard_projects', JSON.stringify(projects));
        return;
    }

    try {
        fs.writeFileSync(dataPath, JSON.stringify(projects, null, 2));
    } catch (e) {
        console.error("Failed to save metadata:", e);
    }
};

export const loadMetadata = async (): Promise<Project[] | null> => {
    let projects: Project[] | null = null;

    if (!isElectron() || !dataPath) {
        const saved = localStorage.getItem('manuscript_guard_projects');
        projects = saved ? JSON.parse(saved) : null;
    } else {
        try {
            if (fs.existsSync(dataPath)) {
                const data = fs.readFileSync(dataPath, 'utf-8');
                projects = JSON.parse(data);
            }
        } catch (e) {
            console.error("Failed to load metadata:", e);
        }
    }

    if (projects) {
        // Migration: Convert legacy projects (versions[]) to branch-based projects (branches[])
        const migratedProjects = projects.map(p => {
            if (!p.branches || p.branches.length === 0) {
                // If it has legacy versions, move them to 'main' branch
                const legacyVersions = p.versions || [];
                const mainBranch = {
                    id: 'branch-main',
                    name: 'main',
                    versions: legacyVersions,
                    createdAt: p.lastModified
                };

                return {
                    ...p,
                    branches: [mainBranch],
                    defaultBranchId: 'branch-main',
                    versions: undefined // Clear legacy
                };
            }
            return p;
        });

        return migratedProjects;
    }

    return null;
};
