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
  Moon,
  Radio,
} from "lucide-react";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("REGISTER"); // REGISTER, DESTINATIONS, USERS, REPORTS
  const [registerFilter, setRegisterFilter] = useState("ALL"); // ALL, INSIDE, EXITED, GUEST, DELIVERY

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
            className="btn-liquid-secondary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md"
          >
            <QrCode className="w-4 h-4 text-cyan-600 dark:text-cyan-400" /> Passes
          </Link>
          <Link
            href="/gatekeeper"
            className="btn-liquid-secondary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md"
          >
            <ScanLine className="w-4 h-4 text-cyan-600 dark:text-cyan-400" /> Scanner
          </Link>
          <button
            onClick={() => {
              setAdminProfileMsg({ type: "", text: "" });
              setShowAdminProfileModal(true);
            }}
            className="btn-liquid-secondary p-2.5 rounded-xl text-cyan-600 dark:text-cyan-300"
            title="Edit profile"
          >
            <User className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setAdminPassMsg({ type: "", text: "" });
              setShowAdminPasswordModal(true);
            }}
            className="btn-liquid-secondary p-2.5 rounded-xl text-cyan-600 dark:text-cyan-300"
            title="Change password"
          >
            <KeyRound className="w-4 h-4" />
          </button>
          <button
            onClick={handleLogout}
            className="btn-liquid-secondary p-2.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 hover:border-rose-500/50"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* TODAY'S OVERVIEW COUNTERS (Apple iOS Liquid Glass OS KPI Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-elevated liquid-glass-surface rounded-2xl p-5 space-y-2">
          <span className="text-xs font-medium text-white/70 uppercase tracking-wider block">Guests today</span>
          <div className="flex items-center gap-2.5">
            <span className="text-3xl font-bold tracking-tight text-white drop-shadow-[0_2px_8px_rgba(255,255,255,0.15)]">{stats.guestsToday}</span>
            <span className="kpi-sub-tag">passes</span>
          </div>
        </div>
        <div className="glass-elevated liquid-glass-surface rounded-2xl p-5 space-y-2">
          <span className="text-xs font-medium text-white/70 uppercase tracking-wider block">Deliveries today</span>
          <div className="flex items-center gap-2.5">
            <span className="text-3xl font-bold tracking-tight text-white drop-shadow-[0_2px_8px_rgba(255,255,255,0.15)]">{stats.deliveriesToday}</span>
            <span className="kpi-sub-tag">entries</span>
          </div>
        </div>
        <div className="glass-elevated liquid-glass-surface rounded-2xl p-5 space-y-2">
          <span className="text-xs font-medium text-white/70 uppercase tracking-wider block">Currently inside</span>
          <div className="flex items-center gap-2.5">
            <span className="text-3xl font-bold tracking-tight text-white drop-shadow-[0_2px_8px_rgba(255,255,255,0.15)]">{stats.currentlyInside}</span>
            <span className="kpi-sub-tag">active</span>
          </div>
        </div>
        <div className="glass-elevated liquid-glass-surface rounded-2xl p-5 space-y-2">
          <span className="text-xs font-medium text-white/70 uppercase tracking-wider block">Exited today</span>
          <div className="flex items-center gap-2.5">
            <span className="text-3xl font-bold tracking-tight text-white drop-shadow-[0_2px_8px_rgba(255,255,255,0.15)]">{stats.exitedToday}</span>
            <span className="kpi-sub-tag">exited</span>
          </div>
        </div>
      </div>

      {/* ADMIN NAVIGATION TABS */}
      <div className="ui-tab-bar">
        {[
          { id: "REGISTER", label: "Live feed" },
          { id: "DESTINATIONS", label: `Units (${destinations.length})`, action: fetchDestinations },
          { id: "USERS", label: "Members", action: fetchUsers },
          { id: "REPORTS", label: "Reports", action: fetchFilteredReports },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              if (tab.action) tab.action();
            }}
            className={`px-4 py-2 rounded-xl text-sm transition-all ${
              activeTab === tab.id
                ? "bg-white/10 text-white font-medium border border-white/20 shadow-sm"
                : "text-white/60 hover:text-white transition-colors"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: LIVE ACTIVITY REGISTER */}
      {activeTab === "REGISTER" && (
        <div className="glass-floating liquid-glass-surface rounded-3xl p-6 sm:p-8 space-y-5 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-400" />
                <span>Live Gate Activity Stream</span>
              </h2>
              <p className="text-xs text-white/70 mt-0.5">Real-time gate pass and delivery movement logging</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchDashboardOverview}
                className="text-xs text-white/80 hover:text-white font-medium flex items-center gap-1.5 liquid-touch-spring px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10"
              >
                <RefreshCw className="w-3.5 h-3.5 text-cyan-400" /> Refresh
              </button>
            </div>
          </div>

          {/* Segmented Filter Pills */}
          <div className="flex flex-wrap items-center gap-1 p-1 rounded-2xl bg-white/[0.03] border border-white/10 w-fit">
            {[
              { id: "ALL", label: `All (${liveRegister.length})` },
              { id: "INSIDE", label: `Inside (${liveRegister.filter((l) => l.status === "INSIDE").length})` },
              { id: "EXITED", label: `Exited (${liveRegister.filter((l) => l.status === "EXITED").length})` },
              { id: "GUEST", label: `Guests (${liveRegister.filter((l) => l.entry_type === "GUEST").length})` },
              { id: "DELIVERY", label: `Deliveries (${liveRegister.filter((l) => l.entry_type === "DELIVERY").length})` },
            ].map((pill) => (
              <button
                key={pill.id}
                onClick={() => setRegisterFilter(pill.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all liquid-touch-spring ${
                  registerFilter === pill.id
                    ? "bg-white/10 text-white font-semibold border border-white/20 shadow-sm"
                    : "text-white/60 hover:text-white"
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>

          <div className="divide-y divide-white/5 rounded-2xl border border-white/5 overflow-hidden">
            {(() => {
              const filtered = liveRegister.filter((log) => {
                if (registerFilter === "INSIDE") return log.status === "INSIDE";
                if (registerFilter === "EXITED") return log.status === "EXITED";
                if (registerFilter === "GUEST") return log.entry_type === "GUEST";
                if (registerFilter === "DELIVERY") return log.entry_type === "DELIVERY";
                return true;
              });

              if (filtered.length === 0) {
                return (
                  <div className="py-12 text-center text-white/50 font-medium text-sm">
                    No movements matching "{registerFilter}" filter.
                  </div>
                );
              }

              return filtered.map((log) => (
                <div key={log.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-start sm:items-center gap-3">
                    <span className={`px-2.5 py-0.5 rounded-full font-medium text-[11px] shrink-0 ${log.entry_type === 'DELIVERY' ? 'glass-badge-amber' : 'glass-badge-cyan'}`}>
                      {log.entry_type}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-white text-sm font-semibold">{log.person_name}</strong>
                        {log.company_name && <span className="text-white/60 font-medium">({log.company_name})</span>}
                      </div>
                      <p className="text-white/70 text-xs mt-0.5">
                        Destinations: <strong className="text-cyan-300 font-mono font-medium text-xs">{Array.isArray(log.destinations) ? log.destinations.join(', ') : log.destinations}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                    <span className="font-mono text-white/60 text-xs">
                      {new Date(log.entry_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full ${log.status === 'INSIDE' ? 'glass-badge-emerald' : 'glass-badge-indigo'}`}>
                      {log.status === 'INSIDE' ? 'ENTERED / INSIDE' : 'EXITED'}
                    </span>
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
      )}

      {/* TAB 2: CONFIGURE DESTINATIONS */}
      {activeTab === "DESTINATIONS" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="glass-floating rounded-3xl p-6 sm:p-8 space-y-4">
            <h2 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2">
              <Plus className="w-5 h-5 text-cyan-400" />
              <span>Add Destination</span>
            </h2>

            {destMsg && <div className="p-3 rounded-2xl glass-badge-emerald text-xs font-semibold">{destMsg}</div>}

            <form onSubmit={handleAddDestination} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-white/80 uppercase tracking-wider">Group Label / Wing (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Wing A, Block B, Floor 2"
                  value={destForm.groupLabel}
                  onChange={(e) => setDestForm({ ...destForm, groupLabel: e.target.value })}
                  className="glass-input w-full px-4 py-3 rounded-2xl text-white text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-white/80 uppercase tracking-wider">Unit / Flat / Department Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 101, 203, HR Dept, Villa 12"
                  value={destForm.unitNumber}
                  onChange={(e) => setDestForm({ ...destForm, unitNumber: e.target.value })}
                  className="glass-input w-full px-4 py-3 rounded-2xl text-white text-sm"
                />
              </div>

              <button
                type="submit"
                className="btn-liquid-primary w-full py-3.5 rounded-2xl text-white font-semibold text-sm spring-press mt-2"
              >
                Add Destination
              </button>
            </form>
          </div>

          <div className="glass-floating rounded-3xl p-6 sm:p-8 space-y-4">
            <h2 className="text-lg font-semibold text-white tracking-tight">Configured Destinations ({destinations.length})</h2>
            <div className="max-h-[50vh] overflow-y-auto space-y-2 pr-1">
              {destinations.map((d) => (
                <div key={d.id} className="glass-plank p-3.5 rounded-2xl flex items-center justify-between text-xs text-white">
                  <span className="font-semibold">{d.full_name}</span>
                  <span className="font-mono text-[10px] glass-pill px-2.5 py-0.5 rounded-full">{d.group_label || 'Unit'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MANAGE MEMBERS */}
      {activeTab === "USERS" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
          {/* Create User Card */}
          <div className="glass-floating rounded-3xl p-6 sm:p-8 space-y-4">
            <h2 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-400" />
              <span>Create Member</span>
            </h2>

            {userMsg && <div className="p-3 rounded-2xl glass-badge-emerald text-xs font-semibold">{userMsg}</div>}

            <form onSubmit={handleAddUser} className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-white/80 uppercase tracking-wider">Account Role</label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                  className="glass-input w-full px-3.5 py-2.5 rounded-2xl text-white text-xs"
                >
                  <option value="MEMBER">MEMBER (Resident / Authorized)</option>
                  <option value="GATEKEEPER">GATEKEEPER (Security Guard)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-white/80 uppercase tracking-wider">Member Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Patel"
                  value={userForm.username}
                  onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                  className="glass-input w-full px-3.5 py-2.5 rounded-2xl text-white text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-white/80 uppercase tracking-wider">Flat / Unit Number *</label>
                {destinations.length > 0 ? (
                  <select
                    value={userForm.flatUnit}
                    onChange={(e) => setUserForm({ ...userForm, flatUnit: e.target.value })}
                    className="glass-input w-full px-3.5 py-2.5 rounded-2xl text-white text-xs"
                  >
                    <option value="">Select Configured Flat...</option>
                    {destinations.map((d) => (
                      <option key={d.id} value={d.full_name}>{d.full_name}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    placeholder="e.g. A-203 or House 12"
                    value={userForm.flatUnit}
                    onChange={(e) => setUserForm({ ...userForm, flatUnit: e.target.value })}
                    className="glass-input w-full px-3.5 py-2.5 rounded-2xl text-white text-xs"
                  />
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-white/80 uppercase tracking-wider">Password *</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  className="glass-input w-full px-3.5 py-2.5 rounded-2xl text-white text-xs"
                />
              </div>

              <button
                type="submit"
                className="btn-liquid-primary w-full py-3.5 rounded-2xl text-white font-semibold text-xs spring-press mt-2"
              >
                Create Account
              </button>
            </form>
          </div>

          {/* Member Accounts List */}
          <div className="lg:col-span-2 glass-floating rounded-3xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white tracking-tight">Organization Accounts ({usersList.length})</h2>
              <span className="text-xs text-white/60">Click key to set password anytime</span>
            </div>

            <div className="max-h-[60vh] overflow-y-auto space-y-2.5 pr-1">
              {usersList
                .filter((u) => u.role !== 'ADMIN')
                .map((u) => (
                  <div key={u.id} className="glass-plank p-4 rounded-2xl flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-white text-sm font-semibold">{u.username}</strong>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${u.role === 'GATEKEEPER' ? 'glass-badge-amber' : 'glass-badge-cyan'}`}>
                          {u.role}
                        </span>
                      </div>
                      <p className="text-white/60 text-xs mt-1">Flat / Unit: <strong className="text-cyan-300 font-mono">{u.phone || 'Assigned'}</strong></p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEditModal(u)}
                        className="btn-liquid-secondary px-3 py-1.5 rounded-xl text-white/90 font-medium flex items-center gap-1.5 spring-press text-xs"
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
        <div className="glass-floating rounded-3xl p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2">
              <Calendar className="w-5 h-5 text-cyan-400" />
              <span>Filter & Export Gate Activity</span>
            </h2>
            <div className="flex items-center gap-2.5">
              <button
                onClick={handleExportCSV}
                className="btn-liquid-primary py-2.5 px-4 rounded-xl text-white font-semibold text-xs flex items-center gap-2 spring-press"
              >
                <Download className="w-4 h-4" /> Export CSV / Excel
              </button>
              <button
                onClick={handleExportPDF}
                className="btn-liquid-secondary py-2.5 px-4 rounded-xl font-semibold text-xs flex items-center gap-2 spring-press"
              >
                <FileText className="w-4 h-4" /> Export PDF Report
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 glass-sheet p-4 rounded-2xl">
            <div>
              <label className="text-xs font-medium text-white/80 uppercase tracking-wider block mb-1.5">From Date</label>
              <input
                type="date"
                value={reportFilters.fromDate}
                onChange={(e) => setReportFilters({ ...reportFilters, fromDate: e.target.value })}
                className="glass-input w-full px-3 py-2 rounded-xl text-xs font-medium"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-white/80 uppercase tracking-wider block mb-1.5">To Date</label>
              <input
                type="date"
                value={reportFilters.toDate}
                onChange={(e) => setReportFilters({ ...reportFilters, toDate: e.target.value })}
                className="glass-input w-full px-3 py-2 rounded-xl text-xs font-medium"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-white/80 uppercase tracking-wider block mb-1.5">Entry Type</label>
              <select
                value={reportFilters.entryType}
                onChange={(e) => setReportFilters({ ...reportFilters, entryType: e.target.value })}
                className="glass-input w-full px-3 py-2 rounded-xl text-xs font-medium"
              >
                <option value="ALL">All Types</option>
                <option value="GUEST">Guest Passes</option>
                <option value="DELIVERY">Deliveries</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => fetchFilteredReports()}
                className="btn-liquid-primary w-full py-2.5 px-3 rounded-xl text-white font-semibold text-xs spring-press"
              >
                Apply Filters
              </button>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleClearFilters}
                className="btn-liquid-secondary w-full py-2.5 px-3 rounded-xl text-white font-semibold text-xs spring-press"
              >
                Clear Filters
              </button>
            </div>
          </div>

          <div className="space-y-2.5 max-h-[50vh] overflow-y-auto p-1 rounded-2xl">
            {reports.length === 0 ? (
              <div className="py-12 text-center text-white/60 font-medium text-sm">No logs match the selected filters.</div>
            ) : (
              reports.map((log) => (
                <div key={log.id} className="glass-plank p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-0.5 rounded-full font-medium text-[11px] shrink-0 ${log.entry_type === 'DELIVERY' ? 'glass-badge-amber' : 'glass-badge-cyan'}`}>
                      {log.entry_type}
                    </span>
                    <div>
                      <strong className="text-white font-semibold text-sm block">{log.person_name}</strong>
                      <span className="text-white/70 text-xs mt-0.5 block">
                        Destinations: <strong className="text-cyan-300 font-mono font-medium">{Array.isArray(log.destinations) ? log.destinations.join(", ") : log.destinations}</strong>
                        {log.phone && <span className="text-white/60 ml-2 font-mono">({log.phone})</span>}
                      </span>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="font-mono text-white/60 block text-xs">{new Date(log.entry_time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                    <span className={`text-xs inline-block mt-0.5 px-2.5 py-0.5 rounded-full ${log.status === "INSIDE" ? "glass-badge-emerald" : "glass-badge-indigo"}`}>
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
              <h3 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-cyan-400" />
                <span>Edit Member & Set Password</span>
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-white/60 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {editMsg && (
              <div className="p-3 rounded-2xl glass-badge-cyan text-xs font-semibold">
                {editMsg}
              </div>
            )}

            <form onSubmit={handleUpdateMember} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-medium text-white/80 uppercase tracking-wider">Member Name</label>
                <input
                  type="text"
                  required
                  value={editForm.username}
                  onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                  className="glass-input w-full px-3.5 py-2.5 rounded-2xl text-white text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-white/80 uppercase tracking-wider">Flat / Unit Reference</label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="glass-input w-full px-3.5 py-2.5 rounded-2xl text-white text-xs"
                />
              </div>

              <div className="p-3.5 rounded-2xl glass-sheet space-y-1.5">
                <label className="text-xs font-semibold text-cyan-300 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5" /> Set New Member Password
                </label>
                <input
                  type="password"
                  placeholder="Enter new password for member"
                  value={editForm.newPassword}
                  onChange={(e) => setEditForm({ ...editForm, newPassword: e.target.value })}
                  className="glass-input w-full px-3 py-2 rounded-xl text-white text-xs"
                />
              </div>

              <button
                type="submit"
                className="btn-liquid-primary w-full py-3.5 rounded-2xl text-white font-semibold text-xs spring-press mt-2"
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
              <h3 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2">
                <User className="w-5 h-5 text-cyan-400" />
                <span>Edit Admin Profile</span>
              </h3>
              <button onClick={() => setShowAdminProfileModal(false)} className="text-white/60 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {adminProfileMsg.text && (
              <div className={`p-3 rounded-2xl border text-xs font-semibold ${adminProfileMsg.type === 'success' ? 'glass-badge-emerald' : 'glass-badge-ruby'}`}>
                {adminProfileMsg.text}
              </div>
            )}

            <form onSubmit={handleUpdateAdminProfile} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-medium text-white/80 uppercase tracking-wider">Admin Display Name</label>
                <input
                  type="text"
                  required
                  value={adminProfileForm.username}
                  onChange={(e) => setAdminProfileForm({ ...adminProfileForm, username: e.target.value })}
                  className="glass-input w-full px-3.5 py-2.5 rounded-2xl text-white text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-white/80 uppercase tracking-wider">Admin Flat / Unit Reference</label>
                <input
                  type="text"
                  placeholder="e.g. Admin Villa / Flat 101"
                  value={adminProfileForm.flatUnit}
                  onChange={(e) => setAdminProfileForm({ ...adminProfileForm, flatUnit: e.target.value })}
                  className="glass-input w-full px-3.5 py-2.5 rounded-2xl text-white text-xs"
                />
              </div>

              <button
                type="submit"
                className="btn-liquid-primary w-full py-3.5 rounded-2xl text-white font-semibold text-xs spring-press mt-2"
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
              <h3 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2">
                <Lock className="w-5 h-5 text-cyan-400" />
                <span>Change Admin Password</span>
              </h3>
              <button onClick={() => setShowAdminPasswordModal(false)} className="text-white/60 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {adminPassMsg.text && (
              <div className={`p-3 rounded-2xl border text-xs font-semibold ${adminPassMsg.type === 'success' ? 'glass-badge-emerald' : 'glass-badge-ruby'}`}>
                {adminPassMsg.text}
              </div>
            )}

            <form onSubmit={handleChangeAdminPasswordWithOld} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-medium text-white/80 uppercase tracking-wider">Current (Old) Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={adminPassForm.oldPassword}
                  onChange={(e) => setAdminPassForm({ ...adminPassForm, oldPassword: e.target.value })}
                  className="glass-input w-full px-3.5 py-2.5 rounded-2xl text-white text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-white/80 uppercase tracking-wider">New Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={adminPassForm.newPassword}
                  onChange={(e) => setAdminPassForm({ ...adminPassForm, newPassword: e.target.value })}
                  className="glass-input w-full px-3.5 py-2.5 rounded-2xl text-white text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={adminPassLoading}
                className="btn-liquid-primary w-full py-3.5 rounded-2xl text-white font-semibold text-xs spring-press mt-2"
              >
                {adminPassLoading ? "Updating..." : "Update Password"}
              </button>
            </form>

            <div className="border-t border-white/10 pt-3 text-center space-y-2">
              <span className="text-xs text-white/60">Forgot your current password?</span>
              <Link
                href="/reset-password"
                className="btn-liquid-secondary w-full py-2.5 px-4 rounded-2xl text-cyan-300 font-semibold text-xs flex items-center justify-center gap-2 spring-press"
              >
                <Mail className="w-4 h-4 text-cyan-400" /> Send Email Reset Code
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* RFID Automated Gate Access */}
      <div className="liquid-glass-surface glass-elevated rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 mt-8">
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-400/40 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
            <Radio className="w-6 h-6 text-cyan-300 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <h4 className="text-base font-semibold text-white tracking-tight">RFID Automated Gate Access</h4>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                Coming Soon
              </span>
            </div>
            <p className="text-xs text-white/70 mt-0.5">
              Automated high-frequency RFID vehicle barrier authentication, barrier control relays, and driver fast-lane verification.
            </p>
          </div>
        </div>
        <div className="px-3.5 py-1.5 rounded-xl border border-white/15 bg-white/5 text-xs text-white/80 font-mono font-medium whitespace-nowrap">
          Hardware Sensor Ready
        </div>
      </div>
    </div>
  );
}
