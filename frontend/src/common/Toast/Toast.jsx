import React from "react";
import "./Toast.css";

export default function Toast({ type, message }) {
  const icons = { success: "✅", error: "🚨", info: "💡" };

  return (
    <div className={`toast-box toast-${type}`}>
      <span className="toast-icon">{icons[type]}</span>
      <span className="toast-text">{message}</span>
    </div>
  );
}
