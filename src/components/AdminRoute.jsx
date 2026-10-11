import React from "react";
import { Navigate } from "react-router-dom";

export default function AdminRoute({ children }) {
  let user = null;
  try { user = JSON.parse(localStorage.getItem("user") || "null"); } catch { user = null; }
  if (!user?.is_staff && !user?.is_superuser) return <Navigate to="/3c8f1a2e" replace />;
  return children;
}
