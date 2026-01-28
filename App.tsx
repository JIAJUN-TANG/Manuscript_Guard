import React, { useState, useEffect, useRef } from 'react';
import { STORAGE_KEY } from './constants';
import { Project, ManuscriptVersion, Branch } from './types';
import { calculateHash, calculateSimilarity, determineVersionType, readFileContent } from './services/textUtils';
import { initStorage, saveMetadata, loadMetadata, saveSourceFile } from './services/storage';
import { FileText, UploadCloud, ExternalLink } from './components/Icons';
import { Modal } from './components/Modal';
import { BranchSelector } from './components/BranchSelector';
import { ConfirmDialog } from './components/ConfirmDialog';

// Components
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { VersionList } from './components/VersionList';
import { ComparisonDrawer } from './components/ComparisonDrawer';

const App: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeBranchId, setActiveBranchId] = useState<string | null>(null);

  // States for comparison and analysis
  const [comparingVersionId, setComparingVersionId] = useState<string | null>(null);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [previewingVersion, setPreviewingVersion] = useState<ManuscriptVersion | null>(null);

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

  // Load from Storage
  useEffect(() => {
    const loadProjects = async () => {
      await initStorage();
      const stored = await loadMetadata();
      if (stored) {
        setProjects(stored);
      }
    };
    loadProjects();
  }, []);

  // Save to Storage
  useEffect(() => {
    if (projects.length > 0) {
      saveMetadata(projects);
    }
  }, [projects]);


  const activeProject = projects.find(p => p.id === activeProjectId);
  // Safely access branches (migration safety)
  const branches = activeProject?.branches || [];
  const activeBranch = branches.find(b => b.id === activeBranchId) || branches[0] || null;
  const versions = activeBranch?.versions || [];

  // Update active branch when project changes
  useEffect(() => {
    if (activeProject && !activeBranchId) {
      // Default to defaultBranchId or the first branch
      const branches = activeProject.branches || [];
      setActiveBranchId(activeProject.defaultBranchId || branches[0]?.id || null);
    } else if (activeProject && activeBranchId) {
      // Verify active branch belongs to project
      const branches = activeProject.branches || [];
      const exists = branches.find(b => b.id === activeBranchId);
      if (!exists) {
        setActiveBranchId(activeProject.defaultBranchId || branches[0]?.id || null);
      }
    }
  }, [activeProjectId, activeProject, activeBranchId]);

  // --- Logic: Create New Project ---
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

      // Save source file to app storage
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

      setProjects(prev => {
        const updated = [newProject, ...prev];
        saveMetadata(updated); // Immediate save
        return updated;
      });
      setActiveProjectId(newProject.id);
      setActiveBranchId('branch-main'); // Set active branch to main

      // Reset and close
      setIsNewProjectModalOpen(false);
      setNewProjectName('');
      setNewProjectFile(null);
    } catch (error) {
      alert("Error creating project: " + (error as Error).message);
    }
  };

  // --- Logic: Add Version to Active Project ---
  const handleAddVersion = async (file: File) => {
    if (!activeProject || !activeBranch) return;

    try {
      const content = await readFileContent(file);
      const timestamp = Date.now();
      const hash = calculateHash(content);

      // Calculate similarity with previous version in CURRENT BRANCH
      const latestVersion = versions[0];
      const similarity = latestVersion
        ? calculateSimilarity(content, latestVersion.content)
        : 0;

      const changeType = determineVersionType(similarity, !latestVersion);

      // Calculate semantic version
      let versionLabel = 'V1.0.0';
      if (latestVersion) {
        // Parse previous version "V1.2.3" -> [1, 2, 3]
        const parts = latestVersion.metadata.versionLabel.replace(/^V/, '').split('.').map(Number);
        let [major, minor, patch] = parts.length === 3 ? parts : [1, 0, 0];

        if (changeType === 'Major Update') {
          major += 1;
          minor = 0;
          patch = 0;
        } else if (changeType === 'Minor Update') {
          minor += 1;
          patch = 0;
        } else {
          // Tweak or Initial (though initial handled by !latestVersion)
          patch += 1;
        }
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

      // Save to storage
      const storedPath = await saveSourceFile(file, newVersion.id);
      if (storedPath) {
        newVersion.metadata.storedPath = storedPath;
      }

      setProjects(prev => prev.map(p => {
        if (p.id === activeProject.id) {
          return {
            ...p,
            branches: p.branches.map(b =>
              b.id === activeBranch?.id
                ? { ...b, versions: [newVersion, ...b.versions] }
                : b
            ),
            lastModified: timestamp
          };
        }
        return p;
      }));
    } catch (error) {
      console.error("Failed to add version:", error);
      alert("Error adding version: " + (error as Error).message);
    }
  };

  // --- Logic: Delete Project ---
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
  }

  // --- Logic: Delete Version ---
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

  // --- Logic: Confirm Action Execution ---
  const handleConfirmAction = () => {
    setConfirmation({ ...confirmation, isOpen: false });

    if (confirmation.type === 'delete-project' && confirmation.id) {
      // Execute Project Deletion
      const projectId = confirmation.id;
      setProjects(prev => prev.filter(p => p.id !== projectId));
      if (activeProjectId === projectId) {
        setActiveProjectId(null);
        setActiveBranchId(null);
      }
    } else if (confirmation.type === 'delete-version' && confirmation.id) {
      // Execute Version Deletion
      const versionId = confirmation.id;
      if (!activeProject || !activeBranch) return;

      setProjects(prev => prev.map(p => {
        if (p.id === activeProject.id) {
          return {
            ...p,
            branches: p.branches.map(b => {
              if (b.id === activeBranch?.id) {
                // 1. Filter out deleted version
                const remainingVersions = b.versions.filter(v => v.id !== versionId);

                // 2. Sort oldest to newest for recalculation
                // (Assuming existing versions are Newest...Oldest, we reverse)
                const sorted = [...remainingVersions].reverse();

                // 3. Recalculate
                const recalculated: ManuscriptVersion[] = [];

                for (let i = 0; i < sorted.length; i++) {
                  const current = sorted[i];
                  const prev = i > 0 ? recalculated[i - 1] : null;

                  let similarity: number | null = null;
                  let changeType: any = 'Initial'; // using 'any' to match VersionType string
                  let versionLabel = 'V1.0.0';

                  if (prev) {
                    similarity = calculateSimilarity(current.content, prev.content);
                    changeType = determineVersionType(similarity, false);

                    // Semantic Version Logic
                    const parts = prev.metadata.versionLabel.replace(/^V/, '').split('.').map(Number);
                    let [major, minor, patch] = parts.length === 3 ? parts : [1, 0, 0];

                    if (changeType === 'Major Update') {
                      major += 1; minor = 0; patch = 0;
                    } else if (changeType === 'Minor Update') {
                      minor += 1; patch = 0;
                    } else {
                      patch += 1;
                    }
                    versionLabel = `V${major}.${minor}.${patch}`;
                  }

                  recalculated.push({
                    ...current,
                    metadata: {
                      ...current.metadata,
                      versionLabel
                    },
                    similarityToPrevious: similarity,
                    changeType
                  });
                }

                // 4. Reverse back to Newest...Oldest
                return { ...b, versions: recalculated.reverse() };
              }
              return b;
            })
          };
        }
        return p;
      }));
      // If we deleted the version being compared or analyzed, reset those states
      if (comparingVersionId === versionId) setComparingVersionId(null);
      if (analyzingId === versionId) setAnalyzingId(null);
      if (previewingVersion?.id === versionId) setPreviewingVersion(null);
    }
  };



  const handleCreateBranch = (name: string) => {
    if (!activeProject || !activeBranch) return;

    const newBranch: Branch = {
      id: `branch-${Date.now()}`,
      name: name,
      // Clone current branch versions? Or start fresh?
      // Requirement: "similar to github" -> usually branches off from current state
      versions: [...activeBranch.versions],
      createdAt: Date.now()
    };

    setProjects(prev => prev.map(p => {
      if (p.id === activeProject.id) {
        return {
          ...p,
          branches: [...p.branches, newBranch]
        };
      }
      return p;
    }));
    setActiveBranchId(newBranch.id);
  };

  // --- 分析的逻辑 ---
  const handleAnalyze = async (version: ManuscriptVersion) => {
    alert("AI分析暂不可用");
    return;
  };

  // Drag Handlers for Main Area
  const handleMainDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!activeProject) return;
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsMainDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsMainDragActive(false);
    }
  };

  const handleMainDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMainDragActive(false);
    if (activeProject && e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleAddVersion(e.dataTransfer.files[0]);
    }
  };

  // Helper for Comparison Drawer
  const comparisonBaseVersion = comparingVersionId
    ? activeBranch?.versions.find(v => v.id === comparingVersionId)
    : null;
  const comparisonTargetVersion = comparingVersionId
    ? activeBranch?.versions[activeBranch.versions.findIndex(v => v.id === comparingVersionId) + 1]
    : null;

  const handleDownloadVersion = (version: ManuscriptVersion) => {
    const blob = new Blob([version.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;

    // Format date as YYYYMMDD
    const date = new Date(version.metadata.timestamp);
    const dateStr = date.toISOString().split('T')[0];

    a.download = `${version.metadata.versionLabel}-${dateStr}-${version.metadata.originalName}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleOpenExternal = async () => {
    if (!previewingVersion) return;
    try {
      const { shell } = window.require('electron');

      // If we have a stored path (original file), open that directly!
      if (previewingVersion.metadata.storedPath) {
        await shell.openPath(previewingVersion.metadata.storedPath);
        return;
      }

      // Fallback for legacy files or non-stored files: create temp
      const fs = window.require('fs');
      const path = window.require('path');
      const os = window.require('os');

      const tempDir = os.tmpdir();
      let fileName = previewingVersion.metadata.originalName;
      if (fileName.toLowerCase().endsWith('.docx')) {
        fileName = fileName.replace(/\.docx$/i, '.txt');
      }

      const tempPath = path.join(tempDir, `preview-${Date.now()}-${fileName}`);
      fs.writeFileSync(tempPath, previewingVersion.content);

      await shell.openPath(tempPath);
    } catch (error) {
      console.error('Failed to open external:', error);
      alert('无法调用外部程序打开文件 (仅支持 Electron 环境)');
    }
  };


  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">

      <Sidebar
        projects={projects}
        activeProjectId={activeProjectId}
        onSelectProject={(id) => { setActiveProjectId(id); setComparingVersionId(null); }}
        onDeleteProject={handleDeleteProject}
        onNewProject={() => setIsNewProjectModalOpen(true)}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-slate-50/30">

        {/* Electron Title Bar Drag Region */}
        <div className="h-8 w-full bg-transparent shrink-0" style={{ WebkitAppRegion: 'drag' } as any}></div>

        <Navbar
          activeProject={activeProject || null}
          versionCount={versions.length}
          onUploadVersion={handleAddVersion}
          onDragEnter={handleMainDrag}
        >
          {/* Inject Branch Selector if active project */}
          {activeProject && activeBranch && (
            <div className="mr-auto ml-4">
              <BranchSelector
                branches={activeProject.branches}
                activeBranchId={activeBranch.id}
                onChangeBranch={setActiveBranchId}
                onCreateBranch={handleCreateBranch}
              />
            </div>
          )}
        </Navbar>

        {/* Upload Version Drag Overlay */}
        {isMainDragActive && activeProject && (
          <div
            className="absolute inset-0 top-16 bg-white/80 backdrop-blur-md z-50 flex items-center justify-center animate-in fade-in duration-200"
            onDragEnter={handleMainDrag}
            onDragLeave={handleMainDrag}
            onDragOver={handleMainDrag}
            onDrop={handleMainDrop}
          >
            <div className="border-4 border-indigo-500/50 border-dashed rounded-3xl p-12 text-center animate-bounce">
              <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                <UploadCloud className="w-12 h-12 text-indigo-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800">Add version to "{activeProject.name}"</h3>
              <p className="text-slate-500 mt-2 font-medium">Release to upload and analyze changes</p>
            </div>
          </div>
        )}



        <div className="flex-1 flex overflow-hidden relative">
          <VersionList
            activeProject={activeProject || null}
            versions={versions} // Pass explicit versions from branch
            comparingVersionId={comparingVersionId}
            analyzingId={analyzingId}
            onCompare={(id) => setComparingVersionId(comparingVersionId === id ? null : id)}
            onAnalyze={handleAnalyze}
            onPreview={setPreviewingVersion}
            onDownload={handleDownloadVersion}
            onDelete={handleDeleteVersion}
          />

          <ComparisonDrawer
            isOpen={!!comparingVersionId}
            onClose={() => setComparingVersionId(null)}
            oldVersionLabel={comparisonTargetVersion?.metadata.versionLabel}
            newVersionLabel={comparisonBaseVersion?.metadata.versionLabel}
            oldContent={comparisonTargetVersion?.content}
            newContent={comparisonBaseVersion?.content}
          />
        </div>
      </main>

      {/* New Project Modal */}
      <Modal
        isOpen={isNewProjectModalOpen}
        onClose={() => { setIsNewProjectModalOpen(false); setNewProjectFile(null); setNewProjectName(''); }}
        title="创建新项目"
      >
        <form onSubmit={(e) => {
          e.preventDefault();
          if (newProjectFile) {
            const name = newProjectName.trim() || newProjectFile.name.split('.')[0];
            handleCreateProject(name, newProjectFile);
          }
        }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">项目名称 (可选)</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="例如：论文初稿"
              value={newProjectName}
              onChange={e => setNewProjectName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">初始手稿</label>
            <div
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${newProjectFile ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'}`}
              onClick={() => newProjectFileInputRef.current?.click()}
            >
              <input
                ref={newProjectFileInputRef}
                type="file"
                className="hidden"
                accept=".txt,.md,.docx"
                onChange={(e) => e.target.files && setNewProjectFile(e.target.files[0])}
              />
              {newProjectFile ? (
                <div className="flex items-center justify-center gap-2 text-indigo-700 font-medium">
                  <FileText className="w-5 h-5" />
                  {newProjectFile.name}
                </div>
              ) : (
                <div className="text-slate-500">
                  <UploadCloud className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                  <span className="text-sm">点击选择初始手稿</span>
                </div>
              )}
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsNewProjectModalOpen(false)}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!newProjectFile}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold shadow-md transition-all active:scale-95"
            >
              创建项目
            </button>
          </div>
        </form>
      </Modal>

      {/* Preview Modal */}
      <Modal
        isOpen={!!previewingVersion}
        onClose={() => setPreviewingVersion(null)}
        title={previewingVersion ? `预览: ${previewingVersion.metadata.versionLabel} - ${previewingVersion.metadata.originalName}` : '预览'}
        size="full"
      >
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50 rounded-lg font-mono text-base whitespace-pre-wrap leading-relaxed border border-slate-200 shadow-inner">
          <div className="max-w-5xl mx-auto bg-white p-12 min-h-full shadow-sm">
            {previewingVersion?.content}
          </div>
        </div>
        <div className="pt-4 flex justify-end gap-3 shrink-0">
          <button
            onClick={handleOpenExternal}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <ExternalLink className="w-4 h-4" />
            使用其他应用打开
          </button>
          <button
            onClick={() => setPreviewingVersion(null)}
            className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300 transition-colors"
          >
            关闭预览
          </button>
        </div>
      </Modal>

      {/* Custom Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmation.isOpen}
        title={confirmation.title}
        message={confirmation.message}
        confirmLabel="删除"
        cancelLabel="取消"
        isDangerous={true}
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmation({ ...confirmation, isOpen: false })}
      />
    </div>
  );
};

export default App;