import 'package:flutter/material.dart';
import '../../core/api_service.dart';
import '../../core/glass_widgets.dart';

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
    final org = _orgController.text.trim().toUpperCase();
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
        organizationCode: org,
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
        _message = "Connection error. Please verify network or server status.";
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
          _message = res['message'] ?? "Password reset successfully! You can now sign in.";
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
      backgroundColor: Colors.transparent,
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, size: 18, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          "Admin Password Reset",
          style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w700),
        ),
      ),
      body: AmbientCanvasBackground(
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              physics: const ClampingScrollPhysics(),
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
              child: FrostedGlassCard(
                borderRadius: 28,
                padding: const EdgeInsets.all(24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Center(
                      child: Container(
                        width: 58,
                        height: 58,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(18),
                          color: const Color(0xFF06B6D4).withOpacity(0.18),
                          border: Border.all(color: const Color(0xFF06B6D4).withOpacity(0.4)),
                        ),
                        child: const Icon(Icons.mark_email_read, size: 30, color: Color(0xFF22D3EE)),
                      ),
                    ),
                    const SizedBox(height: 14),
                    const Text(
                      "Gatify Security OTP",
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w900),
                    ),
                    const SizedBox(height: 6),
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
                          color: _isSuccess ? Colors.green.withOpacity(0.15) : Colors.red.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: _isSuccess ? Colors.greenAccent : Colors.redAccent),
                        ),
                        child: Text(
                          _message!,
                          style: TextStyle(
                            color: _isSuccess ? Colors.greenAccent : Colors.redAccent,
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                    ],

                    if (_step == 1) ...[
                      GlassTextField(
                        controller: _orgController,
                        labelText: "Organization ID",
                        hintText: "e.g. GVS1024",
                        textCapitalization: TextCapitalization.characters,
                        prefixIcon: const Icon(Icons.business, color: Color(0xFF06B6D4), size: 20),
                      ),
                      const SizedBox(height: 14),

                      GlassTextField(
                        controller: _emailController,
                        labelText: "Admin Username or Registered Email",
                        hintText: "admin@organization.com",
                        keyboardType: TextInputType.emailAddress,
                        prefixIcon: const Icon(Icons.email_outlined, color: Color(0xFF06B6D4), size: 20),
                      ),
                      const SizedBox(height: 24),

                      LiquidGlassButton(
                        onPressed: _handleRequestOtp,
                        isLoading: _isLoading,
                        label: "Send 6-Digit OTP Email",
                        icon: Icons.send,
                      ),
                    ] else ...[
                      GlassTextField(
                        controller: _otpController,
                        labelText: "6-Digit Security Reset Code (OTP)",
                        hintText: "Enter 6-digit OTP",
                        keyboardType: TextInputType.number,
                        prefixIcon: const Icon(Icons.security, color: Color(0xFF06B6D4), size: 20),
                      ),
                      const SizedBox(height: 14),

                      GlassTextField(
                        controller: _newPassController,
                        labelText: "New Secret Password",
                        hintText: "••••••••",
                        isPassword: true,
                        prefixIcon: const Icon(Icons.lock_outline, color: Color(0xFF06B6D4), size: 20),
                      ),
                      const SizedBox(height: 24),

                      LiquidGlassButton(
                        onPressed: _handleConfirmReset,
                        isLoading: _isLoading,
                        label: "Confirm & Update Password",
                        icon: Icons.check,
                      ),
                    ],
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
