"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import {
  Users,
  UserPlus,
  Search,
  Car,
  Hash,
  Mail,
  Tag,
  Trash2,
  Edit,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
  ShieldCheck,
  Radio,
  Wifi,
} from "lucide-react";

export default function AdminUserManagementPage() {
  const router = useRouter();
  const { currentAdmin, adminToken } = useSelector((state) => state.admin);

  const [mounted, setMounted] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRfidModal, setShowRfidModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Modal-specific Error and Success Messages
  const [modalError, setModalError] = useState("");
  const [modalSuccess, setModalSuccess] = useState("");

  // Add User Form State
  const [newUserForm, setNewUserForm] = useState({
    name: "",
    email: "",
    vehicleNumber: "",
    enrollmentNumber: "",
    rfid_tag: "",
    password: "",
  });

  // Assign RFID Form State
  const [rfidInput, setRfidInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // RFID Auto-Scan State
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch all users
  const fetchUsers = async () => {
    if (!currentAdmin || !adminToken) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch user directory");
      }

      setUsers(data.users || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentAdmin) {
      router.push("/admin/auth");
      return;
    }
    fetchUsers();
  }, [currentAdmin, router]);

  // Handle Live RFID Scan Trigger
  const triggerRfidAutoScan = async (targetField) => {
    setIsScanning(true);
    setScanMessage("Launching RFID reader script...");
    setModalError("");
    setModalSuccess("");
    const scanStartTime = Date.now();

    try {
      await fetch("/api/admin/hardware", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ script: "read_tags_entry", action: "start" }),
      });

      setScanMessage("Listening for physical card tap... Tap tag on scanner now.");

      let attempts = 0;
      const pollInterval = setInterval(async () => {
        attempts += 1;
        try {
          const res = await fetch(`/api/admin/users/scan-rfid?since=${scanStartTime}`, {
            headers: { Authorization: `Bearer ${adminToken}` },
          });
          const data = await res.json();

          if (data.noScanner) {
            clearInterval(pollInterval);
            setIsScanning(false);
            setScanMessage("");
            setModalError(data.message || "No RFID scanner attached. Please connect RFID hardware scanner.");
            return;
          }

          if (res.ok && data.success && data.rfid_tag) {
            clearInterval(pollInterval);
            setIsScanning(false);
            setScanMessage("");

            if (targetField === "newUser") {
              setNewUserForm((prev) => ({ ...prev, rfid_tag: data.rfid_tag }));
            } else if (targetField === "rfidInput") {
              setRfidInput(data.rfid_tag);
            }
            setModalSuccess(`Scanned RFID Tag captured: ${data.rfid_tag}`);
            return;
          }
        } catch (pollErr) {
          console.error("Scan poll error:", pollErr);
        }

        if (attempts >= 10) {
          clearInterval(pollInterval);
          setIsScanning(false);
          setScanMessage("");
          setModalError("No RFID scanner attached or scan timed out. Please connect RFID scanner.");
        }
      }, 1200);
    } catch (err) {
      setIsScanning(false);
      setScanMessage("");
      setModalError("Failed to start hardware RFID reader process.");
    }
  };

  const handleAddUserSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setModalError("");
    setModalSuccess("");

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(newUserForm),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to add user");
      }

      setSuccess(`User '${newUserForm.name}' registered successfully!`);
      setShowAddModal(false);
      setNewUserForm({
        name: "",
        email: "",
        vehicleNumber: "",
        enrollmentNumber: "",
        rfid_tag: "",
        password: "",
      });
      fetchUsers();
    } catch (err) {
      setModalError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignRfidSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    setSubmitting(true);
    setModalError("");
    setModalSuccess("");

    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          userId: selectedUser._id,
          rfid_tag: rfidInput,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to update RFID tag");
      }

      setSuccess(`RFID Tag assigned to '${selectedUser.name}' successfully!`);
      setShowRfidModal(false);
      setSelectedUser(null);
      setRfidInput("");
      fetchUsers();
    } catch (err) {
      setModalError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Are you sure you want to delete user '${user.name}'?`)) return;
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/admin/users?id=${user._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to remove user");
      }

      setSuccess(`User '${user.name}' removed successfully.`);
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  if (!currentAdmin) return null;

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.vehicleNumber && u.vehicleNumber.toLowerCase().includes(q)) ||
      (u.enrollmentNumber && u.enrollmentNumber.toString().includes(q)) ||
      (u.rfid_tag && u.rfid_tag.toLowerCase().includes(q))
    );
  });

  const usersWithRfid = users.filter((u) => u.rfid_tag && u.rfid_tag.trim() !== "").length;
  const usersMissingRfid = users.length - usersWithRfid;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            User & RFID Tag Directory
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Enroll vehicles, manage resident accounts, and assign RFID barrier tags
          </p>
        </div>

        <button
          onClick={() => {
            setError("");
            setSuccess("");
            setModalError("");
            setModalSuccess("");
            setShowAddModal(true);
          }}
          className="btn-liquid-primary py-3 px-5 rounded-2xl text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-xl shadow-cyan-600/30 spring-press self-start md:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          Enroll New User
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="glass-elevated rounded-3xl p-5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Enrolled Users</span>
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-white font-mono">{users.length}</p>
        </div>

        <div className="glass-elevated rounded-3xl p-5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">RFID Tag Assigned</span>
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300">
              <Tag className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-emerald-300 font-mono">{usersWithRfid}</p>
        </div>

        <div className="glass-elevated rounded-3xl p-5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Unassigned RFID Tags</span>
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-amber-300 font-mono">{usersMissingRfid}</p>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 font-bold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 font-bold">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* User Table Container */}
      <div className="glass-floating rounded-3xl p-6 space-y-4 shadow-2xl">
        {/* Search Bar */}
        <div className="flex items-center gap-3 glass-input rounded-2xl px-4 py-2.5 max-w-md">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by Name, Email, Vehicle No, ID, or RFID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs text-white placeholder:text-slate-500 focus:outline-none"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-16 text-xs text-slate-400 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
            Loading user directory...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <Users className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-sm font-bold text-slate-300">No users found matching query</p>
            <p className="text-xs text-slate-500">Try adjusting your search query or click 'Enroll New User'.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 font-bold">
                  <th className="py-3 px-4">User Details</th>
                  <th className="py-3 px-4">Vehicle Plate</th>
                  <th className="py-3 px-4">Enrollment ID</th>
                  <th className="py-3 px-4">Assigned RFID Tag</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white">{user.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{user.email}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-cyan-300">
                      {user.vehicleNumber}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      {user.enrollmentNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      {user.rfid_tag ? (
                        <span className="px-2.5 py-1 rounded-full glass-badge-cyan font-mono font-bold text-[11px]">
                          {user.rfid_tag}
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full glass-badge-amber font-medium text-[11px]">
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setRfidInput(user.rfid_tag || "");
                            setError("");
                            setModalError("");
                            setModalSuccess("");
                            setShowRfidModal(true);
                          }}
                          className="btn-liquid-secondary py-1.5 px-3 rounded-xl text-cyan-300 text-[11px] font-bold flex items-center gap-1 spring-press"
                          title="Assign or Change RFID Tag"
                        >
                          <Tag className="w-3.5 h-3.5 text-cyan-400" />
                          {user.rfid_tag ? "Change RFID" : "Assign RFID"}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user)}
                          className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 spring-press transition-colors"
                          title="Delete User Account"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add New User Modal */}
      {mounted &&
        showAddModal &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-200">
            <div className="w-full max-w-lg glass-floating rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-300">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Enroll New Resident User</h3>
                    <p className="text-xs text-slate-400">Register account & vehicle for Gatify gate access</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {modalError && (
                <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 font-bold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}
              {modalSuccess && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 font-bold">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{modalSuccess}</span>
                </div>
              )}

              <form onSubmit={handleAddUserSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kavan Patel"
                    value={newUserForm.name}
                    onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                    className="glass-input w-full p-3 rounded-2xl text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="user@example.com"
                      value={newUserForm.email}
                      onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                      className="glass-input w-full p-3 rounded-2xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={newUserForm.password}
                      onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                      className="glass-input w-full p-3 rounded-2xl text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Vehicle License No.</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. GJ07KP0510"
                      value={newUserForm.vehicleNumber}
                      onChange={(e) => setNewUserForm({ ...newUserForm, vehicleNumber: e.target.value })}
                      className="glass-input w-full p-3 rounded-2xl text-xs font-mono uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Enrollment / Unit ID</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 12202080701052"
                      value={newUserForm.enrollmentNumber}
                      onChange={(e) => setNewUserForm({ ...newUserForm, enrollmentNumber: e.target.value })}
                      className="glass-input w-full p-3 rounded-2xl text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Assigned RFID Tag Code
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="e.g. 0008664886"
                      value={newUserForm.rfid_tag}
                      onChange={(e) => setNewUserForm({ ...newUserForm, rfid_tag: e.target.value })}
                      className="glass-input flex-1 p-3 rounded-2xl text-xs font-mono font-bold text-cyan-300"
                    />
                    <button
                      type="button"
                      onClick={() => triggerRfidAutoScan("newUser")}
                      disabled={isScanning}
                      className="btn-liquid-secondary py-3 px-3.5 rounded-2xl text-white font-bold text-xs flex items-center gap-1.5 spring-press whitespace-nowrap disabled:opacity-60"
                      title="Launch RFID script and auto-fill scanned tag code"
                    >
                      {isScanning ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Wifi className="w-3.5 h-3.5 text-cyan-400" />
                      )}
                      {isScanning ? "Scanning..." : "📡 Auto-Scan RFID"}
                    </button>
                  </div>
                  {isScanning && (
                    <p className="text-[11px] text-cyan-400 font-medium mt-1.5 flex items-center gap-1 animate-pulse">
                      <Radio className="w-3 h-3" /> {scanMessage || "Listening for physical card scan..."}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="btn-liquid-secondary py-2.5 px-4 rounded-2xl text-slate-300 text-xs font-semibold spring-press"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-liquid-primary py-2.5 px-5 rounded-2xl text-white text-xs font-bold flex items-center gap-2 spring-press disabled:opacity-50"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save User Account"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* Assign / Change RFID Modal */}
      {mounted &&
        showRfidModal &&
        selectedUser &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-200">
            <div className="w-full max-w-md glass-floating rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-300">
                    <Tag className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Assign RFID Tag Code</h3>
                    <p className="text-xs text-slate-400">For user: <strong className="text-white">{selectedUser.name}</strong></p>
                  </div>
                </div>
                <button
                  onClick={() => setShowRfidModal(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {modalError && (
                <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 font-bold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}
              {modalSuccess && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 font-bold">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{modalSuccess}</span>
                </div>
              )}

              <form onSubmit={handleAssignRfidSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    RFID Hardware Tag Code
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      required
                      placeholder="e.g. 0008664886"
                      value={rfidInput}
                      onChange={(e) => setRfidInput(e.target.value)}
                      className="glass-input flex-1 p-3 rounded-2xl text-xs font-mono font-bold text-cyan-300"
                    />
                    <button
                      type="button"
                      onClick={() => triggerRfidAutoScan("rfidInput")}
                      disabled={isScanning}
                      className="btn-liquid-secondary py-3 px-3.5 rounded-2xl text-white font-bold text-xs flex items-center gap-1.5 spring-press whitespace-nowrap disabled:opacity-60"
                      title="Launch RFID script and auto-fill scanned tag code"
                    >
                      {isScanning ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Wifi className="w-3.5 h-3.5 text-cyan-400" />
                      )}
                      {isScanning ? "Scanning..." : "📡 Auto-Scan"}
                    </button>
                  </div>
                  {isScanning ? (
                    <p className="text-[11px] text-cyan-400 font-medium mt-1.5 flex items-center gap-1 animate-pulse">
                      <Radio className="w-3 h-3" /> {scanMessage || "Listening for physical card scan..."}
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-400 mt-1.5">
                      Click '📡 Auto-Scan' to capture live scan from connected physical RFID reader.
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowRfidModal(false)}
                    className="btn-liquid-secondary py-2.5 px-4 rounded-2xl text-slate-300 text-xs font-semibold spring-press"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-liquid-primary py-2.5 px-5 rounded-2xl text-white text-xs font-bold flex items-center gap-2 spring-press disabled:opacity-50"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save RFID Tag"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
