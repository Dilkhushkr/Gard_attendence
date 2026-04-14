import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "../pages/LoginPage";
import SignupPage from "../pages/SignupPage";
import UserDashboardPage from "../pages/UserDashboardPage";
import AdminDashboardPage from "../pages/AdminDashboardPage";
import ProtectedRoute from "./ProtectedRoute";

export default function AppRouter() {
  const hostMode = import.meta.env.VITE_HOST_MODE || "all";

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      {hostMode !== "admin" && (
        <Route
          path="/user/dashboard"
          element={
            <ProtectedRoute allowRole="user">
              <UserDashboardPage />
            </ProtectedRoute>
          }
        />
      )}
      {hostMode !== "user" && (
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowRole="admin">
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
      )}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
