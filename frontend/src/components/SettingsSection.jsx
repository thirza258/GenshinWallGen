

const SettingsSection = ({ resolution, onResolutionChange }) => {
  return (
    <div>
      <div className="font-mono text-xs tracking-wider uppercase text-indigo-400 mb-3">
        Settings
      </div>
      <div className="bg-[#14142a] border border-indigo-500/15 rounded-xl p-5 space-y-5">
        <div className="flex justify-between items-center">
          <span className="text-indigo-300/70 text-sm">Resolution</span>
          <select
            value={resolution}
            onChange={onResolutionChange}
            className="bg-[#0e0e1e] border border-indigo-500/20 rounded-lg px-3 py-1.5 text-gray-200 text-sm outline-none focus:border-indigo-500"
          >
            <option value="1920x1080">1920×1080 FHD</option>
            <option value="2560x1440">2560×1440 QHD</option>
            <option value="3840x2160">3840×2160 4K</option>
            <option value="1280x720">1280×720 HD</option>
            <option value="1366x768">1366×768 Laptop</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default SettingsSection;