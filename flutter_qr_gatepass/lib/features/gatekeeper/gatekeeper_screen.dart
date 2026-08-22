import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/api_service.dart';
import '../auth/login_screen.dart';

String formatPassDateLocal(String? isoStr) {
  if (isoStr == null || isoStr.isEmpty) return "";

  final datePart = isoStr.split("T")[0];
  if (datePart.contains("-")) {
    final parts = datePart.split("-");
    if (parts.length == 3) {
      final y = int.tryParse(parts[0]) ?? 2026;
      final m = int.tryParse(parts[1]) ?? 8;
      final d = int.tryParse(parts[2]) ?? 21;
      final months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

      if (isoStr.contains("T00:00") || isoStr.contains("T05:30") || isoStr.contains("T18:30")) {
        return "$d ${months[m - 1]} $y, 00:00";
      }
    }
  }

  final dt = DateTime.tryParse(isoStr)?.toLocal();
  if (dt == null) return "";
  final months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  final mStr = months[dt.month - 1];
  final hStr = dt.hour.toString().padLeft(2, '0');
  final minStr = dt.minute.toString().padLeft(2, '0');
  return "${dt.day} $mStr ${dt.year}, $hStr:$minStr";
}

class GatekeeperScreen extends StatefulWidget {
  const GatekeeperScreen({super.key});

  @override
  State<GatekeeperScreen> createState() => _GatekeeperScreenState();
}

class _GatekeeperScreenState extends State<GatekeeperScreen> {
  int _activeView = 0; // 0: Home, 1: Scan, 2: Delivery

  // Delivery Form State
  final _companyController = TextEditingController();
  final _personController = TextEditingController();
  final _phoneController = TextEditingController();
  final _wingController = TextEditingController();
  final _flatController = TextEditingController();
  final List<String> _selectedDestinations = [];
  bool _isSubmittingDelivery = false;

  // Scan Form State
  final _qrTokenController = TextEditingController();
  String? _scanResult;
  String _scanStatusCode = "";
  bool _isCameraActive = false;

  void _addDestination() {
    final flat = _flatController.text.trim();
    if (flat.isEmpty) return;

    final wing = _wingController.text.trim().toUpperCase();
    final destName = wing.isNotEmpty ? '$wing-$flat' : flat;

    if (!_selectedDestinations.contains(destName)) {
      setState(() {
        _selectedDestinations.add(destName);
        _wingController.clear();
        _flatController.clear();
      });
    }
  }

  Future<void> _submitDelivery() async {
    final company = _companyController.text.trim();
    final agent = _personController.text.trim();

    if (company.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Delivery Company is compulsory.")));
      return;
    }

    if (agent.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Delivery Agent Name is compulsory.")));
      return;
    }

    if (_selectedDestinations.isEmpty && _flatController.text.isNotEmpty) {
      _addDestination();
    }

    if (_selectedDestinations.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("At least one Destination Flat is compulsory.")),
      );
      return;
    }

    setState(() => _isSubmittingDelivery = true);

    try {
      final res = await ApiService.submitDelivery(
        personName: _personController.text.trim(),
        companyName: _companyController.text.trim(),
        phone: _phoneController.text.trim(),
        destinations: _selectedDestinations,
      );

      if (res['success'] == true) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Delivery Entry Recorded Successfully!")),
        );
        setState(() {
          _companyController.clear();
          _personController.clear();
          _phoneController.clear();
          _selectedDestinations.clear();
          _activeView = 0;
        });
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Failed to log delivery.")),
      );
    } finally {
      setState(() => _isSubmittingDelivery = false);
    }
  }

  Future<void> _submitScan() async {
    final code = _qrTokenController.text.trim();
    if (code.isEmpty) return;

    try {
      final res = await ApiService.scanQrPass(code);
      if (res['success'] == true) {
        setState(() {
          _scanStatusCode = "VERIFIED";
          _scanResult = "VERIFIED: ${res['pass']['guestName']} (${res['pass']['destination']})";
          _qrTokenController.clear();
        });
      } else {
        String messageText = res['message'] ?? "Invalid or Expired QR Pass.";
        if (res['statusCode'] == 'NOT_YET_VALID' && res['validFromIso'] != null) {
          final formatted = formatPassDateLocal(res['validFromIso']?.toString());
          messageText = "NOT YET VALID: Pass for ${res['guestName'] ?? 'Guest'} is valid starting $formatted!";
        }

        setState(() {
          _scanStatusCode = res['statusCode'] ?? "INVALID";
          _scanResult = messageText;
        });
      }
    } catch (e) {
      setState(() {
        _scanStatusCode = "INVALID";
        _scanResult = "Scan verification failed.";
      });
    }
  }

  void _logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
    if (!mounted) return;
    Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const LoginScreen()));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E293B),
        title: const Text("Gatekeeper Security Hub", style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
        actions: [
          IconButton(icon: const Icon(Icons.logout, color: Colors.redAccent), onPressed: _logout),
        ],
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: _activeView == 0
              ? _buildHomeMenu()
              : _activeView == 1
                  ? _buildScanView()
                  : _buildDeliveryView(),
        ),
      ),
    );
  }

  Widget _buildHomeMenu() {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Touch Button 1: Scan QR Pass
        InkWell(
          onTap: () => setState(() => _activeView = 1),
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 36, horizontal: 24),
            decoration: BoxDecoration(
              gradient: const LinearGradient(colors: [Color(0xFF0891B2), Color(0xFF2563EB)]),
              borderRadius: BorderRadius.circular(24),
              boxShadow: [BoxShadow(color: const Color(0xFF0891B2).withValues(alpha: 0.3), blurRadius: 16)],
            ),
            child: const Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.qr_code_scanner, size: 48, color: Colors.white),
                SizedBox(width: 16),
                Text("SCAN GUEST QR", style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w800)),
              ],
            ),
          ),
        ),
        const SizedBox(height: 24),

        // Touch Button 2: Delivery Entry
        InkWell(
          onTap: () => setState(() => _activeView = 2),
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 36, horizontal: 24),
            decoration: BoxDecoration(
              color: const Color(0xFF1E293B),
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: const Color(0xFF0891B2).withValues(alpha: 0.4), width: 2),
            ),
            child: const Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.local_shipping, size: 48, color: Color(0xFF06B6D4)),
                SizedBox(width: 16),
                Text("DELIVERY ENTRY", style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w800)),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildScanView() {
    Color bannerBg = Colors.red.withValues(alpha: 0.2);
    Color bannerBorder = Colors.red;
    Color bannerText = Colors.redAccent;

    if (_scanStatusCode == "VERIFIED") {
      bannerBg = Colors.green.withValues(alpha: 0.2);
      bannerBorder = Colors.green;
      bannerText = Colors.greenAccent;
    } else if (_scanStatusCode == "NOT_YET_VALID") {
      bannerBg = Colors.cyan.withValues(alpha: 0.2);
      bannerBorder = Colors.cyan;
      bannerText = Colors.cyanAccent;
    } else if (_scanStatusCode == "ALREADY_USED") {
      bannerBg = Colors.amber.withValues(alpha: 0.2);
      bannerBorder = Colors.amber;
      bannerText = Colors.amberAccent;
    } else if (_scanStatusCode == "EXPIRED") {
      bannerBg = Colors.orange.withValues(alpha: 0.2);
      bannerBorder = Colors.orange;
      bannerText = Colors.orangeAccent;
    } else if (_scanStatusCode == "REVOKED") {
      bannerBg = Colors.purple.withValues(alpha: 0.2);
      bannerBorder = Colors.purple;
      bannerText = Colors.purpleAccent;
    }

    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          TextButton.icon(
            onPressed: () => setState(() {
              _activeView = 0;
              _isCameraActive = false;
            }),
            icon: const Icon(Icons.arrow_back, color: Color(0xFF94A3B8)),
            label: const Text("Back to Main Menu", style: TextStyle(color: Color(0xFF94A3B8))),
          ),
          const SizedBox(height: 12),

          if (_scanResult != null) ...[
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: bannerBg,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: bannerBorder),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(_scanStatusCode, style: TextStyle(color: bannerText, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1)),
                  const SizedBox(height: 4),
                  Text(_scanResult!, style: TextStyle(color: bannerText, fontSize: 15, fontWeight: FontWeight.bold)),
                ],
              ),
            ),
            const SizedBox(height: 16),
          ],

          // REAL CAMERA VIEWFINDER BOX (MobileScanner)
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF1E293B),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Column(
              children: [
                Container(
                  height: 220,
                  decoration: BoxDecoration(
                    color: const Color(0xFF0F172A),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: _isCameraActive ? Colors.greenAccent : const Color(0xFF06B6D4)),
                  ),
                  child: _isCameraActive
                      ? ClipRRect(
                          borderRadius: BorderRadius.circular(16),
                          child: MobileScanner(
                            onDetect: (capture) {
                              final List<Barcode> barcodes = capture.barcodes;
                              for (final barcode in barcodes) {
                                final code = barcode.rawValue;
                                if (code != null && code.isNotEmpty) {
                                  _qrTokenController.text = code;
                                  _submitScan();
                                  setState(() => _isCameraActive = false);
                                  break;
                                }
                              }
                            },
                          ),
                        )
                      : Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(Icons.camera_alt, size: 42, color: Color(0xFF06B6D4)),
                              const SizedBox(height: 8),
                              const Text("Camera Viewfinder Ready", style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12, fontWeight: FontWeight.bold)),
                            ],
                          ),
                        ),
                ),
                const SizedBox(height: 12),
                ElevatedButton.icon(
                  onPressed: () => setState(() => _isCameraActive = !_isCameraActive),
                  icon: Icon(_isCameraActive ? Icons.videocam_off : Icons.camera_front, color: Colors.white, size: 16),
                  label: Text(_isCameraActive ? "Close Camera View" : "Open Live Camera Viewfinder", style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                  style: ElevatedButton.styleFrom(backgroundColor: _isCameraActive ? Colors.redAccent : const Color(0xFF0891B2)),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          TextField(
            controller: _qrTokenController,
            style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
            decoration: InputDecoration(
              labelText: "Enter or Scan QR Token",
              labelStyle: const TextStyle(color: Color(0xFF94A3B8)),
              filled: true,
              fillColor: const Color(0xFF1E293B),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
            ),
          ),
          const SizedBox(height: 16),

          ElevatedButton(
            onPressed: _submitScan,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF0891B2),
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            ),
            child: const Text("Validate QR Pass", style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  Widget _buildDeliveryView() {
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          TextButton.icon(
            onPressed: () => setState(() => _activeView = 0),
            icon: const Icon(Icons.arrow_back, color: Color(0xFF94A3B8)),
            label: const Text("Back to Main Menu", style: TextStyle(color: Color(0xFF94A3B8))),
          ),
          const SizedBox(height: 8),

          TextField(
            controller: _companyController,
            style: const TextStyle(color: Colors.white),
            decoration: InputDecoration(
              labelText: "Delivery Company (Amazon, Zomato...) *",
              labelStyle: const TextStyle(color: Color(0xFF94A3B8)),
              filled: true,
              fillColor: const Color(0xFF1E293B),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
            ),
          ),
          const SizedBox(height: 12),

          TextField(
            controller: _personController,
            style: const TextStyle(color: Colors.white),
            decoration: InputDecoration(
              labelText: "Delivery Agent Name *",
              labelStyle: const TextStyle(color: Color(0xFF94A3B8)),
              filled: true,
              fillColor: const Color(0xFF1E293B),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
            ),
          ),
          const SizedBox(height: 12),

          TextField(
            controller: _phoneController,
            keyboardType: TextInputType.phone,
            style: const TextStyle(color: Colors.white),
            decoration: InputDecoration(
              labelText: "Agent Mobile Number (Optional)",
              labelStyle: const TextStyle(color: Color(0xFF94A3B8)),
              filled: true,
              fillColor: const Color(0xFF1E293B),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
            ),
          ),
          const SizedBox(height: 16),

          // Wing + Flat Addition Box
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF1E293B),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text("Add Destination Flats *", style: TextStyle(color: Color(0xFF06B6D4), fontWeight: FontWeight.bold)),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      flex: 1,
                      child: TextField(
                        controller: _wingController,
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                        decoration: const InputDecoration(hintText: "Wing (A)", hintStyle: TextStyle(color: Color(0xFF64748B))),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      flex: 2,
                      child: TextField(
                        controller: _flatController,
                        keyboardType: TextInputType.number,
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                        decoration: const InputDecoration(hintText: "Flat # (203)", hintStyle: TextStyle(color: Color(0xFF64748B))),
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.add_circle, color: Color(0xFF06B6D4), size: 32),
                      onPressed: _addDestination,
                    ),
                  ],
                ),
                if (_selectedDestinations.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    children: _selectedDestinations.map((dest) {
                      return Chip(
                        backgroundColor: const Color(0xFF0891B2).withValues(alpha: 0.3),
                        label: Text(dest, style: const TextStyle(color: Colors.cyanAccent, fontWeight: FontWeight.bold)),
                        deleteIcon: const Icon(Icons.close, size: 14, color: Colors.cyanAccent),
                        onDeleted: () => setState(() => _selectedDestinations.remove(dest)),
                      );
                    }).toList(),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 20),

          ElevatedButton(
            onPressed: _isSubmittingDelivery ? null : _submitDelivery,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF0891B2),
              padding: const EdgeInsets.symmetric(vertical: 18),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            ),
            child: _isSubmittingDelivery
                ? const CircularProgressIndicator(color: Colors.white)
                : const Text("RECORD DELIVERY ENTRY", style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w800)),
          ),
        ],
      ),
    );
  }
}
