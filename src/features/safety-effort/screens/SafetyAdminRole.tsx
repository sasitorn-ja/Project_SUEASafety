// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import { Search, Pencil, Trash2, Plus, Users, Shield, User, Mail, Calendar, ArrowLeft } from "lucide-react";
import { Combobox } from "@/components/ui/combobox";
import { useNavigate } from "@/lib/router-compat";

const INITIAL_USERS = [
  { id: 1, username: "0150_chaianan_k", fullName: "ชัยอนันต์ คงสมลาภ", email: "0150_chaianan_k@scg.com", status: "Admin", type: "CPAC", createdDate: "07-08-2025 16:33" },
  { id: 2, username: "Jumphond", fullName: "จุมพล ดวงใหญ่", email: "Jumphond@scg.com", status: "Member", type: "CPAC", createdDate: "17-08-2025 10:32" },
  { id: 3, username: "puttaraj", fullName: "พุทธรักษ์ จันทร์ศิริ", email: "puttaraj@scg.com", status: "Member", type: "CPAC", createdDate: "18-08-2025 10:43" },
  { id: 4, username: "sompoplo", fullName: "สมพร ปลอดสวัสดิ์", email: "sompoplo@scg.com", status: "Member", type: "CPAC", createdDate: "18-08-2025 11:13" },
  { id: 5, username: "seksanta", fullName: "เศกสรรพ์ อุดมขันติกุล", email: "seksanta@scg.com", status: "Member", type: "CPAC", createdDate: "18-08-2025 11:59" },
  { id: 6, username: "phatsakb", fullName: "พัสกร บุณยะประภัศร", email: "phatsakb@scg.com", status: "Member", type: "CPAC", createdDate: "18-08-2025 14:32" },
  { id: 7, username: "prasanh", fullName: "ประสาร หาญจิตต์", email: "prasanh@scg.com", status: "Member", type: "CPAC", createdDate: "18-08-2025 14:33" },
  { id: 8, username: "issarawp", fullName: "อิสราวดี ภักดีกัลย์", email: "issarawp@scg.com", status: "Admin", type: "CPAC", createdDate: "23-08-2025 09:39" },
  { id: 9, username: "suthkae", fullName: "สุเทพ แก่นดง", email: "suthkae@scg.com", status: "Member", type: "CPAC", createdDate: "24-08-2025 08:40" },
  { id: 10, username: "somchart", fullName: "สมชาติ เดชะเทพประวิทย์", email: "somchart@scg.com", status: "Member", type: "CPAC", createdDate: "25-08-2025 07:33" }
];

const T = {
  page: "var(--background)",
  card: "var(--card)",
  ink: "var(--foreground)",
  sub: "var(--muted-foreground)",
  line: "var(--border)",
  lineStrong: "var(--border)",
  accent: "var(--brand-accent-strong)",
  accentDeep: "var(--brand-text)",
  accentSoft: "var(--brand-soft)",
  danger: "var(--destructive)",
  ok: "var(--success)",
  shadow: "0 14px 36px var(--brand-shadow)"
};

const inputStyle = {
  width: "100%",
  borderRadius: 10,
  border: "1px solid var(--border)",
  background: "var(--card)",
  color: "var(--foreground)",
  minHeight: 38,
  height: 38,
  padding: "0 12px",
  fontSize: 13.5,
  fontFamily: "inherit",
  outline: "none"
};

const buttonPrimaryStyle = {
  height: 38,
  borderRadius: 10,
  border: "none",
  background: "linear-gradient(135deg, var(--brand-accent-strong) 0%, var(--brand-accent) 100%)",
  color: "#fff",
  padding: "0 16px",
  fontWeight: 800,
  fontFamily: "inherit",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 6
};

const buttonGhostStyle = {
  height: 38,
  borderRadius: 10,
  border: `1px solid var(--border)`,
  background: "var(--card)",
  color: "var(--foreground)",
  padding: "0 14px",
  fontWeight: 800,
  fontFamily: "inherit",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6
};

const buttonDangerStyle = {
  height: 38,
  borderRadius: 10,
  border: "none",
  background: "rgba(213, 48, 26, 0.08)",
  color: "var(--destructive)",
  padding: "0 14px",
  fontWeight: 800,
  fontFamily: "inherit",
  cursor: "pointer"
};

export default function SafetyAdminRole() {
  const navigate = useNavigate();
  const [users, setUsers] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("suea-safety-users-v1");
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          // ignore
        }
      }
    }
    return INITIAL_USERS;
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [editingUser, setEditingUser] = useState(null);
  const [addingUser, setAddingUser] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState(null);

  const [userForm, setUserForm] = useState({
    username: "",
    fullName: "",
    email: "",
    status: "Member",
    type: "CPAC"
  });

  const saveUsers = (newUsers) => {
    setUsers(newUsers);
    if (typeof window !== "undefined") {
      localStorage.setItem("suea-safety-users-v1", JSON.stringify(newUsers));
    }
  };

  const handleAddUser = () => {
    setUserForm({
      username: "",
      fullName: "",
      email: "",
      status: "Member",
      type: "CPAC"
    });
    setAddingUser(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setUserForm({
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      status: user.status,
      type: user.type
    });
  };

  const submitAddUser = () => {
    if (!userForm.username || !userForm.fullName || !userForm.email) {
      window.alert("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }
    const maxId = users.reduce((max, u) => Math.max(max, u.id || 0), 0);
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const formattedDate = `${day}-${month}-${year} ${hours}:${minutes}`;

    const newUser = {
      id: maxId + 1,
      username: userForm.username,
      fullName: userForm.fullName,
      email: userForm.email,
      status: userForm.status,
      type: userForm.type,
      createdDate: formattedDate
    };

    saveUsers([newUser, ...users]);
    setAddingUser(false);
  };

  const submitEditUser = () => {
    if (!userForm.username || !userForm.fullName || !userForm.email) {
      window.alert("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }
    const updated = users.map(u => {
      if (u.id === editingUser.id) {
        return {
          ...u,
          username: userForm.username,
          fullName: userForm.fullName,
          email: userForm.email,
          status: userForm.status,
          type: userForm.type
        };
      }
      return u;
    });

    saveUsers(updated);
    setEditingUser(null);
  };

  const handleDeleteUser = (id) => {
    setDeleteUserId(id);
  };

  const confirmDeleteUser = () => {
    const next = users.filter(u => u.id !== deleteUserId);
    saveUsers(next);
    setDeleteUserId(null);
  };

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return users.filter(u => {
      const matchesSearch = !query || 
        u.username.toLowerCase().includes(query) ||
        u.fullName.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query);
      
      const matchesStatus = statusFilter === "all" || u.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [users, searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredUsers.length / pageSize) || 1;

  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, page, pageSize]);

  return (
    <div
      style={{
        height: "100%",
        background: `radial-gradient(circle at top right, rgba(var(--brand-accent-rgb),0.18), transparent 28%), ${T.page}`,
        color: T.ink,
        fontFamily: "'Prompt','Sarabun',sans-serif",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden"
      }}
    >
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16, padding: "16px 20px", minHeight: 0 }}>
        
        {/* Header Block */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: T.card,
            border: `1px solid ${T.line}`,
            borderRadius: 20,
            padding: "12px 20px",
            boxShadow: `0 4px 12px var(--brand-shadow)`,
            flexShrink: 0
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button
              onClick={() => navigate("/safety-admin")}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                display: "grid",
                placeItems: "center",
                color: T.sub,
                padding: 4,
                borderRadius: "50%",
                transition: "background 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(0,0,0,0.05)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 900, color: T.ink, margin: 0 }}>จัดการบทบาทผู้ใช้งาน (User Role Management)</h1>
              <p style={{ fontSize: 12.5, color: T.sub, margin: "2px 0 0" }}>จัดการสิทธิ์ แผนก และการกำหนดกลุ่มทำงานของพนักงาน</p>
            </div>
          </div>

          <button onClick={handleAddUser} style={buttonPrimaryStyle}>
            <Plus size={15} />
            <span>เพิ่มผู้ใช้งาน</span>
          </button>
        </div>

        {/* Filters and List Table */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 16,
            background: T.card,
            border: `1px solid ${T.line}`,
            borderRadius: 24,
            padding: 16,
            boxShadow: T.shadow,
            minHeight: 0,
            overflow: "hidden"
          }}
        >
          {/* Filter row */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
            <div style={{ position: "relative", width: 300 }}>
              <input
                type="text"
                placeholder="ค้นหาชื่อผู้ใช้, ชื่อจริง, อีเมล..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                style={{
                  ...inputStyle,
                  paddingLeft: 34
                }}
              />
              <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: T.sub }} />
            </div>

            <Combobox
              value={statusFilter}
              onValueChange={(val) => { setStatusFilter(val); setPage(1); }}
              aria-label="กรองประเภทบทบาท"
              searchPlaceholder="ค้นหาบทบาท"
              style={{ width: 160 }}
              options={[
                { value: "all", label: "บทบาททั้งหมด" },
                { value: "Admin", label: "Admin" },
                { value: "Member", label: "Member" }
              ]}
            />
          </div>

          {/* Table Container */}
          <div style={{ flex: 1, overflowY: "auto", minHeight: 0, border: `1px solid ${T.line}`, borderRadius: 12 }}>
            {paginatedUsers.length === 0 ? (
              <div style={{ padding: 48, textAlign: "center", color: T.sub, fontSize: 14 }}>
                ไม่พบข้อมูลผู้ใช้งานตามเงื่อนไขที่เลือก
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", background: T.card, textAlign: "left", fontSize: "13.5px" }}>
                <thead>
                  <tr style={{ background: "var(--secondary)", borderBottom: `2px solid ${T.line}`, minHeight: 48 }}>
                    <th style={{ padding: "12px 16px", fontWeight: 800, color: "var(--secondary-foreground)", width: 80, textAlign: "center" }}>Avatar</th>
                    <th style={{ padding: "12px 16px", fontWeight: 800, color: "var(--secondary-foreground)" }}>Username</th>
                    <th style={{ padding: "12px 16px", fontWeight: 800, color: "var(--secondary-foreground)" }}>Full Name</th>
                    <th style={{ padding: "12px 16px", fontWeight: 800, color: "var(--secondary-foreground)" }}>Email</th>
                    <th style={{ padding: "12px 16px", fontWeight: 800, color: "var(--secondary-foreground)", width: 100 }}>Status</th>
                    <th style={{ padding: "12px 16px", fontWeight: 800, color: "var(--secondary-foreground)", width: 90 }}>Type</th>
                    <th style={{ padding: "12px 16px", fontWeight: 800, color: "var(--secondary-foreground)", width: 160 }}>Create Date</th>
                    <th style={{ padding: "12px 16px", fontWeight: 800, color: "var(--secondary-foreground)", width: 100, textAlign: "center" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.map((user, idx) => {
                    const firstChar = user.fullName ? user.fullName.charAt(0) : "?";
                    return (
                      <tr
                        key={user.id}
                        style={{
                          borderBottom: idx < paginatedUsers.length - 1 ? `1px solid ${T.line}` : "none",
                          transition: "background 0.2s"
                        }}
                        className="hover:bg-[rgba(var(--brand-accent-rgb),0.03)] transition-colors"
                      >
                        {/* Avatar */}
                        <td style={{ padding: "10px 16px", textAlign: "center" }}>
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: "50%",
                              background: "var(--primary)",
                              color: "var(--primary-foreground, #fff)",
                              display: "grid",
                              placeItems: "center",
                              fontWeight: "700",
                              fontSize: "13px",
                              margin: "0 auto"
                            }}
                          >
                            {firstChar}
                          </div>
                        </td>

                        {/* Username */}
                        <td style={{ padding: "10px 16px", fontWeight: "600", color: T.ink }}>
                          {user.username}
                        </td>

                        {/* Full Name */}
                        <td style={{ padding: "10px 16px", fontWeight: "700", color: T.ink }}>
                          {user.fullName}
                        </td>

                        {/* Email */}
                        <td style={{ padding: "10px 16px", color: T.sub }}>
                          {user.email}
                        </td>

                        {/* Status */}
                        <td style={{ padding: "10px 16px" }}>
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: "800",
                              color: user.status === "Admin" ? "var(--success)" : "var(--brand-text)",
                              background: user.status === "Admin" ? "rgba(31, 122, 85, 0.08)" : "var(--brand-soft)",
                              border: user.status === "Admin" ? "1px solid rgba(31, 122, 85, 0.25)" : "1px solid rgba(var(--brand-accent-rgb), 0.3)",
                              padding: "2px 8px",
                              borderRadius: "6px",
                              display: "inline-block"
                            }}
                          >
                            {user.status}
                          </span>
                        </td>

                        {/* Type */}
                        <td style={{ padding: "10px 16px" }}>
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: "800",
                              color: "var(--secondary-foreground)",
                              background: "var(--secondary)",
                              border: "1px solid var(--border)",
                              padding: "2px 8px",
                              borderRadius: "6px",
                              display: "inline-block"
                            }}
                          >
                            {user.type}
                          </span>
                        </td>

                        {/* Create Date */}
                        <td style={{ padding: "10px 16px", color: T.sub }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <Calendar size={13} style={{ color: "var(--primary)" }} />
                            <span>{user.createdDate}</span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td style={{ padding: "10px 16px", textAlign: "center" }}>
                          <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
                            <button
                              type="button"
                              onClick={() => handleEditUser(user)}
                              style={{
                                width: 30,
                                height: 30,
                                borderRadius: 6,
                                border: "none",
                                background: "var(--primary)",
                                color: "var(--primary-foreground, #fff)",
                                display: "grid",
                                placeItems: "center",
                                cursor: "pointer",
                                boxShadow: `0 4px 10px var(--brand-shadow)`
                              }}
                              title="แก้ไข"
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(user.id)}
                              style={{
                                width: 30,
                                height: 30,
                                borderRadius: 6,
                                border: "none",
                                background: "var(--destructive)",
                                color: "#ffffff",
                                display: "grid",
                                placeItems: "center",
                                cursor: "pointer",
                                boxShadow: `0 4px 10px rgba(213, 48, 26, 0.12)`
                              }}
                              title="ลบ"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination Controls */}
          {filteredUsers.length > 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderTop: `1px solid ${T.line}`,
                paddingTop: 12,
                flexShrink: 0,
                fontSize: 13,
                color: T.sub
              }}
            >
              <div>
                Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, filteredUsers.length)} of {filteredUsers.length} users
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ display: "flex", gap: 4 }}>
                  <button
                    type="button"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    style={{
                      ...buttonGhostStyle,
                      height: 28,
                      minWidth: 28,
                      borderRadius: 6,
                      padding: 0,
                      fontSize: 12,
                      opacity: page === 1 ? 0.5 : 1,
                      cursor: page === 1 ? "not-allowed" : "pointer"
                    }}
                  >
                    &lt;
                  </button>
                  {Array.from({ length: totalPages }).map((_, index) => {
                    const pageNum = index + 1;
                    const active = page === pageNum;
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setPage(pageNum)}
                        style={{
                          height: 28,
                          minWidth: 28,
                          borderRadius: 6,
                          border: active ? `1px solid ${T.accent}` : `1px solid ${T.line}`,
                          background: active ? T.accentSoft : "var(--card)",
                          color: active ? T.accentDeep : T.ink,
                          fontSize: 12,
                          fontWeight: 800,
                          cursor: "pointer",
                          padding: 0,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                    style={{
                      ...buttonGhostStyle,
                      height: 28,
                      minWidth: 28,
                      borderRadius: 6,
                      padding: 0,
                      fontSize: 12,
                      opacity: page === totalPages ? 0.5 : 1,
                      cursor: page === totalPages ? "not-allowed" : "pointer"
                    }}
                  >
                    &gt;
                  </button>
                </div>

                <Combobox
                  value={String(pageSize)}
                  onValueChange={(v) => { setPageSize(parseInt(v)); setPage(1); }}
                  aria-label="จำนวนต่อหน้า"
                  searchable={false}
                  style={{ width: 120 }}
                  options={[
                    { value: "5", label: "5 / page" },
                    { value: "10", label: "10 / page" },
                    { value: "20", label: "20 / page" }
                  ]}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add User Modal */}
      {addingUser && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0, 0, 0, 0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(4px)"
          }}
        >
          <div
            style={{
              background: T.card,
              borderRadius: 20,
              width: "100%",
              maxWidth: 480,
              padding: 24,
              boxShadow: T.shadow,
              display: "flex",
              flexDirection: "column",
              gap: 16
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: 16, fontWeight: 900, color: T.ink, margin: 0 }}>เพิ่มผู้ใช้งานใหม่</h3>
              <button
                onClick={() => setAddingUser(false)}
                style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: 16, color: T.sub }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "grid", gap: 4 }}>
                <label style={{ fontSize: 12, fontWeight: 800, color: T.sub }}>Username</label>
                <input
                  type="text"
                  placeholder="เช่น sompoplo"
                  value={userForm.username}
                  onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div style={{ display: "grid", gap: 4 }}>
                <label style={{ fontSize: 12, fontWeight: 800, color: T.sub }}>Full Name</label>
                <input
                  type="text"
                  placeholder="เช่น สมพร ปลอดสวัสดิ์"
                  value={userForm.fullName}
                  onChange={(e) => setUserForm({ ...userForm, fullName: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div style={{ display: "grid", gap: 4 }}>
                <label style={{ fontSize: 12, fontWeight: 800, color: T.sub }}>Email</label>
                <input
                  type="email"
                  placeholder="เช่น sompoplo@scg.com"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div style={{ display: "grid", gap: 4 }}>
                <label style={{ fontSize: 12, fontWeight: 800, color: T.sub }}>Status</label>
                <select
                  value={userForm.status}
                  onChange={(e) => setUserForm({ ...userForm, status: e.target.value })}
                  style={{ ...inputStyle, cursor: "pointer" }}
                >
                  <option value="Admin">Admin</option>
                  <option value="Member">Member</option>
                </select>
              </div>
              <div style={{ display: "grid", gap: 4 }}>
                <label style={{ fontSize: 12, fontWeight: 800, color: T.sub }}>Type</label>
                <input
                  type="text"
                  value={userForm.type}
                  onChange={(e) => setUserForm({ ...userForm, type: e.target.value })}
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
              <button onClick={() => setAddingUser(false)} style={buttonGhostStyle}>ยกเลิก</button>
              <button onClick={submitAddUser} style={buttonPrimaryStyle}>บันทึก</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0, 0, 0, 0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(4px)"
          }}
        >
          <div
            style={{
              background: T.card,
              borderRadius: 20,
              width: "100%",
              maxWidth: 480,
              padding: 24,
              boxShadow: T.shadow,
              display: "flex",
              flexDirection: "column",
              gap: 16
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: 16, fontWeight: 900, color: T.ink, margin: 0 }}>แก้ไขผู้ใช้งาน</h3>
              <button
                onClick={() => setEditingUser(null)}
                style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: 16, color: T.sub }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "grid", gap: 4 }}>
                <label style={{ fontSize: 12, fontWeight: 800, color: T.sub }}>Username</label>
                <input
                  type="text"
                  value={userForm.username}
                  onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div style={{ display: "grid", gap: 4 }}>
                <label style={{ fontSize: 12, fontWeight: 800, color: T.sub }}>Full Name</label>
                <input
                  type="text"
                  value={userForm.fullName}
                  onChange={(e) => setUserForm({ ...userForm, fullName: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div style={{ display: "grid", gap: 4 }}>
                <label style={{ fontSize: 12, fontWeight: 800, color: T.sub }}>Email</label>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div style={{ display: "grid", gap: 4 }}>
                <label style={{ fontSize: 12, fontWeight: 800, color: T.sub }}>Status</label>
                <select
                  value={userForm.status}
                  onChange={(e) => setUserForm({ ...userForm, status: e.target.value })}
                  style={{ ...inputStyle, cursor: "pointer" }}
                >
                  <option value="Admin">Admin</option>
                  <option value="Member">Member</option>
                </select>
              </div>
              <div style={{ display: "grid", gap: 4 }}>
                <label style={{ fontSize: 12, fontWeight: 800, color: T.sub }}>Type</label>
                <input
                  type="text"
                  value={userForm.type}
                  onChange={(e) => setUserForm({ ...userForm, type: e.target.value })}
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
              <button onClick={() => setEditingUser(null)} style={buttonGhostStyle}>ยกเลิก</button>
              <button onClick={submitEditUser} style={buttonPrimaryStyle}>บันทึก</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Dialog */}
      {deleteUserId && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0, 0, 0, 0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(4px)"
          }}
        >
          <div
            style={{
              background: T.card,
              borderRadius: 20,
              width: "100%",
              maxWidth: 400,
              padding: 24,
              boxShadow: T.shadow,
              display: "flex",
              flexDirection: "column",
              gap: 16
            }}
          >
            <h3 style={{ fontSize: 16, fontWeight: 900, color: T.danger, margin: 0 }}>ยืนยันการลบผู้ใช้งาน</h3>
            <p style={{ fontSize: 14, color: T.ink, margin: 0 }}>คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลผู้ใช้งานรายนี้? การลบข้อมูลจะไม่สามารถกู้คืนได้</p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
              <button onClick={() => setDeleteUserId(null)} style={buttonGhostStyle}>ยกเลิก</button>
              <button onClick={confirmDeleteUser} style={buttonDangerStyle}>ยืนยันลบ</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
