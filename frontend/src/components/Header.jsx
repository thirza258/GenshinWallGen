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
    <header className="sticky top-0 z-10 flex justify-between items-center px-9 py-5 border-b border-indigo-500/15 bg-[#0e0e1e]/90 backdrop-blur-md">
      <div className="font-mono text-xl font-bold tracking-tight">
        Wall<span className="text-indigo-500">Craft</span>
      </div>
      <div className="flex gap-2.5 items-center">
        {/* Auth Section */}
        {isAuthenticated ? (
          <>
            <span className="text-indigo-300 text-sm">✓ Logged in</span>
            <button
              onClick={onLogout}
              className="px-4 py-2 rounded-lg bg-red-500/10 text-red-400 text-sm font-semibold hover:bg-red-500/20 transition-all"
            >
              Logout
            </button>
          </>
        ) : (
          <button
            onClick={onLoginClick}
            className="px-4 py-2 rounded-lg bg-indigo-500/10 text-indigo-400 text-sm font-semibold hover:bg-indigo-500/20 transition-all"
          >
            Login / Register
          </button>
        )}

        {/* Save Button */}
        <button
          onClick={onSave}
          disabled={isSaving}
          className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#14142a] text-gray-200 border border-indigo-500/15 text-sm font-semibold hover:bg-indigo-500/10 transition-all disabled:opacity-50"
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
          className="flex items-center gap-1.5 px-6 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold text-sm shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0"
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