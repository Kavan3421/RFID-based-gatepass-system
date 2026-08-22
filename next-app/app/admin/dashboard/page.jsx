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
  User
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

  // Member Management State (Email is OPTIONAL; Name, Flat & Password are required)
  const [usersList, setUsersList] = useState([]);
  const [userForm, setUserForm] = useState({ username: "", flatUnit: "", phone: "", password: "", role: "MEMBER" });
  const [userMsg, setUserMsg] = useState("");

  // Edit / Password Reset Modal State for Members
  const [selectedUser, setSelectedUser] = useState(null);
  const [editForm, setEditForm] = useState({ username: "", phone: "", role: "MEMBER", newPassword: "" });
  const [editMsg, setEditMsg] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);

  // Admin Self Profile Edit State (Name, Flat/Unit, Phone)
  const [showAdminProfileModal, setShowAdminProfileModal] = useState(false);
  const [adminProfileForm, setAdminProfileForm] = useState({ username: "", flatUnit: "", phone: "" });
  const [adminProfileMsg, setAdminProfileMsg] = useState({ type: "", text: "" });

  // Admin Self Password Change Modal State (Old Password OR SMTP)
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

  useEffect(() => {
    const storedUser = localStorage.getItem("qrgp_user");
    const token = localStorage.getItem("qrgp_token");
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

  const fetchDashboardOverview = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("qrgp_token");
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
      const token = localStorage.getItem("qrgp_token");
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
      const token = localStorage.getItem("qrgp_token");
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
      const token = localStorage.getItem("qrgp_token");
      const res = await fetch("/api/admin/members", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setUsersList(data.users || []);
    } catch (err) {
      console.error("Fetch users error:", err);
    }
  };

  // Create Member (Only Name, Flat, Password required; Email optional)
  const handleAddUser = async (e) => {
    e.preventDefault();
    setUserMsg("");
    try {
      const token = localStorage.getItem("qrgp_token");
      const res = await fetch("/api/admin/members", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: userForm.username,
          phone: userForm.phone || userForm.flatUnit, // Store Flat/Unit as reference
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
      const token = localStorage.getItem("qrgp_token");
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

  // Update Admin Profile (Name, Flat/Unit, Phone)
  const handleUpdateAdminProfile = async (e) => {
    e.preventDefault();
    setAdminProfileMsg({ type: "", text: "" });

    try {
      const token = localStorage.getItem("qrgp_token");
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
      localStorage.setItem("qrgp_user", JSON.stringify(updatedUser));

      setAdminProfileMsg({ type: "success", text: "Admin profile details updated successfully!" });
      setTimeout(() => setShowAdminProfileModal(false), 1200);
    } catch (err) {
      setAdminProfileMsg({ type: "error", text: err.message });
    }
  };

  // Admin Self Password Change via Old Password
  const handleChangeAdminPasswordWithOld = async (e) => {
    e.preventDefault();
    setAdminPassMsg({ type: "", text: "" });
    setAdminPassLoading(true);

    try {
      const token = localStorage.getItem("qrgp_token");
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
      const token = localStorage.getItem("qrgp_token");
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

  const fetchFilteredReports = async () => {
    try {
      const token = localStorage.getItem("qrgp_token");
      const query = new URLSearchParams(reportFilters).toString();
      const res = await fetch(`/api/admin/reports?${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setReports(data.logs || []);
    } catch (err) {
      console.error("Fetch reports error:", err);
    }
  };

  const handleExportCSV = () => {
    if (reports.length === 0) return alert("No report records available to export.");
    let csvContent = "data:text/csv;charset=utf-8,Time,Type,Person Name,Phone,Company,Destinations,Status\n";
    reports.forEach((log) => {
      const dests = Array.isArray(log.destinations) ? log.destinations.join(" | ") : log.destinations;
      csvContent += `"${new Date(log.entry_time).toLocaleString()}","${log.entry_type}","${log.person_name}","${log.phone || ''}","${log.company_name || ''}","${dests}","${log.status}"\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Gate_Register_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLogout = () => {
    localStorage.removeItem("qrgp_token");
    localStorage.removeItem("qrgp_user");
    router.push("/login");
  };

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 text-left">
      {/* Admin Command Header & Super-Access Control Bar */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-800 bg-slate-950/90 flex flex-wrap items-center justify-between gap-4 shadow-2xl">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">{organization.name || user.organizationName}</h1>
            <span className="px-3.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-bold">
              ORG ID: {user.organizationCode}
            </span>
            <span className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> SUPER ADMIN
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Welcome, <strong>{user.username}</strong> {user.phone ? `(${user.phone})` : ''} • Full Management & Gatekeeper Access
          </p>
        </div>

        {/* Super Access Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/member"
            className="px-3.5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-2 shadow-md transition-all"
          >
            <QrCode className="w-4 h-4" /> Create QR Guest Pass
          </Link>

          <Link
            href="/gatekeeper"
            className="px-3.5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-2 shadow-md transition-all"
          >
            <ScanLine className="w-4 h-4" /> Gatekeeper Scanner
          </Link>

          <button
            onClick={() => {
              setAdminProfileMsg({ type: "", text: "" });
              setShowAdminProfileModal(true);
            }}
            className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold border border-slate-800 transition-all flex items-center gap-1.5"
          >
            <User className="w-4 h-4 text-cyan-400" /> Edit My Profile
          </button>

          <button
            onClick={() => {
              setAdminPassMsg({ type: "", text: "" });
              setShowAdminPasswordModal(true);
            }}
            className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-400 text-xs font-bold border border-slate-800 transition-all flex items-center gap-1.5"
          >
            <KeyRound className="w-4 h-4" /> Change Password
          </button>

          <button
            onClick={handleLogout}
            className="px-3.5 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold border border-red-500/20 transition-all flex items-center gap-1.5"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>

      {/* TODAY'S OVERVIEW COUNTERS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel rounded-2xl p-5 border border-slate-800/80 bg-slate-900/60 shadow-lg">
          <span className="text-xs font-semibold text-slate-400 block">Guests Entered Today</span>
          <span className="text-3xl font-extrabold text-cyan-400 mt-1 block font-mono">{stats.guestsToday}</span>
        </div>
        <div className="glass-panel rounded-2xl p-5 border border-slate-800/80 bg-slate-900/60 shadow-lg">
          <span className="text-xs font-semibold text-slate-400 block">Deliveries Logged Today</span>
          <span className="text-3xl font-extrabold text-blue-400 mt-1 block font-mono">{stats.deliveriesToday}</span>
        </div>
        <div className="glass-panel rounded-2xl p-5 border border-slate-800/80 bg-slate-900/60 shadow-lg">
          <span className="text-xs font-semibold text-slate-400 block">Currently Inside Campus</span>
          <span className="text-3xl font-extrabold text-emerald-400 mt-1 block font-mono">{stats.currentlyInside}</span>
        </div>
        <div className="glass-panel rounded-2xl p-5 border border-slate-800/80 bg-slate-900/60 shadow-lg">
          <span className="text-xs font-semibold text-slate-400 block">Exited Campus Today</span>
          <span className="text-3xl font-extrabold text-slate-400 mt-1 block font-mono">{stats.exitedToday}</span>
        </div>
      </div>

      {/* ADMIN NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("REGISTER")}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === "REGISTER" ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/30" : "bg-slate-900 text-slate-400 hover:text-white"
          }`}
        >
          Live Digital Register
        </button>
        <button
          onClick={() => {
            setActiveTab("DESTINATIONS");
            fetchDestinations();
          }}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === "DESTINATIONS" ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/30" : "bg-slate-900 text-slate-400 hover:text-white"
          }`}
        >
          Configure Destinations
        </button>
        <button
          onClick={() => {
            setActiveTab("USERS");
            fetchUsers();
          }}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === "USERS" ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/30" : "bg-slate-900 text-slate-400 hover:text-white"
          }`}
        >
          Member & Password Management
        </button>
        <button
          onClick={() => {
            setActiveTab("REPORTS");
            fetchFilteredReports();
          }}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === "REPORTS" ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/30" : "bg-slate-900 text-slate-400 hover:text-white"
          }`}
        >
          Reports & Exports
        </button>
      </div>

      {/* TAB 1: LIVE DIGITAL REGISTER */}
      {activeTab === "REGISTER" && (
        <div className="glass-panel rounded-3xl p-6 border border-slate-800/80 bg-slate-950/80 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-400" /> Live Digital Gate Register
            </h2>
            <button onClick={fetchDashboardOverview} className="text-xs text-cyan-400 font-semibold hover:underline">
              Refresh Stream
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5 rounded-l-xl">Time</th>
                  <th className="p-3.5">Type</th>
                  <th className="p-3.5">Person Name</th>
                  <th className="p-3.5">Company</th>
                  <th className="p-3.5">Destinations</th>
                  <th className="p-3.5 rounded-r-xl">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {liveRegister.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-500">No entry records available.</td>
                  </tr>
                ) : (
                  liveRegister.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="p-3.5 font-mono text-slate-400">{new Date(log.entry_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${log.entry_type === 'DELIVERY' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'}`}>
                          {log.entry_type}
                        </span>
                      </td>
                      <td className="p-3.5 font-semibold text-white">{log.person_name}</td>
                      <td className="p-3.5 text-slate-400">{log.company_name || '-'}</td>
                      <td className="p-3.5 font-medium text-cyan-300">
                        {Array.isArray(log.destinations) ? log.destinations.join(', ') : log.destinations}
                      </td>
                      <td className="p-3.5">
                        <span className={`font-semibold ${log.status === 'INSIDE' ? 'text-emerald-400' : 'text-slate-500'}`}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: CONFIGURE DESTINATIONS */}
      {activeTab === "DESTINATIONS" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-panel rounded-3xl p-6 border border-slate-800 bg-slate-950/80 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-cyan-400" /> Add Destination
            </h2>

            {destMsg && <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs">{destMsg}</div>}

            <form onSubmit={handleAddDestination} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Group Label / Wing (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Wing A, Block B, Floor 2"
                  value={destForm.groupLabel}
                  onChange={(e) => setDestForm({ ...destForm, groupLabel: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Unit / Flat / Department Number</label>
                <input
                  type="text"
                  placeholder="e.g. 101, 203, HR Dept, Villa 12"
                  value={destForm.unitNumber}
                  onChange={(e) => setDestForm({ ...destForm, unitNumber: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-sm"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm shadow-lg shadow-cyan-600/30 transition-all"
              >
                Add Destination
              </button>
            </form>
          </div>

          <div className="glass-panel rounded-3xl p-6 border border-slate-800 bg-slate-950/80 space-y-4">
            <h2 className="text-lg font-bold text-white">Existing Destinations ({destinations.length})</h2>
            <div className="max-h-[50vh] overflow-y-auto space-y-2 pr-1">
              {destinations.map((d) => (
                <div key={d.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs text-white">
                  <span className="font-semibold">{d.full_name}</span>
                  <span className="text-slate-500 font-mono text-[10px]">{d.group_label || 'Unit'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MANAGE MEMBERS (Name, Flat/Unit & Password Required; Email Optional) */}
      {activeTab === "USERS" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create User Card */}
          <div className="glass-panel rounded-3xl p-6 border border-slate-800 bg-slate-950/80 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-400" /> Create Member
            </h2>

            {userMsg && <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs">{userMsg}</div>}

            <form onSubmit={handleAddUser} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Account Role</label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                >
                  <option value="MEMBER">MEMBER (Resident / Authorized Person)</option>
                  <option value="GATEKEEPER">GATEKEEPER (Security Guard)</option>
                </select>
              </div>

              {/* Member Full Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Member Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Patel"
                  value={userForm.username}
                  onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                />
              </div>

              {/* Destination / Flat Number */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Flat / Unit Number *</label>
                {destinations.length > 0 ? (
                  <select
                    value={userForm.flatUnit}
                    onChange={(e) => setUserForm({ ...userForm, flatUnit: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
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
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                  />
                )}
              </div>

              {/* Member Password */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Password *</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 transition-all mt-2"
              >
                Create Member Account
              </button>
            </form>
          </div>

          {/* Member Accounts List */}
          <div className="lg:col-span-2 glass-panel rounded-3xl p-6 border border-slate-800 bg-slate-950/80 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Organization Accounts ({usersList.length})</h2>
              <span className="text-xs text-slate-400">Click <Edit3 className="w-3.5 h-3.5 inline text-cyan-400" /> to set member password anytime</span>
            </div>

            <div className="max-h-[60vh] overflow-y-auto space-y-2.5 pr-1">
              {usersList
                .filter((u) => u.role !== 'ADMIN')
                .map((u) => (
                <div key={u.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-white text-sm">{u.username}</strong>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${u.role === 'GATEKEEPER' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'}`}>
                        {u.role}
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs mt-1">Flat / Unit: <strong className="text-cyan-300">{u.phone || 'Assigned'}</strong></p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEditModal(u)}
                      className="px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-bold flex items-center gap-1.5 transition-all"
                    >
                      <KeyRound className="w-3.5 h-3.5" /> Edit / Set Member Password
                    </button>

                    {u.id !== user.id && (
                      <button
                        onClick={() => handleDeleteMember(u.id, u.username)}
                        className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-colors"
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
        <div className="glass-panel rounded-3xl p-6 border border-slate-800 bg-slate-950/80 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-cyan-400" /> Filter & Export Gate Activity
            </h2>
            <button
              onClick={handleExportCSV}
              className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all"
            >
              <Download className="w-4 h-4" /> Export CSV / Excel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-900 p-4 rounded-2xl border border-slate-800">
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">From Date</label>
              <input
                type="date"
                value={reportFilters.fromDate}
                onChange={(e) => setReportFilters({ ...reportFilters, fromDate: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">To Date</label>
              <input
                type="date"
                value={reportFilters.toDate}
                onChange={(e) => setReportFilters({ ...reportFilters, toDate: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">Entry Type</label>
              <select
                value={reportFilters.entryType}
                onChange={(e) => setReportFilters({ ...reportFilters, entryType: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
              >
                <option value="ALL">All Types</option>
                <option value="GUEST">Guest Passes</option>
                <option value="DELIVERY">Deliveries</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={fetchFilteredReports}
                className="w-full py-2 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-all"
              >
                Apply Filters
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 font-semibold uppercase">
                <tr>
                  <th className="p-3">Time</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Person</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3">Destinations</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {reports.length === 0 ? (
                  <tr><td colSpan={6} className="p-6 text-center text-slate-500">No logs match the selected filters.</td></tr>
                ) : (
                  reports.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-900/40">
                      <td className="p-3 font-mono text-slate-400">{new Date(log.entry_time).toLocaleString()}</td>
                      <td className="p-3 font-bold">{log.entry_type}</td>
                      <td className="p-3 font-semibold text-white">{log.person_name}</td>
                      <td className="p-3 text-slate-400">{log.phone || '-'}</td>
                      <td className="p-3 text-cyan-300">{Array.isArray(log.destinations) ? log.destinations.join(", ") : log.destinations}</td>
                      <td className="p-3 font-semibold">{log.status}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EDIT MEMBER MODAL */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md glass-panel rounded-3xl p-6 border border-slate-800 bg-slate-950 space-y-4 text-left relative shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-cyan-400" /> Edit Member & Set Password
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {editMsg && (
              <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
                {editMsg}
              </div>
            )}

            <form onSubmit={handleUpdateMember} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Member Name</label>
                <input
                  type="text"
                  required
                  value={editForm.username}
                  onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Flat / Unit Reference</label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                />
              </div>

              {/* Member Password Change */}
              <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 space-y-1">
                <label className="text-xs font-bold text-cyan-300 flex items-center gap-1">
                  <KeyRound className="w-3.5 h-3.5" /> Set New Member Password
                </label>
                <input
                  type="password"
                  placeholder="Enter new password for member"
                  value={editForm.newPassword}
                  onChange={(e) => setEditForm({ ...editForm, newPassword: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 transition-all"
              >
                Save Member Changes
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ADMIN PROFILE MODAL (NAME, FLAT/UNIT) */}
      {showAdminProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md glass-panel rounded-3xl p-6 border border-slate-800 bg-slate-950 space-y-4 text-left relative shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <User className="w-5 h-5 text-cyan-400" /> Edit My Admin Profile
              </h3>
              <button onClick={() => setShowAdminProfileModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {adminProfileMsg.text && (
              <div className={`p-3 rounded-xl border text-xs font-bold ${adminProfileMsg.type === 'success' ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' : 'bg-red-500/20 border-red-500/40 text-red-300'}`}>
                {adminProfileMsg.text}
              </div>
            )}

            <form onSubmit={handleUpdateAdminProfile} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Admin Display Name</label>
                <input
                  type="text"
                  required
                  value={adminProfileForm.username}
                  onChange={(e) => setAdminProfileForm({ ...adminProfileForm, username: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Admin Flat / Unit Reference</label>
                <input
                  type="text"
                  placeholder="e.g. Admin Villa / Flat 101"
                  value={adminProfileForm.flatUnit}
                  onChange={(e) => setAdminProfileForm({ ...adminProfileForm, flatUnit: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 transition-all"
              >
                Save Profile Changes
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ADMIN SELF PASSWORD CHANGE MODAL (OLD PASSWORD OR SMTP VERIFICATION) */}
      {showAdminPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md glass-panel rounded-3xl p-6 border border-slate-800 bg-slate-950 space-y-4 text-left relative shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-cyan-400" /> Change Main Admin Password
              </h3>
              <button onClick={() => setShowAdminPasswordModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {adminPassMsg.text && (
              <div className={`p-3 rounded-xl border text-xs font-bold ${adminPassMsg.type === 'success' ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' : 'bg-red-500/20 border-red-500/40 text-red-300'}`}>
                {adminPassMsg.text}
              </div>
            )}

            {/* Option A: Know Old Password */}
            <form onSubmit={handleChangeAdminPasswordWithOld} className="space-y-3">
              <div className="text-xs font-semibold text-slate-400 pb-1">
                Option 1: If you remember your current password:
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Current (Old) Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={adminPassForm.oldPassword}
                  onChange={(e) => setAdminPassForm({ ...adminPassForm, oldPassword: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={adminPassLoading}
                className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 transition-all"
              >
                {adminPassLoading ? "Updating..." : "Update Password Using Old Password"}
              </button>
            </form>

            <div className="border-t border-slate-800 pt-3 text-center space-y-2">
              <span className="text-xs text-slate-400">Option 2: Forgot your current password?</span>
              <Link
                href="/reset-password"
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-400 font-bold text-xs border border-slate-800 flex items-center justify-center gap-2 transition-all"
              >
                <Mail className="w-4 h-4" /> Send SMTP Reset Code to Admin Email
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
