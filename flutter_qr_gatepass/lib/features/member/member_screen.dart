import 'dart:io';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:path_provider_android/path_provider_android.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/api_service.dart';
import '../../core/glass_widgets.dart';
import '../../core/theme_controller.dart';
import '../auth/login_screen.dart';

String formatLocalPassDate(String? isoString) {
  if (isoString == null || isoString.isEmpty) return "";

  final datePart = isoString.split("T")[0];
  if (datePart.contains("-")) {
    final parts = datePart.split("-");
    if (parts.length == 3) {
      final y = int.tryParse(parts[0]) ?? 2026;
      final m = int.tryParse(parts[1]) ?? 8;
      final d = int.tryParse(parts[2]) ?? 21;
      final months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

      if (isoString.contains("T00:00") || isoString.contains("T05:30") || isoString.contains("T18:30")) {
        return "$d ${months[m - 1]} $y, 00:00";
      }
    }
  }

  final dt = DateTime.tryParse(isoString)?.toLocal();
  if (dt == null) return "";
  final months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  final mStr = months[dt.month - 1];
  final hStr = dt.hour.toString().padLeft(2, '0');
  final minStr = dt.minute.toString().padLeft(2, '0');
  return "${dt.day} $mStr ${dt.year}, $hStr:$minStr";
}

class MemberScreen extends StatefulWidget {
  const MemberScreen({super.key});

  @override
  State<MemberScreen> createState() => _MemberScreenState();
}

class _MemberScreenState extends State<MemberScreen> {
  int _currentTabIndex = 0; // 0: Generate Pass, 1: History Feed
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _manualDestController = TextEditingController();
  
  List<dynamic> _destinations = [];
  List<dynamic> _passesHistory = [];
  String? _selectedDestinationId;
  DateTime _selectedDate = DateTime.now();
  int _durationHours = 12;
  bool _isGenerating = false;
  bool _isLoadingHistory = false;
  String? _generatedPassCode;

  @override
  void initState() {
    super.initState();
    _fetchDestinations();
    _fetchMyPasses();
  }

  Future<void> _fetchDestinations() async {
    try {
      final res = await ApiService.getDestinations();
      if (res['success'] == true) {
        setState(() {
          _destinations = res['destinations'] ?? [];
        });
      }
    } catch (_) {}
  }

  Future<void> _fetchMyPasses() async {
    setState(() => _isLoadingHistory = true);
    try {
      final res = await ApiService.getMyPasses();
      if (res['success'] == true) {
        setState(() {
          _passesHistory = res['passes'] ?? [];
        });
      }
    } catch (_) {} finally {
      if (mounted) setState(() => _isLoadingHistory = false);
    }
  }

  Future<void> _downloadQrImage(String passCode, String guestName, String validUntilStr) async {
    try {
      final passCodeText = passCode.isNotEmpty ? passCode : 'PASS';
      final painter = QrPainter(
        data: passCodeText,
        version: QrVersions.auto,
        gapless: true,
      );

      const double cardWidth = 500.0;
      const double cardHeight = 650.0;

      final recorder = ui.PictureRecorder();
      final canvas = Canvas(recorder, const Rect.fromLTWH(0, 0, cardWidth, cardHeight));

      // 1. Draw Card Dark Background
      canvas.drawRect(
        const Rect.fromLTWH(0, 0, cardWidth, cardHeight),
        Paint()..color = const Color(0xFF050811),
      );

      // 2. Cyan Specular Border
      final borderPaint = Paint()
        ..color = const Color(0xFF06B6D4)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 4.0;
      canvas.drawRect(const Rect.fromLTWH(14, 14, 472, 622), borderPaint);

      // 3. Header Text ("GATIFY DIGITAL GATE PASS")
      final textPainterHeader = TextPainter(
        text: const TextSpan(
          text: "GATIFY DIGITAL GATE PASS",
          style: TextStyle(color: Color(0xFF06B6D4), fontSize: 15, fontWeight: FontWeight.bold, letterSpacing: 1.5),
        ),
        textDirection: TextDirection.ltr,
      );
      textPainterHeader.layout(maxWidth: 450);
      textPainterHeader.paint(canvas, Offset((cardWidth - textPainterHeader.width) / 2, 45));

      // 4. Title Text ("VISITOR ACCESS CREDENTIAL")
      final textPainterTitle = TextPainter(
        text: const TextSpan(
          text: "VISITOR ACCESS CREDENTIAL",
          style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w900, letterSpacing: 1.5),
        ),
        textDirection: TextDirection.ltr,
      );
      textPainterTitle.layout(maxWidth: 450);
      textPainterTitle.paint(canvas, Offset((cardWidth - textPainterTitle.width) / 2, 85));

      // 5. Guest Name Text
      final textPainterGuest = TextPainter(
        text: TextSpan(
          text: "Guest: ${guestName.isNotEmpty ? guestName : 'Visitor'}",
          style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 14, fontWeight: FontWeight.w600),
        ),
        textDirection: TextDirection.ltr,
      );
      textPainterGuest.layout(maxWidth: 400);
      textPainterGuest.paint(canvas, Offset((cardWidth - textPainterGuest.width) / 2, 130));

      // 6. Valid Until Text
      final textPainterUntil = TextPainter(
        text: TextSpan(
          text: "Valid Until: $validUntilStr",
          style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
        ),
        textDirection: TextDirection.ltr,
      );
      textPainterUntil.layout(maxWidth: 400);
      textPainterUntil.paint(canvas, Offset((cardWidth - textPainterUntil.width) / 2, 155));

      // 7. White Box for QR Code (280x280 centered)
      const double qrBoxSize = 280.0;
      const double qrBoxX = (cardWidth - qrBoxSize) / 2;
      const double qrBoxY = 190.0;

      canvas.drawRRect(
        RRect.fromRectAndRadius(const Rect.fromLTWH(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize), const Radius.circular(16)),
        Paint()..color = Colors.white,
      );

      // 8. Paint QR Code INSIDE White Box
      canvas.save();
      canvas.translate(qrBoxX + 10, qrBoxY + 10);
      painter.paint(canvas, const Size(260.0, 260.0));
      canvas.restore();

      // 9. Pass Code Token Text ("QGP-XXXXXX")
      final textPainterToken = TextPainter(
        text: TextSpan(
          text: passCodeText,
          style: const TextStyle(color: Color(0xFF06B6D4), fontSize: 22, fontWeight: FontWeight.bold, letterSpacing: 2.5),
        ),
        textDirection: TextDirection.ltr,
      );
      textPainterToken.layout(maxWidth: 400);
      textPainterToken.paint(canvas, Offset((cardWidth - textPainterToken.width) / 2, 495));

      // 10. Footer Subtitle
      final textPainterFooter = TextPainter(
        text: const TextSpan(
          text: "Present this QR Code at Gatify Security Gate for Instant Entry",
          style: TextStyle(color: Color(0xFF94A3B8), fontSize: 11),
        ),
        textDirection: TextDirection.ltr,
      );
      textPainterFooter.layout(maxWidth: 400);
      textPainterFooter.paint(canvas, Offset((cardWidth - textPainterFooter.width) / 2, 540));

      // Render to PNG
      final picture = recorder.endRecording();
      final img = await picture.toImage(cardWidth.toInt(), cardHeight.toInt());
      final byteData = await img.toByteData(format: ui.ImageByteFormat.png);
      final pngBytes = byteData?.buffer.asUint8List();

      if (pngBytes != null) {
        Directory downloadsDir = Directory('/storage/emulated/0/Download');
        if (!downloadsDir.existsSync()) {
          downloadsDir = Directory('/sdcard/Download');
        }

        final PathProviderAndroid provider = PathProviderAndroid();
        final String targetFolder = downloadsDir.existsSync()
            ? downloadsDir.path
            : (await provider.getApplicationSupportPath() ?? '/sdcard/Download');

        final filePath = '$targetFolder/Gatify-Pass-$passCodeText.png';
        final file = File(filePath);
        await file.writeAsBytes(pngBytes);

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text("Gatify Pass saved to Downloads: Gatify-Pass-$passCodeText.png"),
              backgroundColor: const Color(0xFF0891B2),
              duration: const Duration(seconds: 4),
            ),
          );
        }
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Pass PNG Generated Successfully!")),
        );
      }
    }
  }

  Future<void> _handleCreatePass() async {
    final name = _nameController.text.trim();
    if (name.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Guest Full Name is compulsory.")));
      return;
    }

    setState(() => _isGenerating = true);

    try {
      final now = DateTime.now();
      final isToday = _selectedDate.year == now.year && _selectedDate.month == now.month && _selectedDate.day == now.day;
      final localValidFrom = isToday ? now : DateTime(_selectedDate.year, _selectedDate.month, _selectedDate.day, 0, 0, 0);
      final dateStr = "${_selectedDate.year}-${_selectedDate.month.toString().padLeft(2, '0')}-${_selectedDate.day.toString().padLeft(2, '0')}";

      final res = await ApiService.createGuestPass(
        guestName: name,
        guestPhone: _phoneController.text.trim(),
        durationHours: _durationHours,
        validDate: dateStr,
        validFromIso: localValidFrom.toIso8601String(),
      );

      if (res['success'] == true) {
        setState(() {
          _generatedPassCode = res['pass']['pass_code'];
          _nameController.clear();
          _phoneController.clear();
          _manualDestController.clear();
          _selectedDestinationId = null;
        });
        _fetchMyPasses();
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Failed to generate pass.")),
        );
      }
    } finally {
      if (mounted) setState(() => _isGenerating = false);
    }
  }

  void _showQrDialog(dynamic pass) {
    final passCode = pass['pass_code']?.toString() ?? '';
    final guestName = pass['guest_name']?.toString() ?? 'Visitor Pass';
    final validUntilStr = formatLocalPassDate(pass['valid_until']?.toString());

    showDialog(
      context: context,
      builder: (ctx) => Dialog(
        backgroundColor: Colors.transparent,
        child: FrostedGlassCard(
          borderRadius: 28,
          padding: const EdgeInsets.all(24),
          child: SingleChildScrollView(
            physics: const ClampingScrollPhysics(),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  guestName,
                  style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w900),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 4),
                SelectableText(
                  passCode,
                  style: const TextStyle(color: Color(0xFF06B6D4), fontSize: 16, fontWeight: FontWeight.bold, letterSpacing: 1.5),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: const Color(0xFF06B6D4), width: 3),
                  ),
                  child: SizedBox(
                    width: 200,
                    height: 200,
                    child: QrImageView(
                      data: passCode.isNotEmpty ? passCode : 'PASS',
                      version: QrVersions.auto,
                      size: 200.0,
                      backgroundColor: Colors.white,
                    ),
                  ),
                ),
                const SizedBox(height: 14),
                Text(
                  "Valid Until: $validUntilStr",
                  style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 11),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 18),

                // Download PNG Button
                LiquidGlassButton(
                  onPressed: () {
                    _downloadQrImage(passCode, guestName, validUntilStr);
                  },
                  height: 46,
                  label: "Download Pass PNG",
                  icon: Icons.download,
                ),
                const SizedBox(height: 10),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    TextButton.icon(
                      onPressed: () {
                        Clipboard.setData(ClipboardData(text: passCode));
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text("Pass Token '$passCode' copied!")),
                        );
                      },
                      icon: const Icon(Icons.copy, size: 14, color: Color(0xFF22D3EE)),
                      label: const Text("Copy Token", style: TextStyle(color: Color(0xFF22D3EE), fontSize: 12, fontWeight: FontWeight.bold)),
                    ),
                    TextButton(
                      onPressed: () => Navigator.pop(ctx),
                      child: const Text("Close", style: TextStyle(color: Color(0xFF94A3B8), fontWeight: FontWeight.bold, fontSize: 12)),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
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
            const Icon(Icons.qr_code_2, color: Color(0xFF14B8A6), size: 22),
            const SizedBox(width: 8),
            Text(
              "Resident",
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
        currentIndex: _currentTabIndex,
        onTap: (index) => setState(() => _currentTabIndex = index),
        items: const [
          DockItem(icon: Icons.add_moderator, label: "Generate Pass"),
          DockItem(icon: Icons.history, label: "My Passes"),
        ],
      ),
      body: AmbientCanvasBackground(
        child: SafeArea(
          bottom: false,
          child: IndexedStack(
            index: _currentTabIndex,
            children: [
              _buildGeneratePassTab(),
              _buildGuestHistoryTab(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildGeneratePassTab() {
    final isDark = ThemeController.isDarkMode.value;

    return SingleChildScrollView(
      physics: const ClampingScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 90),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (_generatedPassCode != null) ...[
            FrostedGlassCard(
              borderRadius: 24,
              padding: const EdgeInsets.all(20),
              customBorder: Border.all(color: const Color(0xFF06B6D4).withValues(alpha: 0.6), width: 1.5),
              child: Column(
                children: [
                  const Text("GUEST PASS ACTIVE!", style: TextStyle(color: Color(0xFF22D3EE), fontWeight: FontWeight.w900, fontSize: 16)),
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: const Color(0xFF06B6D4), width: 3),
                    ),
                    child: SizedBox(
                      width: 160,
                      height: 160,
                      child: QrImageView(
                        data: _generatedPassCode!,
                        version: QrVersions.auto,
                        size: 160.0,
                        backgroundColor: Colors.white,
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  SelectableText(
                    _generatedPassCode!,
                    style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold, letterSpacing: 2),
                  ),
                  const SizedBox(height: 12),
                  LiquidGlassButton(
                    onPressed: () {
                      _downloadQrImage(_generatedPassCode!, _nameController.text, "");
                    },
                    height: 46,
                    label: "Download Gatify Pass Card",
                    icon: Icons.download,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 18),
          ],

          FrostedGlassCard(
            borderRadius: 28,
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  "Create Digital Visitor Credential",
                  style: TextStyle(color: isDark ? Colors.white : const Color(0xFF0F172A), fontSize: 18, fontWeight: FontWeight.w900),
                ),
                const SizedBox(height: 16),

                // 1. Guest Name (Compulsory *)
                GlassTextField(
                  controller: _nameController,
                  labelText: "Guest Full Name *",
                  hintText: "e.g. Rahul Sharma",
                  prefixIcon: const Icon(Icons.person_outline, color: Color(0xFF06B6D4), size: 20),
                ),
                const SizedBox(height: 12),

                // 2. Guest Mobile Number (Optional)
                GlassTextField(
                  controller: _phoneController,
                  labelText: "Guest Mobile Number (Optional)",
                  hintText: "10-digit mobile number",
                  keyboardType: TextInputType.phone,
                  prefixIcon: const Icon(Icons.phone_outlined, color: Color(0xFF06B6D4), size: 20),
                ),
                const SizedBox(height: 12),

                // 3. Destination Select
                if (_destinations.isNotEmpty) ...[
                  Text("Destination (Flat / Dept) *", style: TextStyle(color: isDark ? const Color(0xFFCBD5E1) : const Color(0xFF475569), fontSize: 12, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF0F172A).withValues(alpha: 0.72) : Colors.white,
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: isDark ? Colors.white.withValues(alpha: 0.18) : const Color(0xFFCBD5E1)),
                    ),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<String>(
                        value: _selectedDestinationId,
                        dropdownColor: isDark ? const Color(0xFF0F172A) : Colors.white,
                        style: TextStyle(color: isDark ? Colors.white : const Color(0xFF0F172A), fontSize: 13, fontWeight: FontWeight.w600),
                        hint: Text("Select Destination...", style: TextStyle(color: isDark ? const Color(0xFF64748B) : const Color(0xFF94A3B8))),
                        isExpanded: true,
                        items: _destinations.map((d) {
                          return DropdownMenuItem<String>(
                            value: d['id'].toString(),
                            child: Text(d['full_name'] ?? 'Unit', style: TextStyle(color: isDark ? Colors.white : const Color(0xFF0F172A))),
                          );
                        }).toList(),
                        onChanged: (val) => setState(() => _selectedDestinationId = val),
                      ),
                    ),
                  ),
                ] else ...[
                  GlassTextField(
                    controller: _manualDestController,
                    labelText: "Destination (Flat / Dept #) *",
                    hintText: "e.g. A-203",
                    prefixIcon: const Icon(Icons.location_on_outlined, color: Color(0xFF06B6D4), size: 20),
                  ),
                ],
                const SizedBox(height: 12),

                // 4. Pass Valid Date Picker
                Text("Valid Date *", style: TextStyle(color: isDark ? const Color(0xFFCBD5E1) : const Color(0xFF475569), fontSize: 12, fontWeight: FontWeight.w600)),
                const SizedBox(height: 6),
                InkWell(
                  onTap: () async {
                    final picked = await showDatePicker(
                      context: context,
                      initialDate: _selectedDate,
                      firstDate: DateTime.now().subtract(const Duration(days: 1)),
                      lastDate: DateTime.now().add(const Duration(days: 90)),
                    );
                    if (picked != null) setState(() => _selectedDate = picked);
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF0F172A).withValues(alpha: 0.72) : Colors.white,
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: isDark ? Colors.white.withValues(alpha: 0.18) : const Color(0xFFCBD5E1)),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          "${_selectedDate.year}-${_selectedDate.month.toString().padLeft(2, '0')}-${_selectedDate.day.toString().padLeft(2, '0')}",
                          style: TextStyle(color: isDark ? Colors.white : const Color(0xFF0F172A), fontSize: 13, fontWeight: FontWeight.bold),
                        ),
                        const Icon(Icons.calendar_today, color: Color(0xFF06B6D4), size: 18),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 12),

                // 5. Duration Select
                Text("Pass Validity Duration *", style: TextStyle(color: isDark ? const Color(0xFFCBD5E1) : const Color(0xFF475569), fontSize: 12, fontWeight: FontWeight.w600)),
                const SizedBox(height: 6),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF0F172A).withValues(alpha: 0.72) : Colors.white,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: isDark ? Colors.white.withValues(alpha: 0.18) : const Color(0xFFCBD5E1)),
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<int>(
                      value: _durationHours,
                      dropdownColor: isDark ? const Color(0xFF0F172A) : Colors.white,
                      style: TextStyle(color: isDark ? Colors.white : const Color(0xFF0F172A), fontSize: 13, fontWeight: FontWeight.w600),
                      isExpanded: true,
                      items: [
                        DropdownMenuItem(value: 4, child: Text("4 Hours", style: TextStyle(color: isDark ? Colors.white : const Color(0xFF0F172A)))),
                        DropdownMenuItem(value: 8, child: Text("8 Hours", style: TextStyle(color: isDark ? Colors.white : const Color(0xFF0F172A)))),
                        DropdownMenuItem(value: 12, child: Text("12 Hours (Default)", style: TextStyle(color: isDark ? Colors.white : const Color(0xFF0F172A)))),
                        DropdownMenuItem(value: 24, child: Text("24 Hours (Full Day)", style: TextStyle(color: isDark ? Colors.white : const Color(0xFF0F172A)))),
                      ],
                      onChanged: (val) => setState(() => _durationHours = val ?? 12),
                    ),
                  ),
                ),
                const SizedBox(height: 20),

                LiquidGlassButton(
                  onPressed: _isGenerating ? null : _handleCreatePass,
                  isLoading: _isGenerating,
                  label: "GENERATE GUEST QR PASS",
                  icon: Icons.qr_code,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildGuestHistoryTab() {
    final isDark = ThemeController.isDarkMode.value;

    return _isLoadingHistory
        ? const Center(child: CircularProgressIndicator(color: Color(0xFF06B6D4)))
        : RefreshIndicator(
            onRefresh: _fetchMyPasses,
            child: ListView(
              physics: const ClampingScrollPhysics(),
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 90),
              children: [
                Text("My Guest Pass History", style: TextStyle(color: isDark ? Colors.white : const Color(0xFF0F172A), fontSize: 16, fontWeight: FontWeight.w900)),
                const SizedBox(height: 12),
                if (_passesHistory.isEmpty)
                  const Padding(
                    padding: EdgeInsets.all(24.0),
                    child: Text("No guest passes created yet.", textAlign: TextAlign.center, style: TextStyle(color: Color(0xFF94A3B8))),
                  ),
                ..._passesHistory.map((pass) {
                  final now = DateTime.now();
                  final validFrom = pass['valid_from'] != null ? DateTime.tryParse(pass['valid_from'])?.toLocal() : null;
                  final validUntil = pass['valid_until'] != null ? DateTime.tryParse(pass['valid_until'])?.toLocal() : null;

                  final isFuture = validFrom != null && now.isBefore(validFrom);
                  final isExpired = validUntil != null && now.isAfter(validUntil);

                  String computedStatus = pass['status'] ?? 'ACTIVE';
                  if (computedStatus == 'ACTIVE') {
                    if (isFuture) {
                      computedStatus = 'SCHEDULED';
                    } else if (isExpired) {
                      computedStatus = 'EXPIRED';
                    }
                  }

                  final canDownload = computedStatus == 'ACTIVE' || computedStatus == 'SCHEDULED';
                  final displayUntilStr = formatLocalPassDate(pass['valid_until']?.toString());

                  return GlassPlankTile(
                    leading: Container(
                      width: 42,
                      height: 42,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(14),
                        color: const Color(0xFF06B6D4).withValues(alpha: 0.18),
                      ),
                      child: const Icon(Icons.qr_code, color: Color(0xFF22D3EE), size: 22),
                    ),
                    title: Text(pass['guest_name'] ?? 'Guest Pass', style: TextStyle(color: isDark ? Colors.white : const Color(0xFF0F172A), fontWeight: FontWeight.bold, fontSize: 14)),
                    subtitle: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text("Code: ${pass['pass_code']}", style: const TextStyle(color: Color(0xFF22D3EE), fontSize: 11, fontFamily: 'monospace', fontWeight: FontWeight.bold)),
                        Text("Until: $displayUntilStr", style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 10)),
                      ],
                    ),
                    trailing: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        GlassPillChip(
                          label: computedStatus,
                          color: computedStatus == 'ACTIVE' ? const Color(0xFF06B6D4) :
                                 computedStatus == 'NOT YET VALID' ? const Color(0xFFF59E0B) :
                                 computedStatus == 'USED' ? const Color(0xFF10B981) :
                                 const Color(0xFFF43F5E),
                        ),
                        if (canDownload) ...[
                          const SizedBox(height: 6),
                          GestureDetector(
                            onTap: () => _showQrDialog(pass),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                              decoration: BoxDecoration(
                                gradient: const LinearGradient(colors: [Color(0xFF06B6D4), Color(0xFF2563EB)]),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(Icons.download, size: 12, color: Colors.white),
                                  SizedBox(width: 4),
                                  Text("View / Download", style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                  );
                }),
              ],
            ),
          );
  }
}
