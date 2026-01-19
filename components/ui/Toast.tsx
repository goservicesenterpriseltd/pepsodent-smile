'use client';

import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import { toastStore, type Toast } from '@/stores/ToastStore';

const ToastItem = observer(({ toast }: { toast: Toast }) => {
  const getToastStyles = () => {
    switch (toast.type) {
      case 'error':
        return {
          bg: 'bg-gradient-to-r from-[#e60012] to-[#ff1a2e]',
          border: 'border-[#e60012]',
          icon: '⚠️',
        };
      case 'warning':
        return {
          bg: 'bg-gradient-to-r from-[#ff9800] to-[#ffb74d]',
          border: 'border-[#ff9800]',
          icon: '⚡',
        };
      case 'success':
        return {
          bg: 'bg-gradient-to-r from-[#10b981] to-[#34d399]',
          border: 'border-[#10b981]',
          icon: '✅',
        };
      case 'info':
      default:
        return {
          bg: 'bg-gradient-to-r from-[#003366] to-[#004d99]',
          border: 'border-[#003366]',
          icon: 'ℹ️',
        };
    }
  };

  const styles = getToastStyles();

  return (
    <div
      className={`
        ${styles.bg}
        ${styles.border}
        border-2
        text-white
        px-6 py-4
        rounded-2xl
        shadow-2xl
        backdrop-blur-sm
        min-w-[300px]
        max-w-[500px]
        transform
        transition-all
        duration-300
        ease-out
        animate-slide-in
        hover:scale-105
        cursor-pointer
      `}
      onClick={() => toastStore.remove(toast.id)}
      role="alert"
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl flex-shrink-0">{styles.icon}</span>
        <p className="flex-1 font-semibold text-sm md:text-base leading-relaxed">
          {toast.message}
        </p>
        <button
          onClick={(e) => {
            e.stopPropagation();
            toastStore.remove(toast.id);
          }}
          className="flex-shrink-0 text-white/80 hover:text-white transition-colors text-xl font-bold"
          aria-label="Close toast"
        >
          ×
        </button>
      </div>
    </div>
  );
});

export const ToastContainer = observer(() => {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 pointer-events-none">
      {toastStore.toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} />
        </div>
      ))}
    </div>
  );
});

