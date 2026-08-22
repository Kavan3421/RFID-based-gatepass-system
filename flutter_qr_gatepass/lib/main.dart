import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import 'features/auth/login_screen.dart';
import 'features/admin/admin_screen.dart';
import 'features/gatekeeper/gatekeeper_screen.dart';
import 'features/member/member_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const QrGatePassApp());
}

class QrGatePassApp extends StatelessWidget {
  const QrGatePassApp({Key? key}) : super(key: key);

  Future<Widget> _getInitialScreen() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('qrgp_token');
    final userStr = prefs.getString('qrgp_user');

    if (token != null && userStr != null) {
      try {
        final user = jsonDecode(userStr);
        final role = user['role'];
        if (role == 'ADMIN') return const AdminScreen();
        if (role == 'GATEKEEPER') return const GatekeeperScreen();
        if (role == 'MEMBER') return const MemberScreen();
      } catch (e) {}
    }
    return const LoginScreen();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'QR Gate Pass',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF0F172A),
        fontFamily: 'Roboto',
        useMaterial3: true,
      ),
      home: FutureBuilder<Widget>(
        future: _getInitialScreen(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Scaffold(
              backgroundColor: Color(0xFF0F172A),
              body: Center(child: CircularProgressIndicator(color: Color(0xFF0891B2))),
            );
          }
          return snapshot.data ?? const LoginScreen();
        },
      ),
    );
  }
}
