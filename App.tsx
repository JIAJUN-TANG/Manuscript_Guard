import React, { useState, useEffect, useRef } from 'react';
import { Project, ManuscriptVersion, Branch } from './types';
import { calculateHash, calculateSimilarity, determineVersionType, readFileContent } from './services/textUtils';
import { 
  initStorage, 
  saveMetadata, 
  loadMetadata, 
  saveSourceFile, 
  deleteSourceFile, 
  getCurrentBackupPath, 
  updateBackupPath, 
  getDefaultBackupPath 
} from './services/storage';
import { FileText, UploadCloud, ExternalLink } from './components/Icons';
import { Modal } from './components/Modal';
import { BranchSelector } from './components/BranchSelector';
import { ConfirmDialog } from './components/ConfirmDialog';
import { ToastProvider, useToast } from './components/ToastProvider';

// Components
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { VersionList } from './components/VersionList';
import { ComparisonDrawer } from './components/ComparisonDrawer';
import { Settings } from './components/Settings';
import { NewProjectModal } from './components/NewProjectModal';
import { PreviewModal } from './components/PreviewModal';

const AppContent: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeBranchId, setActiveBranchId] = useState<string | null>(null);

  // 存储路径状态
  const [currentPath, setCurrentPath] = useState<string>('');

  // States for comparison and analysis
  const [comparingVersionId, setComparingVersionId] = useState<string | null>(null);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [previewingVersion, setPreviewingVersion] = useState<ManuscriptVersion | null>(null);
  const [comparisonState, setComparisonState] = useState({
    isOpen: false,
    oldVersionLabel: '',
    newVersionLabel: '',
    oldContent: '',
    newContent: ''
  });

  // Toast notifications
  const { showSuccess, showError, showInfo } = useToast();

  // States for Modals
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectFile, setNewProjectFile] = useState<File | null>(null);

  // Drag states
  const [isMainDragActive, setIsMainDragActive] = useState(false);
  const newProjectFileInputRef = useRef<HTMLInputElement>(null);

  // Confirmation Dialog State
  const [confirmation, setConfirmation] = useState<{
    isOpen: boolean;
    type: 'delete-project' | 'delete-version' | null;
    id: string | null;
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: null,
    id: null,
    title: '',
    message: ''
  });

  // Settings State
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // --- 初始化加载 ---
  useEffect(() => {
    const loadData = async () => {
      await initStorage();
      const path = getCurrentBackupPath();
      setCurrentPath(path);
      
      const stored = await loadMetadata();
      if (stored) {
        setProjects(stored);
      }
    };
    loadData();
  }, []);

  // --- 自动保存 ---
  useEffect(() => {
    if (projects.length > 0) {
      saveMetadata(projects);
    }
  }, [projects]);

  const activeProject = projects.find(p => p.id === activeProjectId);
  const branches = activeProject?.branches || [];
  const activeBranch = branches.find(b => b.id === activeBranchId) || branches[0] || null;
  const versions = activeBranch?.versions || [];

  // Update active branch when project changes
  useEffect(() => {
    if (activeProject && !activeBranchId) {
      const branches = activeProject.branches || [];
      setActiveBranchId(activeProject.defaultBranchId || branches[0]?.id || null);
    } else if (activeProject && activeBranchId) {
      const branches = activeProject.branches || [];
      const exists = branches.find(b => b.id === activeBranchId);
      if (!exists) {
        setActiveBranchId(activeProject.defaultBranchId || branches[0]?.id || null);
      }
    }
  }, [activeProjectId, activeProject, activeBranchId]);

  // --- 逻辑：创建新项目 ---
  const handleCreateProject = async (name: string, file: File) => {
    if (!file) return;
    try {
      const content = await readFileContent(file);
      const hash = calculateHash(content);
      const timestamp = Date.now();
      const extension = file.name.split('.').pop()?.toLowerCase() || 'txt';
      const fileType = (['docx', 'md', 'txt'].includes(extension) ? extension : 'txt') as 'docx' | 'md' | 'txt';

      const newVersion: ManuscriptVersion = {
        id: crypto.randomUUID(),
        content,
        metadata: {
          originalName: file.name,
          timestamp,
          versionLabel: 'V1.0.0',
          hash,
          size: file.size
        },
        similarityToPrevious: null,
        changeType: 'Initial',
      };

      const storedPath = await saveSourceFile(file, newVersion.id);
      if (storedPath) {
        newVersion.metadata.storedPath = storedPath;
      }

      const newProject: Project = {
        id: crypto.randomUUID(),
        name: name,
        type: fileType,
        branches: [{
          id: 'branch-main',
          name: 'main',
          versions: [newVersion],
          createdAt: timestamp
        }],
        defaultBranchId: 'branch-main',
        lastModified: timestamp
      };

      setProjects(prev => [newProject, ...prev]);
      setActiveProjectId(newProject.id);
      setActiveBranchId('branch-main');
      setIsNewProjectModalOpen(false);
      setNewProjectName('');
      setNewProjectFile(null);
      showSuccess('项目创建成功');
    } catch (error) {
      showError("创建项目失败: " + (error as Error).message);
    }
  };

  // --- 逻辑：添加版本 ---
  const handleAddVersion = async (file: File) => {
    if (!activeProject || !activeBranch) return;
    try {
      const content = await readFileContent(file);
      const timestamp = Date.now();
      const hash = calculateHash(content);
      const latestVersion = versions[0];
      const similarity = latestVersion ? calculateSimilarity(content, latestVersion.content) : 0;
      const changeType = determineVersionType(similarity, !latestVersion);

      let versionLabel = 'V1.0.0';
      if (latestVersion) {
        const parts = latestVersion.metadata.versionLabel.replace(/^V/, '').split('.').map(Number);
        let [major, minor, patch] = parts.length === 3 ? parts : [1, 0, 0];
        if (changeType === 'Major Update') { major += 1; minor = 0; patch = 0; }
        else if (changeType === 'Minor Update') { minor += 1; patch = 0; }
        else { patch += 1; }
        versionLabel = `V${major}.${minor}.${patch}`;
      }

      const newVersion: ManuscriptVersion = {
        id: crypto.randomUUID(),
        content,
        metadata: {
          originalName: file.name,
          timestamp,
          versionLabel,
          hash,
          size: file.size
        },
        similarityToPrevious: latestVersion ? similarity : null,
        changeType,
      };

      const storedPath = await saveSourceFile(file, newVersion.id);
      if (storedPath) newVersion.metadata.storedPath = storedPath;

      setProjects(prev => prev.map(p => {
        if (p.id === activeProject.id) {
          return {
            ...p,
            branches: p.branches.map(b =>
              b.id === activeBranch?.id ? { ...b, versions: [newVersion, ...b.versions] } : b
            ),
            lastModified: timestamp
          };
        }
        return p;
      }));
      showSuccess('版本添加成功');
    } catch (error) {
      showError("添加版本失败: " + (error as Error).message);
    }
  };

  // --- 逻辑：删除处理 ---
  const handleDeleteProject = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    const project = projects.find(p => p.id === projectId);
    setConfirmation({
      isOpen: true,
      type: 'delete-project',
      id: projectId,
      title: '删除项目',
      message: `确定要删除项目“${project?.name}”及其所有历史版本吗？此操作无法撤销。`
    });
  };

  const handleDeleteVersion = (e: React.MouseEvent, versionId: string) => {
    e.stopPropagation();
    if (!activeProject || !activeBranch) return;
    const version = activeBranch.versions.find(v => v.id === versionId);
    setConfirmation({
      isOpen: true,
      type: 'delete-version',
      id: versionId,
      title: '删除版本',
      message: `确定要删除版本“${version?.metadata.versionLabel}”吗？此操作无法撤销。`
    });
  };

  const handleConfirmAction = async () => {
    setConfirmation({ ...confirmation, isOpen: false });
    if (confirmation.type === 'delete-project' && confirmation.id) {
      setProjects(prev => prev.filter(p => p.id !== confirmation.id));
      if (activeProjectId === confirmation.id) {
        setActiveProjectId(null);
        setActiveBranchId(null);
      }
      showSuccess('项目删除成功');
    } else if (confirmation.type === 'delete-version' && confirmation.id) {
      if (!activeProject || !activeBranch) return;
      
      // 找到要删除的版本，获取其存储路径
      const versionToDelete = activeBranch.versions.find(v => v.id === confirmation.id);
      if (versionToDelete && versionToDelete.metadata.storedPath) {
        // 删除物理文件
        try {
          await deleteSourceFile(versionToDelete.metadata.storedPath);
          console.log('文件删除成功:', versionToDelete.metadata.storedPath);
        } catch (error) {
          console.error('删除文件失败:', error);
          // 即使文件删除失败，也继续删除版本记录
        }
      }
      
      setProjects(prev => prev.map(p => {
        if (p.id === activeProject.id) {
          const updatedBranches = p.branches.map(branch => {
            if (branch.id === activeBranch.id) {
              const versionIndex = branch.versions.findIndex(v => v.id === confirmation.id);
              if (versionIndex === -1) return branch;
              
              const updatedVersions = [...branch.versions];
              updatedVersions.splice(versionIndex, 1);
              
              // 重新计算后续版本的相似度
              for (let i = versionIndex - 1; i >= 0; i--) {
                if (i > 0) {
                  const similarity = calculateSimilarity(
                    updatedVersions[i].content,
                    updatedVersions[i - 1].content
                  );
                  updatedVersions[i].similarityToPrevious = similarity;
                } else {
                  updatedVersions[i].similarityToPrevious = null;
                }
              }
              
              return {
                ...branch,
                versions: updatedVersions
              };
            }
            return branch;
          });
          
          return {
            ...p,
            branches: updatedBranches,
            lastModified: Date.now()
          };
        }
        return p;
      }));
      showSuccess('版本删除成功');
    }
  };

  // --- 逻辑：打开外部程序 (安全重写) ---
  const handleOpenExternal = async () => {
    if (!previewingVersion) return;
    try {
      const api = (window as any).electronAPI;
      if (!api) throw new Error("非 Electron 环境");

      if (previewingVersion.metadata.storedPath) {
        // 调用我们暴露在 preload.js 中的 openPath (或者通过 ipcRenderer 调用主进程的 shell.openPath)
        await api.openPath(previewingVersion.metadata.storedPath);
        showSuccess('正在打开外部程序...');
      } else {
        showError("该版本没有关联的本地文件，无法使用外部程序打开。");
      }
    } catch (error) {
      console.error('Failed to open external:', error);
      showError('无法打开外部程序：请检查文件是否仍存在于备份目录中。');
    }
  };

  // --- 逻辑：设置相关 ---
  const handleOpenSettings = () => {
    setIsSettingsModalOpen(true);
  };

  const handleUpdateBackupPath = async (newPath: string) => {
    try {
      await updateBackupPath(newPath);
      setCurrentPath(newPath); // 同步本地状态
      const stored = await loadMetadata(); // 迁移后重新从新路径读取
      if (stored) setProjects(stored);
      showSuccess('备份路径更新成功');
    } catch (error: any) {
      throw error; // 抛出错误以便 Settings 弹窗显示错误信息
    }
  };

  const handleResetToDefaultPath = async () => {
    const defaultPath = await getDefaultBackupPath();
    if (defaultPath === currentPath) return;
    await handleUpdateBackupPath(defaultPath);
  };

  // --- 逻辑：下载版本 ---  
  const handleDownloadVersion = (version: ManuscriptVersion) => {
    try {
      const content = version.content;
      if (!content) {
        showError('该版本没有内容可供下载');
        return;
      }

      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // 生成带有版本号和日期的文件名
      const dateStr = new Date(version.metadata.timestamp).toISOString().split('T')[0];
      const baseName = version.metadata.originalName.split('.').slice(0, -1).join('.') || 'manuscript';
      const extension = version.metadata.originalName.split('.').pop() || 'txt';
      const fileName = `${baseName}_${version.metadata.versionLabel}_${dateStr}.${extension}`;
      
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showSuccess('下载成功');
    } catch (error) {
      console.error('下载失败:', error);
      showError('下载失败: ' + (error as Error).message);
    }
  };

  // --- 逻辑：版本对比 ---  
  const handleCompare = (versionId: string) => {
    if (!activeBranch) return;
    
    const versions = activeBranch.versions;
    const versionIndex = versions.findIndex(v => v.id === versionId);
    
    if (versionIndex >= 0 && versionIndex < versions.length - 1) {
      // 当前版本作为新版本，前一个版本作为旧版本
      const newVersion = versions[versionIndex];
      const oldVersion = versions[versionIndex + 1];
      
      setComparisonState({
        isOpen: true,
        oldVersionLabel: oldVersion.metadata.versionLabel,
        newVersionLabel: newVersion.metadata.versionLabel,
        oldContent: oldVersion.content,
        newContent: newVersion.content
      });
      
      setComparingVersionId(versionId);
    }
  };

  const handleCloseCompare = () => {
    setComparisonState({
      isOpen: false,
      oldVersionLabel: '',
      newVersionLabel: '',
      oldContent: '',
      newContent: ''
    });
    setComparingVersionId(null);
  };

  // 渲染逻辑保持您的原有 JSX 结构...
  // (为节省篇幅，以下仅展示关键变动点)

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      <Sidebar
        projects={projects}
        activeProjectId={activeProjectId}
        onSelectProject={(id) => { setActiveProjectId(id); setComparingVersionId(null); }}
        onDeleteProject={handleDeleteProject}
        onNewProject={() => setIsNewProjectModalOpen(true)}
        onOpenSettings={handleOpenSettings}
      />

      <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-slate-50/30">
        <div className="h-10 w-full bg-white shrink-0" style={{ WebkitAppRegion: 'drag' } as any}></div>

        <Navbar
          activeProject={activeProject || null}
          versionCount={versions.length}
          onUploadVersion={handleAddVersion}
          onDragEnter={(e) => { e.preventDefault(); setIsMainDragActive(true); }}
        >
          {activeProject && activeBranch && (
            <div className="mr-auto ml-4">
              <BranchSelector
                branches={activeProject.branches}
                activeBranchId={activeBranch.id}
                onChangeBranch={setActiveBranchId}
                onCreateBranch={(name) => {
                    const newBranch: Branch = {
                        id: `branch-${Date.now()}`,
                        name,
                        versions: [...activeBranch.versions],
                        createdAt: Date.now()
                    };
                    setProjects(prev => prev.map(p => p.id === activeProject.id ? { ...p, branches: [...p.branches, newBranch] } : p));
                    setActiveBranchId(newBranch.id);
                }}
              />
            </div>
          )}
        </Navbar>

        <div className="flex-1 flex overflow-hidden relative">
          <VersionList
            activeProject={activeProject || null}
            versions={versions}
            comparingVersionId={comparingVersionId}
            analyzingId={analyzingId}
            onCompare={handleCompare}
            onAnalyze={setAnalyzingId}
            onPreview={setPreviewingVersion}
            onDelete={handleDeleteVersion}
            onDownload={handleDownloadVersion}
          />
          <ComparisonDrawer
            isOpen={comparisonState.isOpen}
            oldVersionLabel={comparisonState.oldVersionLabel}
            newVersionLabel={comparisonState.newVersionLabel}
            oldContent={comparisonState.oldContent}
            newContent={comparisonState.newContent}
            onClose={handleCloseCompare}
          />
        </div>
      </main>

      {/* Settings Modal*/}
      <Settings
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        currentBackupPath={currentPath}
        onUpdateBackupPath={handleUpdateBackupPath}
        onResetToDefaultPath={handleResetToDefaultPath}
      />

      <ConfirmDialog
        isOpen={confirmation.isOpen}
        title={confirmation.title}
        message={confirmation.message}
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmation({ ...confirmation, isOpen: false })}
      />

      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onCreate={handleCreateProject}
      />

      <PreviewModal
        isOpen={!!previewingVersion}
        onClose={() => setPreviewingVersion(null)}
        version={previewingVersion}
        onOpenExternal={handleOpenExternal}
      />
      
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
};

export default App;