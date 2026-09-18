import { useState } from "react";

const AuthModal = ({
  isOpen,
  onClose,
  onLoginSuccess,
  addToast,
  backendUrl,
}) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const BACKEND_URL =
    backendUrl ||
    import.meta.env.VITE_BACKEND_URL ||
    `${window.location.protocol}//${window.location.hostname}:8009/api`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const endpoint = isLogin ? "/login" : "/register";
    try {
      const response = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("token", data.access_token);
        onLoginSuccess(data.access_token);
        addToast(
          `${isLogin ? "Logged in" : "Registered"} successfully`,
          "success",
        );
        onClose();
      } else {
        addToast(data.detail || "Authentication failed", "error");
      }
    } catch (err) {
      console.warn("Auth error:", err);
      addToast("Network error", "error");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Account sign in"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 overflow-y-auto"
    >
      <div className="bg-[#FFFCF3] border border-black/20 rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-[#151D4D]">
            {isLogin ? "Login" : "Register"}
          </h2>
          <button
            aria-label="Close account dialog"
            onClick={onClose}
            className="min-h-11 min-w-11 text-black/50 hover:text-black"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-black/70 mb-1">
              Username
            </label>
            <input
              aria-label="Username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 bg-[#FFFCF3] border border-black/20 rounded-lg text-black focus:outline-none focus:border-[#151D4D]"
              required
              autoComplete="username"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-black/70 mb-1">
              Password
            </label>
            <input
              aria-label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-[#FFFCF3] border border-black/20 rounded-lg text-black focus:outline-none focus:border-[#151D4D]"
              required
              autoComplete={isLogin ? "current-password" : "new-password"}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 rounded-lg bg-gradient-to-r from-[#151D4D] to-[#000000] text-[#FFFCF3] font-semibold hover:shadow-lg transition-all disabled:opacity-50"
          >
            {isLoading ? "Processing..." : isLogin ? "Login" : "Register"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-[#151D4D] hover:text-black"
          >
            {isLogin
              ? "Don't have an account? Register"
              : "Already have an account? Login"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
