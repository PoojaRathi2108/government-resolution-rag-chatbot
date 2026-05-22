// src/utils/toast.js
import { toast } from "react-toastify";

// Success
export const showSuccess = (message, options = {}) =>
  toast.success(message, {
    position: "top-right",
    autoClose: 2000,
    theme: "colored",
    ...options,
  });

// Error
export const showError = (message, options = {}) =>
  toast.error(message, {
    position: "top-right",
    autoClose: 2000,
    theme: "colored",
    ...options,
  });

// Info
export const showInfo = (message, options = {}) =>
  toast.info(message, {
    position: "top-right",
    autoClose: 2000,
    theme: "colored",
    ...options,
  });

// Warning
export const showWarning = (message, options = {}) =>
  toast.warning(message, {
    position: "top-right",
    autoClose: 3000,
    theme: "colored",
    ...options,
  });
