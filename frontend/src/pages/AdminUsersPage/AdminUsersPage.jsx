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
import "./AdminUsersPage.css";

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

  // Thêm duy nhất 1 UI state để xử lý Tabs
  const [activeTab, setActiveTab] = useState("list"); // 'list' hoặc 'create'

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
    return <Navigate to="/" replace />;
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
      // Chuyển về tab list sau khi tạo thành công (Tuỳ chọn thêm để tăng UX)
      setActiveTab("list");
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
      <div className="admin-users-page">
        <div className="page-container">
          {isLoading && <Loading text="Dang tai danh sach tai khoan..." />}

          <header className="page-header">
            <h1 className="page-title">Quan ly tai khoan</h1>
            <p className="page-subtitle">
              Tao tai khoan noi bo va reset mat khau cho nhan vien.
            </p>
          </header>

          {/* Tab Navigation */}
          <div className="tab-navigation">
            <button
              type="button"
              onClick={() => setActiveTab("list")}
              className={`tab-btn ${activeTab === "list" ? "tab-active" : "tab-inactive"}`}
            >
              Danh sách tài khoản
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("create")}
              className={`tab-btn ${activeTab === "create" ? "tab-active" : "tab-inactive"}`}
            >
              Tạo tài khoản mới
            </button>
          </div>

          <div className="tab-content-area">
            {/* Tab 1: Danh sách tài khoản */}
            {activeTab === "list" && (
              <section className="table-card">
                <div className="table-wrapper">
                  <table className="neo-table">
                    <thead>
                      <tr className="tr-head">
                        <Th>Name</Th>
                        <Th>Email</Th>
                        <Th>Role</Th>
                        <Th>Status</Th>
                        <Th>Action</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedUsers.map((user) => (
                        <tr key={user.id} className="tr-body">
                          <Td>{user.name}</Td>
                          <Td>{user.email}</Td>
                          <Td>{user.role}</Td>
                          <Td>
                            <span
                              className={`status-badge ${
                                user.status === "Active"
                                  ? "status-active"
                                  : "status-inactive"
                              }`}
                            >
                              {user.status}
                            </span>
                          </Td>
                          <Td>
                            <button
                              type="button"
                              onClick={() => setResetTarget(user)}
                              className="btn-secondary"
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
            )}

            {/* Tab 2: Form Tạo tài khoản */}
            {activeTab === "create" && (
              <form onSubmit={handleCreateUser} className="form-card">
                <h2 className="card-title">Nhập thông tin nhân viên</h2>

                <div className="form-grid">
                  <Field label="Ho ten">
                    <input
                      value={form.name}
                      onChange={(event) =>
                        updateForm("name", event.target.value)
                      }
                      required
                      className="input-field"
                    />
                  </Field>

                  <Field label="Email">
                    <input
                      type="email"
                      value={form.email}
                      onChange={(event) =>
                        updateForm("email", event.target.value)
                      }
                      required
                      className="input-field"
                    />
                  </Field>

                  <Field label="Mat khau khoi tao">
                    <input
                      type="password"
                      value={form.password}
                      onChange={(event) =>
                        updateForm("password", event.target.value)
                      }
                      required
                      minLength={8}
                      className="input-field"
                    />
                  </Field>

                  <Field label="Role">
                    <select
                      value={form.role}
                      onChange={(event) =>
                        updateForm("role", event.target.value)
                      }
                      className="select-field"
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
                      onChange={(event) =>
                        updateForm("status", event.target.value)
                      }
                      className="select-field"
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                <div className="form-actions">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary"
                  >
                    {isSubmitting ? "Dang tao..." : "Tạo tài khoản"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Modal Reset Password */}
        {resetTarget ? (
          <div className="modal-overlay">
            <form onSubmit={handleResetPassword} className="modal-card">
              <div className="tape-deco"></div>
              <h2 className="modal-title">Reset password</h2>
              <p className="modal-subtitle">Target: {resetTarget.email}</p>

              <Field label="Mat khau moi">
                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  minLength={8}
                  required
                  className="input-field"
                />
              </Field>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => {
                    setResetTarget(null);
                    setNewPassword("");
                  }}
                  className="btn-cancel"
                >
                  Huy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-confirm"
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
    <label className="input-group">
      <span className="input-label">{label}</span>
      {children}
    </label>
  );
}

function Th({ children }) {
  return <th className="th-neo">{children}</th>;
}

function Td({ children, colSpan }) {
  return (
    <td colSpan={colSpan} className="td-neo">
      {children}
    </td>
  );
}
