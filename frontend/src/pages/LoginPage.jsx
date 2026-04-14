import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthLayout from "../layouts/AuthLayout";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, logout, token, user, isLoading } = useAuth();
  const hostMode = import.meta.env.VITE_HOST_MODE || "all";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dashboardPath =
    hostMode === "admin"
      ? "/admin/dashboard"
      : hostMode === "user"
      ? "/user/dashboard"
      : user?.role === "admin"
      ? "/admin/dashboard"
      : "/user/dashboard";

  if (!isLoading && token && user) {
    return (
      <AuthLayout title="Already signed in">
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <p className="text-sm text-slate-700">
              You are currently signed in as <strong>{user.email}</strong> ({user.role}).
            </p>
            <p className="mt-2 text-sm text-slate-500">
              If you want to access a different account, please sign out first.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => navigate(dashboardPath, { replace: true })}
              className="rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Go to my dashboard
            </button>
            <button
              type="button"
              onClick={() => {
                logout();
                navigate("/login", { replace: true });
              }}
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Switch account
            </button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      setError("");
      const user = await login(email, password);
      if (hostMode === "admin") {
        navigate("/admin/dashboard");
        return;
      }
      if (hostMode === "user") {
        navigate("/user/dashboard");
        return;
      }
      navigate(user.role === "admin" ? "/admin/dashboard" : "/user/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Login">
      <style>{`
        .form-input {
          width: 100%;
          padding: 12px 14px;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          font-size: 14px;
          background: #f8f9fa;
          transition: all 0.3s ease;
          font-family: 'DM Sans', sans-serif;
        }
        .form-input:focus {
          outline: none;
          background: white;
          border-color: #667eea;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
        }
        .form-input::placeholder {
          color: #94a3b8;
        }
        .submit-btn {
          width: 100%;
          padding: 12px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 10px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: 'DM Sans', sans-serif;
        }
        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
        }
        .submit-btn:active:not(:disabled) {
          transform: translateY(0);
        }
        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .error-banner {
          padding: 12px;
          background: #fee2e2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          color: #dc2626;
          font-size: 13px;
          margin-bottom: 16px;
        }
      `}</style>

      <form onSubmit={onSubmit} className="space-y-4">
        {error && (
          <div className="error-banner">
            <span>⚠️ {error}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-2">Email Address</label>
          <input
            type="email"
            className="form-input"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-2">Password</label>
          <input
            type="password"
            className="form-input"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isSubmitting}
          />
        </div>

        <button type="submit" className="submit-btn" disabled={isSubmitting}>
          {isSubmitting ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <div className="mt-6">
        <p className="text-center text-sm text-slate-600">
          Don't have an account?{" "}
          <Link to="/signup" className="font-semibold text-purple-600 hover:text-purple-700 transition">
            Create one
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
