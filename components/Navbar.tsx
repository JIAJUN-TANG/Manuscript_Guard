import React, { useRef } from 'react';
import { Project } from '../types';
import { UploadCloud } from './Icons';

interface NavbarProps {
    activeProject: Project | null;
    versionCount?: number;
    onUploadVersion: (file: File) => void;
    onDragEnter: (e: React.DragEvent) => void;
    children?: React.ReactNode;
}

export const Navbar: React.FC<NavbarProps> = ({ activeProject, versionCount, onUploadVersion, onDragEnter, children }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    return (
        <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md flex items-center justify-between px-8 shadow-sm z-10 shrink-0 sticky top-0">
            <div className="flex items-center gap-4 min-w-0">
                <h2 className="text-lg font-bold text-slate-800 truncate">
                    {activeProject ? activeProject.name : 'Dashboard'}
                </h2>
                {activeProject && versionCount !== undefined && (
                    <span className="hidden xl:inline-block px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-mono font-medium border border-indigo-100 whitespace-nowrap">
                        {versionCount} 个版本
                    </span>
                )}
                {children}
            </div>

            {activeProject && (
                <div
                    onDragEnter={onDragEnter}
                    className="relative"
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept=".txt,.md,.docx"
                        onChange={(e) => e.target.files?.[0] && onUploadVersion(e.target.files[0])}
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="group flex items-center gap-2 px-3 xl:px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-full text-sm font-semibold transition-all shadow-lg shadow-indigo-200 hover:shadow-indigo-300 active:scale-95 whitespace-nowrap"
                    >
                        <UploadCloud className="w-4 h-4" />
                        <span className="hidden xl:inline">上传新版本</span>
                    </button>
                </div>
            )}
        </header>
    );
};
