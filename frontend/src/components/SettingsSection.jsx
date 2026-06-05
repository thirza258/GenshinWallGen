
import { useState, useEffect } from "react";

const SettingsSection = ({
  resolution,
  onResolutionChange,
  selectedImage,
  onImageChange,
}) => {
  const [sourceImages, setSourceImages] = useState([]);
  const [imagesLoading, setImagesLoading] = useState(true);

  const BACKEND_URL =
    import.meta.env.VITE_BACKEND_URL || "http://localhost:8009/api";

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/source-images`);
        if (res.ok) {
          const data = await res.json();
          setSourceImages(data.images || []);
        }
      } catch (err) {
        console.warn("Failed to load source images:", err);
      } finally {
        setImagesLoading(false);
      }
    };
    fetchImages();
  }, [BACKEND_URL]);

  return (
    <div>
      <div className="font-mono text-xs tracking-wider uppercase text-[#151D4D] mb-3">
        Settings
      </div>
      <div className="bg-[#FFFCF3] border border-black/15 rounded-xl p-5 space-y-5">
        <div className="flex justify-between items-center">
          <span className="text-black/70 text-sm">Background</span>
          <select
            value={selectedImage}
            onChange={onImageChange}
            disabled={imagesLoading}
            className="bg-[#FFFCF3] border border-black/15 rounded-lg px-3 py-1.5 text-black text-sm outline-none focus:border-[#151D4D] max-w-[180px] truncate"
          >
            <option value="random">🎲 Random</option>
            {sourceImages.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-black/70 text-sm">Resolution</span>
          <select
            value={resolution}
            onChange={onResolutionChange}
            className="bg-[#FFFCF3] border border-black/15 rounded-lg px-3 py-1.5 text-black text-sm outline-none focus:border-[#151D4D]"
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
