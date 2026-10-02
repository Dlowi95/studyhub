import { clearAccountSession } from "@/lib/session";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, allowedRoles }) {
  const token = localStorage.getItem("token");
  const userString = localStorage.getItem("user");

  if (!token || !userString) {
    window.dispatchEvent(new CustomEvent("openAuthModal", { detail: { tab: "login" } }));
    return <Navigate to="/" replace />;
  }

  let user;
  try {
    user = JSON.parse(userString);
  } catch {
    clearAccountSession();
    window.dispatchEvent(new CustomEvent("openAuthModal", { detail: { tab: "login" } }));
    return <Navigate to="/" replace />;
  }

  if (user.status === "blocked") {
    clearAccountSession();
    window.dispatchEvent(new CustomEvent("openAuthModal", { detail: { tab: "login" } }));
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/profile" replace />;
  }

  return children;
}
