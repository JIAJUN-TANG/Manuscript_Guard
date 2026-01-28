import React, { useMemo } from 'react';
import * as Diff from 'diff';

interface DiffViewerProps {
  oldContent: string;
  newContent: string;
  mode?: 'inline' | 'split';
}

const DiffViewer: React.FC<DiffViewerProps> = ({ oldContent, newContent, mode = 'split' }) => {
  const [diffs, setDiffs] = React.useState<Diff.Change[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    setIsLoading(true);
    // Use setTimeout to allow the UI to render the loading state before the heavy diff calculation
    const timer = setTimeout(() => {
      const result = Diff.diffWords(oldContent, newContent);
      setDiffs(result);
      setIsLoading(false);
    }, 100);
    return () => clearTimeout(timer);
  }, [oldContent, newContent]);

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-4">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium text-sm animate-pulse">正在比对文件差异...</p>
      </div>
    );
  }

  if (mode === 'split') {
    return (
      <div className="flex h-full font-mono text-sm leading-7 text-slate-600 divide-x divide-slate-200">
        {/* Left: Old Version */}
        <div className="w-1/2 p-6 overflow-y-auto custom-scrollbar bg-white">
          <h4 className="mb-4 font-bold text-slate-400 text-xs uppercase tracking-wider sticky top-0 bg-white pb-2 border-b border-slate-100">Old Version</h4>
          <div className="prose prose-sm max-w-none whitespace-pre-wrap">
            {diffs.map((part, index) => {
              if (part.added) return null; // Don't show added parts in old version
              return (
                <span
                  key={index}
                  className={part.removed ? 'bg-red-100 text-red-800 line-through decoration-red-300' : ''}
                >
                  {part.value}
                </span>
              );
            })}
          </div>
        </div>

        {/* Right: New Version */}
        <div className="w-1/2 p-6 overflow-y-auto custom-scrollbar bg-slate-50/30">
          <h4 className="mb-4 font-bold text-slate-400 text-xs uppercase tracking-wider sticky top-0 bg-slate-50/30 pb-2 border-b border-slate-100">New Version</h4>
          <div className="prose prose-sm max-w-none whitespace-pre-wrap">
            {diffs.map((part, index) => {
              if (part.removed) return null; // Don't show removed parts in new version
              return (
                <span
                  key={index}
                  className={part.added ? 'bg-green-100 text-green-800' : ''}
                >
                  {part.value}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6 custom-scrollbar font-mono text-sm leading-7 text-slate-600">
      <div className="prose prose-sm max-w-none">
        {diffs.map((part, index) => {
          const colorClass = part.added
            ? 'bg-green-100 text-green-800 border-b-2 border-green-200 mx-0.5 px-0.5 rounded-t'
            : part.removed
              ? 'bg-red-50 text-red-400 line-through decoration-red-300 opacity-70 mx-0.5'
              : 'text-slate-500';
          return (
            <span key={index} className={colorClass}>
              {part.value}
            </span>
          );
        })}
      </div>
    </div>
  );
};

export default DiffViewer;