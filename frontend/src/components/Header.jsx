const Header = ({ 
  onSave, 
  isSaving, 
  onGenerate, 
  isGenerating,
  isAuthenticated,
  onLoginClick,
  onLogout,
  onNavigateHome,
  onOpenPixelStudio
}) => {
  return (
    <header className="sticky top-0 z-20 flex flex-wrap gap-3 justify-between items-center px-4 sm:px-9 py-4 border-b border-black/15 bg-[#FFFCF3]/95 backdrop-blur-md">
      <div className="flex items-center gap-3">
        {onNavigateHome && (
          <button
            onClick={onNavigateHome}
            id="back-to-home-btn"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#151D4D]/10 hover:bg-[#151D4D] text-[#151D4D] hover:text-[#FFFCF3] text-xs font-semibold transition-all"
            title="Return to Landing Page"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5" />
              <path d="m12 19-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">Home</span>
          </button>
        )}
        <div 
          className="font-mono text-base sm:text-xl font-bold tracking-tight cursor-pointer hover:opacity-80 transition-opacity"
          onClick={onNavigateHome}
        >
          GenshinWall<span className="text-[#C58B35]">Craft</span>
        </div>
      </div>

      <div className="flex gap-2 sm:gap-3 items-center">
        <button onClick={onOpenPixelStudio} className="px-3 py-2 rounded-lg border border-[#151D4D]/20 text-[#151D4D] text-xs font-semibold hover:bg-[#151D4D]/10 transition-all">
          ▦ Pixel Studio
        </button>
        {/* Auth Section */}
        {isAuthenticated ? (
          <div className="flex items-center gap-2">
            <span className="text-[#151D4D] text-xs font-medium hidden sm:inline">✓ Logged in</span>
            <button
              onClick={onLogout}
              className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-black/5 text-black text-xs sm:text-sm font-semibold hover:bg-black/10 transition-all"
            >
              Logout
            </button>
          </div>
        ) : (
          <button
            onClick={onLoginClick}
            className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-[#151D4D]/10 text-[#151D4D] text-xs sm:text-sm font-semibold hover:bg-[#151D4D]/20 transition-all"
          >
            Login / Register
          </button>
        )}

        {/* Save Button */}
        <button
          onClick={onSave}
          disabled={isSaving}
          className="flex items-center gap-1.5 px-3 py-1.5 sm:px-5 sm:py-2 rounded-lg bg-[#FFFCF3] text-black border border-black/15 text-xs sm:text-sm font-semibold hover:bg-[#151D4D]/10 hover:text-[#151D4D] transition-all disabled:opacity-50"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
            <polyline points="17 21 17 13 7 13 7 21" />
            <polyline points="7 3 7 8 15 8" />
          </svg>
          <span className="hidden sm:inline">Save</span>
        </button>

        {/* Generate Button */}
        <button
          onClick={onGenerate}
          disabled={isGenerating}
          id="generator-generate-btn"
          className="flex items-center gap-1.5 px-4 py-1.5 sm:px-6 sm:py-2 rounded-lg bg-gradient-to-r from-[#151D4D] to-[#000000] text-[#FFFCF3] font-semibold text-xs sm:text-sm shadow-md shadow-black/20 hover:shadow-black/30 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          <span>Generate</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
