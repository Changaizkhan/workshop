import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { API_BASE } from "../api";

function LoginView({ onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const performLogin = async (user, pass) => {
    const u = user.trim();
    const p = pass.trim();
    if (!u || !p) {
      setError("Please provide both username and passphrase.");
      return;
    }
    setUsername(u);
    setPassword(p);
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: u, password: p }),
      });
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        throw new Error("Backend not reachable. Start Backend and set VITE_API_URL in Frontend/.env");
      }
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed. Check your username and password.");
      }
      onLoginSuccess(data.user, data.token);
    } catch (err) {
      setError(err.message || "Cannot connect to backend. Check Frontend/.env VITE_API_URL");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await performLogin(username, password);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 bg-blue-600 text-white rounded-2xl items-center justify-center font-black text-2xl mb-4 shadow-lg shadow-blue-500/20">
            H
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white uppercase">
            HPG<span className="text-blue-500"> 4.0</span>
          </h2>
          <p className="text-slate-400 text-xs tracking-wider uppercase mt-1">Enterprise Workshop ERP</p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-sm mb-6 flex items-start gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              autoComplete="username"
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl py-3 px-4 text-sm text-slate-100 placeholder-slate-600 focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Passphrase
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl py-3 pl-4 pr-12 text-sm text-slate-100 placeholder-slate-600 focus:outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1 cursor-pointer"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-900/40 text-sm cursor-pointer"
          >
            {loading ? "Validating credentials..." : "Enter System Secure Shell"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginView;
