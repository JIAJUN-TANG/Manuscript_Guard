import React from 'react';
import { ManuscriptVersion, Project } from '../types';
import { GitCommit, Clock, GitDiff, Sparkles, Eye, Trash2, FileText, Download, UploadCloud } from './Icons';
import { getVersionColor } from '../services/textUtils';

interface VersionListProps {
    activeProject: Project | null;
    versions: ManuscriptVersion[];
    comparingVersionId: string | null;
    analyzingId: string | null;
    onCompare: (versionId: string) => void;
    onAnalyze: (version: ManuscriptVersion) => void;
    onPreview: (version: ManuscriptVersion) => void;
    onDownload: (version: ManuscriptVersion) => void;
    onDelete: (e: React.MouseEvent, versionId: string) => void;
}

export const VersionList: React.FC<VersionListProps> = ({
    activeProject,
    versions,
    comparingVersionId,
    analyzingId,
    onCompare,
    onAnalyze,
    onPreview,
    onDownload,
    onDelete,
}) => {
    if (!activeProject) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-fade-in-up">
                <div className="w-32 h-32 bg-slate-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
                    <FileText className="w-16 h-16 text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-700">未选择项目</h3>
                <p className="text-slate-400 mt-2 max-w-sm">从侧边栏选择一个项目查看历史记录，或点击“新建项目”开始跟踪新手稿。</p>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar scroll-smooth">
            {versions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 animate-fade-in-up">
                    <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <UploadCloud className="w-10 h-10 text-slate-300" />
                    </div>
                    <p>尚无版本记录</p>
                    <p className="text-sm mt-2">上传文件以开始记录版本历史</p>
                </div>
            ) : (
                <div className="max-w-4xl mx-auto space-y-8 pb-10">
                    {versions.map((version, idx) => {
                        const isLatest = idx === 0;
                        return (
                            <div
                                key={version.id}
                                className={`relative pl-8 animate-fade-in-up`}
                                style={{ animationDelay: `${idx * 100}ms` }}
                            >
                                {/* Timeline Line */}
                                {idx !== versions.length - 1 && (
                                    <div className="absolute left-[13px] top-8 bottom-[-32px] w-0.5 bg-slate-200/80 rounded-full"></div>
                                )}

                                {/* Timeline Dot */}
                                <div className={`absolute left-0 top-3 w-[26px] h-[26px] rounded-full border-[3px] flex items-center justify-center z-10 bg-white transition-all duration-300 ${isLatest
                                    ? 'border-indigo-500 text-indigo-500 shadow-[0_0_0_4px_rgba(99,102,241,0.15)]'
                                    : 'border-slate-300 text-slate-300'
                                    }`}>
                                    {isLatest && <div className="absolute inset-0 rounded-full animate-pulse-ring"></div>}
                                    <GitCommit className="w-3.5 h-3.5" />
                                </div>

                                {/* Card */}
                                <div className={`
                        bg-white rounded-2xl p-5 border transition-all duration-300 ease-out
                        ${isLatest ? 'shadow-lg border-indigo-100/50' : 'shadow-sm border-slate-200 hover:shadow-md hover:border-slate-300'}
                        group hover:-translate-y-1
                   `}>
                                    {/* Header */}
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <span className="font-bold text-slate-800 text-xl tracking-tight">{version.metadata.versionLabel}</span>
                                                <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold tracking-wide border shadow-sm uppercase ${getVersionColor(version.changeType)}`}>
                                                    {version.changeType}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-slate-500 mt-2 font-medium">
                                                <div className="flex items-center gap-1.5">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    <span>{new Date(version.metadata.timestamp).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
                                                </div>
                                                {version.similarityToPrevious !== null && (
                                                    <>
                                                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                        <span className={`${version.similarityToPrevious > 90 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                            相似度：{version.similarityToPrevious.toFixed(1)}%
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                                            {version.similarityToPrevious !== null && (
                                                <>
                                                    <button
                                                        onClick={() => onCompare(version.id)}
                                                        className={`
                                        flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border
                                        ${comparingVersionId === version.id
                                                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md transform scale-105'
                                                                : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50'}
                                    `}
                                                    >
                                                        <GitDiff className="w-3.5 h-3.5" />
                                                        {comparingVersionId === version.id ? '计算差异中...' : '查看差异'}
                                                    </button>
                                                    {/* AI Analysis Button - Temporarily Disabled */}
                                                    {/* <button
                                                        onClick={() => onAnalyze(version)}
                                                        disabled={analyzingId === version.id}
                                                        className={`
                                        flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border border-slate-200
                                        bg-white hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200
                                        disabled:opacity-50 disabled:cursor-not-allowed
                                    `}
                                                    >
                                                        <Sparkles className={`w-3.5 h-3.5 ${analyzingId === version.id ? 'animate-spin' : ''}`} />
                                                        智能总结
                                                    </button> */}
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Footer: Metadata & Actions */}
                                    <div className="flex justify-between items-end mt-4">
                                        {/* Metadata Badges */}
                                        <div className="flex flex-wrap gap-2 text-[10px] text-slate-500 font-mono">
                                            <span className="bg-slate-100 px-2 py-1 rounded-md border border-slate-200/50">
                                                原始文件名：{version.metadata.originalName}
                                            </span>
                                            <span className="bg-slate-100 px-2 py-1 rounded-md border border-slate-200/50">
                                                哈希值：{version.metadata.hash.substring(0, 8)}
                                            </span>
                                            <span className="bg-slate-100 px-2 py-1 rounded-md border border-slate-200/50">
                                                文件大小：{(version.metadata.size / 1024).toFixed(1)} KB
                                            </span>
                                        </div>

                                        {/* Actions (Preview & Delete) */}
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity pb-0.5">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onPreview(version); }}
                                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                                                title="预览文件"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onDownload(version); }}
                                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                                                title="下载文件"
                                            >
                                                <Download className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onDelete(e, version.id); }}
                                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                                title="删除版本"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* AI Analysis Result */}
                                    {version.aiAnalysis && (
                                        <div className="mt-4 pt-4 border-t border-slate-100 animate-in slide-in-from-top-2 fade-in duration-500">
                                            <div className="flex items-center gap-2 text-xs font-bold text-purple-700 mb-2.5">
                                                <div className="p-1 bg-purple-100 rounded-md">
                                                    <Sparkles className="w-3 h-3" />
                                                </div>
                                                智能总结
                                            </div>
                                            <div className="text-sm text-slate-700 leading-relaxed bg-gradient-to-br from-purple-50/80 to-white p-4 rounded-xl border border-purple-100/80 shadow-sm prose prose-sm max-w-none">
                                                <div dangerouslySetInnerHTML={{ __html: version.aiAnalysis.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<b class="text-purple-900">$1</b>') }} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    );
};
