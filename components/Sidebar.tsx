import React, { useState } from 'react';
import { Project } from '../types';
import { FileText, Trash2, ChevronLeft, ChevronRight } from './Icons';

interface SidebarProps {
    projects: Project[];
    activeProjectId: string | null;
    onSelectProject: (projectId: string) => void;
    onDeleteProject: (e: React.MouseEvent, projectId: string) => void;
    onNewProject: () => void;
    onOpenSettings: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
    projects,
    activeProjectId,
    onSelectProject,
    onDeleteProject,
    onNewProject,
    onOpenSettings,
}) => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <aside className={`${isCollapsed ? 'w-20' : 'w-80'} bg-white border-r border-slate-200 flex flex-col shadow-lg z-20 transition-all duration-300 ease-in-out relative`}>
            {/* Drag region for electron window moving */}
            <div className="h-8 w-full bg-transparent shrink-0" style={{ WebkitAppRegion: 'drag' } as any}></div>

            <div className="px-6 pb-6 pt-2 border-b border-slate-100 bg-white sticky top-0 z-10">
                <div className="flex items-center gap-3 text-indigo-700 mb-6">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                        <FileText className="w-5 h-5" />
                    </div>
                    {!isCollapsed && (
                        <div className="transition-all duration-300 ease-in-out">
                            <h1 className="text-xl font-bold tracking-tight leading-none">ManuscriptGuard</h1>
                            <p className="text-[10px] text-slate-400 font-medium mt-1 uppercase tracking-wider">手稿版本管理</p>
                        </div>
                    )}
                </div>

                {!isCollapsed && (
                    <button
                        onClick={onNewProject}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-slate-200 active:scale-95 group"
                    >
                        <span className="text-lg leading-none mb-0.5">+</span>
                        新建项目
                    </button>
                )}
                {isCollapsed && (
                    <button
                        onClick={onNewProject}
                        className="w-full flex items-center justify-center gap-2 px-2 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-slate-200 active:scale-95 group"
                        title="新建项目"
                    >
                        <span className="text-lg leading-none mb-0.5">+</span>
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                {!isCollapsed && projects.length === 0 && (
                    <div className="text-center py-10">
                        <p className="text-sm text-slate-400">还没有项目。</p>
                        <p className="text-xs text-slate-300 mt-1">点击“新建项目”开始。</p>
                    </div>
                )}
                {!isCollapsed && projects.map((project, index) => (
                    <div
                        key={project.id}
                        onClick={() => onSelectProject(project.id)}
                        className={`group relative flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 ease-out animate-fade-in-up ${activeProjectId === project.id
                            ? 'bg-indigo-50 text-indigo-900 font-medium shadow-sm ring-1 ring-indigo-200'
                            : 'hover:bg-slate-50 text-slate-600 hover:text-slate-900'
                            }`}
                        style={{ animationDelay: `${index * 50}ms` }}
                    >
                        <div className="truncate flex-1 pr-8 transition-all duration-300 ease-in-out">
                            <div className="truncate">{project.name}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">{new Date(project.lastModified).toLocaleDateString()}</div>
                        </div>

                        {/* Type Badge */}
                        <span className={`absolute right-10 text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${activeProjectId === project.id ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                            {project.type}
                        </span>

                        <button
                            onClick={(e) => onDeleteProject(e, project.id)}
                            className="absolute right-2 opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-100 hover:text-red-600 rounded-md transition-all"
                            title="删除项目"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                ))}
            </div>

            {/* Settings Button */}
            <div className="p-4 border-t border-slate-100">
                {!isCollapsed && (
                    <button
                        onClick={onOpenSettings}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-all active:scale-95"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                            <circle cx="12" cy="12" r="3" />
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                        </svg>
                        设置
                    </button>
                )}
                {isCollapsed && (
                    <button
                        onClick={onOpenSettings}
                        className="w-full flex items-center justify-center gap-2 px-2 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-all active:scale-95"
                        title="设置"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                            <circle cx="12" cy="12" r="3" />
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Collapse/Expand Button at Middle Right Edge */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute top-1/2 -right-4 transform -translate-y-1/2 p-2 rounded-full bg-white shadow-lg hover:bg-slate-100 transition-all z-30"
                title={isCollapsed ? '展开侧边栏' : '收起侧边栏'}
            >
                {isCollapsed ? (
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                ) : (
                    <ChevronLeft className="w-4 h-4 text-slate-500" />
                )}
            </button>
        </aside>
    );
};
