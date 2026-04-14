import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ allowRole, children }) {
  const { token, user, isLoading } = useAuth();
  
  // Wait for auth to load from localStorage
  if (isLoading) {
    return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
      <p>Loading...</p>
    </div>;
  }
  
  // Not authenticated
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }
  
  // Check role if required
  if (allowRole && user.role !== allowRole) {
    const redirectPath = user.role === "admin" ? "/admin/dashboard" : "/user/dashboard";
    return <Navigate to={redirectPath} replace />;
  }
  
  return children;
}
