import React, { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose, duration = 3000 }) => {
  const [visible, setVisible] = useState(true);
  const [opacity, setOpacity] = useState(0);
  const [translateY, setTranslateY] = useState(-20);

  useEffect(() => {
    // 淡入动画
    const fadeInTimer = setTimeout(() => {
      setOpacity(1);
      setTranslateY(0);
    }, 100);

    // 自动关闭
    const closeTimer = setTimeout(() => {
      setVisible(false);
      setOpacity(0);
      setTranslateY(-20);
      setTimeout(onClose, 300);
    }, duration);

    return () => {
      clearTimeout(fadeInTimer);
      clearTimeout(closeTimer);
    };
  }, [duration, onClose]);

  if (!visible) return null;

  const typeClasses = {
    success: 'bg-emerald-500 text-white border-emerald-600/30',
    error: 'bg-red-500 text-white border-red-600/30',
    info: 'bg-indigo-500 text-white border-indigo-600/30'
  };

  const iconClasses = {
    success: 'w-5 h-5 text-emerald-100',
    error: 'w-5 h-5 text-red-100',
    info: 'w-5 h-5 text-indigo-100'
  };

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${typeClasses[type]} transition-all duration-300 ease-out`}
        style={{
          opacity,
          transform: `translateY(${translateY}px)`
        }}
      >
        {/* Icon */}
        <div className="flex-shrink-0">
          {type === 'success' && (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={iconClasses[type]}>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          )}
          {type === 'error' && (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={iconClasses[type]}>
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          )}
          {type === 'info' && (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={iconClasses[type]}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          )}
        </div>

        {/* Message */}
        <div className="flex-1 text-sm font-medium">
          {message}
        </div>

        {/* Close Button */}
        <button
          onClick={() => {
            setVisible(false);
            setOpacity(0);
            setTranslateY(-20);
            setTimeout(onClose, 300);
          }}
          className="flex-shrink-0 p-1 rounded-full hover:bg-white/20 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/80">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
};