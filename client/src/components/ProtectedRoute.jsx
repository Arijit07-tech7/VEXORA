import { useEffect } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { getUser } from "../lib/auth";

export default function ProtectedRoute({ adminOnly = false }) {
  const user = getUser();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleExpired = () => navigate("/login", { replace: true, state: { from: location.pathname } });
    window.addEventListener("vexora:auth-expired", handleExpired);
    return () => window.removeEventListener("vexora:auth-expired", handleExpired);
  }, [location.pathname, navigate]);

  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (adminOnly && user.role !== "admin") return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}
