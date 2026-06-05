

const StatusBar = ({ statusMsg }) => {
  return (
    <div className="flex items-center gap-2.5 px-9 py-3 border-t border-black/15 font-mono text-xs text-black/60">
      <div className="w-1.5 h-1.5 rounded-full bg-[#151D4D] animate-pulse"></div>
      <span>{statusMsg}</span>
    </div>
  );
};

export default StatusBar;
