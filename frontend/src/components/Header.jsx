const Header = ({ 
  onSave, 
  isSaving, 
  onGenerate, 
  isGenerating,
  isAuthenticated,
  onLoginClick,
  onLogout
}) => {
  return (
    <header className="sticky top-0 z-10 flex justify-between items-center px-9 py-5 border-b border-black/15 bg-[#FFFCF3]/90 backdrop-blur-md">
      <div className="font-mono text-xl font-bold tracking-tight">
       Daily Task Genshin Wall<span className="text-[#151D4D]">Paper</span>
      </div>
      <div className="flex gap-2.5 items-center">
        {/* Auth Section */}
        {isAuthenticated ? (
          <>
            <span className="text-[#151D4D] text-sm">✓ Logged in</span>
            <button
              onClick={onLogout}
              className="px-4 py-2 rounded-lg bg-black/5 text-black text-sm font-semibold hover:bg-black/10 transition-all"
            >
              Logout
            </button>
          </>
        ) : (
          <button
            onClick={onLoginClick}
            className="px-4 py-2 rounded-lg bg-[#151D4D]/10 text-[#151D4D] text-sm font-semibold hover:bg-[#151D4D]/20 transition-all"
          >
            Login / Register
          </button>
        )}

        {/* Save Button */}
        <button
          onClick={onSave}
          disabled={isSaving}
          className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#FFFCF3] text-black border border-black/15 text-sm font-semibold hover:bg-[#151D4D]/10 hover:text-[#151D4D] transition-all disabled:opacity-50"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
            <polyline points="17 21 17 13 7 13 7 21" />
            <polyline points="7 3 7 8 15 8" />
          </svg>
          Save
        </button>

        {/* Generate Button */}
        <button
          onClick={onGenerate}
          disabled={isGenerating}
          className="flex items-center gap-1.5 px-6 py-2 rounded-lg bg-gradient-to-r from-[#151D4D] to-[#000000] text-[#FFFCF3] font-semibold text-sm shadow-lg shadow-black/20 hover:shadow-black/30 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          Generate
        </button>
      </div>
    </header>
  );
};

export default Header;
