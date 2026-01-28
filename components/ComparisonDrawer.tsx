import React from 'react';
import DiffViewer from './DiffViewer';
import { GitDiff, ChevronRight } from './Icons';

interface ComparisonDrawerProps {
    isOpen: boolean;
    oldVersionLabel?: string;
    newVersionLabel?: string;
    oldContent?: string;
    newContent?: string;
    onClose: () => void;
}

export const ComparisonDrawer: React.FC<ComparisonDrawerProps> = ({
    isOpen,
    oldVersionLabel,
    newVersionLabel,
    oldContent,
    newContent,
    onClose
}) => {
    if (!isOpen || !oldContent || !newContent) return null;

    // Using Modal style instead of Drawer
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 animate-in fade-in">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>

            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[95vw] h-[90vh] flex flex-col overflow-hidden z-50 animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="h-16 border-b border-slate-100 flex items-center justify-between px-6 bg-slate-50/50 backdrop-blur-md shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-md">
                            <GitDiff className="w-4 h-4" />
                        </div>
                        <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2">
                            <span>版本对比</span>
                            <span className="text-slate-300">|</span>
                            <span className="text-red-500 line-through decoration-red-300 opacity-70">{oldVersionLabel}</span>
                            <ChevronRight className="w-3 h-3 text-slate-400" />
                            <span className="text-green-600">{newVersionLabel}</span>
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden p-0 bg-white">
                    <DiffViewer oldContent={oldContent} newContent={newContent} mode="split" />
                </div>
            </div>
        </div>
    );
};
