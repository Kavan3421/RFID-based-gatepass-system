import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  // Default to Laptop LAN IP for physical Android devices on local Wi-Fi
  static String defaultBaseUrl = "http://10.64.107.135:3000/api";

  static Future<String> getBaseUrl() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('qrgp_base_url') ?? defaultBaseUrl;
  }

  static Future<void> setBaseUrl(String url) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('qrgp_base_url', url);
  }

  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('qrgp_token');
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
    final url = Uri.parse('$baseUrl/auth/login');
    final response = await http.post(
      url,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'organizationCode': organizationCode,
        'username': username,
        'password': password,
      }),
    ).timeout(const Duration(seconds: 10));
    return jsonDecode(response.body);
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
    );
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
    );
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
    );
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
    );
    return jsonDecode(response.body);
  }

  // 6. Fetch Members List
  static Future<Map<String, dynamic>> getMembers() async {
    final baseUrl = await getBaseUrl();
    final url = Uri.parse('$baseUrl/admin/members');
    final headers = await _getHeaders();
    final response = await http.get(url, headers: headers);
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
    );
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
    );
    return jsonDecode(response.body);
  }

  // 9. Delete Member Account
  static Future<Map<String, dynamic>> deleteMember(String userId) async {
    final baseUrl = await getBaseUrl();
    final url = Uri.parse('$baseUrl/admin/members?userId=$userId');
    final headers = await _getHeaders();
    final response = await http.delete(url, headers: headers);
    return jsonDecode(response.body);
  }

  // 10. Fetch Destinations
  static Future<Map<String, dynamic>> getDestinations() async {
    final baseUrl = await getBaseUrl();
    final url = Uri.parse('$baseUrl/admin/destinations');
    final headers = await _getHeaders();
    final response = await http.get(url, headers: headers);
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
    );
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
    );
    return jsonDecode(response.body);
  }

  // 13. Gatekeeper: Scan QR Pass Code
  static Future<Map<String, dynamic>> scanQrPass(String passCode) async {
    final baseUrl = await getBaseUrl();
    final url = Uri.parse('$baseUrl/gatekeeper/scan');
    final headers = await _getHeaders();
    final response = await http.post(
      url,
      headers: headers,
      body: jsonEncode({'passCode': passCode}),
    );
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
    );
    return jsonDecode(response.body);
  }

  // 15. Fetch Live Register Logs & Stats
  static Future<Map<String, dynamic>> getDashboardOverview() async {
    final baseUrl = await getBaseUrl();
    final url = Uri.parse('$baseUrl/admin/dashboard');
    final headers = await _getHeaders();
    final response = await http.get(url, headers: headers);
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
    final response = await http.get(url, headers: headers);
    return jsonDecode(response.body);
  }

  // 17. Member: Fetch My Guest Passes History
  static Future<Map<String, dynamic>> getMyPasses() async {
    final baseUrl = await getBaseUrl();
    final url = Uri.parse('$baseUrl/member/guest-pass');
    final headers = await _getHeaders();
    final response = await http.get(url, headers: headers);
    return jsonDecode(response.body);
  }
}
