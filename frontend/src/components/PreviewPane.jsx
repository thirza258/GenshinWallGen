

const PreviewPane = ({ imageUrl, isGenerating, resolution }) => {
  return (
    <main className="bg-[#FDE7CE] p-8 flex flex-col gap-5">
      <div className="flex justify-between items-center">
        <div className="font-mono text-xs tracking-wider uppercase text-[#151D4D]">Preview</div>
        <div className="font-mono text-xs text-[#151D4D]/60">
          {imageUrl && resolution}
        </div>
      </div>
      <div className="relative flex-1 bg-[#FFFCF3] border border-black/15 rounded-2xl overflow-hidden flex items-center justify-center min-h-[320px]">
        {isGenerating && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-[#FDE7CE]/80">
            <div className="w-10 h-10 border-[3px] border-[#151D4D]/20 border-t-[#151D4D] rounded-full animate-spin"></div>
          </div>
        )}
        {imageUrl ? (
          <img src={imageUrl} alt="Generated wallpaper" className="w-full h-full object-contain" />
        ) : (
          <div className="text-center text-black/40">
            <div className="text-4xl mb-3 opacity-40">✨</div>
            <p className="text-sm">
              Click <strong className="text-[#151D4D]">Generate</strong> to create your wallpaper
            </p>
          </div>
        )}
      </div>
    </main>
  );
};

export default PreviewPane;
