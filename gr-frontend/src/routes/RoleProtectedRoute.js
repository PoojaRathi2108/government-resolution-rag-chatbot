// src/routes/RoleProtectedRoute.js
import React from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

const RoleProtectedRoute = ({ allowedRoles, children }) => {
  const auth = useSelector((state) => state.user?.user?.user?.role);
  console.log("Auth:", auth);
  
  if (!auth) {
    return <Navigate to="/auth" />;
  }

  return allowedRoles.includes(auth) ? children : <Navigate to="/" />;
};

export default RoleProtectedRoute;
