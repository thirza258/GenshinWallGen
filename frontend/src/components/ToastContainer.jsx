import React from 'react';

const ToastItem = ({ toast }) => (
  <div
    className={`px-4 py-3 rounded-xl text-sm font-medium shadow-xl animate-slide-in ${
      toast.type === 'success'
        ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
        : toast.type === 'error'
        ? 'bg-red-500/15 border border-red-500/30 text-red-400'
        : 'bg-indigo-500/15 border border-indigo-500/30 text-indigo-400'
    }`}
  >
    {toast.message}
  </div>
);

const ToastContainer = ({ toasts }) => {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-7 right-7 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
};

export default ToastContainer;