import React, { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const sessionStatus = useAuthStore((state) => state.sessionStatus);
  const login = useAuthStore((state) => state.login);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const redirectTarget = location.state?.from?.pathname || "/chapter-list";

  useEffect(() => {
    setErrorMessage("");
  }, [email, password]);

  if (isAuthenticated) {
    return <Navigate to={redirectTarget} replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      await login({ email, password });
      navigate(redirectTarget, { replace: true });
    } catch (error) {
      setErrorMessage(error.message || "Dang nhap that bai.");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background:
          "radial-gradient(circle at top, #f4efe6 0%, #efe7da 35%, #e8edf2 100%)",
        padding: "24px",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "#ffffff",
          border: "1px solid #d7dde5",
          borderRadius: "10px",
          boxShadow: "0 24px 60px rgba(15, 23, 42, 0.12)",
          padding: "28px",
        }}
      >
        <div style={{ marginBottom: "20px" }}>
          <div
            style={{
              fontSize: "12px",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#8a6f42",
              fontWeight: 700,
              marginBottom: "10px",
            }}
          >
            Manga Editorial System
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: "28px",
              lineHeight: 1.1,
              color: "#111827",
            }}
          >
            Dang nhap
          </h1>
          <p style={{ margin: "10px 0 0", color: "#667085" }}>
            Su dung email va mat khau de truy cap he thong.
          </p>
        </div>

        <label
          htmlFor="email"
          style={{ display: "block", marginBottom: "14px", color: "#344054" }}
        >
          <span style={{ display: "block", marginBottom: "6px" }}>Email</span>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: "8px",
              border: "1px solid #d0d5dd",
              outline: "none",
              fontSize: "14px",
            }}
          />
        </label>

        <label
          htmlFor="password"
          style={{ display: "block", marginBottom: "16px", color: "#344054" }}
        >
          <span style={{ display: "block", marginBottom: "6px" }}>Mat khau</span>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            required
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: "8px",
              border: "1px solid #d0d5dd",
              outline: "none",
              fontSize: "14px",
            }}
          />
        </label>

        {errorMessage ? (
          <div
            style={{
              marginBottom: "16px",
              padding: "12px 14px",
              borderRadius: "8px",
              background: "#fff1f2",
              color: "#b42318",
              border: "1px solid #fecdd3",
              fontSize: "14px",
            }}
          >
            {errorMessage}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={sessionStatus === "authenticating"}
          style={{
            width: "100%",
            padding: "12px 16px",
            border: "none",
            borderRadius: "8px",
            background: "#111827",
            color: "#ffffff",
            fontWeight: 700,
            cursor:
              sessionStatus === "authenticating" ? "not-allowed" : "pointer",
          }}
        >
          {sessionStatus === "authenticating" ? "Dang dang nhap..." : "Dang nhap"}
        </button>
      </form>
    </div>
  );
}
