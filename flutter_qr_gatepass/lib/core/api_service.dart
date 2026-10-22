import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  /// Current PC Wi-Fi IP (update if Windows IP changes).
  static const String lanWifiUrl = "http://10.184.161.227:3000/api";
  static const String lanEthernetUrl = "http://172.21.127.119:3000/api";
  static const String emulatorUrl = "http://10.0.2.2:3000/api";
  static const String localhostUrl = "http://127.0.0.1:3000/api";
  static const List<String> _legacyUrls = [
    "http://10.145.198.227:3000/api",
    "http://10.86.110.227:3000/api",
    "http://10.64.107.135:3000/api",
    "http://10.64.107.134:3000/api",
    "http://169.254.68.21:3000/api",
  ];

  static String? _cachedBaseUrl;

  static String get platformDefaultUrl {
    if (kIsWeb) return localhostUrl;
    if (!kIsWeb && Platform.isAndroid) return lanWifiUrl;
    if (!kIsWeb && Platform.isIOS) return lanWifiUrl;
    return localhostUrl;
  }

  static List<String> get _probeUrls {
    if (kIsWeb) return [localhostUrl];
    final urls = <String>{
      lanWifiUrl,
      if (Platform.isAndroid) emulatorUrl,
      lanEthernetUrl,
      localhostUrl,
      ..._legacyUrls,
    };
    return urls.toList();
  }

  static String normalizeBaseUrl(String url) {
    String formatted = url.trim();
    if (formatted.endsWith('/')) {
      formatted = formatted.substring(0, formatted.length - 1);
    }
    if (!formatted.endsWith('/api')) {
      formatted = '$formatted/api';
    }
    if (!formatted.startsWith('http://') && !formatted.startsWith('https://')) {
      formatted = 'http://$formatted';
    }
    return formatted;
  }

  static Future<String> getBaseUrl() async {
    if (_cachedBaseUrl != null) return _cachedBaseUrl!;

    // Flutter web runs in the browser on this PC — talk to Next.js on localhost.
    if (kIsWeb) {
      _cachedBaseUrl = localhostUrl;
      return _cachedBaseUrl!;
    }

    final prefs = await SharedPreferences.getInstance();
    final saved = prefs.getString('gatify_base_url') ?? prefs.getString('qrgp_base_url');

    if (saved != null) {
      final normalized = normalizeBaseUrl(saved);
      // If the saved URL is an old legacy URL, update it to current platformDefaultUrl
      if (_legacyUrls.contains(normalized)) {
        await setBaseUrl(platformDefaultUrl);
        return platformDefaultUrl;
      }
      _cachedBaseUrl = normalized;
      return normalized;
    }

    _cachedBaseUrl = platformDefaultUrl;
    return _cachedBaseUrl!;
  }

  static Future<String?> discoverWorkingUrl() async {
    final results = await Future.wait(_probeUrls.map((url) async {
      final ok = await testConnection(url);
      return ok ? url : null;
    }));
    return results.firstWhere((url) => url != null, orElse: () => null);
  }

  static Future<void> setBaseUrl(String url) async {
    final prefs = await SharedPreferences.getInstance();
    final formatted = normalizeBaseUrl(url);
    _cachedBaseUrl = formatted;
    await prefs.setString('gatify_base_url', formatted);
    await prefs.setString('qrgp_base_url', formatted);
  }

  /// Test connection to a given URL. Never calls [getBaseUrl] (avoids recursion).
  static Future<bool> testConnection([String? candidateUrl]) async {
    try {
      final urlStr = normalizeBaseUrl((candidateUrl ?? platformDefaultUrl).trim());
      String testEndpoint = urlStr;
      if (testEndpoint.endsWith('/api')) {
        testEndpoint = testEndpoint.replaceAll(RegExp(r'/api$'), '');
      }
      final uri = Uri.parse(testEndpoint);
      final res = await http.get(uri).timeout(const Duration(seconds: 3));
      return res.statusCode == 200 || res.statusCode == 404 || res.statusCode == 307;
    } catch (_) {
      return false;
    }
  }

  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('gatify_token') ?? prefs.getString('qrgp_token');
  }

  static Future<Map<String, String>> _getHeaders() async {
    final token = await getToken();
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  // 1. Multi-tenant Login
  static Future<Map<String, dynamic>> login({
    required String organizationCode,
    required String username,
    required String password,
  }) async {
    final baseUrl = await getBaseUrl();
    try {
      final url = Uri.parse('$baseUrl/auth/login');
      final response = await http.post(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'organizationCode': organizationCode,
          'username': username,
          'password': password,
        }),
      ).timeout(const Duration(seconds: 8));
      return jsonDecode(response.body);
    } catch (_) {
      // If primary URL failed, try to auto-discover any available local server
      final workingUrl = await discoverWorkingUrl();
      if (workingUrl != null && workingUrl != baseUrl) {
        await setBaseUrl(workingUrl);
        final fallbackUrl = Uri.parse('$workingUrl/auth/login');
        final response = await http.post(
          fallbackUrl,
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({
            'organizationCode': organizationCode,
            'username': username,
            'password': password,
          }),
        ).timeout(const Duration(seconds: 8));
        return jsonDecode(response.body);
      }
      rethrow;
    }
  }

  // 2. Request SMTP Password Reset OTP
  static Future<Map<String, dynamic>> requestPasswordReset({
    required String organizationCode,
    required String usernameOrEmail,
  }) async {
    final baseUrl = await getBaseUrl();
    final url = Uri.parse('$baseUrl/auth/reset-password');
    final response = await http.post(
      url,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'action': 'REQUEST',
        'organizationCode': organizationCode,
        'usernameOrEmail': usernameOrEmail,
      }),
    ).timeout(const Duration(seconds: 8));
    return jsonDecode(response.body);
  }

  // 3. Confirm Password Reset OTP & Set New Password
  static Future<Map<String, dynamic>> confirmPasswordReset({
    required String organizationCode,
    required String email,
    required String resetToken,
    required String newPassword,
  }) async {
    final baseUrl = await getBaseUrl();
    final url = Uri.parse('$baseUrl/auth/reset-password');
    final response = await http.post(
      url,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'action': 'CONFIRM',
        'organizationCode': organizationCode,
        'email': email,
        'resetToken': resetToken,
        'newPassword': newPassword,
      }),
    ).timeout(const Duration(seconds: 8));
    return jsonDecode(response.body);
  }

  // 4. Admin Change Password Using Old Password
  static Future<Map<String, dynamic>> changeAdminPassword({
    required String oldPassword,
    required String newPassword,
  }) async {
    final baseUrl = await getBaseUrl();
    final url = Uri.parse('$baseUrl/admin/change-password');
    final headers = await _getHeaders();
    final response = await http.post(
      url,
      headers: headers,
      body: jsonEncode({
        'oldPassword': oldPassword,
        'newPassword': newPassword,
      }),
    ).timeout(const Duration(seconds: 8));
    return jsonDecode(response.body);
  }

  // 5. Update Admin Profile (Name, Flat/Unit)
  static Future<Map<String, dynamic>> updateAdminProfile({
    required String username,
    required String flatUnit,
  }) async {
    final baseUrl = await getBaseUrl();
    final url = Uri.parse('$baseUrl/admin/profile');
    final headers = await _getHeaders();
    final response = await http.put(
      url,
      headers: headers,
      body: jsonEncode({
        'username': username,
        'flatUnit': flatUnit,
      }),
    ).timeout(const Duration(seconds: 8));
    return jsonDecode(response.body);
  }

  // 6. Fetch Members List
  static Future<Map<String, dynamic>> getMembers() async {
    final baseUrl = await getBaseUrl();
    final url = Uri.parse('$baseUrl/admin/members');
    final headers = await _getHeaders();
    final response = await http.get(url, headers: headers).timeout(const Duration(seconds: 8));
    return jsonDecode(response.body);
  }

  // 7. Create Member Account
  static Future<Map<String, dynamic>> createMember({
    required String username,
    required String flatUnit,
    required String password,
    required String role,
  }) async {
    final baseUrl = await getBaseUrl();
    final url = Uri.parse('$baseUrl/admin/members');
    final headers = await _getHeaders();
    final response = await http.post(
      url,
      headers: headers,
      body: jsonEncode({
        'username': username,
        'phone': flatUnit,
        'password': password,
        'role': role,
      }),
    ).timeout(const Duration(seconds: 8));
    return jsonDecode(response.body);
  }

  // 8. Update Member Account & Set New Member Password
  static Future<Map<String, dynamic>> updateMember({
    required String userId,
    required String username,
    required String flatUnit,
    String? newPassword,
  }) async {
    final baseUrl = await getBaseUrl();
    final url = Uri.parse('$baseUrl/admin/members');
    final headers = await _getHeaders();
    final response = await http.put(
      url,
      headers: headers,
      body: jsonEncode({
        'userId': userId,
        'username': username,
        'phone': flatUnit,
        if (newPassword != null && newPassword.isNotEmpty) 'newPassword': newPassword,
      }),
    ).timeout(const Duration(seconds: 8));
    return jsonDecode(response.body);
  }

  // 9. Delete Member Account
  static Future<Map<String, dynamic>> deleteMember(String userId) async {
    final baseUrl = await getBaseUrl();
    final url = Uri.parse('$baseUrl/admin/members?userId=$userId');
    final headers = await _getHeaders();
    final response = await http.delete(url, headers: headers).timeout(const Duration(seconds: 8));
    return jsonDecode(response.body);
  }

  // 10. Fetch Destinations
  static Future<Map<String, dynamic>> getDestinations() async {
    final baseUrl = await getBaseUrl();
    final url = Uri.parse('$baseUrl/admin/destinations');
    final headers = await _getHeaders();
    final response = await http.get(url, headers: headers).timeout(const Duration(seconds: 8));
    return jsonDecode(response.body);
  }

  // 11. Add Destination
  static Future<Map<String, dynamic>> createDestination({
    required String groupLabel,
    required String unitNumber,
  }) async {
    final baseUrl = await getBaseUrl();
    final url = Uri.parse('$baseUrl/admin/destinations');
    final headers = await _getHeaders();
    final response = await http.post(
      url,
      headers: headers,
      body: jsonEncode({
        'groupLabel': groupLabel,
        'unitNumber': unitNumber,
      }),
    ).timeout(const Duration(seconds: 8));
    return jsonDecode(response.body);
  }

  // 12. Gatekeeper: Record Delivery
  static Future<Map<String, dynamic>> submitDelivery({
    required String personName,
    required String companyName,
    required String phone,
    required List<String> destinations,
  }) async {
    final baseUrl = await getBaseUrl();
    final url = Uri.parse('$baseUrl/gatekeeper/entry');
    final headers = await _getHeaders();
    final response = await http.post(
      url,
      headers: headers,
      body: jsonEncode({
        'entryType': 'DELIVERY',
        'personName': personName,
        'companyName': companyName,
        'phone': phone,
        'destinations': destinations,
      }),
    ).timeout(const Duration(seconds: 8));
    return jsonDecode(response.body);
  }

  // 13. Gatekeeper: Scan QR Pass Code (ENTRY or EXIT)
  static Future<Map<String, dynamic>> scanQrPass(String passCode, {String scanType = 'ENTRY'}) async {
    final baseUrl = await getBaseUrl();
    final url = Uri.parse('$baseUrl/gatekeeper/scan');
    final headers = await _getHeaders();
    final response = await http.post(
      url,
      headers: headers,
      body: jsonEncode({
        'passCode': passCode,
        'qr_token': passCode,
        'scanType': scanType,
        'scan_type': scanType,
      }),
    ).timeout(const Duration(seconds: 8));
    return jsonDecode(response.body);
  }

  // 14. Member: Generate Guest Pass
  static Future<Map<String, dynamic>> createGuestPass({
    required String guestName,
    required String guestPhone,
    required int durationHours,
    String? validDate,
    String? validFromIso,
  }) async {
    final baseUrl = await getBaseUrl();
    final url = Uri.parse('$baseUrl/member/guest-pass');
    final headers = await _getHeaders();
    final response = await http.post(
      url,
      headers: headers,
      body: jsonEncode({
        'guestName': guestName,
        'guestPhone': guestPhone,
        'durationHours': durationHours,
        if (validDate != null) 'validDate': validDate,
        if (validFromIso != null) 'validFromIso': validFromIso,
      }),
    ).timeout(const Duration(seconds: 8));
    return jsonDecode(response.body);
  }

  // 15. Fetch Live Register Logs & Stats
  static Future<Map<String, dynamic>> getDashboardOverview() async {
    final baseUrl = await getBaseUrl();
    final url = Uri.parse('$baseUrl/admin/dashboard');
    final headers = await _getHeaders();
    final response = await http.get(url, headers: headers).timeout(const Duration(seconds: 8));
    return jsonDecode(response.body);
  }

  // 16. Fetch Filtered Reports
  static Future<Map<String, dynamic>> getReports({
    String fromDate = '',
    String toDate = '',
    String entryType = 'ALL',
  }) async {
    final baseUrl = await getBaseUrl();
    final query = 'fromDate=$fromDate&toDate=$toDate&entryType=$entryType';
    final url = Uri.parse('$baseUrl/admin/reports?$query');
    final headers = await _getHeaders();
    final response = await http.get(url, headers: headers).timeout(const Duration(seconds: 8));
    return jsonDecode(response.body);
  }

  // 17. Member: Fetch My Guest Passes History
  static Future<Map<String, dynamic>> getMyPasses() async {
    final baseUrl = await getBaseUrl();
    final url = Uri.parse('$baseUrl/member/guest-pass');
    final headers = await _getHeaders();
    final response = await http.get(url, headers: headers).timeout(const Duration(seconds: 8));
    return jsonDecode(response.body);
  }

  // 18. Admin / Gatekeeper: Mark Entry Log as Exited
  static Future<Map<String, dynamic>> markExit(String logId) async {
    final baseUrl = await getBaseUrl();
    final url = Uri.parse('$baseUrl/gatekeeper/exit');
    final headers = await _getHeaders();
    final response = await http.post(
      url,
      headers: headers,
      body: jsonEncode({'logId': logId}),
    ).timeout(const Duration(seconds: 8));
    return jsonDecode(response.body);
  }
}
