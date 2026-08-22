import 'package:flutter/material.dart';
import '../../core/api_service.dart';

class ResetPasswordScreen extends StatefulWidget {
  const ResetPasswordScreen({Key? key}) : super(key: key);

  @override
  State<ResetPasswordScreen> createState() => _ResetPasswordScreenState();
}

class _ResetPasswordScreenState extends State<ResetPasswordScreen> {
  int _step = 1; // 1: Request OTP, 2: Confirm OTP & Set New Password
  final _orgController = TextEditingController();
  final _emailController = TextEditingController();
  final _otpController = TextEditingController();
  final _newPassController = TextEditingController();

  bool _isLoading = false;
  String? _message;
  bool _isSuccess = false;

  Future<void> _handleRequestOtp() async {
    final org = _orgController.text.trim();
    final email = _emailController.text.trim();
    if (org.isEmpty || email.isEmpty) {
      setState(() {
        _isSuccess = false;
        _message = "Organization ID and Admin Email/Username are required.";
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _message = null;
    });

    try {
      final res = await ApiService.requestPasswordReset(
        organizationCode: org.toUpperCase(),
        usernameOrEmail: email,
      );

      if (res['success'] == true) {
        setState(() {
          _isSuccess = true;
          _message = res['message'] ?? "OTP sent! Check your inbox.";
          _step = 2;
        });
      } else {
        setState(() {
          _isSuccess = false;
          _message = res['message'] ?? "Failed to request OTP.";
        });
      }
    } catch (e) {
      setState(() {
        _isSuccess = false;
        _message = "Connection error. Please check server connection.";
      });
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _handleConfirmReset() async {
    final otp = _otpController.text.trim();
    final newPass = _newPassController.text.trim();
    if (otp.isEmpty || newPass.isEmpty) {
      setState(() {
        _isSuccess = false;
        _message = "OTP token and New Password are required.";
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _message = null;
    });

    try {
      final res = await ApiService.confirmPasswordReset(
        organizationCode: _orgController.text.trim().toUpperCase(),
        email: _emailController.text.trim(),
        resetToken: otp,
        newPassword: newPass,
      );

      if (res['success'] == true) {
        setState(() {
          _isSuccess = true;
          _message = res['message'] ?? "Password reset successfully! You can now log in.";
        });
        Future.delayed(const Duration(seconds: 2), () {
          if (mounted) Navigator.pop(context);
        });
      } else {
        setState(() {
          _isSuccess = false;
          _message = res['message'] ?? "Failed to reset password.";
        });
      }
    } catch (e) {
      setState(() {
        _isSuccess = false;
        _message = "Error resetting password.";
      });
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E293B),
        title: const Text("Reset Admin Password", style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
      ),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Icon(Icons.mark_email_read, size: 54, color: Color(0xFF06B6D4)),
                const SizedBox(height: 12),
                const Text(
                  "SMTP Email OTP Reset",
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                const Text(
                  "Enter your registered admin details to receive a 6-digit security OTP code via email.",
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
                ),
                const SizedBox(height: 24),

                if (_message != null) ...[
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: _isSuccess ? Colors.green.withValues(alpha: 0.15) : Colors.red.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: _isSuccess ? Colors.green : Colors.red),
                    ),
                    child: Text(_message!, style: TextStyle(color: _isSuccess ? Colors.greenAccent : Colors.redAccent, fontSize: 12)),
                  ),
                  const SizedBox(height: 16),
                ],

                if (_step == 1) ...[
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

                  TextField(
                    controller: _emailController,
                    keyboardType: TextInputType.emailAddress,
                    style: const TextStyle(color: Colors.white),
                    decoration: InputDecoration(
                      labelText: "Admin Username or Registered Email",
                      labelStyle: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
                      prefixIcon: const Icon(Icons.email, color: Color(0xFF06B6D4)),
                      filled: true,
                      fillColor: const Color(0xFF1E293B),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                    ),
                  ),
                  const SizedBox(height: 24),

                  ElevatedButton(
                    onPressed: _isLoading ? null : _handleRequestOtp,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF0891B2),
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    ),
                    child: _isLoading
                        ? const CircularProgressIndicator(color: Colors.white)
                        : const Text("Send 6-Digit OTP Email", style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold)),
                  ),
                ] else ...[
                  TextField(
                    controller: _otpController,
                    keyboardType: TextInputType.number,
                    style: const TextStyle(color: Colors.cyanAccent, fontSize: 20, fontWeight: FontWeight.bold, letterSpacing: 4),
                    decoration: InputDecoration(
                      labelText: "Enter 6-Digit Security OTP Code",
                      labelStyle: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
                      prefixIcon: const Icon(Icons.security, color: Color(0xFF06B6D4)),
                      filled: true,
                      fillColor: const Color(0xFF1E293B),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                    ),
                  ),
                  const SizedBox(height: 16),

                  TextField(
                    controller: _newPassController,
                    obscureText: true,
                    style: const TextStyle(color: Colors.white),
                    decoration: InputDecoration(
                      labelText: "New Secret Password",
                      labelStyle: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
                      prefixIcon: const Icon(Icons.lock, color: Color(0xFF06B6D4)),
                      filled: true,
                      fillColor: const Color(0xFF1E293B),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                    ),
                  ),
                  const SizedBox(height: 24),

                  ElevatedButton(
                    onPressed: _isLoading ? null : _handleConfirmReset,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF0891B2),
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    ),
                    child: _isLoading
                        ? const CircularProgressIndicator(color: Colors.white)
                        : const Text("Confirm & Update Password", style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold)),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}
