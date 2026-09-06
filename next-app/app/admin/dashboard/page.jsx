"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  Users,
  UserCheck,
  Truck,
  FileText,
  Plus,
  Download,
  Search,
  Calendar,
  LogOut,
  ShieldCheck,
  Layers,
  CheckCircle2,
  Clock,
  Lock,
  KeyRound,
  Edit3,
  Trash2,
  X,
  AlertCircle,
  Home as HomeIcon,
  Mail,
  QrCode,
  ScanLine,
  User,
  Sparkles,
  RefreshCw,
  Sun,
  Moon
} from "lucide-react";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("REGISTER"); // REGISTER, DESTINATIONS, USERS, REPORTS

  // Dashboard Overview Stats
  const [stats, setStats] = useState({ guestsToday: 0, deliveriesToday: 0, currentlyInside: 0, exitedToday: 0 });
  const [organization, setOrganization] = useState({});
  const [liveRegister, setLiveRegister] = useState([]);
  const [loading, setLoading] = useState(true);

  // Destination Management Form State
  const [destinations, setDestinations] = useState([]);
  const [destForm, setDestForm] = useState({ groupLabel: "", unitNumber: "", customFullName: "" });
  const [destMsg, setDestMsg] = useState("");

  // Member Management State
  const [usersList, setUsersList] = useState([]);
  const [userForm, setUserForm] = useState({ username: "", flatUnit: "", phone: "", password: "", role: "MEMBER" });
  const [userMsg, setUserMsg] = useState("");

  // Edit / Password Reset Modal State for Members
  const [selectedUser, setSelectedUser] = useState(null);
  const [editForm, setEditForm] = useState({ username: "", phone: "", role: "MEMBER", newPassword: "" });
  const [editMsg, setEditMsg] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);

  // Admin Self Profile Edit State
  const [showAdminProfileModal, setShowAdminProfileModal] = useState(false);
  const [adminProfileForm, setAdminProfileForm] = useState({ username: "", flatUnit: "", phone: "" });
  const [adminProfileMsg, setAdminProfileMsg] = useState({ type: "", text: "" });

  // Admin Self Password Change Modal State
  const [showAdminPasswordModal, setShowAdminPasswordModal] = useState(false);
  const [adminPassForm, setAdminPassForm] = useState({ oldPassword: "", newPassword: "" });
  const [adminPassMsg, setAdminPassMsg] = useState({ type: "", text: "" });
  const [adminPassLoading, setAdminPassLoading] = useState(false);

  // Report Filtering State
  const [reports, setReports] = useState([]);
  const [reportFilters, setReportFilters] = useState({
    fromDate: "",
    toDate: "",
    entryType: "ALL",
    status: "ALL",
    search: "",
  });

  // Theme State: 'dark' | 'light'
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    const savedTheme = localStorage.getItem("gatify_theme") || "dark";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
    document.documentElement.classList.toggle("light", savedTheme === "light");

    const storedUser = localStorage.getItem("gatify_user") || localStorage.getItem("qrgp_user");
    const token = localStorage.getItem("gatify_token") || localStorage.getItem("qrgp_token");
    if (!storedUser || !token) {
      router.push("/login");
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    if (parsedUser.role !== "ADMIN") {
      router.push("/login");
      return;
    }
    setUser(parsedUser);
    setAdminProfileForm({
      username: parsedUser.username || "",
      flatUnit: parsedUser.phone || "",
      phone: parsedUser.phone || "",
    });
    fetchDashboardOverview();
    fetchDestinations();
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("gatify_theme", nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
    document.documentElement.classList.toggle("light", nextTheme === "light");
  };

  const fetchDashboardOverview = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("gatify_token") || localStorage.getItem("qrgp_token");
      const res = await fetch("/api/admin/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        setOrganization(data.organization);
        setLiveRegister(data.liveRegister || []);
      }
    } catch (err) {
      console.error("Dashboard overview error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDestinations = async () => {
    try {
      const token = localStorage.getItem("gatify_token") || localStorage.getItem("qrgp_token");
      const res = await fetch("/api/admin/destinations", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setDestinations(data.destinations || []);
    } catch (err) {
      console.error("Fetch destinations error:", err);
    }
  };

  const handleAddDestination = async (e) => {
    e.preventDefault();
    setDestMsg("");
    try {
      const token = localStorage.getItem("gatify_token") || localStorage.getItem("qrgp_token");
      const res = await fetch("/api/admin/destinations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(destForm),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to add destination.");
      setDestMsg("Destination added successfully!");
      setDestForm({ groupLabel: "", unitNumber: "", customFullName: "" });
      fetchDestinations();
    } catch (err) {
      setDestMsg(err.message);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("gatify_token") || localStorage.getItem("qrgp_token");
      const res = await fetch("/api/admin/members", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setUsersList(data.users || []);
    } catch (err) {
      console.error("Fetch users error:", err);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setUserMsg("");
    try {
      const token = localStorage.getItem("gatify_token") || localStorage.getItem("qrgp_token");
      const res = await fetch("/api/admin/members", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: userForm.username,
          phone: userForm.phone || userForm.flatUnit,
          password: userForm.password,
          role: userForm.role,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to create user.");
      setUserMsg(`Member "${data.user.username}" created successfully!`);
      setUserForm({ username: "", flatUnit: "", phone: "", password: "", role: "MEMBER" });
      fetchUsers();
    } catch (err) {
      setUserMsg(err.message);
    }
  };

  const handleOpenEditModal = (u) => {
    setSelectedUser(u);
    setEditForm({
      username: u.username || "",
      phone: u.phone || "",
      role: u.role || "MEMBER",
      newPassword: "",
    });
    setEditMsg("");
    setShowEditModal(true);
  };

  const handleUpdateMember = async (e) => {
    e.preventDefault();
    setEditMsg("");
    try {
      const token = localStorage.getItem("gatify_token") || localStorage.getItem("qrgp_token");
      const res = await fetch("/api/admin/members", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          ...editForm,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to update member.");
      setEditMsg(`Updated ${data.user.username} successfully!`);
      setTimeout(() => {
        setShowEditModal(false);
        fetchUsers();
      }, 1200);
    } catch (err) {
      setEditMsg(err.message);
    }
  };

  const handleExportCSV = () => {
    if (!reports || reports.length === 0) {
      alert("No report records to export.");
      return;
    }

    const headers = ["Log ID", "Visitor Name", "Phone", "Entry Type", "Destinations", "Status", "Entry Time", "Exit Time"];
    const rows = reports.map((r) => [
      `"${r.id || ""}"`,
      `"${(r.person_name || "").replace(/"/g, '""')}"`,
      `"${(r.phone || "").replace(/"/g, '""')}"`,
      `"${r.entry_type || ""}"`,
      `"${(Array.isArray(r.destinations) ? r.destinations.join(", ") : r.destinations || "").replace(/"/g, '""')}"`,
      `"${r.status || ""}"`,
      `"${r.entry_time || ""}"`,
      `"${r.exit_time || ""}"`,
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Gatify_Activity_Report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    if (!reports || reports.length === 0) {
      alert("No report records to export.");
      return;
    }

    const orgTitle = user?.organizationName || user?.organizationCode || "Gatify Security Hub";
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to export the PDF report.");
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Gatify Security Audit Report</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; color: #0f172a; margin: 0; }
          .header { border-bottom: 2px solid #06b6d4; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
          h1 { margin: 0 0 4px 0; font-size: 22px; color: #0f172a; }
          .subtitle { font-size: 12px; color: #64748b; margin: 0; }
          .meta { font-size: 11px; color: #334155; margin-bottom: 16px; line-height: 1.6; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 10px; }
          th { background: #f1f5f9; text-align: left; padding: 8px; font-weight: 700; color: #334155; border-bottom: 1px solid #cbd5e1; }
          td { padding: 8px; border-bottom: 1px solid #e2e8f0; }
          tr:nth-child(even) td { background: #f8fafc; }
          .status-inside { color: #059669; font-weight: 700; }
          .status-exited { color: #64748b; font-weight: 600; }
          .footer { margin-top: 24px; font-size: 10px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 10px; }
          @media print {
            body { padding: 12px; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>GATIFY SECURITY GATE REPORT</h1>
            <p class="subtitle">Spatial Access & Intelligent Visitor OS</p>
          </div>
          <div style="text-align: right;">
            <strong style="font-size: 13px; color: #0284c7;">${orgTitle}</strong>
          </div>
        </div>

        <div class="meta">
          <strong>Generated On:</strong> ${new Date().toLocaleString()}<br/>
          <strong>Total Records:</strong> ${reports.length}
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Visitor / Person</th>
              <th>Type</th>
              <th>Destination(s)</th>
              <th>Status</th>
              <th>Entry Time</th>
              <th>Exit Time</th>
            </tr>
          </thead>
          <tbody>
            ${reports
              .map(
                (r, i) => `
              <tr>
                <td>${i + 1}</td>
                <td><strong>${r.person_name || "N/A"}</strong> ${r.phone ? `<span style="color: #64748b;">(${r.phone})</span>` : ""}</td>
                <td>${r.entry_type || "GUEST"}</td>
                <td>${Array.isArray(r.destinations) ? r.destinations.join(", ") : r.destinations || "N/A"}</td>
                <td class="${r.status === "INSIDE" ? "status-inside" : "status-exited"}">${r.status || "N/A"}</td>
                <td>${r.entry_time ? new Date(r.entry_time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : "N/A"}</td>
                <td>${r.exit_time ? new Date(r.exit_time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : "—"}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>

        <div class="footer">
          Report generated by Gatify Platform • Official Security & Visitor Audit Log
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleUpdateAdminProfile = async (e) => {
    e.preventDefault();
    setAdminProfileMsg({ type: "", text: "" });

    try {
      const token = localStorage.getItem("gatify_token") || localStorage.getItem("qrgp_token");
      const res = await fetch("/api/admin/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(adminProfileForm),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to update admin profile.");

      const updatedUser = { ...user, username: data.user.username, phone: data.user.phone };
      setUser(updatedUser);
      localStorage.setItem("gatify_user", JSON.stringify(updatedUser));
      localStorage.setItem("qrgp_user", JSON.stringify(updatedUser));

      setAdminProfileMsg({ type: "success", text: "Admin profile details updated successfully!" });
      setTimeout(() => setShowAdminProfileModal(false), 1200);
    } catch (err) {
      setAdminProfileMsg({ type: "error", text: err.message });
    }
  };

  const handleChangeAdminPasswordWithOld = async (e) => {
    e.preventDefault();
    setAdminPassMsg({ type: "", text: "" });
    setAdminPassLoading(true);

    try {
      const token = localStorage.getItem("gatify_token") || localStorage.getItem("qrgp_token");
      const res = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(adminPassForm),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to update admin password.");
      setAdminPassMsg({ type: "success", text: "Admin password changed successfully!" });
      setAdminPassForm({ oldPassword: "", newPassword: "" });
      setTimeout(() => setShowAdminPasswordModal(false), 1500);
    } catch (err) {
      setAdminPassMsg({ type: "error", text: err.message });
    } finally {
      setAdminPassLoading(false);
    }
  };

  const handleDeleteMember = async (userId, username) => {
    if (!confirm(`Are you sure you want to remove member "${username}"?`)) return;
    try {
      const token = localStorage.getItem("gatify_token") || localStorage.getItem("qrgp_token");
      const res = await fetch(`/api/admin/members?userId=${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to delete user.");
      fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  const fetchFilteredReports = async (customFilters) => {
    try {
      const filtersToUse = customFilters || reportFilters;
      const token = localStorage.getItem("gatify_token") || localStorage.getItem("qrgp_token");
      const query = new URLSearchParams(filtersToUse).toString();
      const res = await fetch(`/api/admin/reports?${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setReports(data.logs || []);
    } catch (err) {
      console.error("Fetch reports error:", err);
    }
  };

  const handleClearFilters = () => {
    const cleared = {
      fromDate: "",
      toDate: "",
      entryType: "ALL",
      status: "ALL",
      search: "",
    };
    setReportFilters(cleared);
    fetchFilteredReports(cleared);
  };

  const handleLogout = () => {
    localStorage.removeItem("gatify_token");
    localStorage.removeItem("gatify_user");
    localStorage.removeItem("qrgp_token");
    localStorage.removeItem("qrgp_user");
    router.push("/login");
  };

  if (!user) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="glass-elevated rounded-2xl p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold truncate">{organization.name || user.organizationName}</h1>
            <span className="px-2.5 py-1 rounded-full glass-badge-cyan text-xs font-medium">
              {user.organizationCode}
            </span>
          </div>
          <p className="text-sm text-[var(--text-secondary)]">
            {user.username}{user.phone ? ` · ${user.phone}` : ""}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/member"
            className="btn-liquid-secondary px-3 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5"
          >
            <QrCode className="w-4 h-4" /> Passes
          </Link>
          <Link
            href="/gatekeeper"
            className="btn-liquid-secondary px-3 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5"
          >
            <ScanLine className="w-4 h-4" /> Scanner
          </Link>
          <button
            onClick={() => {
              setAdminProfileMsg({ type: "", text: "" });
              setShowAdminProfileModal(true);
            }}
            className="p-2.5 rounded-xl border border-[var(--border)]"
            title="Edit profile"
          >
            <User className="w-4 h-4 text-teal-400" />
          </button>
          <button
            onClick={() => {
              setAdminPassMsg({ type: "", text: "" });
              setShowAdminPasswordModal(true);
            }}
            className="p-2.5 rounded-xl border border-[var(--border)]"
            title="Change password"
          >
            <KeyRound className="w-4 h-4 text-teal-400" />
          </button>
          <button
            onClick={handleLogout}
            className="p-2.5 rounded-xl border border-rose-500/20 text-rose-400"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* TODAY'S OVERVIEW COUNTERS (Liquid Glass KPI Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-elevated rounded-2xl p-5 space-y-1">
          <span className="text-sm text-[var(--text-secondary)]">Guests today</span>
          <span className="text-3xl font-bold text-teal-400">{stats.guestsToday}</span>
        </div>
        <div className="glass-elevated rounded-2xl p-5 space-y-1">
          <span className="text-sm text-[var(--text-secondary)]">Deliveries today</span>
          <span className="text-3xl font-bold text-sky-400">{stats.deliveriesToday}</span>
        </div>
        <div className="glass-elevated rounded-2xl p-5 space-y-1">
          <span className="text-sm text-[var(--text-secondary)]">Currently inside</span>
          <span className="text-3xl font-bold text-emerald-400">{stats.currentlyInside}</span>
        </div>
        <div className="glass-elevated rounded-2xl p-5 space-y-1">
          <span className="text-sm text-[var(--text-secondary)]">Exited today</span>
          <span className="text-3xl font-bold text-[var(--text-primary)]">{stats.exitedToday}</span>
        </div>
      </div>

      {/* ADMIN NAVIGATION TABS */}
      <div className="ui-tab-bar">
        <button
          onClick={() => setActiveTab("REGISTER")}
          className={`px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap ${activeTab === "REGISTER" ? "btn-liquid-primary" : "text-[var(--text-secondary)]"}`}
        >
          Live feed
        </button>
        <button
          onClick={() => {
            setActiveTab("DESTINATIONS");
            fetchDestinations();
          }}
          className={`px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap ${activeTab === "DESTINATIONS" ? "btn-liquid-primary" : "text-[var(--text-secondary)]"}`}
        >
          Units ({destinations.length})
        </button>
        <button
          onClick={() => {
            setActiveTab("USERS");
            fetchUsers();
          }}
          className={`px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap ${activeTab === "USERS" ? "btn-liquid-primary" : "text-[var(--text-secondary)]"}`}
        >
          Members
        </button>
        <button
          onClick={() => {
            setActiveTab("REPORTS");
            fetchFilteredReports();
          }}
          className={`px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap ${activeTab === "REPORTS" ? "btn-liquid-primary" : "text-[var(--text-secondary)]"}`}
        >
          Reports
        </button>
      </div>

      {/* TAB 1: LIVE ACTIVITY REGISTER (Flowing Frosted Feed Planks) */}
      {activeTab === "REGISTER" && (
        <div className="glass-floating rounded-3xl p-6 sm:p-8 space-y-5 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-500" />
              <span>Live Gate Activity Stream</span>
            </h2>
            <button
              onClick={fetchDashboardOverview}
              className="text-xs text-cyan-600 dark:text-cyan-400 font-bold hover:underline flex items-center gap-1.5 spring-press"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Stream
            </button>
          </div>

          <div className="space-y-3">
            {liveRegister.length === 0 ? (
              <div className="py-12 text-center text-slate-500 dark:text-slate-400 text-sm">No gate entry movements logged yet today.</div>
            ) : (
              liveRegister.map((log) => (
                <div key={log.id} className="glass-plank p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-start sm:items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-full font-black text-[10px] shrink-0 ${log.entry_type === 'DELIVERY' ? 'glass-badge-amber' : 'glass-badge-cyan'}`}>
                      {log.entry_type}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-slate-900 dark:text-white text-sm font-bold">{log.person_name}</strong>
                        {log.company_name && <span className="text-slate-500 dark:text-slate-400 font-medium">({log.company_name})</span>}
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                        Destinations: <strong className="text-cyan-600 dark:text-cyan-300 font-mono">{Array.isArray(log.destinations) ? log.destinations.join(', ') : log.destinations}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                    <span className="font-mono text-slate-500 dark:text-slate-400 text-xs">
                      {new Date(log.entry_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className={`font-black text-xs px-2.5 py-0.5 rounded-full ${log.status === 'INSIDE' ? 'glass-badge-emerald' : 'text-slate-500 bg-slate-800/10 dark:bg-slate-800'}`}>
                      {log.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: CONFIGURE DESTINATIONS */}
      {activeTab === "DESTINATIONS" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="glass-floating rounded-3xl p-6 sm:p-8 space-y-4">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-cyan-400" />
              <span>Add Destination</span>
            </h2>

            {destMsg && <div className="p-3 rounded-2xl glass-badge-emerald text-xs font-bold">{destMsg}</div>}

            <form onSubmit={handleAddDestination} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Group Label / Wing (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Wing A, Block B, Floor 2"
                  value={destForm.groupLabel}
                  onChange={(e) => setDestForm({ ...destForm, groupLabel: e.target.value })}
                  className="glass-input w-full px-4 py-3 rounded-2xl text-white placeholder-slate-500 text-sm focus:border-cyan-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Unit / Flat / Department Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 101, 203, HR Dept, Villa 12"
                  value={destForm.unitNumber}
                  onChange={(e) => setDestForm({ ...destForm, unitNumber: e.target.value })}
                  className="glass-input w-full px-4 py-3 rounded-2xl text-white placeholder-slate-500 text-sm focus:border-cyan-400"
                />
              </div>

              <button
                type="submit"
                className="btn-liquid-primary w-full py-3.5 rounded-2xl text-white font-extrabold text-sm shadow-lg shadow-cyan-600/30 spring-press mt-2"
              >
                Add Destination
              </button>
            </form>
          </div>

          <div className="glass-floating rounded-3xl p-6 sm:p-8 space-y-4">
            <h2 className="text-lg font-black text-white">Configured Destinations ({destinations.length})</h2>
            <div className="max-h-[50vh] overflow-y-auto space-y-2 pr-1">
              {destinations.map((d) => (
                <div key={d.id} className="glass-plank p-3.5 rounded-2xl flex items-center justify-between text-xs text-white">
                  <span className="font-bold">{d.full_name}</span>
                  <span className="text-slate-400 font-mono text-[10px] glass-pill px-2 py-0.5 rounded-full">{d.group_label || 'Unit'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MANAGE MEMBERS */}
      {activeTab === "USERS" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in zoom-in-95 duration-200">
          {/* Create User Card */}
          <div className="glass-floating rounded-3xl p-6 sm:p-8 space-y-4">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-400" />
              <span>Create Member</span>
            </h2>

            {userMsg && <div className="p-3 rounded-2xl glass-badge-emerald text-xs font-bold">{userMsg}</div>}

            <form onSubmit={handleAddUser} className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Account Role</label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                  className="glass-input w-full px-3.5 py-2.5 rounded-2xl text-white text-xs focus:border-cyan-400"
                >
                  <option value="MEMBER" className="bg-slate-900 text-white">MEMBER (Resident / Authorized)</option>
                  <option value="GATEKEEPER" className="bg-slate-900 text-white">GATEKEEPER (Security Guard)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Member Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Patel"
                  value={userForm.username}
                  onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                  className="glass-input w-full px-3.5 py-2.5 rounded-2xl text-white text-xs focus:border-cyan-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Flat / Unit Number *</label>
                {destinations.length > 0 ? (
                  <select
                    value={userForm.flatUnit}
                    onChange={(e) => setUserForm({ ...userForm, flatUnit: e.target.value })}
                    className="glass-input w-full px-3.5 py-2.5 rounded-2xl text-white text-xs focus:border-cyan-400"
                  >
                    <option value="" className="bg-slate-900 text-white">Select Configured Flat...</option>
                    {destinations.map((d) => (
                      <option key={d.id} value={d.full_name} className="bg-slate-900 text-white">{d.full_name}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    placeholder="e.g. A-203 or House 12"
                    value={userForm.flatUnit}
                    onChange={(e) => setUserForm({ ...userForm, flatUnit: e.target.value })}
                    className="glass-input w-full px-3.5 py-2.5 rounded-2xl text-white text-xs focus:border-cyan-400"
                  />
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Password *</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  className="glass-input w-full px-3.5 py-2.5 rounded-2xl text-white text-xs focus:border-cyan-400"
                />
              </div>

              <button
                type="submit"
                className="btn-liquid-primary w-full py-3.5 rounded-2xl text-white font-extrabold text-xs shadow-lg shadow-cyan-600/30 spring-press mt-2"
              >
                Create Account
              </button>
            </form>
          </div>

          {/* Member Accounts List */}
          <div className="lg:col-span-2 glass-floating rounded-3xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-white">Organization Accounts ({usersList.length})</h2>
              <span className="text-xs text-slate-400">Click key to set password anytime</span>
            </div>

            <div className="max-h-[60vh] overflow-y-auto space-y-2.5 pr-1">
              {usersList
                .filter((u) => u.role !== 'ADMIN')
                .map((u) => (
                  <div key={u.id} className="glass-plank p-4 rounded-2xl flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-white text-sm font-bold">{u.username}</strong>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${u.role === 'GATEKEEPER' ? 'glass-badge-amber' : 'glass-badge-cyan'}`}>
                          {u.role}
                        </span>
                      </div>
                      <p className="text-slate-400 text-xs mt-1">Flat / Unit: <strong className="text-cyan-300 font-mono">{u.phone || 'Assigned'}</strong></p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEditModal(u)}
                        className="btn-liquid-secondary px-3 py-1.5 rounded-xl text-cyan-300 font-bold flex items-center gap-1.5 spring-press text-xs"
                      >
                        <KeyRound className="w-3.5 h-3.5 text-cyan-400" /> Edit Password
                      </button>

                      {u.id !== user.id && (
                        <button
                          onClick={() => handleDeleteMember(u.id, u.username)}
                          className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 spring-press transition-colors"
                          title="Remove Member"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: REPORTS & EXPORTS */}
      {activeTab === "REPORTS" && (
        <div className="glass-floating rounded-3xl p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-cyan-500" />
              <span>Filter & Export Gate Activity</span>
            </h2>
            <div className="flex items-center gap-2.5">
              <button
                onClick={handleExportCSV}
                className="btn-liquid-primary py-2.5 px-4 rounded-2xl text-white font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 spring-press"
              >
                <Download className="w-4 h-4" /> Export CSV / Excel
              </button>
              <button
                onClick={handleExportPDF}
                className="py-2.5 px-4 rounded-2xl text-white font-extrabold text-xs flex items-center gap-2 shadow-lg bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 shadow-rose-600/30 spring-press"
              >
                <FileText className="w-4 h-4" /> Export PDF Report
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 glass-sheet p-4 rounded-2xl">
            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">From Date</label>
              <input
                type="date"
                value={reportFilters.fromDate}
                onChange={(e) => setReportFilters({ ...reportFilters, fromDate: e.target.value })}
                className="glass-input w-full px-3 py-2 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">To Date</label>
              <input
                type="date"
                value={reportFilters.toDate}
                onChange={(e) => setReportFilters({ ...reportFilters, toDate: e.target.value })}
                className="glass-input w-full px-3 py-2 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">Entry Type</label>
              <select
                value={reportFilters.entryType}
                onChange={(e) => setReportFilters({ ...reportFilters, entryType: e.target.value })}
                className="glass-input w-full px-3 py-2 rounded-xl text-xs"
              >
                <option value="ALL">All Types</option>
                <option value="GUEST">Guest Passes</option>
                <option value="DELIVERY">Deliveries</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => fetchFilteredReports()}
                className="btn-liquid-primary w-full py-2.5 px-3 rounded-xl text-white font-bold text-xs spring-press"
              >
                Apply Filters
              </button>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleClearFilters}
                className="btn-liquid-secondary w-full py-2.5 px-3 rounded-xl text-slate-800 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white font-bold text-xs spring-press"
              >
                Clear Filters
              </button>
            </div>
          </div>

          <div className="space-y-2.5 max-h-[50vh] overflow-y-auto p-1 rounded-2xl">
            {reports.length === 0 ? (
              <div className="py-12 text-center text-slate-500 dark:text-slate-400 text-sm">No logs match the selected filters.</div>
            ) : (
              reports.map((log) => (
                <div key={log.id} className="glass-plank p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-full font-black text-[10px] shrink-0 ${log.entry_type === 'DELIVERY' ? 'glass-badge-amber' : 'glass-badge-cyan'}`}>
                      {log.entry_type}
                    </span>
                    <div>
                      <strong className="text-slate-900 dark:text-white font-bold text-sm block">{log.person_name}</strong>
                      <span className="text-slate-600 dark:text-slate-400 text-xs mt-0.5 block">
                        Destinations: <strong className="text-cyan-600 dark:text-cyan-300 font-mono">{Array.isArray(log.destinations) ? log.destinations.join(", ") : log.destinations}</strong>
                        {log.phone && <span className="text-slate-500 dark:text-slate-400 ml-2 font-mono">({log.phone})</span>}
                      </span>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="font-mono text-slate-500 dark:text-slate-400 block text-xs">{new Date(log.entry_time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                    <span className={`font-black text-xs inline-block mt-0.5 px-2 py-0.5 rounded-full ${log.status === "INSIDE" ? "glass-badge-emerald" : "text-slate-500 bg-slate-800/10 dark:bg-slate-800/60"}`}>
                      {log.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* EDIT MEMBER MODAL */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xl p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md glass-floating rounded-3xl p-6 sm:p-8 space-y-4 text-left relative shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-cyan-400" />
                <span>Edit Member & Set Password</span>
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {editMsg && (
              <div className="p-3 rounded-2xl glass-badge-cyan text-xs font-bold">
                {editMsg}
              </div>
            )}

            <form onSubmit={handleUpdateMember} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Member Name</label>
                <input
                  type="text"
                  required
                  value={editForm.username}
                  onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                  className="glass-input w-full px-3.5 py-2.5 rounded-2xl text-white text-xs focus:border-cyan-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Flat / Unit Reference</label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="glass-input w-full px-3.5 py-2.5 rounded-2xl text-white text-xs focus:border-cyan-400"
                />
              </div>

              <div className="p-3.5 rounded-2xl glass-sheet space-y-1.5">
                <label className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5" /> Set New Member Password
                </label>
                <input
                  type="password"
                  placeholder="Enter new password for member"
                  value={editForm.newPassword}
                  onChange={(e) => setEditForm({ ...editForm, newPassword: e.target.value })}
                  className="glass-input w-full px-3 py-2 rounded-xl text-white text-xs focus:border-cyan-400"
                />
              </div>

              <button
                type="submit"
                className="btn-liquid-primary w-full py-3.5 rounded-2xl text-white font-extrabold text-xs shadow-lg shadow-cyan-600/30 spring-press mt-2"
              >
                Save Member Changes
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ADMIN PROFILE MODAL */}
      {showAdminProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xl p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md glass-floating rounded-3xl p-6 sm:p-8 space-y-4 text-left relative shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <User className="w-5 h-5 text-cyan-400" />
                <span>Edit Admin Profile</span>
              </h3>
              <button onClick={() => setShowAdminProfileModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {adminProfileMsg.text && (
              <div className={`p-3 rounded-2xl border text-xs font-bold ${adminProfileMsg.type === 'success' ? 'glass-badge-emerald' : 'glass-badge-ruby'}`}>
                {adminProfileMsg.text}
              </div>
            )}

            <form onSubmit={handleUpdateAdminProfile} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Admin Display Name</label>
                <input
                  type="text"
                  required
                  value={adminProfileForm.username}
                  onChange={(e) => setAdminProfileForm({ ...adminProfileForm, username: e.target.value })}
                  className="glass-input w-full px-3.5 py-2.5 rounded-2xl text-white text-xs focus:border-cyan-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Admin Flat / Unit Reference</label>
                <input
                  type="text"
                  placeholder="e.g. Admin Villa / Flat 101"
                  value={adminProfileForm.flatUnit}
                  onChange={(e) => setAdminProfileForm({ ...adminProfileForm, flatUnit: e.target.value })}
                  className="glass-input w-full px-3.5 py-2.5 rounded-2xl text-white text-xs focus:border-cyan-400"
                />
              </div>

              <button
                type="submit"
                className="btn-liquid-primary w-full py-3.5 rounded-2xl text-white font-extrabold text-xs shadow-lg shadow-cyan-600/30 spring-press mt-2"
              >
                Save Profile Changes
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ADMIN SELF PASSWORD CHANGE MODAL */}
      {showAdminPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xl p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md glass-floating rounded-3xl p-6 sm:p-8 space-y-4 text-left relative shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-cyan-400" />
                <span>Change Admin Password</span>
              </h3>
              <button onClick={() => setShowAdminPasswordModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {adminPassMsg.text && (
              <div className={`p-3 rounded-2xl border text-xs font-bold ${adminPassMsg.type === 'success' ? 'glass-badge-emerald' : 'glass-badge-ruby'}`}>
                {adminPassMsg.text}
              </div>
            )}

            <form onSubmit={handleChangeAdminPasswordWithOld} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Current (Old) Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={adminPassForm.oldPassword}
                  onChange={(e) => setAdminPassForm({ ...adminPassForm, oldPassword: e.target.value })}
                  className="glass-input w-full px-3.5 py-2.5 rounded-2xl text-white text-xs focus:border-cyan-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">New Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={adminPassForm.newPassword}
                  onChange={(e) => setAdminPassForm({ ...adminPassForm, newPassword: e.target.value })}
                  className="glass-input w-full px-3.5 py-2.5 rounded-2xl text-white text-xs focus:border-cyan-400"
                />
              </div>

              <button
                type="submit"
                disabled={adminPassLoading}
                className="btn-liquid-primary w-full py-3.5 rounded-2xl text-white font-extrabold text-xs shadow-lg shadow-cyan-600/30 spring-press mt-2"
              >
                {adminPassLoading ? "Updating..." : "Update Password"}
              </button>
            </form>

            <div className="border-t border-white/10 pt-3 text-center space-y-2">
              <span className="text-xs text-slate-400">Forgot your current password?</span>
              <Link
                href="/reset-password"
                className="btn-liquid-secondary w-full py-2.5 px-4 rounded-2xl text-cyan-300 font-bold text-xs flex items-center justify-center gap-2 spring-press"
              >
                <Mail className="w-4 h-4 text-cyan-400" /> Send Email Reset Code
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
