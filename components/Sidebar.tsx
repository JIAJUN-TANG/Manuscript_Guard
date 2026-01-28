import React from 'react';
import { Project } from '../types';
import { FileText, Trash2 } from './Icons';

interface SidebarProps {
    projects: Project[];
    activeProjectId: string | null;
    onSelectProject: (projectId: string) => void;
    onDeleteProject: (e: React.MouseEvent, projectId: string) => void;
    onNewProject: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
    projects,
    activeProjectId,
    onSelectProject,
    onDeleteProject,
    onNewProject,
}) => {
    return (
        <aside className="w-80 bg-white border-r border-slate-200 flex flex-col shadow-lg z-20 transition-all duration-300">
            {/* Drag region for electron window moving */}
            <div className="h-8 w-full bg-transparent shrink-0" style={{ WebkitAppRegion: 'drag' } as any}></div>

            <div className="px-6 pb-6 pt-2 border-b border-slate-100 bg-white sticky top-0 z-10">
                <div className="flex items-center gap-3 text-indigo-700 mb-6">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                        <FileText className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight leading-none">ManuscriptGuard</h1>
                        <p className="text-[10px] text-slate-400 font-medium mt-1 uppercase tracking-wider">手稿版本管理</p>
                    </div>
                </div>

                <button
                    onClick={onNewProject}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-slate-200 active:scale-95 group"
                >
                    <span className="text-lg leading-none mb-0.5">+</span>
                    新建项目
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                {projects.length === 0 && (
                    <div className="text-center py-10">
                        <p className="text-sm text-slate-400">还没有项目。</p>
                        <p className="text-xs text-slate-300 mt-1">点击“新建项目”开始。</p>
                    </div>
                )}
                {projects.map((project, index) => (
                    <div
                        key={project.id}
                        onClick={() => onSelectProject(project.id)}
                        className={`group relative flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 ease-out animate-fade-in-up ${activeProjectId === project.id
                            ? 'bg-indigo-50 text-indigo-900 font-medium shadow-sm ring-1 ring-indigo-200'
                            : 'hover:bg-slate-50 text-slate-600 hover:text-slate-900'
                            }`}
                        style={{ animationDelay: `${index * 50}ms` }}
                    >
                        <div className="truncate flex-1 pr-8">
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
                            title="Delete Project"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                ))}
            </div>
        </aside>
    );
};
