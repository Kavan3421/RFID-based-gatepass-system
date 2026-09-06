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
      final prefs = await SharedPreferences.getInstance()
          .timeout(const Duration(seconds: 2));
      final token =
          prefs.getString('gatify_token') ?? prefs.getString('qrgp_token');
      final userStr =
          prefs.getString('gatify_user') ?? prefs.getString('qrgp_user');

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
        final lightScheme = const ColorScheme.light(
          primary: Color(0xFF3B9DF3),
          secondary: Color(0xFF46CAA6),
          surface: Color(0xFFF5F9FF),
          onPrimary: Color(0xFF031C3B),
          onSecondary: Color(0xFF03281F),
          onSurface: Color(0xFF132645),
        );

        final darkScheme = const ColorScheme.dark(
          primary: Color(0xFF79CBFF),
          secondary: Color(0xFF72DBBF),
          surface: Color(0xFF122338),
          onPrimary: Color(0xFF031C3B),
          onSecondary: Color(0xFF062A22),
          onSurface: Color(0xFFF4F8FF),
        );

        return MaterialApp(
          title: 'Gatify',
          debugShowCheckedModeBanner: false,
          themeMode: isDark ? ThemeMode.dark : ThemeMode.light,
          theme: ThemeData(
            brightness: Brightness.light,
            fontFamily: 'SF Pro Text',
            scaffoldBackgroundColor: const Color(0xFFEEF3FB),
            primaryColor: lightScheme.primary,
            colorScheme: lightScheme,
            appBarTheme: AppBarTheme(
              backgroundColor: Colors.transparent,
              elevation: 0,
              centerTitle: false,
              surfaceTintColor: Colors.transparent,
              titleTextStyle: const TextStyle(
                  color: Color(0xFF102347),
                  fontSize: 17,
                  fontWeight: FontWeight.w700),
              iconTheme: const IconThemeData(color: Color(0xFF102347)),
            ),
            cardColor: const Color(0x80FFFFFF),
            dividerColor: const Color(0x6689A1C2),
            inputDecorationTheme: InputDecorationTheme(
              filled: true,
              fillColor: const Color(0xB8FFFFFF),
              contentPadding:
                  const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(18),
                borderSide: const BorderSide(color: Color(0x8093AACB)),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(18),
                borderSide: const BorderSide(color: Color(0x8093AACB)),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(18),
                borderSide:
                    const BorderSide(color: Color(0xFF3B9DF3), width: 1.3),
              ),
              hintStyle: const TextStyle(color: Color(0xFF6581A5)),
              labelStyle: const TextStyle(
                  color: Color(0xFF456487), fontWeight: FontWeight.w600),
            ),
            elevatedButtonTheme: ElevatedButtonThemeData(
              style: ElevatedButton.styleFrom(
                elevation: 0,
                padding:
                    const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(18)),
                backgroundColor: const Color(0xFF9FD7FF),
                foregroundColor: const Color(0xFF06213F),
                textStyle:
                    const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
              ),
            ),
            useMaterial3: true,
          ),
          darkTheme: ThemeData(
            brightness: Brightness.dark,
            fontFamily: 'SF Pro Text',
            scaffoldBackgroundColor: const Color(0xFF070D18),
            primaryColor: darkScheme.primary,
            colorScheme: darkScheme,
            appBarTheme: AppBarTheme(
              backgroundColor: Colors.transparent,
              elevation: 0,
              centerTitle: false,
              surfaceTintColor: Colors.transparent,
              titleTextStyle: const TextStyle(
                  color: Color(0xFFF4F8FF),
                  fontSize: 17,
                  fontWeight: FontWeight.w700),
              iconTheme: const IconThemeData(color: Color(0xFFF4F8FF)),
            ),
            cardColor: const Color(0x801B2639),
            dividerColor: const Color(0x66B4CBE8),
            inputDecorationTheme: InputDecorationTheme(
              filled: true,
              fillColor: const Color(0xAA16233A),
              contentPadding:
                  const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(18),
                borderSide: const BorderSide(color: Color(0x66FFFFFF)),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(18),
                borderSide: const BorderSide(color: Color(0x66FFFFFF)),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(18),
                borderSide:
                    const BorderSide(color: Color(0xFF79CBFF), width: 1.3),
              ),
              hintStyle: const TextStyle(color: Color(0xFF8EA3BF)),
              labelStyle: const TextStyle(
                  color: Color(0xFFB7C9E1), fontWeight: FontWeight.w600),
            ),
            elevatedButtonTheme: ElevatedButtonThemeData(
              style: ElevatedButton.styleFrom(
                elevation: 0,
                padding:
                    const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(18)),
                backgroundColor: const Color(0xFF86CCFF),
                foregroundColor: const Color(0xFF06213F),
                textStyle:
                    const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
              ),
            ),
            useMaterial3: true,
          ),
          home: _home,
        );
      },
    );
  }
}
