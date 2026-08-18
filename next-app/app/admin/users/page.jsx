"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";

export default function AdminUserManagementPage() {
  const router = useRouter();
  const { currentAdmin, adminToken } = useSelector((state) => state.admin);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRfidModal, setShowRfidModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

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

  // Handle Register New User
  const handleAddUserSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

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
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Assign / Update RFID Tag
  const handleAssignRfidSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    setSubmitting(true);
    setError("");
    setSuccess("");

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
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete User
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

  // Filtered Users List
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
            User & RFID Tag Management
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm mt-1">
            Enroll new vehicles, manage resident accounts, and assign RFID barrier tags
          </p>
        </div>

        <button
          onClick={() => {
            setError("");
            setSuccess("");
            setShowAddModal(true);
          }}
          className="py-3 px-5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all self-start md:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          Enroll New User
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="glass-panel glass-card-hover rounded-2xl p-5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Total Enrolled Users</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">{users.length}</p>
        </div>

        <div className="glass-panel glass-card-hover rounded-2xl p-5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">RFID Tag Assigned</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Tag className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{usersWithRfid}</p>
        </div>

        <div className="glass-panel glass-card-hover rounded-2xl p-5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Unassigned RFID Tags</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">{usersMissingRfid}</p>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* User Table Container */}
      <div className="glass-panel rounded-3xl p-6 space-y-4">
        {/* Search Bar */}
        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-2xl px-4 py-2.5 max-w-md">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by Name, Email, Vehicle No, ID, or RFID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-16 text-xs text-slate-500 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
            Loading user directory...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <Users className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No users found matching query</p>
            <p className="text-xs text-slate-500">Try adjusting your search query or click 'Enroll New User'.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                  <th className="py-3 px-4">User Details</th>
                  <th className="py-3 px-4">Vehicle Plate</th>
                  <th className="py-3 px-4">Enrollment ID</th>
                  <th className="py-3 px-4">Assigned RFID Tag</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-slate-100">{user.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{user.email}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {user.vehicleNumber}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-400">
                      {user.enrollmentNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      {user.rfid_tag ? (
                        <span className="px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-500/20 font-mono font-bold text-[11px]">
                          {user.rfid_tag}
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 font-medium text-[11px]">
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
                            setShowRfidModal(true);
                          }}
                          className="py-1.5 px-3 rounded-xl bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 text-[11px] font-semibold flex items-center gap-1 transition-all"
                          title="Assign or Change RFID Tag"
                        >
                          <Tag className="w-3.5 h-3.5" />
                          {user.rfid_tag ? "Change RFID" : "Assign RFID"}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user)}
                          className="p-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 transition-colors"
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
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg glass-panel rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Enroll New Resident User</h3>
                  <p className="text-xs text-slate-500">Register account & vehicle for RFID gate system access</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddUserSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kavan Patel"
                  value={newUserForm.name}
                  onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                  className="input-field w-full text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="user@example.com"
                    value={newUserForm.email}
                    onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                    className="input-field w-full text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={newUserForm.password}
                    onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                    className="input-field w-full text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Vehicle License No.</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. GJ07KP0510"
                    value={newUserForm.vehicleNumber}
                    onChange={(e) => setNewUserForm({ ...newUserForm, vehicleNumber: e.target.value })}
                    className="input-field w-full text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Enrollment Number</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 12202080701052"
                    value={newUserForm.enrollmentNumber}
                    onChange={(e) => setNewUserForm({ ...newUserForm, enrollmentNumber: e.target.value })}
                    className="input-field w-full text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Assigned RFID Tag Code (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 0008664886 (Can be assigned later)"
                  value={newUserForm.rfid_tag}
                  onChange={(e) => setNewUserForm({ ...newUserForm, rfid_tag: e.target.value })}
                  className="input-field w-full text-xs font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 shadow-md"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save User Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign / Change RFID Modal */}
      {showRfidModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md glass-panel rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Assign RFID Tag Code</h3>
                  <p className="text-xs text-slate-500">For user: <strong className="text-slate-900 dark:text-slate-200">{selectedUser.name}</strong></p>
                </div>
              </div>
              <button
                onClick={() => setShowRfidModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignRfidSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  RFID Hardware Tag Code
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 0008664886"
                  value={rfidInput}
                  onChange={(e) => setRfidInput(e.target.value)}
                  className="input-field w-full text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400"
                />
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Scan the physical RFID card/sticker at the USB reader or type the exact hex/decimal tag number.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRfidModal(false)}
                  className="py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="py-2.5 px-5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 shadow-md"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save RFID Tag"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
