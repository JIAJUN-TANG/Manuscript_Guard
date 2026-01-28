import React, { useState } from 'react';
import { Branch } from '../types';
import { GitBranch, Plus } from './Icons';

interface BranchSelectorProps {
    branches: Branch[];
    activeBranchId: string;
    onChangeBranch: (branchId: string) => void;
    onCreateBranch: (name: string) => void;
}

export const BranchSelector: React.FC<BranchSelectorProps> = ({
    branches,
    activeBranchId,
    onChangeBranch,
    onCreateBranch
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newBranchName, setNewBranchName] = useState('');

    const activeBranch = branches.find(b => b.id === activeBranchId);

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newBranchName.trim()) {
            onCreateBranch(newBranchName.trim());
            setNewBranchName('');
            setIsCreating(false);
            setIsOpen(false);
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-medium transition-colors border border-slate-200"
            >
                <GitBranch className="w-3.5 h-3.5" />
                <span className="max-w-[100px] truncate">{activeBranch?.name || 'Branch'}</span>
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)}></div>
                    <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-2 border-b border-slate-50 bg-slate-50/50">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2 py-1">切换分支</h3>
                        </div>

                        <div className="max-h-48 overflow-y-auto py-1">
                            {branches.map(branch => (
                                <button
                                    key={branch.id}
                                    onClick={() => {
                                        onChangeBranch(branch.id);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between group ${activeBranchId === branch.id
                                        ? 'bg-indigo-50 text-indigo-700 font-medium'
                                        : 'text-slate-600 hover:bg-slate-50'
                                        }`}
                                >
                                    <span className="flex items-center gap-2">
                                        <GitBranch className={`w-3.5 h-3.5 ${activeBranchId === branch.id ? 'text-indigo-500' : 'text-slate-400'}`} />
                                        {branch.name}
                                    </span>
                                    {activeBranchId === branch.id && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="p-2 border-t border-slate-100 bg-slate-50">
                            {isCreating ? (
                                <form onSubmit={handleCreateSubmit} className="flex gap-2">
                                    <input
                                        type="text"
                                        autoFocus
                                        placeholder="分支名称"
                                        value={newBranchName}
                                        onChange={(e) => setNewBranchName(e.target.value)}
                                        className="flex-1 px-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:border-indigo-500"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newBranchName.trim()}
                                        className="px-2 py-1 bg-indigo-600 text-white rounded text-xs font-bold disabled:opacity-50"
                                    >
                                        添加
                                    </button>
                                </form>
                            ) : (
                                <button
                                    onClick={() => setIsCreating(true)}
                                    className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 text-slate-600 rounded-lg text-xs font-medium transition-colors"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    新建分支
                                </button>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
