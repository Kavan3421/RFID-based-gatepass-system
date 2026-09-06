import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import 'core/theme_controller.dart';
import 'features/auth/login_screen.dart';
import 'features/admin/admin_screen.dart';
import 'features/gatekeeper/gatekeeper_screen.dart';
import 'features/member/member_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  try {
    await ThemeController.init().timeout(const Duration(seconds: 2));
  } catch (_) {}
  runApp(const GatifyApp());
}

class GatifyApp extends StatefulWidget {
  const GatifyApp({super.key});

  @override
  State<GatifyApp> createState() => _GatifyAppState();
}

class _GatifyAppState extends State<GatifyApp> {
  Widget _home = const LoginScreen();

  @override
  void initState() {
    super.initState();
    _restoreSession();
  }

  Future<void> _restoreSession() async {
    try {
      final prefs = await SharedPreferences.getInstance().timeout(const Duration(seconds: 2));
      final token = prefs.getString('gatify_token') ?? prefs.getString('qrgp_token');
      final userStr = prefs.getString('gatify_user') ?? prefs.getString('qrgp_user');

      if (token == null || userStr == null) return;

      final user = jsonDecode(userStr);
      final role = user['role'];
      Widget next = const LoginScreen();
      if (role == 'ADMIN') next = const AdminScreen();
      if (role == 'GATEKEEPER') next = const GatekeeperScreen();
      if (role == 'MEMBER') next = const MemberScreen();

      if (mounted) setState(() => _home = next);
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<bool>(
      valueListenable: ThemeController.isDarkMode,
      builder: (context, isDark, _) {
        return MaterialApp(
          title: 'Gatify',
          debugShowCheckedModeBanner: false,
          themeMode: isDark ? ThemeMode.dark : ThemeMode.light,
          theme: ThemeData(
            brightness: Brightness.light,
            scaffoldBackgroundColor: const Color(0xFFF3F5F8),
            primaryColor: const Color(0xFF14B8A6),
            colorScheme: const ColorScheme.light(
              primary: Color(0xFF14B8A6),
              secondary: Color(0xFF0EA5E9),
              surface: Color(0xFFFFFFFF),
              onPrimary: Colors.white,
              onSecondary: Colors.white,
              onSurface: Color(0xFF0F172A),
            ),
            appBarTheme: const AppBarTheme(
              backgroundColor: Colors.transparent,
              elevation: 0,
              titleTextStyle: TextStyle(color: Color(0xFF0F172A), fontSize: 16, fontWeight: FontWeight.w700),
              iconTheme: IconThemeData(color: Color(0xFF0F172A)),
            ),
            useMaterial3: true,
          ),
          darkTheme: ThemeData(
            brightness: Brightness.dark,
            scaffoldBackgroundColor: const Color(0xFF0A1018),
            primaryColor: const Color(0xFF14B8A6),
            colorScheme: const ColorScheme.dark(
              primary: Color(0xFF14B8A6),
              secondary: Color(0xFF0EA5E9),
              surface: Color(0xFF0F172A),
              onPrimary: Colors.white,
              onSecondary: Colors.white,
              onSurface: Colors.white,
            ),
            appBarTheme: const AppBarTheme(
              backgroundColor: Colors.transparent,
              elevation: 0,
              titleTextStyle: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w700),
              iconTheme: IconThemeData(color: Colors.white),
            ),
            useMaterial3: true,
          ),
          home: _home,
        );
      },
    );
  }
}
