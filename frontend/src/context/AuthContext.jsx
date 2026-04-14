import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiRequest } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState({ token: "", user: null });
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth from sessionStorage on mount
  useEffect(() => {
    const raw = sessionStorage.getItem("auth");
    if (raw) {
      try {
        setAuth(JSON.parse(raw));
      } catch (e) {
        console.error("Failed to parse auth from sessionStorage", e);
        sessionStorage.removeItem("auth");
      }
    }
    setIsLoading(false);
  }, []);

  const saveAuth = (next) => {
    setAuth(next);
    sessionStorage.setItem("auth", JSON.stringify(next));
  };

  const login = async (email, password) => {
    const data = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
    saveAuth({ token: data.token, user: data.user });
    return data.user;
  };

  const signup = async (payload) => {
    const data = await apiRequest("/auth/signup", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    saveAuth({ token: data.token, user: data.user });
    return data.user;
  };

  const logout = () => {
    const next = { token: "", user: null };
    setAuth(next);
    sessionStorage.removeItem("auth");
  };

  const value = useMemo(
    () => ({ token: auth.token, user: auth.user, login, signup, logout, isLoading }),
    [auth, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
