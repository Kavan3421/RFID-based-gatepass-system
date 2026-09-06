import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/api_service.dart';
import '../../core/glass_widgets.dart';
import '../../core/theme_controller.dart';
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
  String _scanType = 'ENTRY'; // 'ENTRY' or 'EXIT'

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
        if (!mounted) return;
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
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Failed to log delivery.")),
      );
    } finally {
      if (mounted) setState(() => _isSubmittingDelivery = false);
    }
  }

  Future<void> _submitScan() async {
    final code = _qrTokenController.text.trim().toUpperCase();
    if (code.isEmpty) return;

    try {
      final res = await ApiService.scanQrPass(code, scanType: _scanType);
      if (res['success'] == true) {
        setState(() {
          _scanStatusCode = res['statusCode'] ?? (_scanType == 'EXIT' ? "EXIT_RECORDED" : "VERIFIED");
          _scanResult = res['message'] ?? (_scanType == 'EXIT' ? "EXIT LOGGED: Guest Checked Out" : "ENTRY APPROVED: ${res['pass']['guestName']} (${res['pass']['destination']})");
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
    } catch (_) {
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
    final isDark = ThemeController.isDarkMode.value;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0A1018) : const Color(0xFFF3F5F8),
      extendBody: true,
      appBar: AppBar(
        backgroundColor: isDark ? const Color(0xFF141C28) : Colors.white,
        elevation: 0,
        title: Row(
          children: [
            const Icon(Icons.shield, color: Color(0xFF14B8A6), size: 20),
            const SizedBox(width: 8),
            Text(
              "Gatekeeper",
              style: TextStyle(
                color: isDark ? Colors.white : const Color(0xFF0F172A),
                fontSize: 17,
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: Icon(
              isDark ? Icons.light_mode : Icons.dark_mode_outlined,
              color: isDark ? Colors.amberAccent : const Color(0xFF4F46E5),
              size: 20,
            ),
            tooltip: "Toggle Theme",
            onPressed: () => ThemeController.toggleTheme(),
          ),
          IconButton(icon: const Icon(Icons.logout, color: Colors.redAccent, size: 20), onPressed: _logout),
        ],
      ),
      bottomNavigationBar: FloatingGlassDock(
        currentIndex: _activeView == 0
            ? 0
            : _activeView == 1
                ? (_scanType == 'ENTRY' ? 1 : 2)
                : 3,
        onTap: (index) {
          setState(() {
            if (index == 0) {
              _activeView = 0;
              _isCameraActive = false;
            } else if (index == 1) {
              _activeView = 1;
              _scanType = 'ENTRY';
            } else if (index == 2) {
              _activeView = 1;
              _scanType = 'EXIT';
            } else if (index == 3) {
              _activeView = 2;
              _isCameraActive = false;
            }
          });
        },
        items: const [
          DockItem(icon: Icons.dashboard_outlined, label: "Home"),
          DockItem(icon: Icons.login, label: "Scan In", isPrimary: true),
          DockItem(icon: Icons.logout, label: "Scan Out"),
          DockItem(icon: Icons.local_shipping_outlined, label: "Delivery"),
        ],
      ),
      body: AmbientCanvasBackground(
        child: SafeArea(
          bottom: false,
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: _activeView == 0
                ? _buildHomeMenu()
                : _activeView == 1
                    ? _buildScanView()
                    : _buildDeliveryView(),
          ),
        ),
      ),
    );
  }

  Widget _buildHomeMenu() {
    return SingleChildScrollView(
      physics: const ClampingScrollPhysics(),
      padding: const EdgeInsets.only(bottom: 90),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const SizedBox(height: 6),
          const Text(
            "Select Gate Action",
            style: TextStyle(
              color: Colors.white,
              fontSize: 22,
              fontWeight: FontWeight.w900,
              letterSpacing: -0.5,
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            "Tap an action card below to start verification",
            style: TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
          ),
          const SizedBox(height: 16),

          // Massive Tactile Tile 1: Scan Guest Entry Pass
          GestureDetector(
            onTap: () => setState(() {
              _scanType = 'ENTRY';
              _activeView = 1;
            }),
            behavior: HitTestBehavior.opaque,
            child: Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(26),
                gradient: const LinearGradient(
                  colors: [
                    Color(0xFF0E253A),
                    Color(0xFF0F172A),
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                border: Border.all(
                  color: const Color(0xFF06B6D4).withValues(alpha: 0.6),
                  width: 1.5,
                ),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF06B6D4).withValues(alpha: 0.30),
                    blurRadius: 20,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              child: Row(
                children: [
                  Container(
                    width: 58,
                    height: 58,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(18),
                      gradient: const LinearGradient(
                        colors: [Color(0xFF06B6D4), Color(0xFF2563EB)],
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFF06B6D4).withValues(alpha: 0.50),
                          blurRadius: 16,
                        ),
                      ],
                    ),
                    child: const Icon(Icons.login, size: 30, color: Colors.white),
                  ),
                  const SizedBox(width: 16),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Text(
                              "SCAN GUEST ENTRY",
                              style: TextStyle(
                                inherit: false,
                                color: Colors.white,
                                fontSize: 16,
                                fontWeight: FontWeight.w900,
                                letterSpacing: 0.2,
                              ),
                            ),
                            SizedBox(width: 6),
                            GlassPillChip(label: "IN", color: Color(0xFF06B6D4)),
                          ],
                        ),
                        SizedBox(height: 3),
                        Text(
                          "Validate pass & permit entry",
                          style: TextStyle(
                            inherit: false,
                            color: Color(0xFF22D3EE),
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const Icon(Icons.arrow_forward_ios, color: Color(0xFF22D3EE), size: 16),
                ],
              ),
            ),
          ),
          const SizedBox(height: 14),

          // Massive Tactile Tile 2: Scan Guest Exit Pass
          GestureDetector(
            onTap: () => setState(() {
              _scanType = 'EXIT';
              _activeView = 1;
            }),
            behavior: HitTestBehavior.opaque,
            child: Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(26),
                gradient: const LinearGradient(
                  colors: [
                    Color(0xFF2E1C1A),
                    Color(0xFF0F172A),
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                border: Border.all(
                  color: const Color(0xFFF59E0B).withValues(alpha: 0.6),
                  width: 1.5,
                ),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFFF59E0B).withValues(alpha: 0.25),
                    blurRadius: 20,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              child: Row(
                children: [
                  Container(
                    width: 58,
                    height: 58,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(18),
                      gradient: const LinearGradient(
                        colors: [Color(0xFFF59E0B), Color(0xFFE11D48)],
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFFF59E0B).withValues(alpha: 0.50),
                          blurRadius: 16,
                        ),
                      ],
                    ),
                    child: const Icon(Icons.logout, size: 30, color: Colors.white),
                  ),
                  const SizedBox(width: 16),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Text(
                              "SCAN GUEST EXIT",
                              style: TextStyle(
                                inherit: false,
                                color: Colors.white,
                                fontSize: 16,
                                fontWeight: FontWeight.w900,
                                letterSpacing: 0.2,
                              ),
                            ),
                            SizedBox(width: 6),
                            GlassPillChip(label: "OUT", color: Color(0xFFF59E0B)),
                          ],
                        ),
                        SizedBox(height: 3),
                        Text(
                          "Log visitor exit & checkout",
                          style: TextStyle(
                            inherit: false,
                            color: Color(0xFFFCD34D),
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const Icon(Icons.arrow_forward_ios, color: Color(0xFFFCD34D), size: 16),
                ],
              ),
            ),
          ),
          const SizedBox(height: 14),

          // Massive Tactile Tile 3: Delivery Entry
          GestureDetector(
            onTap: () => setState(() => _activeView = 2),
            behavior: HitTestBehavior.opaque,
            child: Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(26),
                gradient: const LinearGradient(
                  colors: [
                    Color(0xFF1E2442),
                    Color(0xFF0F172A),
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                border: Border.all(
                  color: const Color(0xFF3B82F6).withValues(alpha: 0.6),
                  width: 1.5,
                ),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF3B82F6).withValues(alpha: 0.25),
                    blurRadius: 20,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              child: Row(
                children: [
                  Container(
                    width: 58,
                    height: 58,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(18),
                      gradient: const LinearGradient(
                        colors: [Color(0xFF3B82F6), Color(0xFF4F46E5)],
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFF3B82F6).withValues(alpha: 0.50),
                          blurRadius: 16,
                        ),
                      ],
                    ),
                    child: const Icon(Icons.local_shipping, size: 30, color: Colors.white),
                  ),
                  const SizedBox(width: 16),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          "RAPID DELIVERY ENTRY",
                          style: TextStyle(
                            inherit: false,
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 0.2,
                          ),
                        ),
                        SizedBox(height: 3),
                        Text(
                          "Fast 2-tap multi-unit package logger",
                          style: TextStyle(
                            inherit: false,
                            color: Color(0xFF93C5FD),
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const Icon(Icons.arrow_forward_ios, color: Color(0xFF93C5FD), size: 16),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildScanView() {
    final isExit = _scanType == 'EXIT';
    Color bannerBg = Colors.red.withValues(alpha: 0.20);
    Color bannerBorder = Colors.red.withValues(alpha: 0.55);
    Color bannerText = Colors.redAccent;

    if (_scanStatusCode == "VERIFIED" || _scanStatusCode == "EXIT_RECORDED") {
      bannerBg = Colors.green.withValues(alpha: 0.20);
      bannerBorder = Colors.green.withValues(alpha: 0.55);
      bannerText = Colors.greenAccent;
    } else if (_scanStatusCode == "NOT_YET_VALID") {
      bannerBg = Colors.cyan.withValues(alpha: 0.20);
      bannerBorder = Colors.cyan.withValues(alpha: 0.55);
      bannerText = Colors.cyanAccent;
    } else if (_scanStatusCode == "ALREADY_USED" || _scanStatusCode == "ALREADY_EXITED" || _scanStatusCode == "ALREADY_INSIDE") {
      bannerBg = Colors.amber.withValues(alpha: 0.20);
      bannerBorder = Colors.amber.withValues(alpha: 0.55);
      bannerText = Colors.amberAccent;
    }

    return SingleChildScrollView(
      physics: const ClampingScrollPhysics(),
      padding: const EdgeInsets.only(bottom: 90),
      child: FrostedGlassCard(
        borderRadius: 28,
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                TextButton.icon(
                  onPressed: () => setState(() {
                    _activeView = 0;
                    _isCameraActive = false;
                  }),
                  icon: const Icon(Icons.arrow_back, color: Color(0xFF94A3B8), size: 18),
                  label: const Text("Main Menu", style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12, fontWeight: FontWeight.bold)),
                ),
                // Mode Toggle Switch
                Container(
                  padding: const EdgeInsets.all(3),
                  decoration: BoxDecoration(
                    color: const Color(0xFF0F172A),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Colors.white.withValues(alpha: 0.15)),
                  ),
                  child: Row(
                    children: [
                      GestureDetector(
                        onTap: () => setState(() => _scanType = 'ENTRY'),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                          decoration: BoxDecoration(
                            color: !isExit ? const Color(0xFF06B6D4) : Colors.transparent,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            "Scan In",
                            style: TextStyle(
                              color: !isExit ? Colors.white : const Color(0xFF94A3B8),
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                      GestureDetector(
                        onTap: () => setState(() => _scanType = 'EXIT'),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                          decoration: BoxDecoration(
                            color: isExit ? const Color(0xFFF59E0B) : Colors.transparent,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            "Scan Out",
                            style: TextStyle(
                              color: isExit ? Colors.white : const Color(0xFF94A3B8),
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),

            // Active Mode Header Indicator
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                color: (isExit ? const Color(0xFFF59E0B) : const Color(0xFF06B6D4)).withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: (isExit ? const Color(0xFFF59E0B) : const Color(0xFF06B6D4)).withValues(alpha: 0.35)),
              ),
              child: Row(
                children: [
                  Icon(isExit ? Icons.logout : Icons.login, color: isExit ? const Color(0xFFF59E0B) : const Color(0xFF06B6D4), size: 16),
                  const SizedBox(width: 8),
                  Text(
                    isExit ? "MODE: SCANNING GUEST EXIT & CHECKOUT" : "MODE: SCANNING GUEST ENTRY",
                    style: TextStyle(
                      color: isExit ? const Color(0xFFFCD34D) : const Color(0xFF22D3EE),
                      fontSize: 11,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 0.2,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),

            if (_scanResult != null) ...[
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: bannerBg,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: bannerBorder, width: 1.5),
                  boxShadow: [
                    BoxShadow(
                      color: bannerBorder.withValues(alpha: 0.2),
                      blurRadius: 16,
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(_scanStatusCode, style: TextStyle(color: bannerText, fontSize: 11, fontWeight: FontWeight.w900, letterSpacing: 1)),
                    const SizedBox(height: 4),
                    Text(_scanResult!, style: TextStyle(color: bannerText, fontSize: 14, fontWeight: FontWeight.bold)),
                  ],
                ),
              ),
              const SizedBox(height: 16),
            ],

            // LIVE CAMERA HUD
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(22),
                gradient: LinearGradient(
                  colors: [
                    const Color(0xFF0F172A).withValues(alpha: 0.85),
                    const Color(0xFF131E33).withValues(alpha: 0.75),
                  ],
                ),
                border: Border.all(color: Colors.white.withValues(alpha: 0.14)),
              ),
              child: Column(
                children: [
                  Container(
                    height: 220,
                    decoration: BoxDecoration(
                      color: const Color(0xFF050811),
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(
                        color: _isCameraActive
                            ? Colors.greenAccent
                            : isExit
                                ? const Color(0xFFF59E0B)
                                : const Color(0xFF06B6D4),
                        width: 1.5,
                      ),
                    ),
                    child: _isCameraActive
                        ? ClipRRect(
                            borderRadius: BorderRadius.circular(18),
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
                                Icon(isExit ? Icons.logout : Icons.camera_alt, size: 44, color: isExit ? const Color(0xFFF59E0B) : const Color(0xFF06B6D4)),
                                const SizedBox(height: 8),
                                Text("Live ${isExit ? 'Exit' : 'Entry'} Camera Viewfinder", style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12, fontWeight: FontWeight.bold)),
                              ],
                            ),
                          ),
                  ),
                  const SizedBox(height: 12),
                  LiquidGlassButton(
                    onPressed: () => setState(() => _isCameraActive = !_isCameraActive),
                    gradient: _isCameraActive
                        ? const LinearGradient(colors: [Colors.redAccent, Colors.red])
                        : isExit
                            ? const LinearGradient(colors: [Color(0xFFF59E0B), Color(0xFFE11D48)])
                            : null,
                    height: 48,
                    label: _isCameraActive ? "Close Camera View" : "Start Live ${isExit ? 'Exit' : 'Entry'} Auto-Scanner",
                    icon: _isCameraActive ? Icons.videocam_off : Icons.camera_alt,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            GlassTextField(
              controller: _qrTokenController,
              labelText: "Manual QR Token Input",
              hintText: "Enter pass code (e.g. QGP-8A9F21B3)",
              textCapitalization: TextCapitalization.characters,
              prefixIcon: Icon(Icons.qr_code, color: isExit ? const Color(0xFFF59E0B) : const Color(0xFF06B6D4), size: 20),
            ),
            const SizedBox(height: 16),

            LiquidGlassButton(
              onPressed: _submitScan,
              gradient: isExit ? const LinearGradient(colors: [Color(0xFFF59E0B), Color(0xFFE11D48)]) : null,
              label: isExit ? "Validate & Record Exit" : "Validate & Permit Entry",
              icon: isExit ? Icons.door_front_door_outlined : Icons.check_circle_outline,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDeliveryView() {
    return SingleChildScrollView(
      physics: const ClampingScrollPhysics(),
      padding: const EdgeInsets.only(bottom: 90),
      child: FrostedGlassCard(
        borderRadius: 28,
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Align(
              alignment: Alignment.centerLeft,
              child: TextButton.icon(
                onPressed: () => setState(() => _activeView = 0),
                icon: const Icon(Icons.arrow_back, color: Color(0xFF94A3B8), size: 18),
                label: const Text("Back to Main Menu", style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12, fontWeight: FontWeight.bold)),
              ),
            ),
            const SizedBox(height: 8),

            GlassTextField(
              controller: _companyController,
              labelText: "Delivery Company *",
              hintText: "Amazon, Zomato, Swiggy, Flipkart...",
              prefixIcon: const Icon(Icons.business, color: Color(0xFF06B6D4), size: 20),
            ),
            const SizedBox(height: 12),

            GlassTextField(
              controller: _personController,
              labelText: "Delivery Agent Name *",
              hintText: "Agent Name",
              prefixIcon: const Icon(Icons.person_outline, color: Color(0xFF06B6D4), size: 20),
            ),
            const SizedBox(height: 12),

            GlassTextField(
              controller: _phoneController,
              labelText: "Agent Mobile Number (Optional)",
              hintText: "10-digit mobile number",
              keyboardType: TextInputType.phone,
              prefixIcon: const Icon(Icons.phone_outlined, color: Color(0xFF06B6D4), size: 20),
            ),
            const SizedBox(height: 16),

            // Wing + Flat Addition Box
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(20),
                gradient: LinearGradient(
                  colors: [
                    const Color(0xFF0F172A).withValues(alpha: 0.85),
                    const Color(0xFF131E33).withValues(alpha: 0.75),
                  ],
                ),
                border: Border.all(color: Colors.white.withValues(alpha: 0.14)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text("Add Destination Flats *", style: TextStyle(color: Color(0xFF06B6D4), fontWeight: FontWeight.bold, fontSize: 12)),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                        flex: 1,
                        child: GlassTextField(
                          controller: _wingController,
                          hintText: "Wing (A)",
                          textCapitalization: TextCapitalization.characters,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        flex: 2,
                        child: GlassTextField(
                          controller: _flatController,
                          hintText: "Flat # (101)",
                          keyboardType: TextInputType.number,
                        ),
                      ),
                      const SizedBox(width: 8),
                      IconButton(
                        icon: const Icon(Icons.add_circle, color: Color(0xFF06B6D4), size: 38),
                        onPressed: _addDestination,
                      ),
                    ],
                  ),
                  if (_selectedDestinations.isNotEmpty) ...[
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: _selectedDestinations.map((dest) {
                        return GlassPillChip(
                          label: dest,
                          onDeleted: () => setState(() => _selectedDestinations.remove(dest)),
                        );
                      }).toList(),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 20),

            LiquidGlassButton(
              onPressed: _isSubmittingDelivery ? null : _submitDelivery,
              isLoading: _isSubmittingDelivery,
              label: "RECORD DELIVERY ENTRY",
              icon: Icons.check_circle,
            ),
          ],
        ),
      ),
    );
  }
}
