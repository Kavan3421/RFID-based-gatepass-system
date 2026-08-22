import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import '../../core/api_service.dart';
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
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final res = await ApiService.login(
        organizationCode: _orgController.text.trim().toUpperCase(),
        username: _userController.text.trim(),
        password: _passController.text.trim(),
      );

      if (res['success'] == true) {
        final prefs = await SharedPreferences.getInstance();
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
      } else {
        setState(() {
          _errorMessage = res['message'] ?? 'Login failed. Please check credentials.';
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Connection error. Please check network or server status.';
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext meContext) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Icon(Icons.qr_code_scanner, size: 64, color: Color(0xFF06B6D4)),
                const SizedBox(height: 12),
                const Text(
                  "QR GATE PASS",
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.bold),
                ),
                const Text(
                  "Digital Gate & Visitor Management",
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
                ),
                const SizedBox(height: 32),

                if (_errorMessage != null) ...[
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.red.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.red.withValues(alpha: 0.3)),
                    ),
                    child: Text(_errorMessage!, style: const TextStyle(color: Colors.redAccent, fontSize: 12)),
                  ),
                  const SizedBox(height: 16),
                ],

                // Organization ID Input
                TextField(
                  controller: _orgController,
                  textCapitalization: TextCapitalization.characters,
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                  decoration: InputDecoration(
                    labelText: "Organization ID (e.g. GVS1024)",
                    labelStyle: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
                    prefixIcon: const Icon(Icons.business, color: Color(0xFF06B6D4)),
                    filled: true,
                    fillColor: const Color(0xFF1E293B),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                ),
                const SizedBox(height: 16),

                // Username Input
                TextField(
                  controller: _userController,
                  style: const TextStyle(color: Colors.white),
                  decoration: InputDecoration(
                    labelText: "Username",
                    labelStyle: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
                    prefixIcon: const Icon(Icons.person, color: Color(0xFF06B6D4)),
                    filled: true,
                    fillColor: const Color(0xFF1E293B),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                ),
                const SizedBox(height: 16),

                // Password Input
                TextField(
                  controller: _passController,
                  obscureText: true,
                  style: const TextStyle(color: Colors.white),
                  decoration: InputDecoration(
                    labelText: "Password",
                    labelStyle: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
                    prefixIcon: const Icon(Icons.lock, color: Color(0xFF06B6D4)),
                    filled: true,
                    fillColor: const Color(0xFF1E293B),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                ),
                
                // Forgot Admin Password Button
                Align(
                  alignment: Alignment.centerRight,
                  child: TextButton(
                    onPressed: () {
                      Navigator.push(context, MaterialPageRoute(builder: (_) => const ResetPasswordScreen()));
                    },
                    child: const Text("Forgot Admin Password?", style: TextStyle(color: Color(0xFF06B6D4), fontSize: 12, fontWeight: FontWeight.bold)),
                  ),
                ),
                const SizedBox(height: 16),

                ElevatedButton(
                  onPressed: _isLoading ? null : _handleLogin,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF0891B2),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                  child: _isLoading
                      ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                      : const Text("Sign In to Gate Pass", style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
