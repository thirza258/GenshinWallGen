import { useState, useEffect, useCallback } from "react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import PreviewPane from "./components/PreviewPane";
import StatusBar from "./components/StatusBar";
import ToastContainer from "./components/ToastContainer";
import AuthModal from "./components/AuthModal";

const generateId = () =>
  Date.now().toString(36) + Math.random().toString(36).substring(2);

const App = () => {
  const BACKEND_URL =
    import.meta.env.VITE_BACKEND_URL || "http://localhost:8009/api";

  // State
  const [dailyTasks, setDailyTasks] = useState([]);
  const [weeklyTasks, setWeeklyTasks] = useState([]);
  const [notes, setNotes] = useState("");
  const [resolution, setResolution] = useState("1920x1080");
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
        }),
      );
    }
  }, [dailyTasks, weeklyTasks, notes, resolution, isAuthenticated]);

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
  }, [addToast]);

  const authFetch = useCallback(
    async (url, options = {}) => {
      let token = localStorage.getItem("token"); // Ensure we have the latest token
      const headers = {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      };
      const response = await fetch(`${BACKEND_URL}${url}`, {
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
    [BACKEND_URL, token, handleLogout],
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
      response = await authFetch("/generate", { method: "POST" });
      generationResult = await response.json();
      if (!response.ok) throw new Error(generationResult.detail || "Generation failed");

      // Fetch the latest image blob (authenticated)
      const imageResponse = await authFetch("/wallpaper/latest");
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
      };
      const generateResponse = await fetch(`${BACKEND_URL}/anonymous/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const generateData = await generateResponse.json();
      if (!generateResponse.ok) throw new Error(generateData.detail || "Generation failed");

      // --- Now fetch the newly generated image as a Blob ---
      // Append a timestamp to bypass any browser cache on the fetch request itself.
      const imageResponse = await fetch(`${BACKEND_URL}/anonymous/download?t=${Date.now()}`);
      if (!imageResponse.ok) throw new Error("Failed to fetch wallpaper");

      // Revoke the old blob URL if it exists (prevents memory leaks)
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }

      const blob = await imageResponse.blob();
      const objectUrl = URL.createObjectURL(blob);
      setBlobUrl(objectUrl);
      setImageUrl(objectUrl);
      // Store the generation result for the success message
      generationResult = generateData;
    }

    setDownloadEnabled(true);
    addToast(`Wallpaper generated in ${generationResult.elapsed}s`, "success");
    setStatusMsg(
      `Last generated: ${new Date(generationResult.generated_at).toLocaleTimeString()}`,
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
  saveStateToBackend,
  authFetch,
  addToast,
  BACKEND_URL,
  blobUrl, // Add blobUrl to dependencies
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

  // Task handlers (unchanged)
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
        }
      }
      setIsLoadingInitial(false);
    };
    initialize();
  }, [isAuthenticated, authFetch]);

  if (isLoadingInitial) {
    return (
      <div className="min-h-screen bg-[#07070f] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07070f] text-gray-100 font-body flex flex-col">
      <Header
        onSave={saveStateToBackend}
        isSaving={isSaving}
        onGenerate={generateWallpaper}
        isGenerating={isGenerating}
        isAuthenticated={isAuthenticated}
        onLoginClick={() => setShowAuthModal(true)}
        onLogout={handleLogout}
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
