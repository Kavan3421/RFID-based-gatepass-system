import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import '../../core/api_service.dart';
import '../auth/login_screen.dart';
import '../auth/reset_password_screen.dart';
import '../gatekeeper/gatekeeper_screen.dart';
import '../member/member_screen.dart';

class AdminScreen extends StatefulWidget {
  const AdminScreen({super.key});

  @override
  State<AdminScreen> createState() => _AdminScreenState();
}

class _AdminScreenState extends State<AdminScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  Map<String, dynamic>? _user;
  Map<String, dynamic>? _stats;
  List<dynamic> _logs = [];
  List<dynamic> _destinations = [];
  List<dynamic> _usersList = [];
  List<dynamic> _reports = [];
  bool _isLoading = true;

  // Add Destination Form
  final _destWingController = TextEditingController();
  final _destFlatController = TextEditingController();

  // Create Member Form
  final _memNameController = TextEditingController();
  final _memFlatController = TextEditingController();
  final _memPassController = TextEditingController();
  String _selectedRole = "MEMBER";

  // Edit Admin Profile Form
  final _profileNameController = TextEditingController();
  final _profileFlatController = TextEditingController();

  // Change Admin Password Form
  final _oldPassController = TextEditingController();
  final _newPassController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _loadUser();
    _fetchOverview();
    _fetchDestinations();
    _fetchUsers();
    _fetchReports();
  }

  Future<void> _loadUser() async {
    final prefs = await SharedPreferences.getInstance();
    final userStr = prefs.getString('qrgp_user');
    if (userStr != null) {
      final parsed = jsonDecode(userStr);
      setState(() {
        _user = parsed;
        _profileNameController.text = parsed['username'] ?? '';
        _profileFlatController.text = parsed['phone'] ?? '';
      });
    }
  }

  Future<void> _fetchOverview() async {
    setState(() => _isLoading = true);
    try {
      final res = await ApiService.getDashboardOverview();
      if (res['success'] == true) {
        setState(() {
          _stats = res['stats'];
          _logs = res['liveRegister'] ?? [];
        });
      }
    } catch (e) {
      // ignore
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _fetchDestinations() async {
    try {
      final res = await ApiService.getDestinations();
      if (res['success'] == true) {
        setState(() => _destinations = res['destinations'] ?? []);
      }
    } catch (e) {
      // ignore
    }
  }

  Future<void> _fetchUsers() async {
    try {
      final res = await ApiService.getMembers();
      if (res['success'] == true) {
        setState(() => _usersList = res['users'] ?? []);
      }
    } catch (e) {
      // ignore
    }
  }

  Future<void> _fetchReports() async {
    try {
      final res = await ApiService.getReports();
      if (res['success'] == true) {
        setState(() => _reports = res['logs'] ?? []);
      }
    } catch (e) {
      // ignore
    }
  }

  Future<void> _handleAddDestination() async {
    final flat = _destFlatController.text.trim();
    if (flat.isEmpty) return;

    try {
      final res = await ApiService.createDestination(
        groupLabel: _destWingController.text.trim(),
        unitNumber: flat,
      );
      if (res['success'] == true) {
        _destWingController.clear();
        _destFlatController.clear();
        _fetchDestinations();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Destination added successfully!")));
        }
      }
    } catch (e) {
      // ignore
    }
  }

  Future<void> _handleCreateMember() async {
    final name = _memNameController.text.trim();
    final flat = _memFlatController.text.trim();
    final pass = _memPassController.text.trim();

    if (name.isEmpty || flat.isEmpty || pass.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Name, Flat, and Password are required.")));
      return;
    }

    try {
      final res = await ApiService.createMember(
        username: name,
        flatUnit: flat,
        password: pass,
        role: _selectedRole,
      );
      if (res['success'] == true) {
        _memNameController.clear();
        _memFlatController.clear();
        _memPassController.clear();
        _fetchUsers();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Member ${res['user']['username']} created successfully!")));
        }
      }
    } catch (e) {
      // ignore
    }
  }

  void _showEditMemberModal(Map<String, dynamic> member) {
    final nameCtrl = TextEditingController(text: member['username'] ?? '');
    final flatCtrl = TextEditingController(text: member['phone'] ?? '');
    final passCtrl = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1E293B),
        title: const Text("Edit Member & Set Password", style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: nameCtrl,
              style: const TextStyle(color: Colors.white),
              decoration: const InputDecoration(labelText: "Member Name", labelStyle: TextStyle(color: Color(0xFF94A3B8))),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: flatCtrl,
              style: const TextStyle(color: Colors.white),
              decoration: const InputDecoration(labelText: "Flat / Unit Reference", labelStyle: TextStyle(color: Color(0xFF94A3B8))),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: passCtrl,
              obscureText: true,
              style: const TextStyle(color: Colors.white),
              decoration: const InputDecoration(labelText: "Set New Member Password", labelStyle: TextStyle(color: Color(0xFF06B6D4))),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text("Cancel", style: TextStyle(color: Color(0xFF94A3B8)))),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF0891B2)),
            onPressed: () async {
              final res = await ApiService.updateMember(
                userId: member['id'],
                username: nameCtrl.text.trim(),
                flatUnit: flatCtrl.text.trim(),
                newPassword: passCtrl.text.trim(),
              );
              if (res['success'] == true) {
                _fetchUsers();
                if (mounted) Navigator.pop(ctx);
              }
            },
            child: const Text("Save Changes", style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  void _showAdminProfileModal() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1E293B),
        title: const Text("Edit My Admin Profile", style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: _profileNameController,
              style: const TextStyle(color: Colors.white),
              decoration: const InputDecoration(labelText: "Admin Display Name", labelStyle: TextStyle(color: Color(0xFF94A3B8))),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _profileFlatController,
              style: const TextStyle(color: Colors.white),
              decoration: const InputDecoration(labelText: "Admin Flat / Unit Reference", labelStyle: TextStyle(color: Color(0xFF94A3B8))),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text("Cancel", style: TextStyle(color: Color(0xFF94A3B8)))),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF0891B2)),
            onPressed: () async {
              final res = await ApiService.updateAdminProfile(
                username: _profileNameController.text.trim(),
                flatUnit: _profileFlatController.text.trim(),
              );
              if (res['success'] == true) {
                _loadUser();
                if (mounted) Navigator.pop(ctx);
              }
            },
            child: const Text("Save Profile", style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  void _showChangeAdminPasswordModal() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1E293B),
        title: const Text("Change Main Admin Password", style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: _oldPassController,
              obscureText: true,
              style: const TextStyle(color: Colors.white),
              decoration: const InputDecoration(labelText: "Current (Old) Password", labelStyle: TextStyle(color: Color(0xFF94A3B8))),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _newPassController,
              obscureText: true,
              style: const TextStyle(color: Colors.white),
              decoration: const InputDecoration(labelText: "New Password", labelStyle: TextStyle(color: Color(0xFF06B6D4))),
            ),
            const SizedBox(height: 16),
            TextButton.icon(
              onPressed: () {
                Navigator.pop(ctx);
                Navigator.push(context, MaterialPageRoute(builder: (_) => const ResetPasswordScreen()));
              },
              icon: const Icon(Icons.email, color: Color(0xFF06B6D4), size: 16),
              label: const Text("Forgot Password? Use SMTP Reset Code", style: TextStyle(color: Color(0xFF06B6D4), fontSize: 11)),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text("Cancel", style: TextStyle(color: Color(0xFF94A3B8)))),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF0891B2)),
            onPressed: () async {
              final res = await ApiService.changeAdminPassword(
                oldPassword: _oldPassController.text.trim(),
                newPassword: _newPassController.text.trim(),
              );
              if (res['success'] == true) {
                _oldPassController.clear();
                _newPassController.clear();
                if (mounted) Navigator.pop(ctx);
              }
            },
            child: const Text("Update Password", style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  void _logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
    if (!mounted) return;
    Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const LoginScreen()));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E293B),
        title: Text(_user != null ? "${_user!['organizationCode'] ?? 'Admin'} Command Center" : "Admin Command Center", style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
        actions: [
          IconButton(icon: const Icon(Icons.qr_code, color: Colors.cyanAccent), tooltip: "Generate Guest Pass", onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const MemberScreen()))),
          IconButton(icon: const Icon(Icons.qr_code_scanner, color: Colors.amberAccent), tooltip: "Gatekeeper Scanner", onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const GatekeeperScreen()))),
          IconButton(icon: const Icon(Icons.person, color: Colors.white), tooltip: "Edit Admin Profile", onPressed: _showAdminProfileModal),
          IconButton(icon: const Icon(Icons.lock, color: Colors.cyanAccent), tooltip: "Change Password", onPressed: _showChangeAdminPasswordModal),
          IconButton(icon: const Icon(Icons.logout, color: Colors.redAccent), tooltip: "Sign Out", onPressed: _logout),
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: const Color(0xFF06B6D4),
          labelColor: const Color(0xFF06B6D4),
          unselectedLabelColor: const Color(0xFF94A3B8),
          tabs: const [
            Tab(text: "Register"),
            Tab(text: "Destinations"),
            Tab(text: "Members"),
            Tab(text: "Reports"),
          ],
        ),
      ),
      body: SafeArea(
        child: TabBarView(
          controller: _tabController,
          children: [
            _buildLiveRegisterTab(),
            _buildDestinationsTab(),
            _buildMembersTab(),
            _buildReportsTab(),
          ],
        ),
      ),
    );
  }

  // TAB 1: LIVE DIGITAL REGISTER
  Widget _buildLiveRegisterTab() {
    return _isLoading
        ? const Center(child: CircularProgressIndicator(color: Color(0xFF0891B2)))
        : RefreshIndicator(
            onRefresh: _fetchOverview,
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Row(
                  children: [
                    _buildStatCard("Guests Today", "${_stats?['guestsToday'] ?? 0}", Colors.cyanAccent),
                    const SizedBox(width: 8),
                    _buildStatCard("Deliveries", "${_stats?['deliveriesToday'] ?? 0}", Colors.blueAccent),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    _buildStatCard("Inside Campus", "${_stats?['currentlyInside'] ?? 0}", Colors.greenAccent),
                    const SizedBox(width: 8),
                    _buildStatCard("Exited Today", "${_stats?['exitedToday'] ?? 0}", Colors.grey),
                  ],
                ),
                const SizedBox(height: 20),
                const Text("Live Digital Gate Register", style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                const SizedBox(height: 12),
                ..._logs.map((log) {
                  final dests = log['destinations'] is List ? (log['destinations'] as List).join(', ') : log['destinations'].toString();
                  return Card(
                    color: const Color(0xFF1E293B),
                    margin: const EdgeInsets.only(bottom: 8),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    child: ListTile(
                      title: Text(log['person_name'] ?? '', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                      subtitle: Text("Destinations: $dests", style: const TextStyle(color: Colors.cyanAccent, fontSize: 12)),
                      trailing: Text(log['status'] ?? '', style: TextStyle(color: log['status'] == 'INSIDE' ? Colors.greenAccent : Colors.grey, fontWeight: FontWeight.bold)),
                    ),
                  );
                }),
              ],
            ),
          );
  }

  // TAB 2: CONFIGURE DESTINATIONS
  Widget _buildDestinationsTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(color: const Color(0xFF1E293B), borderRadius: BorderRadius.circular(16)),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text("Add New Destination", style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
              const SizedBox(height: 12),
              TextField(
                controller: _destWingController,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(labelText: "Wing / Group (e.g. Wing A)", labelStyle: TextStyle(color: Color(0xFF94A3B8))),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _destFlatController,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(labelText: "Unit / Flat # (e.g. 101)", labelStyle: TextStyle(color: Color(0xFF94A3B8))),
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF0891B2)),
                onPressed: _handleAddDestination,
                child: const Text("Add Destination", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),
        Text("Existing Destinations (${_destinations.length})", style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
        const SizedBox(height: 12),
        ..._destinations.map((d) {
          return Card(
            color: const Color(0xFF1E293B),
            margin: const EdgeInsets.only(bottom: 8),
            child: ListTile(
              title: Text(d['full_name'] ?? '', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              subtitle: Text(d['group_label'] ?? 'Unit', style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12)),
            ),
          );
        }),
      ],
    );
  }

  // TAB 3: MEMBER & PASSWORD MANAGEMENT
  Widget _buildMembersTab() {
    final filteredMembers = _usersList.where((u) => u['role'] != 'ADMIN').toList();
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Create Member Box
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(color: const Color(0xFF1E293B), borderRadius: BorderRadius.circular(16)),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text("Create Member Account", style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                value: _selectedRole,
                dropdownColor: const Color(0xFF1E293B),
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(labelText: "Account Role", labelStyle: TextStyle(color: Color(0xFF94A3B8))),
                items: const [
                  DropdownMenuItem(value: "MEMBER", child: Text("MEMBER (Resident)")),
                  DropdownMenuItem(value: "GATEKEEPER", child: Text("GATEKEEPER (Security Guard)")),
                ],
                onChanged: (v) => setState(() => _selectedRole = v!),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _memNameController,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(labelText: "Member Name *", labelStyle: TextStyle(color: Color(0xFF94A3B8))),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _memFlatController,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(labelText: "Flat / Unit Number *", labelStyle: TextStyle(color: Color(0xFF94A3B8))),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _memPassController,
                obscureText: true,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(labelText: "Password *", labelStyle: TextStyle(color: Color(0xFF94A3B8))),
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF0891B2)),
                onPressed: _handleCreateMember,
                child: const Text("Create Member Account", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),
        Text("Organization Members (${filteredMembers.length})", style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
        const SizedBox(height: 12),
        ...filteredMembers.map((m) {
          return Card(
            color: const Color(0xFF1E293B),
            margin: const EdgeInsets.only(bottom: 8),
            child: ListTile(
              title: Text(m['username'] ?? '', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              subtitle: Text("Flat/Unit: ${m['phone'] ?? 'Assigned'} | Role: ${m['role']}", style: const TextStyle(color: Color(0xFF06B6D4), fontSize: 12)),
              trailing: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  IconButton(
                    icon: const Icon(Icons.key, color: Colors.cyanAccent),
                    tooltip: "Set New Member Password",
                    onPressed: () => _showEditMemberModal(m),
                  ),
                  IconButton(
                    icon: const Icon(Icons.delete, color: Colors.redAccent),
                    tooltip: "Remove Member",
                    onPressed: () async {
                      final res = await ApiService.deleteMember(m['id']);
                      if (res['success'] == true) _fetchUsers();
                    },
                  ),
                ],
              ),
            ),
          );
        }),
      ],
    );
  }

  // TAB 4: REPORTS
  Widget _buildReportsTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Text("Gate Entry & Exit Logs", style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
        const SizedBox(height: 12),
        ..._reports.map((r) {
          final dests = r['destinations'] is List ? (r['destinations'] as List).join(', ') : r['destinations'].toString();
          return Card(
            color: const Color(0xFF1E293B),
            margin: const EdgeInsets.only(bottom: 8),
            child: ListTile(
              title: Text(r['person_name'] ?? '', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              subtitle: Text("Type: ${r['entry_type']} | Destinations: $dests", style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12)),
              trailing: Text(r['status'] ?? '', style: const TextStyle(color: Colors.greenAccent, fontWeight: FontWeight.bold)),
            ),
          );
        }),
      ],
    );
  }

  Widget _buildStatCard(String title, String value, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: const Color(0xFF1E293B), borderRadius: BorderRadius.circular(16)),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 11)),
            const SizedBox(height: 4),
            Text(value, style: TextStyle(color: color, fontSize: 24, fontWeight: FontWeight.bold)),
          ],
        ),
      ),
    );
  }
}
