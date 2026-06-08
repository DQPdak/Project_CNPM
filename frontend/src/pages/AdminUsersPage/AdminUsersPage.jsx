import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import RequirePermission from "../../components/security/RequirePermission";
import {
  createUser,
  listUsers,
  resetUserPassword,
} from "../../services/auth/adminUserService";
import { useToast } from "../../contexts/ToastContext";
import Loading from "../../common/Loading/Loading";
import { useAuthStore } from "../../stores/authStore";

const ROLE_OPTIONS = [
  "Mangaka",
  "Assistant",
  "Tantou Editor",
  "Editorial Board",
  "Admin",
];

const STATUS_OPTIONS = ["Active", "Inactive", "Suspended"];

const initialForm = {
  name: "",
  email: "",
  password: "",
  role: "Assistant",
  status: "Active",
};

export default function AdminUsersPage() {
  const toast = useToast();
  const user = useAuthStore((state) => state.user);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetTarget, setResetTarget] = useState(null);
  const [newPassword, setNewPassword] = useState("");

  const sortedUsers = useMemo(
    () => [...users].sort((a, b) => a.email.localeCompare(b.email)),
    [users],
  );

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    const result = await listUsers();
    if (result.success === false) {
      toast.error("Khong the tai danh sach user: " + result.message);
      setUsers([]);
    } else {
      setUsers(result.users || []);
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    if (user?.role === "Admin") {
      fetchUsers();
    }
  }, [fetchUsers, user?.role]);

  if (user?.role !== "Admin") {
    return <Navigate to="/chapter-list" replace />;
  }

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleCreateUser = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    const result = await createUser(form);
    if (result.success === false) {
      toast.error("Khong the tao tai khoan: " + result.message);
    } else {
      toast.success("Da tao tai khoan nhan vien.");
      setForm(initialForm);
      await fetchUsers();
    }

    setIsSubmitting(false);
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    if (!resetTarget) return;

    setIsSubmitting(true);
    const result = await resetUserPassword(resetTarget.id, newPassword);
    if (result.success === false) {
      toast.error("Khong the reset mat khau: " + result.message);
    } else {
      toast.success("Da reset mat khau va thu hoi session hien tai.");
      setResetTarget(null);
      setNewPassword("");
    }
    setIsSubmitting(false);
  };

  return (
    <RequirePermission required="CAN_MANAGE_USERS">
      <div style={{ maxWidth: "1180px", margin: "0 auto" }}>
        {isLoading && <Loading text="Dang tai danh sach tai khoan..." />}

        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: "26px", color: "#0f172a" }}>
              Quan ly tai khoan
            </h1>
            <p style={{ margin: "6px 0 0", color: "#64748b" }}>
              Tao tai khoan noi bo va reset mat khau cho nhan vien.
            </p>
          </div>
        </header>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(280px, 360px) minmax(0, 1fr)",
            gap: "20px",
            alignItems: "start",
          }}
        >
          <form
            onSubmit={handleCreateUser}
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              padding: "18px",
            }}
          >
            <h2 style={{ margin: "0 0 16px", fontSize: "18px" }}>
              Tao tai khoan
            </h2>

            <Field label="Ho ten">
              <input
                value={form.name}
                onChange={(event) => updateForm("name", event.target.value)}
                required
                style={inputStyle}
              />
            </Field>

            <Field label="Email">
              <input
                type="email"
                value={form.email}
                onChange={(event) => updateForm("email", event.target.value)}
                required
                style={inputStyle}
              />
            </Field>

            <Field label="Mat khau khoi tao">
              <input
                type="password"
                value={form.password}
                onChange={(event) => updateForm("password", event.target.value)}
                required
                minLength={8}
                style={inputStyle}
              />
            </Field>

            <Field label="Role">
              <select
                value={form.role}
                onChange={(event) => updateForm("role", event.target.value)}
                style={inputStyle}
              >
                {ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Status">
              <select
                value={form.status}
                onChange={(event) => updateForm("status", event.target.value)}
                style={inputStyle}
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </Field>

            <button
              type="submit"
              disabled={isSubmitting}
              style={primaryButtonStyle}
            >
              {isSubmitting ? "Dang tao..." : "Tao tai khoan"}
            </button>
          </form>

          <section
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "16px 18px",
                borderBottom: "1px solid #e2e8f0",
                fontWeight: 700,
              }}
            >
              Danh sach tai khoan
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", textAlign: "left" }}>
                    <Th>Name</Th>
                    <Th>Email</Th>
                    <Th>Role</Th>
                    <Th>Status</Th>
                    <Th>Action</Th>
                  </tr>
                </thead>
                <tbody>
                  {sortedUsers.map((user) => (
                    <tr key={user.id} style={{ borderTop: "1px solid #e2e8f0" }}>
                      <Td>{user.name}</Td>
                      <Td>{user.email}</Td>
                      <Td>{user.role}</Td>
                      <Td>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "4px 8px",
                            borderRadius: "999px",
                            background:
                              user.status === "Active" ? "#dcfce7" : "#fee2e2",
                            color:
                              user.status === "Active" ? "#166534" : "#991b1b",
                            fontSize: "12px",
                            fontWeight: 700,
                          }}
                        >
                          {user.status}
                        </span>
                      </Td>
                      <Td>
                        <button
                          type="button"
                          onClick={() => setResetTarget(user)}
                          style={secondaryButtonStyle}
                        >
                          Reset password
                        </button>
                      </Td>
                    </tr>
                  ))}
                  {!isLoading && sortedUsers.length === 0 ? (
                    <tr>
                      <Td colSpan={5}>Chua co tai khoan nao.</Td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {resetTarget ? (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15, 23, 42, 0.36)",
              display: "grid",
              placeItems: "center",
              padding: "20px",
            }}
          >
            <form
              onSubmit={handleResetPassword}
              style={{
                width: "100%",
                maxWidth: "420px",
                background: "#ffffff",
                borderRadius: "8px",
                padding: "20px",
                boxShadow: "0 24px 60px rgba(15, 23, 42, 0.18)",
              }}
            >
              <h2 style={{ margin: "0 0 8px", fontSize: "20px" }}>
                Reset password
              </h2>
              <p style={{ margin: "0 0 16px", color: "#64748b" }}>
                {resetTarget.email}
              </p>
              <Field label="Mat khau moi">
                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  minLength={8}
                  required
                  style={inputStyle}
                />
              </Field>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => {
                    setResetTarget(null);
                    setNewPassword("");
                  }}
                  style={secondaryButtonStyle}
                >
                  Huy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={primaryButtonStyle}
                >
                  {isSubmitting ? "Dang reset..." : "Reset"}
                </button>
              </div>
            </form>
          </div>
        ) : null}
      </div>
    </RequirePermission>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: "block", marginBottom: "14px" }}>
      <span
        style={{
          display: "block",
          marginBottom: "6px",
          color: "#334155",
          fontSize: "13px",
          fontWeight: 700,
        }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

function Th({ children }) {
  return <th style={{ padding: "12px 14px", fontSize: "13px" }}>{children}</th>;
}

function Td({ children, colSpan }) {
  return (
    <td colSpan={colSpan} style={{ padding: "12px 14px", color: "#334155" }}>
      {children}
    </td>
  );
}

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "6px",
  border: "1px solid #cbd5e1",
  outline: "none",
  fontSize: "14px",
};

const primaryButtonStyle = {
  border: "none",
  borderRadius: "6px",
  background: "#0f172a",
  color: "#ffffff",
  padding: "10px 14px",
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryButtonStyle = {
  border: "1px solid #cbd5e1",
  borderRadius: "6px",
  background: "#ffffff",
  color: "#334155",
  padding: "9px 12px",
  fontWeight: 700,
  cursor: "pointer",
};
