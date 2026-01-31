import React from 'react';
import { Modal } from './Modal';
import { ManuscriptVersion } from '../types';
import { Eye, ExternalLink, FileText, Clock } from './Icons';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  version: ManuscriptVersion | null;
  onOpenExternal: () => void;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({ isOpen, onClose, version, onOpenExternal }) => {
  if (!version) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="预览版本" size="full">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-slate-800">{version.metadata.versionLabel}</span>
              <span className="text-sm text-slate-500">{version.changeType}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
              <Clock className="w-3 h-3" />
              <span>{new Date(version.metadata.timestamp).toLocaleString()}</span>
              <span className="mx-1">•</span>
              <span>{(version.metadata.size / 1024).toFixed(1)} KB</span>
              <span className="mx-1">•</span>
              <span>{version.metadata.originalName}</span>
            </div>
          </div>
          <button
            onClick={onOpenExternal}
            className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors"
            title="在外部程序中打开"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            外部打开
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 bg-slate-50 rounded-lg border border-slate-200">
          <div className="max-w-4xl mx-auto">
            {version.content ? (
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap break-words text-sm text-slate-800">
                  {version.content}
                </pre>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                <FileText className="w-12 h-12 mb-3" />
                <p>文件内容为空</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </Modal>
  );
};
