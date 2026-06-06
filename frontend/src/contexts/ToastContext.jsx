import React, { createContext, useContext, useState } from "react";
import Toast from "../common/Toast/Toast";

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = "info") => {
    const id = Math.random().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Tự động xóa sau 3 giây
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  return (
    <ToastContext.Provider value={{
      success: (msg) => addToast(msg, "success"),
      error: (msg) => addToast(msg, "error"),
      info: (msg) => addToast(msg, "info")
    }}>
      {children}
      {/* Nơi chứa tất cả các thông báo hiện ra */}
      <div className="toast-container">
        {toasts.map((t) => (
          <Toast key={t.id} type={t.type} message={t.message} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);