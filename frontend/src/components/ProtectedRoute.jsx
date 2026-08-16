import React from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, allowedRoles }) {
  const token = localStorage.getItem("token");
  const userStr = localStorage.getItem("user");
  
  if (!token || !userStr) {
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(userStr);
    
    // Check if user is blocked
    if (user.status === "blocked") {
      localStorage.clear();
      return <Navigate to="/login" replace />;
    }

    // Check role permissions
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      return <Navigate to="/profile" replace />;
    }
  } catch (error) {
    localStorage.clear();
    return <Navigate to="/login" replace />;
  }

  return children;
}
