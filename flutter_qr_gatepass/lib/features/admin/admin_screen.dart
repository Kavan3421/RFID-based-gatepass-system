import 'dart:io';
import 'package:flutter/material.dart';
import 'package:path_provider_android/path_provider_android.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import '../../core/api_service.dart';
import '../../core/glass_widgets.dart';
import '../../core/pdf_generator.dart';
import '../../core/theme_controller.dart';
import '../auth/login_screen.dart';
import '../gatekeeper/gatekeeper_screen.dart';
import '../member/member_screen.dart';

class AdminScreen extends StatefulWidget {
  const AdminScreen({super.key});

  @override
  State<AdminScreen> createState() => _AdminScreenState();
}

class _AdminScreenState extends State<AdminScreen> {
  int _currentTabIndex = 0; // 0: Feed, 1: Units, 2: Quick Pass, 3: Members, 4: Reports
  int _selectedFilterStory = 0; // 0: All, 1: Guests, 2: Deliveries, 3: Inside

  Map<String, dynamic>? _user;
  Map<String, dynamic>? _stats;
  List<dynamic> _logs = [];
  List<dynamic> _destinations = [];
  List<dynamic> _usersList = [];
  List<dynamic> _reports = [];
  bool _isLoading = true;
  bool _isLoadingReports = false;

  // Reports Filter State
  DateTime? _reportFromDate;
  DateTime? _reportToDate;
  String _reportEntryType = "ALL"; // ALL, GUEST, DELIVERY

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
    _loadUser();
    _fetchOverview();
    _fetchDestinations();
    _fetchUsers();
    _fetchReports();
  }

  Future<void> _loadUser() async {
    final prefs = await SharedPreferences.getInstance();
    final userStr = prefs.getString('gatify_user') ?? prefs.getString('qrgp_user');
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
    } catch (_) {
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _fetchDestinations() async {
    try {
      final res = await ApiService.getDestinations();
      if (res['success'] == true) {
        setState(() => _destinations = res['destinations'] ?? []);
      }
    } catch (_) {}
  }

  Future<void> _fetchUsers() async {
    try {
      final res = await ApiService.getMembers();
      if (res['success'] == true) {
        setState(() => _usersList = res['users'] ?? []);
      }
    } catch (_) {}
  }

  Future<void> _fetchReports() async {
    setState(() => _isLoadingReports = true);
    try {
      final fromStr = _reportFromDate != null
          ? "${_reportFromDate!.year}-${_reportFromDate!.month.toString().padLeft(2, '0')}-${_reportFromDate!.day.toString().padLeft(2, '0')}"
          : '';
      final toStr = _reportToDate != null
          ? "${_reportToDate!.year}-${_reportToDate!.month.toString().padLeft(2, '0')}-${_reportToDate!.day.toString().padLeft(2, '0')}"
          : '';

      final res = await ApiService.getReports(
        fromDate: fromStr,
        toDate: toStr,
        entryType: _reportEntryType,
      );
      if (res['success'] == true) {
        setState(() => _reports = res['logs'] ?? []);
      }
    } catch (_) {
    } finally {
      if (mounted) setState(() => _isLoadingReports = false);
    }
  }

  Future<void> _selectReportDate({required bool isFromDate}) async {
    final initialDate = isFromDate ? (_reportFromDate ?? DateTime.now()) : (_reportToDate ?? DateTime.now());
    final picked = await showDatePicker(
      context: context,
      initialDate: initialDate,
      firstDate: DateTime(2025, 1, 1),
      lastDate: DateTime(2030, 12, 31),
      builder: (ctx, child) {
        return Theme(
          data: ThemeData.dark().copyWith(
            colorScheme: const ColorScheme.dark(
              primary: Color(0xFF06B6D4),
              onPrimary: Colors.white,
              surface: Color(0xFF0F172A),
              onSurface: Colors.white,
            ),
            dialogBackgroundColor: const Color(0xFF0F172A),
          ),
          child: child!,
        );
      },
    );

    if (picked != null) {
      setState(() {
        if (isFromDate) {
          _reportFromDate = picked;
        } else {
          _reportToDate = picked;
        }
      });
    }
  }

  Future<String> _getExportDirectory() async {
    Directory downloadsDir = Directory('/storage/emulated/0/Download');
    if (!downloadsDir.existsSync()) {
      downloadsDir = Directory('/sdcard/Download');
    }
    final PathProviderAndroid provider = PathProviderAndroid();
    return downloadsDir.existsSync()
        ? downloadsDir.path
        : (await provider.getApplicationSupportPath() ?? '/sdcard/Download');
  }

  Future<void> _exportExcel() async {
    if (_reports.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("No filtered report records available to export.")),
      );
      return;
    }

    try {
      final buffer = StringBuffer();
      // UTF-8 BOM for automatic Excel delimiter & character encoding parsing
      buffer.write('\uFEFF');
      buffer.writeln('"Log ID","Visitor Name","Entry Type","Destinations","Status","Entry Time","Exit Time"');

      for (final r in _reports) {
        final id = r['id'] ?? '';
        final name = (r['person_name'] ?? '').toString().replaceAll('"', '""');
        final type = r['entry_type'] ?? '';
        final dests = (r['destinations'] is List
                ? (r['destinations'] as List).join(', ')
                : (r['destinations'] ?? '').toString())
            .replaceAll('"', '""');
        final status = r['status'] ?? '';
        final entry = r['entry_time'] ?? '';
        final exit = r['exit_time'] ?? '';
        buffer.writeln('"$id","$name","$type","$dests","$status","$entry","$exit"');
      }

      final dir = await _getExportDirectory();
      final filename = 'Gatify_Filtered_Reports_${DateTime.now().millisecondsSinceEpoch}.csv';
      final file = File('$dir/$filename');
      await file.writeAsString(buffer.toString());

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFF10B981),
            content: Row(
              children: [
                const Icon(Icons.check_circle, color: Colors.white, size: 20),
                const SizedBox(width: 8),
                Expanded(child: Text("Excel (.CSV) exported (${_reports.length} logs):\n$filename")),
              ],
            ),
            duration: const Duration(seconds: 4),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("Export failed: $e")),
        );
      }
    }
  }

  Future<void> _exportPdf() async {
    if (_reports.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("No filtered report records available to export.")),
      );
      return;
    }

    try {
      final orgName = _user?['organizationName'] ?? _user?['organizationCode'] ?? 'Gatify';
      
      final List<String> filterParts = [];
      if (_reportEntryType != "ALL") filterParts.add("Type: $_reportEntryType");
      if (_reportFromDate != null) {
        filterParts.add("From: ${_reportFromDate!.year}-${_reportFromDate!.month.toString().padLeft(2, '0')}-${_reportFromDate!.day.toString().padLeft(2, '0')}");
      }
      if (_reportToDate != null) {
        filterParts.add("To: ${_reportToDate!.year}-${_reportToDate!.month.toString().padLeft(2, '0')}-${_reportToDate!.day.toString().padLeft(2, '0')}");
      }

      final pdfBytes = SimplePdfGenerator.createReportPdf(
        orgName: orgName,
        records: _reports,
        filterInfo: filterParts.isNotEmpty ? filterParts.join(" | ") : "All Activity",
      );

      final dir = await _getExportDirectory();
      final filename = 'Gatify_Security_Report_${DateTime.now().millisecondsSinceEpoch}.pdf';
      final file = File('$dir/$filename');
      await file.writeAsBytes(pdfBytes);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFF06B6D4),
            content: Row(
              children: [
                const Icon(Icons.picture_as_pdf, color: Colors.white, size: 20),
                const SizedBox(width: 8),
                Expanded(child: Text("PDF Report exported (${_reports.length} logs):\n$filename")),
              ],
            ),
            duration: const Duration(seconds: 4),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("Export failed: $e")),
        );
      }
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
    } catch (_) {}
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
    } catch (_) {}
  }

  Future<void> _handleUpdateAdminProfile() async {
    final name = _profileNameController.text.trim();
    final flat = _profileFlatController.text.trim();

    try {
      final res = await ApiService.updateAdminProfile(username: name, flatUnit: flat);
      if (res['success'] == true) {
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('gatify_user', jsonEncode(res['user']));
        await prefs.setString('qrgp_user', jsonEncode(res['user']));
        setState(() => _user = res['user']);
        if (mounted) {
          Navigator.pop(context);
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Admin profile updated!")));
        }
      }
    } catch (_) {}
  }

  Future<void> _handleChangeAdminPassword() async {
    final oldPass = _oldPassController.text.trim();
    final newPass = _newPassController.text.trim();

    if (oldPass.isEmpty || newPass.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Both password fields are required.")));
      return;
    }

    try {
      final res = await ApiService.changeAdminPassword(oldPassword: oldPass, newPassword: newPass);
      if (res['success'] == true) {
        _oldPassController.clear();
        _newPassController.clear();
        if (mounted) {
          Navigator.pop(context);
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Password changed successfully!")));
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(res['message'] ?? "Error changing password.")));
        }
      }
    } catch (_) {}
  }

  void _showAdminProfileModal() {
    showDialog(
      context: context,
      builder: (ctx) => Dialog(
        backgroundColor: Colors.transparent,
        child: FrostedGlassCard(
          borderRadius: 24,
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text("Edit Admin Profile", style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 16),
              GlassTextField(controller: _profileNameController, labelText: "Username / Name", hintText: "Admin Username"),
              const SizedBox(height: 12),
              GlassTextField(controller: _profileFlatController, labelText: "Contact Phone / Unit", hintText: "e.g. +91 98765 43210"),
              const SizedBox(height: 20),
              LiquidGlassButton(onPressed: _handleUpdateAdminProfile, label: "Save Profile Changes"),
            ],
          ),
        ),
      ),
    );
  }

  void _showChangeAdminPasswordModal() {
    showDialog(
      context: context,
      builder: (ctx) => Dialog(
        backgroundColor: Colors.transparent,
        child: FrostedGlassCard(
          borderRadius: 24,
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text("Change Admin Password", style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 16),
              GlassTextField(controller: _oldPassController, labelText: "Current Password", hintText: "••••••••", isPassword: true),
              const SizedBox(height: 12),
              GlassTextField(controller: _newPassController, labelText: "New Secret Password", hintText: "••••••••", isPassword: true),
              const SizedBox(height: 20),
              LiquidGlassButton(onPressed: _handleChangeAdminPassword, label: "Update Password"),
            ],
          ),
        ),
      ),
    );
  }

  void _showEditMemberModal(Map<String, dynamic> member) {
    final userEditNameCtrl = TextEditingController(text: member['username'] ?? '');
    final userEditFlatCtrl = TextEditingController(text: member['phone'] ?? '');
    final userEditPassCtrl = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => Dialog(
        backgroundColor: Colors.transparent,
        child: FrostedGlassCard(
          borderRadius: 24,
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text("Set Password: ${member['username']}", style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
              const SizedBox(height: 16),
              GlassTextField(controller: userEditNameCtrl, labelText: "Username", hintText: "Username"),
              const SizedBox(height: 12),
              GlassTextField(controller: userEditFlatCtrl, labelText: "Unit / Flat", hintText: "Flat 101"),
              const SizedBox(height: 12),
              GlassTextField(controller: userEditPassCtrl, labelText: "New Password", hintText: "••••••••", isPassword: true),
              const SizedBox(height: 20),
              LiquidGlassButton(
                onPressed: () async {
                  final res = await ApiService.updateMember(
                    userId: member['id'],
                    username: userEditNameCtrl.text.trim(),
                    flatUnit: userEditFlatCtrl.text.trim(),
                    newPassword: userEditPassCtrl.text.trim().isNotEmpty ? userEditPassCtrl.text.trim() : null,
                  );
                  if (res['success'] == true) {
                    _fetchUsers();
                    if (mounted) {
                      Navigator.pop(ctx);
                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Member updated successfully!")));
                    }
                  }
                },
                label: "Save Updates",
              ),
            ],
          ),
        ),
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
    final isDark = ThemeController.isDarkMode.value;

    return Scaffold(
      backgroundColor: Colors.transparent,
      extendBodyBehindAppBar: true,
      extendBody: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        titleSpacing: 16,
        title: Row(
          children: [
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(10),
                color: const Color(0xFF06B6D4).withOpacity(0.18),
                border: Border.all(
                  color: const Color(0xFF06B6D4).withOpacity(0.35),
                ),
              ),
              child: const Icon(Icons.shield_outlined, color: Color(0xFF22D3EE), size: 18),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    _user != null ? "${_user!['organizationCode'] ?? 'Gatify'} Admin" : "Admin",
                    style: TextStyle(
                      color: isDark ? Colors.white : const Color(0xFF0F172A),
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  Text(
                    "Dashboard",
                    style: TextStyle(
                      color: isDark ? const Color(0xFF14B8A6) : const Color(0xFF0D9488),
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.qr_code_scanner, color: Colors.amberAccent, size: 22),
            tooltip: "Gatekeeper Scanner",
            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const GatekeeperScreen())),
          ),
          IconButton(
            icon: Icon(
              isDark ? Icons.light_mode : Icons.dark_mode_outlined,
              color: isDark ? Colors.amberAccent : const Color(0xFF4F46E5),
              size: 22,
            ),
            tooltip: "Toggle Light/Dark Theme",
            onPressed: () => ThemeController.toggleTheme(),
          ),
          PopupMenuButton<String>(
            icon: Icon(
              Icons.more_vert,
              color: isDark ? Colors.white : const Color(0xFF0F172A),
              size: 22,
            ),
            tooltip: "Admin Settings",
            color: isDark ? const Color(0xFF0F172A) : Colors.white,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
              side: BorderSide(color: isDark ? Colors.white12 : const Color(0xFFCBD5E1)),
            ),
            onSelected: (value) {
              if (value == "profile") _showAdminProfileModal();
              if (value == "password") _showChangeAdminPasswordModal();
              if (value == "logout") _logout();
            },
            itemBuilder: (context) => [
              PopupMenuItem(
                value: "profile",
                child: Row(
                  children: [
                    const Icon(Icons.person_outline, color: Color(0xFF06B6D4), size: 18),
                    const SizedBox(width: 10),
                    Text("Admin Profile", style: TextStyle(color: isDark ? Colors.white : const Color(0xFF0F172A), fontSize: 13, fontWeight: FontWeight.w600)),
                  ],
                ),
              ),
              PopupMenuItem(
                value: "password",
                child: Row(
                  children: [
                    const Icon(Icons.lock_outline, color: Color(0xFF06B6D4), size: 18),
                    const SizedBox(width: 10),
                    Text("Change Password", style: TextStyle(color: isDark ? Colors.white : const Color(0xFF0F172A), fontSize: 13, fontWeight: FontWeight.w600)),
                  ],
                ),
              ),
              const PopupMenuDivider(),
              const PopupMenuItem(
                value: "logout",
                child: Row(
                  children: [
                    Icon(Icons.logout, color: Colors.redAccent, size: 18),
                    SizedBox(width: 10),
                    Text("Sign Out", style: TextStyle(color: Colors.redAccent, fontSize: 13, fontWeight: FontWeight.bold)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(width: 4),
        ],
      ),
      bottomNavigationBar: FloatingGlassDock(
        currentIndex: _currentTabIndex,
        onTap: (index) {
          if (index == 2) {
            // Quick pass trigger
            Navigator.push(context, MaterialPageRoute(builder: (_) => const MemberScreen()));
          } else {
            setState(() => _currentTabIndex = index);
          }
        },
        items: const [
          DockItem(icon: Icons.dynamic_feed, label: "Feed"),
          DockItem(icon: Icons.domain, label: "Units"),
          DockItem(icon: Icons.add, label: "New Pass", isPrimary: true),
          DockItem(icon: Icons.people_alt_outlined, label: "Members"),
          DockItem(icon: Icons.analytics_outlined, label: "Reports"),
        ],
      ),
      body: AmbientCanvasBackground(
        child: SafeArea(
          bottom: false,
          child: IndexedStack(
            index: _currentTabIndex == 2 ? 0 : (_currentTabIndex > 2 ? _currentTabIndex - 1 : _currentTabIndex),
            children: [
              _buildLiveFeedView(),
              _buildDestinationsView(),
              _buildMembersView(),
              _buildReportsView(),
            ],
          ),
        ),
      ),
    );
  }

  // 1. SOCIAL MEDIA STYLE LIVE FEED VIEW
  Widget _buildLiveFeedView() {
    final filteredLogs = _logs.where((l) {
      if (_selectedFilterStory == 1) return l['entry_type'] == 'GUEST';
      if (_selectedFilterStory == 2) return l['entry_type'] == 'DELIVERY';
      if (_selectedFilterStory == 3) return l['status'] == 'INSIDE';
      return true;
    }).toList();

    final isDark = ThemeController.isDarkMode.value;

    return _isLoading
        ? const Center(child: CircularProgressIndicator(color: Color(0xFF06B6D4)))
        : RefreshIndicator(
            onRefresh: _fetchOverview,
            child: ListView(
              physics: const ClampingScrollPhysics(),
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 90),
              children: [
                // Top Instagram-Style Story Avatars
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  physics: const BouncingScrollPhysics(),
                  child: Row(
                    children: [
                      StoryStatusAvatar(
                        title: "All Activity",
                        count: "${_logs.length} Total",
                        icon: Icons.dynamic_feed,
                        ringColors: const [Color(0xFF06B6D4), Color(0xFF3B82F6)],
                        isSelected: _selectedFilterStory == 0,
                        onTap: () => setState(() => _selectedFilterStory = 0),
                      ),
                      StoryStatusAvatar(
                        title: "Guests Today",
                        count: "${_stats?['guestsToday'] ?? 0}",
                        icon: Icons.person_pin,
                        ringColors: const [Color(0xFF22D3EE), Color(0xFF0284C7)],
                        isSelected: _selectedFilterStory == 1,
                        onTap: () => setState(() => _selectedFilterStory = 1),
                      ),
                      StoryStatusAvatar(
                        title: "Deliveries",
                        count: "${_stats?['deliveriesToday'] ?? 0}",
                        icon: Icons.local_shipping,
                        ringColors: const [Color(0xFFF59E0B), Color(0xFFD97706)],
                        isSelected: _selectedFilterStory == 2,
                        onTap: () => setState(() => _selectedFilterStory = 2),
                      ),
                      StoryStatusAvatar(
                        title: "Inside Now",
                        count: "${_stats?['currentlyInside'] ?? 0}",
                        icon: Icons.verified_user,
                        ringColors: const [Color(0xFF10B981), Color(0xFF059669)],
                        isSelected: _selectedFilterStory == 3,
                        onTap: () => setState(() => _selectedFilterStory = 3),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 18),

                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text("Live Activity Stream", style: TextStyle(color: isDark ? Colors.white : const Color(0xFF0F172A), fontSize: 17, fontWeight: FontWeight.w900)),
                    Row(
                      children: [
                        GestureDetector(
                          onTap: _fetchOverview,
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                            decoration: BoxDecoration(
                              color: const Color(0xFF06B6D4).withValues(alpha: 0.18),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: const Color(0xFF06B6D4).withValues(alpha: 0.35)),
                            ),
                            child: const Row(
                              children: [
                                Icon(Icons.refresh, color: Color(0xFF22D3EE), size: 14),
                                SizedBox(width: 4),
                                Text("Refresh", style: TextStyle(color: Color(0xFF22D3EE), fontSize: 11, fontWeight: FontWeight.bold)),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
                          decoration: BoxDecoration(
                            color: const Color(0xFF10B981).withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: const Color(0xFF10B981).withValues(alpha: 0.3)),
                          ),
                          child: const Row(
                            children: [
                              Icon(Icons.circle, color: Color(0xFF10B981), size: 8),
                              SizedBox(width: 4),
                              Text("LIVE", style: TextStyle(color: Color(0xFF34D399), fontSize: 10, fontWeight: FontWeight.w900)),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 14),

                if (filteredLogs.isEmpty)
                  Padding(
                    padding: const EdgeInsets.all(32.0),
                    child: Center(
                      child: Column(
                        children: [
                          Icon(Icons.notifications_none, size: 48, color: Colors.white.withValues(alpha: 0.3)),
                          const SizedBox(height: 8),
                          const Text("No movements logged yet.", style: TextStyle(color: Color(0xFF94A3B8), fontSize: 13)),
                        ],
                      ),
                    ),
                  ),

                ...filteredLogs.map((log) {
                  final dests = log['destinations'] is List ? (log['destinations'] as List).join(', ') : log['destinations'].toString();
                  final timeStr = _formatRelativeLogTime(log['entry_time'] ?? log['created_at']);
                  return SocialActivityFeedCard(
                    personName: log['person_name'] ?? 'Visitor',
                    entryType: log['entry_type'] ?? 'GUEST',
                    destinations: dests,
                    status: log['status'] ?? 'INSIDE',
                    time: timeStr,
                    onAction: log['status'] == 'INSIDE'
                        ? () async {
                            try {
                              await ApiService.markExit(log['id'].toString());
                              _fetchOverview();
                            } catch (_) {}
                          }
                        : null,
                  );
                }),
              ],
            ),
          );
  }

  String _formatRelativeLogTime(dynamic isoStr) {
    if (isoStr == null) return 'Today';
    final s = isoStr.toString();
    final dt = DateTime.tryParse(s)?.toLocal();
    if (dt == null) return 'Today';
    final now = DateTime.now();
    final isToday = dt.year == now.year && dt.month == now.month && dt.day == now.day;
    final yesterday = now.subtract(const Duration(days: 1));
    final isYesterday = dt.year == yesterday.year && dt.month == yesterday.month && dt.day == yesterday.day;
    final hStr = dt.hour.toString().padLeft(2, '0');
    final mStr = dt.minute.toString().padLeft(2, '0');
    final timeStr = "$hStr:$mStr";

    if (isToday) return "Today, $timeStr";
    if (isYesterday) return "Yesterday, $timeStr";
    final months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return "${dt.day} ${months[dt.month - 1]}, $timeStr";
  }

  // 2. DESTINATIONS VIEW
  Widget _buildDestinationsView() {
    final isDark = ThemeController.isDarkMode.value;

    return ListView(
      physics: const ClampingScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 90),
      children: [
        FrostedGlassCard(
          borderRadius: 24,
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text("Add New Destination Unit", style: TextStyle(color: isDark ? Colors.white : const Color(0xFF0F172A), fontSize: 16, fontWeight: FontWeight.w900)),
              const SizedBox(height: 14),
              GlassTextField(
                controller: _destWingController,
                labelText: "Wing / Group",
                hintText: "e.g. Wing A",
                textCapitalization: TextCapitalization.characters,
              ),
              const SizedBox(height: 10),
              GlassTextField(
                controller: _destFlatController,
                labelText: "Unit / Flat # *",
                hintText: "e.g. 101",
              ),
              const SizedBox(height: 16),
              LiquidGlassButton(
                onPressed: _handleAddDestination,
                height: 48,
                label: "Add Destination",
                icon: Icons.add,
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),
        Text("Campus Units (${_destinations.length})", style: TextStyle(color: isDark ? Colors.white : const Color(0xFF0F172A), fontSize: 16, fontWeight: FontWeight.w900)),
        const SizedBox(height: 12),
        ..._destinations.map((d) {
          final fullName = d['full_name'] ?? '${d['group_label'] ?? ''} ${d['unit_number'] ?? ''}'.trim();
          return GlassPlankTile(
            leading: Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(12),
                color: const Color(0xFF06B6D4).withValues(alpha: 0.18),
              ),
              child: const Icon(Icons.apartment, color: Color(0xFF22D3EE), size: 18),
            ),
            title: Text(fullName, style: TextStyle(color: isDark ? Colors.white : const Color(0xFF0F172A), fontWeight: FontWeight.bold, fontSize: 14)),
            trailing: const GlassPillChip(label: "Unit", color: Color(0xFF06B6D4)),
          );
        }),
      ],
    );
  }

  // 3. MEMBERS & PASSWORDS VIEW
  Widget _buildMembersView() {
    final isDark = ThemeController.isDarkMode.value;
    final filteredMembers = _usersList.where((u) => u['role'] != 'ADMIN').toList();

    return ListView(
      physics: const ClampingScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 90),
      children: [
        FrostedGlassCard(
          borderRadius: 24,
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text("Add Security / Resident Member", style: TextStyle(color: isDark ? Colors.white : const Color(0xFF0F172A), fontSize: 16, fontWeight: FontWeight.w900)),
              const SizedBox(height: 14),
              // Role Selector Tabs
              Row(
                children: [
                  Expanded(
                    child: GestureDetector(
                      onTap: () => setState(() => _selectedRole = "MEMBER"),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        decoration: BoxDecoration(
                          color: _selectedRole == "MEMBER" ? const Color(0xFF06B6D4).withValues(alpha: 0.25) : Colors.transparent,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: _selectedRole == "MEMBER" ? const Color(0xFF06B6D4) : (isDark ? Colors.white12 : const Color(0xFFCBD5E1))),
                        ),
                        child: Text(
                          "Resident",
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: _selectedRole == "MEMBER" ? (isDark ? Colors.white : const Color(0xFF0284C7)) : const Color(0xFF94A3B8),
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: GestureDetector(
                      onTap: () => setState(() => _selectedRole = "GATEKEEPER"),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        decoration: BoxDecoration(
                          color: _selectedRole == "GATEKEEPER" ? const Color(0xFFF59E0B).withValues(alpha: 0.25) : Colors.transparent,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: _selectedRole == "GATEKEEPER" ? const Color(0xFFF59E0B) : (isDark ? Colors.white12 : const Color(0xFFCBD5E1))),
                        ),
                        child: Text(
                          "Gatekeeper",
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: _selectedRole == "GATEKEEPER" ? (isDark ? Colors.white : const Color(0xFFD97706)) : const Color(0xFF94A3B8),
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              GlassTextField(
                controller: _memNameController,
                labelText: "Full Name / Username *",
                hintText: "e.g. John Doe",
              ),
              const SizedBox(height: 10),
              GlassTextField(
                controller: _memFlatController,
                labelText: "Assigned Flat / Gate # *",
                hintText: "e.g. Flat 101 or Main Gate",
              ),
              const SizedBox(height: 10),
              GlassTextField(
                controller: _memPassController,
                labelText: "Password *",
                hintText: "••••••••",
                isPassword: true,
              ),
              const SizedBox(height: 16),
              LiquidGlassButton(
                onPressed: _handleCreateMember,
                height: 48,
                label: "Create Account",
                icon: Icons.person_add,
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),
        Text("Authorized Accounts (${filteredMembers.length})", style: TextStyle(color: isDark ? Colors.white : const Color(0xFF0F172A), fontSize: 16, fontWeight: FontWeight.w900)),
        const SizedBox(height: 12),
        ...filteredMembers.map((m) {
          return GlassPlankTile(
            leading: Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(12),
                color: (m['role'] == 'GATEKEEPER' ? const Color(0xFFF59E0B) : const Color(0xFF06B6D4)).withValues(alpha: 0.18),
              ),
              child: Icon(
                m['role'] == 'GATEKEEPER' ? Icons.shield : Icons.person,
                color: m['role'] == 'GATEKEEPER' ? const Color(0xFFFBBF24) : const Color(0xFF22D3EE),
                size: 18,
              ),
            ),
            title: Row(
              children: [
                Text(m['username'] ?? '', style: TextStyle(color: isDark ? Colors.white : const Color(0xFF0F172A), fontWeight: FontWeight.bold, fontSize: 14)),
                const SizedBox(width: 8),
                GlassPillChip(
                  label: m['role'] ?? 'MEMBER',
                  color: m['role'] == 'GATEKEEPER' ? const Color(0xFFF59E0B) : const Color(0xFF06B6D4),
                ),
              ],
            ),
            subtitle: Text("Unit: ${m['phone'] ?? 'Assigned'}", style: TextStyle(color: isDark ? const Color(0xFF22D3EE) : const Color(0xFF0284C7), fontSize: 12)),
            trailing: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                IconButton(
                  icon: const Icon(Icons.key, color: Color(0xFF06B6D4), size: 20),
                  tooltip: "Set New Password",
                  onPressed: () => _showEditMemberModal(m),
                ),
                IconButton(
                  icon: const Icon(Icons.delete_outline, color: Colors.redAccent, size: 20),
                  tooltip: "Remove Member",
                  onPressed: () async {
                    final res = await ApiService.deleteMember(m['id']);
                    if (res['success'] == true) _fetchUsers();
                  },
                ),
              ],
            ),
          );
        }),
      ],
    );
  }

  // 4. REPORTS VIEW (With Date & Type Filters & Filtered Excel/PDF Export)
  Widget _buildReportsView() {
    final isDark = ThemeController.isDarkMode.value;
    final fromDateDisplay = _reportFromDate != null
        ? "${_reportFromDate!.day.toString().padLeft(2, '0')}/${_reportFromDate!.month.toString().padLeft(2, '0')}/${_reportFromDate!.year}"
        : "Any Date";
    final toDateDisplay = _reportToDate != null
        ? "${_reportToDate!.day.toString().padLeft(2, '0')}/${_reportToDate!.month.toString().padLeft(2, '0')}/${_reportToDate!.year}"
        : "Any Date";

    return RefreshIndicator(
      onRefresh: _fetchReports,
      child: ListView(
        physics: const ClampingScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 90),
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text("Gate Entry & Exit Logs", style: TextStyle(color: isDark ? Colors.white : const Color(0xFF0F172A), fontSize: 17, fontWeight: FontWeight.w900)),
              GestureDetector(
                onTap: _fetchReports,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: const Color(0xFF06B6D4).withValues(alpha: 0.18),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFF06B6D4).withValues(alpha: 0.35)),
                  ),
                  child: const Row(
                    children: [
                      Icon(Icons.refresh, color: Color(0xFF22D3EE), size: 14),
                      SizedBox(width: 4),
                      Text("Refresh", style: TextStyle(color: Color(0xFF22D3EE), fontSize: 11, fontWeight: FontWeight.bold)),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // FILTER CARD (Like Web App)
          FrostedGlassCard(
            borderRadius: 22,
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.filter_list, color: Color(0xFF06B6D4), size: 16),
                        const SizedBox(width: 6),
                        Text(
                          "Filter Logs By Date & Type",
                          style: TextStyle(color: isDark ? Colors.white : const Color(0xFF0F172A), fontSize: 13, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                    if (_reportFromDate != null || _reportToDate != null || _reportEntryType != "ALL")
                      GestureDetector(
                        onTap: () {
                          setState(() {
                            _reportFromDate = null;
                            _reportToDate = null;
                            _reportEntryType = "ALL";
                          });
                          _fetchReports();
                        },
                        child: const Text(
                          "Clear Filters",
                          style: TextStyle(color: Colors.redAccent, fontSize: 11, fontWeight: FontWeight.bold),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 12),

                // Date Selectors
                Row(
                  children: [
                    // From Date
                    Expanded(
                      child: GestureDetector(
                        onTap: () => _selectReportDate(isFromDate: true),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                          decoration: BoxDecoration(
                            color: isDark ? const Color(0xFF0F172A) : const Color(0xFFFFFFFF),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: _reportFromDate != null ? const Color(0xFF06B6D4) : (isDark ? Colors.white12 : const Color(0xFFCBD5E1)),
                            ),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text("From Date", style: TextStyle(color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B), fontSize: 10)),
                              const SizedBox(height: 2),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    fromDateDisplay,
                                    style: TextStyle(
                                      color: _reportFromDate != null ? (isDark ? Colors.white : const Color(0xFF0F172A)) : (isDark ? const Color(0xFF64748B) : const Color(0xFF94A3B8)),
                                      fontSize: 12,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  const Icon(Icons.calendar_today, size: 13, color: Color(0xFF06B6D4)),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    // To Date
                    Expanded(
                      child: GestureDetector(
                        onTap: () => _selectReportDate(isFromDate: false),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                          decoration: BoxDecoration(
                            color: isDark ? const Color(0xFF0F172A) : const Color(0xFFFFFFFF),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: _reportToDate != null ? const Color(0xFF06B6D4) : (isDark ? Colors.white12 : const Color(0xFFCBD5E1)),
                            ),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text("To Date", style: TextStyle(color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B), fontSize: 10)),
                              const SizedBox(height: 2),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    toDateDisplay,
                                    style: TextStyle(
                                      color: _reportToDate != null ? (isDark ? Colors.white : const Color(0xFF0F172A)) : (isDark ? const Color(0xFF64748B) : const Color(0xFF94A3B8)),
                                      fontSize: 12,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  const Icon(Icons.calendar_today, size: 13, color: Color(0xFF06B6D4)),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),

                // Entry Type Selector Pills
                Row(
                  children: [
                    Expanded(
                      child: GestureDetector(
                        onTap: () => setState(() => _reportEntryType = "ALL"),
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 6),
                          decoration: BoxDecoration(
                            color: _reportEntryType == "ALL" ? (isDark ? const Color(0xFF06B6D4).withValues(alpha: 0.25) : const Color(0xFFE0F2FE)) : (isDark ? Colors.transparent : const Color(0xFFF1F5F9)),
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: _reportEntryType == "ALL" ? const Color(0xFF06B6D4) : (isDark ? Colors.white12 : const Color(0xFFCBD5E1))),
                          ),
                          child: Text(
                            "All Types",
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              color: _reportEntryType == "ALL" ? (isDark ? const Color(0xFF22D3EE) : const Color(0xFF0369A1)) : (isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B)),
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 6),
                    Expanded(
                      child: GestureDetector(
                        onTap: () => setState(() => _reportEntryType = "GUEST"),
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 6),
                          decoration: BoxDecoration(
                            color: _reportEntryType == "GUEST" ? (isDark ? const Color(0xFF06B6D4).withValues(alpha: 0.25) : const Color(0xFFE0F2FE)) : (isDark ? Colors.transparent : const Color(0xFFF1F5F9)),
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: _reportEntryType == "GUEST" ? const Color(0xFF06B6D4) : (isDark ? Colors.white12 : const Color(0xFFCBD5E1))),
                          ),
                          child: Text(
                            "Guests",
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              color: _reportEntryType == "GUEST" ? (isDark ? const Color(0xFF22D3EE) : const Color(0xFF0369A1)) : (isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B)),
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 6),
                    Expanded(
                      child: GestureDetector(
                        onTap: () => setState(() => _reportEntryType = "DELIVERY"),
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 6),
                          decoration: BoxDecoration(
                            color: _reportEntryType == "DELIVERY" ? (isDark ? const Color(0xFFF59E0B).withValues(alpha: 0.25) : const Color(0xFFFEF3C7)) : (isDark ? Colors.transparent : const Color(0xFFF1F5F9)),
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: _reportEntryType == "DELIVERY" ? const Color(0xFFF59E0B) : (isDark ? Colors.white12 : const Color(0xFFCBD5E1))),
                          ),
                          child: Text(
                            "Deliveries",
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              color: _reportEntryType == "DELIVERY" ? (isDark ? const Color(0xFFFBBF24) : const Color(0xFFB45309)) : (isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B)),
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                LiquidGlassButton(
                  onPressed: _fetchReports,
                  isLoading: _isLoadingReports,
                  height: 42,
                  label: "Apply Filters",
                  icon: Icons.check,
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),

          // Export Actions Bar (Excel & PDF)
          Row(
            children: [
              Expanded(
                child: GestureDetector(
                  onTap: _exportExcel,
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 11, horizontal: 12),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(16),
                      gradient: const LinearGradient(
                        colors: [Color(0xFF10B981), Color(0xFF059669)],
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFF10B981).withValues(alpha: 0.35),
                          blurRadius: 12,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.table_chart_outlined, color: Colors.white, size: 16),
                        SizedBox(width: 6),
                        Text("Export Excel", style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w900)),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: GestureDetector(
                  onTap: _exportPdf,
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 11, horizontal: 12),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(16),
                      gradient: const LinearGradient(
                        colors: [Color(0xFFEF4444), Color(0xFFDC2626)],
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFFEF4444).withValues(alpha: 0.35),
                          blurRadius: 12,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.picture_as_pdf_outlined, color: Colors.white, size: 16),
                        SizedBox(width: 6),
                        Text("Export PDF", style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w900)),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // Matching Log Count Banner
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            decoration: BoxDecoration(
              color: const Color(0xFF06B6D4).withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFF06B6D4).withValues(alpha: 0.25)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  "Found ${_reports.length} matching entries",
                  style: const TextStyle(color: Color(0xFF22D3EE), fontSize: 12, fontWeight: FontWeight.bold),
                ),
                const Icon(Icons.analytics_outlined, color: Color(0xFF22D3EE), size: 16),
              ],
            ),
          ),
          const SizedBox(height: 12),

          if (_reports.isEmpty)
            const Padding(
              padding: EdgeInsets.all(24.0),
              child: Text("No records match the selected filters.", textAlign: TextAlign.center, style: TextStyle(color: Color(0xFF94A3B8))),
            ),
          ..._reports.map((r) {
            final dests = r['destinations'] is List ? (r['destinations'] as List).join(', ') : (r['destinations'] ?? '').toString();
            final timeStr = _formatRelativeLogTime(r['entry_time'] ?? r['created_at']);
            return GlassPlankTile(
              leading: Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                  color: (r['entry_type'] == 'DELIVERY' ? const Color(0xFFF59E0B) : const Color(0xFF06B6D4)).withValues(alpha: 0.18),
                ),
                child: Icon(
                  r['entry_type'] == 'DELIVERY' ? Icons.local_shipping : Icons.person,
                  color: r['entry_type'] == 'DELIVERY' ? const Color(0xFFFBBF24) : const Color(0xFF22D3EE),
                  size: 18,
                ),
              ),
              title: Text(
                r['person_name'] ?? '',
                style: TextStyle(
                  color: isDark ? Colors.white : const Color(0xFF0F172A),
                  fontWeight: FontWeight.w900,
                  fontSize: 14,
                ),
              ),
              subtitle: Text(
                "Type: ${r['entry_type']} • $dests • $timeStr",
                style: TextStyle(
                  color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF475569),
                  fontSize: 11,
                  fontWeight: FontWeight.w500,
                ),
              ),
              trailing: GlassPillChip(
                label: r['status'] ?? '',
                color: r['status'] == 'INSIDE' ? const Color(0xFF10B981) : (isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B)),
              ),
            );
          }),
        ],
      ),
    );
  }
}
