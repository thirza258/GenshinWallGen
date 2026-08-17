const ToastItem = ({ toast }) => (
  <div
    className={`px-4 py-3 rounded-xl text-sm font-medium shadow-xl animate-slide-in ${
      toast.type === 'success'
        ? 'bg-[#151D4D]/10 border border-[#151D4D]/30 text-[#151D4D]'
        : toast.type === 'error'
        ? 'bg-[#FFFCF3] border border-black/20 text-black'
        : 'bg-[#151D4D]/8 border border-[#151D4D]/20 text-[#151D4D]'
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
