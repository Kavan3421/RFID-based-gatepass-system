import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import '../../core/api_service.dart';
import '../../core/glass_widgets.dart';
import '../../core/theme_controller.dart';
import '../admin/admin_screen.dart';
import '../gatekeeper/gatekeeper_screen.dart';
import '../member/member_screen.dart';
import 'reset_password_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _orgController = TextEditingController();
  final _userController = TextEditingController();
  final _passController = TextEditingController();
  bool _isLoading = false;
  String? _errorMessage;

  Future<void> _handleLogin() async {
    final org = _orgController.text.trim().toUpperCase();
    final username = _userController.text.trim();
    final password = _passController.text.trim();

    if (org.isEmpty || username.isEmpty || password.isEmpty) {
      setState(() {
        _errorMessage = "Please enter Organization ID, Username, and Password.";
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final res = await ApiService.login(
        organizationCode: org,
        username: username,
        password: password,
      );

      if (res['success'] == true) {
        await _persistSession(res);
        return;
      }

      setState(() {
        _errorMessage = res['message'] ?? 'Login failed. Please check credentials.';
      });
    } catch (e) {
      final activeUrl = await ApiService.getBaseUrl();
      setState(() {
        _errorMessage =
            'Cannot reach the server at "$activeUrl". Keep Next.js running on port 3000. On a phone, tap the network icon and set your PC Wi-Fi IP.';
      });
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _persistSession(Map<String, dynamic> res) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('gatify_token', res['token']);
    await prefs.setString('gatify_user', jsonEncode(res['user']));
    await prefs.setString('qrgp_token', res['token']);
    await prefs.setString('qrgp_user', jsonEncode(res['user']));

    final role = res['user']['role'];
    if (!mounted) return;

    if (role == 'ADMIN') {
      Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const AdminScreen()));
    } else if (role == 'GATEKEEPER') {
      Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const GatekeeperScreen()));
    } else {
      Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const MemberScreen()));
    }
  }

  void _showServerSettingsModal() async {
    final currentUrl = await ApiService.getBaseUrl();
    final urlController = TextEditingController(text: currentUrl);
    bool isTesting = false;
    String? testStatus;
    bool testPassed = false;

    if (!mounted) return;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) => Dialog(
          backgroundColor: Colors.transparent,
          child: FrostedGlassCard(
            borderRadius: 24,
            padding: const EdgeInsets.all(22),
            child: SingleChildScrollView(
              physics: const ClampingScrollPhysics(),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 36,
                        height: 36,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(10),
                          color: const Color(0xFF06B6D4).withOpacity(0.2),
                        ),
                        child: const Icon(Icons.dns, color: Color(0xFF22D3EE), size: 20),
                      ),
                      const SizedBox(width: 10),
                      const Text(
                        "Gatify Server Connection",
                        style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    "Select or enter your Next.js server endpoint:",
                    style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
                  ),
                  const SizedBox(height: 14),

                  GlassTextField(
                    controller: urlController,
                    labelText: "Server API Base URL",
                    hintText: "http://10.184.161.227:3000/api",
                    prefixIcon: const Icon(Icons.link, color: Color(0xFF06B6D4), size: 18),
                  ),
                  const SizedBox(height: 10),

                  // Quick presets
                  const Text("Quick Presets:", style: TextStyle(color: Color(0xFF94A3B8), fontSize: 11, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 6),
                  Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    children: [
                      ActionChip(
                        label: const Text("This PC Wi-Fi (10.184.161.227)", style: TextStyle(fontSize: 11, color: Colors.white)),
                        backgroundColor: const Color(0xFF1E293B),
                        onPressed: () => setModalState(() => urlController.text = ApiService.lanWifiUrl),
                      ),
                      ActionChip(
                        label: const Text("Ethernet (172.21.127.119)", style: TextStyle(fontSize: 11, color: Colors.white)),
                        backgroundColor: const Color(0xFF1E293B),
                        onPressed: () => setModalState(() => urlController.text = ApiService.lanEthernetUrl),
                      ),
                      ActionChip(
                        label: const Text("Emulator (10.0.2.2)", style: TextStyle(fontSize: 11, color: Colors.white)),
                        backgroundColor: const Color(0xFF1E293B),
                        onPressed: () => setModalState(() => urlController.text = ApiService.emulatorUrl),
                      ),
                      ActionChip(
                        label: const Text("Localhost (127.0.0.1)", style: TextStyle(fontSize: 11, color: Colors.white)),
                        backgroundColor: const Color(0xFF1E293B),
                        onPressed: () => setModalState(() => urlController.text = ApiService.localhostUrl),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),

                  if (testStatus != null) ...[
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: testPassed ? Colors.green.withOpacity(0.15) : Colors.red.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: testPassed ? Colors.greenAccent : Colors.redAccent),
                      ),
                      child: Row(
                        children: [
                          Icon(testPassed ? Icons.check_circle : Icons.error, color: testPassed ? Colors.greenAccent : Colors.redAccent, size: 16),
                          const SizedBox(width: 6),
                          Expanded(
                            child: Text(
                              testStatus!,
                              style: TextStyle(color: testPassed ? Colors.greenAccent : Colors.redAccent, fontSize: 12, fontWeight: FontWeight.bold),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 14),
                  ],

                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          style: OutlinedButton.styleFrom(
                            side: const BorderSide(color: Color(0xFF06B6D4)),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                          ),
                          onPressed: isTesting
                              ? null
                              : () async {
                                  setModalState(() {
                                    isTesting = true;
                                    testStatus = null;
                                  });
                                  final ok = await ApiService.testConnection(urlController.text.trim());
                                  setModalState(() {
                                    isTesting = false;
                                    testPassed = ok;
                                    testStatus = ok ? "Connection Successful!" : "Cannot reach server at this URL.";
                                  });
                                },
                          child: isTesting
                              ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF06B6D4)))
                              : const Text("Test Connection", style: TextStyle(color: Color(0xFF22D3EE), fontSize: 12, fontWeight: FontWeight.bold)),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF06B6D4),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                          ),
                          onPressed: () async {
                            await ApiService.setBaseUrl(urlController.text.trim());
                            if (mounted) {
                              setState(() {
                                _errorMessage = null;
                              });
                            }
                            if (ctx.mounted) Navigator.pop(ctx);
                          },
                          child: const Text("Save URL", style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = ThemeController.isDarkMode.value;

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: AmbientCanvasBackground(
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              physics: const ClampingScrollPhysics(),
              padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 20.0),
              child: FrostedGlassCard(
                borderRadius: 28,
                padding: const EdgeInsets.all(26),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Brand Icon & Server Config Button
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        IconButton(
                          icon: Icon(
                            isDark ? Icons.light_mode : Icons.dark_mode_outlined,
                            color: isDark ? Colors.amberAccent : const Color(0xFF0F172A),
                            size: 22,
                          ),
                          tooltip: "Toggle theme",
                          onPressed: () => ThemeController.toggleTheme(),
                        ),
                        Container(
                          width: 56,
                          height: 56,
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(16),
                            color: const Color(0xFF14B8A6).withOpacity(0.16),
                          ),
                          child: const Icon(Icons.qr_code_2, size: 30, color: Color(0xFF2DD4BF)),
                        ),
                        IconButton(
                          icon: Icon(
                            Icons.dns_outlined,
                            color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                            size: 22,
                          ),
                          tooltip: "Server URL",
                          onPressed: _showServerSettingsModal,
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    Text(
                      "Gatify",
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: isDark ? Colors.white : const Color(0xFF0F172A),
                        fontSize: 28,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      "Gate pass & visitor access",
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(height: 28),

                    if (_errorMessage != null) ...[
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.red.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: Colors.redAccent.withOpacity(0.40)),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Icon(Icons.error_outline, size: 18, color: Colors.redAccent),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    _errorMessage!,
                                    style: const TextStyle(color: Colors.redAccent, fontSize: 12, fontWeight: FontWeight.bold),
                                  ),
                                ),
                              ],
                            ),
                            if (_errorMessage!.toLowerCase().contains('cannot reach') ||
                                _errorMessage!.toLowerCase().contains('connection')) ...[
                              const SizedBox(height: 10),
                              TextButton(
                                onPressed: _showServerSettingsModal,
                                child: const Text(
                                  "Set server URL",
                                  style: TextStyle(color: Color(0xFF14B8A6), fontWeight: FontWeight.w800),
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                      const SizedBox(height: 18),
                    ],

                    // Organization ID Input
                    GlassTextField(
                      controller: _orgController,
                      labelText: "Organization ID",
                      hintText: "e.g. GVS1024",
                      textCapitalization: TextCapitalization.characters,
                      prefixIcon: const Icon(Icons.business, color: Color(0xFF06B6D4), size: 20),
                    ),
                    const SizedBox(height: 14),

                    // Username Input
                    GlassTextField(
                      controller: _userController,
                      labelText: "Username",
                      hintText: "Your username",
                      prefixIcon: const Icon(Icons.person_outline, color: Color(0xFF06B6D4), size: 20),
                    ),
                    const SizedBox(height: 14),

                    // Password Input with eye toggle
                    GlassTextField(
                      controller: _passController,
                      labelText: "Password",
                      hintText: "••••••••",
                      isPassword: true,
                      prefixIcon: const Icon(Icons.lock_outline, color: Color(0xFF06B6D4), size: 20),
                    ),

                    // Forgot Admin Password Button
                    Align(
                      alignment: Alignment.centerRight,
                      child: TextButton(
                        onPressed: () {
                          Navigator.push(context, MaterialPageRoute(builder: (_) => const ResetPasswordScreen()));
                        },
                        child: const Text(
                          "Forgot Admin Password?",
                          style: TextStyle(
                            color: Color(0xFF22D3EE),
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),

                    // Sign In Button
                    LiquidGlassButton(
                      onPressed: _handleLogin,
                      isLoading: _isLoading,
                      label: "Sign in",
                      icon: Icons.arrow_forward,
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
