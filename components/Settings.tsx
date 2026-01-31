import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';

declare global {
  interface Window {
    electronAPI: {
      openFolderDialog: (defaultPath: string) => Promise<string | undefined>;
      getDefaultBackupPath: () => Promise<string>;
      updateBackupLocation: (paths: { oldPath: string; newPath: string }) => Promise<{ success: boolean }>;
      joinPaths: (...args: string[]) => string;
    };
  }
}

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  currentBackupPath: string;
  onUpdateBackupPath: (newPath: string) => Promise<void>;
  onResetToDefaultPath: () => Promise<void>;
}

export const Settings: React.FC<SettingsProps> = ({
  isOpen,
  onClose,
  currentBackupPath,
  onUpdateBackupPath,
  onResetToDefaultPath
}) => {
  const [newPath, setNewPath] = useState(currentBackupPath);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 当外部路径变化或打开弹窗时，同步本地状态
  useEffect(() => {
    if (isOpen) {
      setNewPath(currentBackupPath);
      setError(null);
    }
  }, [isOpen, currentBackupPath]);

  const handleSelectPath = async () => {
    try {
      const api = window.electronAPI;
      if (api?.openFolderDialog) {
        const selectedPath = await api.openFolderDialog(newPath || currentBackupPath);
        if (selectedPath) {
          setNewPath(selectedPath);
          setError(null);
        }
      } else {
        setError('无法调用系统对话框，请检查环境');
      }
    } catch (err) {
      console.error('Select directory error:', err);
      setError('打开文件夹选择器失败');
    }
  };

  const handleSave = async () => {
    if (!newPath || newPath === currentBackupPath) {
      onClose();
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 调用父组件传入的更新逻辑
      await onUpdateBackupPath(newPath);
      onClose();
    } catch (err: any) {
      console.error('Failed to update backup path:', err);
      setError(err.message || '迁移文件失败，请确保目标路径有写入权限');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await onResetToDefaultPath();
    } catch (err) {
      setError('恢复默认路径失败');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="应用设置"
    >
      <div className="space-y-6">
        {/* 备份路径设置区 */}
        <div>
          <h3 className="text-sm font-semibold text-slate-800 mb-2">数据存储位置</h3>
          <p className="text-xs text-slate-500 mb-4">
            所有的论文版本和附件将存储在以下目录：
          </p>
          
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newPath}
                readOnly
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none"
                placeholder="未选择路径"
              />
              <button
                onClick={handleSelectPath}
                disabled={isLoading}
                className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                浏览...
              </button>
            </div>
            
            <div className="flex justify-start">
              <button
                onClick={handleReset}
                disabled={isLoading}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium underline underline-offset-4"
              >
                恢复默认存储路径
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-3 p-2 bg-red-50 border border-red-100 rounded text-xs text-red-600">
              ⚠️ {error}
            </div>
          )}

          <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-100">
            <p className="text-[11px] text-amber-700 leading-relaxed">
              <strong>注意：</strong> 修改路径后，系统会自动将现有的所有手稿备份和数据库搬迁至新位置。请确保迁移过程中不要关闭程序。
            </p>
          </div>
        </div>

        {/* 底部操作栏 */}
        <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading || !newPath || newPath === currentBackupPath}
            className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              isLoading 
                ? 'bg-slate-300 cursor-not-allowed text-white' 
                : 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95'
            }`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                同步迁移中...
              </>
            ) : '应用更改'}
          </button>
        </div>
      </div>
    </Modal>
  );
};