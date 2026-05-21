

const PreviewPane = ({ imageUrl, isGenerating, resolution }) => {
  return (
    <main className="bg-[#07070f] p-8 flex flex-col gap-5">
      <div className="flex justify-between items-center">
        <div className="font-mono text-xs tracking-wider uppercase text-indigo-400">Preview</div>
        <div className="font-mono text-xs text-indigo-400/60">
          {imageUrl && resolution}
        </div>
      </div>
      <div className="relative flex-1 bg-[#0e0e1e] border border-indigo-500/15 rounded-2xl overflow-hidden flex items-center justify-center min-h-[320px]">
        {isGenerating && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-[#07070f]/80">
            <div className="w-10 h-10 border-3 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
          </div>
        )}
        {imageUrl ? (
          <img src={imageUrl} alt="Generated wallpaper" className="w-full h-full object-contain" />
        ) : (
          <div className="text-center text-indigo-300/40">
            <div className="text-4xl mb-3 opacity-40">✨</div>
            <p className="text-sm">
              Click <strong className="text-indigo-400">Generate</strong> to create your wallpaper
            </p>
          </div>
        )}
      </div>
    </main>
  );
};

export default PreviewPane;