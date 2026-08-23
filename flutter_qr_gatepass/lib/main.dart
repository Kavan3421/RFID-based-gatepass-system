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
  await ThemeController.init();
  runApp(const GatifyApp());
}

class GatifyApp extends StatelessWidget {
  const GatifyApp({super.key});

  Future<Widget> _getInitialScreen() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('gatify_token') ?? prefs.getString('qrgp_token');
    final userStr = prefs.getString('gatify_user') ?? prefs.getString('qrgp_user');

    if (token != null && userStr != null) {
      try {
        final user = jsonDecode(userStr);
        final role = user['role'];
        if (role == 'ADMIN') return const AdminScreen();
        if (role == 'GATEKEEPER') return const GatekeeperScreen();
        if (role == 'MEMBER') return const MemberScreen();
      } catch (_) {}
    }
    return const LoginScreen();
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
            scaffoldBackgroundColor: const Color(0xFFF1F5F9),
            primaryColor: const Color(0xFF06B6D4),
            colorScheme: const ColorScheme.light(
              primary: Color(0xFF06B6D4),
              secondary: Color(0xFF2563EB),
              surface: Color(0xFFFFFFFF),
              onPrimary: Colors.white,
              onSecondary: Colors.white,
              onSurface: Color(0xFF0F172A),
            ),
            textTheme: const TextTheme(
              displayLarge: TextStyle(color: Color(0xFF0F172A), fontWeight: FontWeight.bold),
              displayMedium: TextStyle(color: Color(0xFF0F172A), fontWeight: FontWeight.bold),
              headlineMedium: TextStyle(color: Color(0xFF0F172A), fontWeight: FontWeight.bold),
              titleLarge: TextStyle(color: Color(0xFF0F172A), fontWeight: FontWeight.bold),
              titleMedium: TextStyle(color: Color(0xFF0F172A), fontWeight: FontWeight.w600),
              bodyLarge: TextStyle(color: Color(0xFF0F172A), fontSize: 14),
              bodyMedium: TextStyle(color: Color(0xFF475569), fontSize: 13),
            ),
            appBarTheme: const AppBarTheme(
              backgroundColor: Colors.transparent,
              elevation: 0,
              titleTextStyle: TextStyle(color: Color(0xFF0F172A), fontSize: 16, fontWeight: FontWeight.w900),
              iconTheme: IconThemeData(color: Color(0xFF0F172A)),
            ),
            useMaterial3: true,
          ),
          darkTheme: ThemeData(
            brightness: Brightness.dark,
            scaffoldBackgroundColor: const Color(0xFF070A13),
            primaryColor: const Color(0xFF06B6D4),
            colorScheme: const ColorScheme.dark(
              primary: Color(0xFF06B6D4),
              secondary: Color(0xFF3B82F6),
              surface: Color(0xFF0F172A),
              onPrimary: Colors.white,
              onSecondary: Colors.white,
              onSurface: Colors.white,
            ),
            textTheme: const TextTheme(
              displayLarge: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
              displayMedium: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
              headlineMedium: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
              titleLarge: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
              titleMedium: TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
              bodyLarge: TextStyle(color: Colors.white, fontSize: 14),
              bodyMedium: TextStyle(color: Color(0xFFCBD5E1), fontSize: 13),
            ),
            appBarTheme: const AppBarTheme(
              backgroundColor: Colors.transparent,
              elevation: 0,
              titleTextStyle: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w900),
              iconTheme: IconThemeData(color: Colors.white),
            ),
            useMaterial3: true,
          ),
          home: FutureBuilder<Widget>(
            future: _getInitialScreen(),
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting) {
                return Scaffold(
                  backgroundColor: isDark ? const Color(0xFF070A13) : const Color(0xFFF1F5F9),
                  body: const Center(
                    child: CircularProgressIndicator(color: Color(0xFF06B6D4)),
                  ),
                );
              }
              return snapshot.data ?? const LoginScreen();
            },
          ),
        );
      },
    );
  }
}
