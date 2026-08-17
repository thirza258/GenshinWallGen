import { useState, useEffect, useCallback } from "react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import PreviewPane from "./components/PreviewPane";
import StatusBar from "./components/StatusBar";
import ToastContainer from "./components/ToastContainer";
import AuthModal from "./components/AuthModal";
import LandingPage from "./components/LandingPage";

const generateId = () =>
  Date.now().toString(36) + Math.random().toString(36).substring(2);

const GENERATION_TIMEOUT = 10 * 60 * 1000; // 10 minutes

/**
 * Wraps fetch() with an AbortController that aborts after `timeout` ms.
 * Pass `timeout` in the options; it is stripped before the real fetch.
 */
const fetchWithTimeout = (url, options = {}) => {
  const { timeout, ...fetchOptions } = options;
  if (!timeout) return fetch(url, fetchOptions);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  // Merge the abort signal with any caller-supplied signal
  const existingSignal = fetchOptions.signal;
  if (existingSignal) {
    existingSignal.addEventListener("abort", () => controller.abort());
  }

  return fetch(url, {
    ...fetchOptions,
    signal: controller.signal,
  }).finally(() => clearTimeout(timer));
};

const App = () => {
  const BACKEND_URL =
    import.meta.env.VITE_BACKEND_URL || "http://localhost:8009/api";

  // Page Routing State ('landing' | 'generator')
  const [currentPage, setCurrentPage] = useState(() =>
    window.location.hash.startsWith("#generator") ? "generator" : "landing"
  );

  // App State
  const [dailyTasks, setDailyTasks] = useState([]);
  const [weeklyTasks, setWeeklyTasks] = useState([]);
  const [notes, setNotes] = useState("");
  const [resolution, setResolution] = useState("1920x1080");
  const [selectedImage, setSelectedImage] = useState("random");
  const [imageUrl, setImageUrl] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [downloadEnabled, setDownloadEnabled] = useState(false);
  const [statusMsg, setStatusMsg] = useState("Ready");
  const [toasts, setToasts] = useState([]);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [blobUrl, setBlobUrl] = useState(null);

  const isAuthenticated = !!token;

  // Listen to hash changes for browser back/forward and deep linking
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith("#generator")) {
        setCurrentPage("generator");
      } else if (hash === "" || hash === "#" || hash === "#home") {
        setCurrentPage("landing");
      }
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // Save guest tasks to localStorage when not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      localStorage.setItem(
        "guestTasks",
        JSON.stringify({
          daily: dailyTasks,
          weekly: weeklyTasks,
          notes,
          resolution,
          image_id: selectedImage,
        }),
      );
    }
  }, [dailyTasks, weeklyTasks, notes, resolution, selectedImage, isAuthenticated]);

  const addToast = useCallback((message, type = "info") => {
    const id = generateId();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const handleLoginSuccess = (newToken) => {
    setToken(newToken);
    setShowAuthModal(false);
    setImageUrl(null);
    setDownloadEnabled(false);
    addToast("Logged in", "success");
  };

  const handleLogout = useCallback(() => {
    localStorage.removeItem("token");
    setToken(null);
    setImageUrl(null);
    setDownloadEnabled(false);
    addToast("Logged out", "info");
    // Reset tasks to empty (guest data will be loaded from localStorage on next render)
    setDailyTasks([]);
    setWeeklyTasks([]);
    setNotes("");
    setResolution("1920x1080");
    setSelectedImage("random");
  }, [addToast]);

  const authFetch = useCallback(
    async (url, options = {}) => {
      let token = localStorage.getItem("token"); // Ensure we have the latest token
      const headers = {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      };
      const response = await fetchWithTimeout(`${BACKEND_URL}${url}`, {
        ...options,
        headers,
      });
      if (response.status === 401) {
        handleLogout();
        setShowAuthModal(true);
        throw new Error("Unauthorized");
      }
      return response;
    },
    [BACKEND_URL, handleLogout],
  );

  // Save tasks to backend (authenticated only)
  const saveStateToBackend = useCallback(async () => {
    if (!isAuthenticated) return false;
    setIsSaving(true);
    try {
      const payload = {
        daily: dailyTasks,
        weekly: weeklyTasks,
        notes,
        resolution,
        image_id: selectedImage,
      };
      const response = await authFetch("/tasks", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        addToast("Saved ✓", "success");
        return true;
      } else {
        addToast("Save failed", "error");
        return false;
      }
    } catch (err) {
      console.warn("Save error:", err);
      addToast("Network error while saving", "error");
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [
    dailyTasks,
    weeklyTasks,
    notes,
    resolution,
    selectedImage,
    isAuthenticated,
    authFetch,
    addToast,
  ]);

  // Generate wallpaper
  const generateWallpaper = useCallback(async () => {
    if (isAuthenticated) {
      const saveSuccess = await saveStateToBackend();
      if (!saveSuccess) {
        addToast("Cannot generate: save failed", "error");
        return;
      }
    }

    setIsGenerating(true);
    setImageUrl(null);
    setDownloadEnabled(false);
    setStatusMsg("Generating wallpaper…");

    try {
      let response;
      let generationResult;

      if (isAuthenticated) {
        response = await authFetch("/generate", {
          method: "POST",
          timeout: GENERATION_TIMEOUT,
        });
        generationResult = await response.json();
        if (!response.ok)
          throw new Error(generationResult.detail || "Generation failed");

        // Fetch the latest image blob (authenticated)
        const imageResponse = await authFetch("/wallpaper/latest", {
          timeout: GENERATION_TIMEOUT,
        });
        if (!imageResponse.ok) throw new Error("Failed to fetch wallpaper");

        // Revoke the old blob URL if it exists (prevents memory leaks)
        if (blobUrl) {
          URL.revokeObjectURL(blobUrl);
        }

        const blob = await imageResponse.blob();
        const objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
        setImageUrl(objectUrl);
      } else {
        // --- Anonymous flow: generate the image first ---
        const payload = {
          daily: dailyTasks,
          weekly: weeklyTasks,
          notes,
          resolution,
          image_id: selectedImage,
        };
        const generateResponse = await fetchWithTimeout(
          `${BACKEND_URL}/anonymous/generate`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            timeout: GENERATION_TIMEOUT,
          },
        );
        const generateData = await generateResponse.json();
        if (!generateResponse.ok)
          throw new Error(generateData.detail || "Generation failed");

        // Fetch newly generated image as Blob
        const imageResponse = await fetchWithTimeout(
          `${BACKEND_URL}/anonymous/download?t=${Date.now()}`,
          { timeout: GENERATION_TIMEOUT },
        );
        if (!imageResponse.ok) throw new Error("Failed to fetch wallpaper");

        if (blobUrl) {
          URL.revokeObjectURL(blobUrl);
        }

        const blob = await imageResponse.blob();
        const objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
        setImageUrl(objectUrl);
        generationResult = generateData;
      }

      setDownloadEnabled(true);
      addToast(`Wallpaper generated in ${generationResult.elapsed}s`, "success");
      setStatusMsg(
        `Last generated: ${new Date(
          generationResult.generated_at,
        ).toLocaleTimeString()}`,
      );
    } catch (err) {
      addToast(`Network error: ${err.message}`, "error");
      setStatusMsg("Generation error");
    } finally {
      setIsGenerating(false);
    }
  }, [
    isAuthenticated,
    dailyTasks,
    weeklyTasks,
    notes,
    resolution,
    selectedImage,
    saveStateToBackend,
    authFetch,
    addToast,
    BACKEND_URL,
    blobUrl,
  ]);

  // Download wallpaper
  const downloadWallpaper = useCallback(async () => {
    try {
      let response;
      if (isAuthenticated) {
        response = await authFetch("/download", { method: "GET" });
      } else {
        response = await fetch(`${BACKEND_URL}/anonymous/download`);
      }
      if (!response.ok) throw new Error("Download failed");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "wallpaper.png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addToast("Download started", "success");
    } catch (err) {
      addToast(`Download failed: ${err.message}`, "error");
    }
  }, [isAuthenticated, authFetch, addToast, BACKEND_URL]);

  // Task handlers
  const handleAddTask = (type, text) => {
    const newTask = { id: generateId(), text, done: false };
    if (type === "daily") setDailyTasks((prev) => [...prev, newTask]);
    else setWeeklyTasks((prev) => [...prev, newTask]);
  };
  const handleToggleTask = (type, idx) => {
    if (type === "daily") {
      setDailyTasks((prev) =>
        prev.map((task, i) =>
          i === idx ? { ...task, done: !task.done } : task,
        ),
      );
    } else {
      setWeeklyTasks((prev) =>
        prev.map((task, i) =>
          i === idx ? { ...task, done: !task.done } : task,
        ),
      );
    }
  };
  const handleEditTask = (type, idx, newText) => {
    if (type === "daily") {
      setDailyTasks((prev) =>
        prev.map((task, i) => (i === idx ? { ...task, text: newText } : task)),
      );
    } else {
      setWeeklyTasks((prev) =>
        prev.map((task, i) => (i === idx ? { ...task, text: newText } : task)),
      );
    }
  };
  const handleDeleteTask = (type, idx) => {
    if (type === "daily") {
      setDailyTasks((prev) => prev.filter((_, i) => i !== idx));
    } else {
      setWeeklyTasks((prev) => prev.filter((_, i) => i !== idx));
    }
  };
  const handleImageChange = (e) => setSelectedImage(e.target.value);

  // Load initial data (tasks from backend or localStorage)
  useEffect(() => {
    const initialize = async () => {
      setIsLoadingInitial(true);
      if (isAuthenticated) {
        try {
          const response = await authFetch("/tasks");
          const data = await response.json();
          setDailyTasks(data.daily || []);
          setWeeklyTasks(data.weekly || []);
          setNotes(data.notes || "");
          setResolution(data.resolution || "1920x1080");
          setSelectedImage(data.image_id || "random");
        } catch (err) {
          console.warn("Could not load tasks from backend", err);
        }
      } else {
        const saved = localStorage.getItem("guestTasks");
        if (saved) {
          const data = JSON.parse(saved);
          setDailyTasks(data.daily || []);
          setWeeklyTasks(data.weekly || []);
          setNotes(data.notes || "");
          setResolution(data.resolution || "1920x1080");
          setSelectedImage(data.image_id || "random");
        }
      }
      setIsLoadingInitial(false);
    };
    initialize();
  }, [isAuthenticated, authFetch]);

  // Navigation handlers
  const handleGetStarted = (options = {}) => {
    if (options.image_id) setSelectedImage(options.image_id);
    if (options.daily) setDailyTasks(options.daily);
    if (options.weekly) setWeeklyTasks(options.weekly);
    if (options.notes !== undefined) setNotes(options.notes);
    if (options.resolution) setResolution(options.resolution);

    setCurrentPage("generator");
    window.location.hash = "generator";
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleApplyPreset = (preset) => {
    if (preset.daily) setDailyTasks(preset.daily);
    if (preset.weekly) setWeeklyTasks(preset.weekly);
    if (preset.notes !== undefined) setNotes(preset.notes);
    if (preset.image) setSelectedImage(preset.image);

    setCurrentPage("generator");
    window.location.hash = "generator";
    window.scrollTo({ top: 0, behavior: "smooth" });
    addToast(`Applied "${preset.title}" template!`, "info");
  };

  const handleNavigateHome = () => {
    setCurrentPage("landing");
    window.location.hash = "";
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (isLoadingInitial) {
    return (
      <div className="min-h-screen bg-[#FDE7CE] flex items-center justify-center">
        <div className="w-10 h-10 border-[3px] border-[#151D4D]/20 border-t-[#151D4D] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDE7CE] text-[#151D4D] font-body flex flex-col selection:bg-[#151D4D] selection:text-[#FFFCF3]">
      {currentPage === "landing" ? (
        /* ─── PAGE 1: LANDING PAGE ─── */
        <LandingPage
          onGetStarted={handleGetStarted}
          onApplyPreset={handleApplyPreset}
          isAuthenticated={isAuthenticated}
          onLoginClick={() => setShowAuthModal(true)}
          onLogout={handleLogout}
        />
      ) : (
        /* ─── PAGE 2: STUDIO GENERATOR ─── */
        <div className="flex flex-col flex-1 min-h-screen">
          <Header
            onSave={saveStateToBackend}
            isSaving={isSaving}
            onGenerate={generateWallpaper}
            isGenerating={isGenerating}
            isAuthenticated={isAuthenticated}
            onLoginClick={() => setShowAuthModal(true)}
            onLogout={handleLogout}
            onNavigateHome={handleNavigateHome}
          />

          <div className="flex flex-col lg:grid lg:grid-cols-[400px_1fr] flex-1 min-h-0">
            <Sidebar
              dailyTasks={dailyTasks}
              weeklyTasks={weeklyTasks}
              onToggleDaily={(idx) => handleToggleTask("daily", idx)}
              onEditDaily={(idx, val) => handleEditTask("daily", idx, val)}
              onDeleteDaily={(idx) => handleDeleteTask("daily", idx)}
              onAddDaily={(text) => handleAddTask("daily", text)}
              onToggleWeekly={(idx) => handleToggleTask("weekly", idx)}
              onEditWeekly={(idx, val) => handleEditTask("weekly", idx, val)}
              onDeleteWeekly={(idx) => handleDeleteTask("weekly", idx)}
              onAddWeekly={(text) => handleAddTask("weekly", text)}
              notes={notes}
              onNotesChange={(e) => setNotes(e.target.value)}
              resolution={resolution}
              onResolutionChange={(e) => setResolution(e.target.value)}
              selectedImage={selectedImage}
              onImageChange={handleImageChange}
              onDownload={downloadWallpaper}
              downloadEnabled={downloadEnabled}
            />
            <PreviewPane
              imageUrl={imageUrl}
              isGenerating={isGenerating}
              resolution={resolution}
            />
          </div>

          <StatusBar statusMsg={statusMsg} />
        </div>
      )}

      {/* Global Toast Container & Auth Modal */}
      <ToastContainer toasts={toasts} />
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLoginSuccess={handleLoginSuccess}
        addToast={addToast}
      />
    </div>
  );
};

export default App;
