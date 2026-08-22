import 'dart:io';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:path_provider_android/path_provider_android.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/api_service.dart';
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

class _MemberScreenState extends State<MemberScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
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
    _tabController = TabController(length: 2, vsync: this);
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
    } catch (e) {
      // ignore
    }
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
    } catch (e) {
      // ignore
    } finally {
      setState(() => _isLoadingHistory = false);
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
        Paint()..color = const Color(0xFF0F172A),
      );

      // 2. Cyan Border
      final borderPaint = Paint()
        ..color = const Color(0xFF06B6D4)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 6.0;
      canvas.drawRect(const Rect.fromLTWH(12, 12, 476, 626), borderPaint);

      // 3. Header Text ("SURVEILEYE DIGITAL GATE PASS")
      final textPainterHeader = TextPainter(
        text: const TextSpan(
          text: "SURVEILEYE DIGITAL GATE PASS",
          style: TextStyle(color: Color(0xFF06B6D4), fontSize: 16, fontWeight: FontWeight.bold, letterSpacing: 1.5),
        ),
        textDirection: TextDirection.ltr,
      );
      textPainterHeader.layout(maxWidth: 450);
      textPainterHeader.paint(canvas, Offset((cardWidth - textPainterHeader.width) / 2, 45));

      // 4. Title Text ("VISITOR ACCESS PASS")
      final textPainterTitle = TextPainter(
        text: const TextSpan(
          text: "VISITOR ACCESS PASS",
          style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w900, letterSpacing: 2),
        ),
        textDirection: TextDirection.ltr,
      );
      textPainterTitle.layout(maxWidth: 450);
      textPainterTitle.paint(canvas, Offset((cardWidth - textPainterTitle.width) / 2, 85));

      // 5. Guest Name Text
      final textPainterGuest = TextPainter(
        text: TextSpan(
          text: "Guest: ${guestName.isNotEmpty ? guestName : 'Visitor'}",
          style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 15, fontWeight: FontWeight.w600),
        ),
        textDirection: TextDirection.ltr,
      );
      textPainterGuest.layout(maxWidth: 400);
      textPainterGuest.paint(canvas, Offset((cardWidth - textPainterGuest.width) / 2, 130));

      // 6. Valid Until Text
      final textPainterUntil = TextPainter(
        text: TextSpan(
          text: "Valid Until: $validUntilStr",
          style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
        ),
        textDirection: TextDirection.ltr,
      );
      textPainterUntil.layout(maxWidth: 400);
      textPainterUntil.paint(canvas, Offset((cardWidth - textPainterUntil.width) / 2, 155));

      // 7. White Box for QR Code (280x280 centered)
      const double qrBoxSize = 280.0;
      const double qrBoxX = (cardWidth - qrBoxSize) / 2; // 110.0
      const double qrBoxY = 190.0;

      canvas.drawRRect(
        RRect.fromRectAndRadius(const Rect.fromLTWH(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize), const Radius.circular(16)),
        Paint()..color = Colors.white,
      );

      // 8. Paint QR Code INSIDE White Box with canvas.save() & canvas.translate()
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
          text: "Present this QR Code at the Security Gate for Entry",
          style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
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

        final filePath = '$targetFolder/QR-Pass-$passCodeText.png';
        final file = File(filePath);
        await file.writeAsBytes(pngBytes);

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text("QR Pass Card saved to Downloads: QR-Pass-$passCodeText.png"),
              backgroundColor: const Color(0xFF0891B2),
              duration: const Duration(seconds: 4),
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("QR Pass PNG Downloaded Successfully!")),
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
      final localValidFrom = DateTime(_selectedDate.year, _selectedDate.month, _selectedDate.day, 0, 0, 0);
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
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Failed to generate pass.")),
      );
    } finally {
      setState(() => _isGenerating = false);
    }
  }

  void _showQrDialog(dynamic pass) {
    final passCode = pass['pass_code']?.toString() ?? '';
    final guestName = pass['guest_name']?.toString() ?? 'Visitor Pass';
    final validUntilStr = formatLocalPassDate(pass['valid_until']?.toString());

    showDialog(
      context: context,
      builder: (ctx) => Dialog(
        backgroundColor: const Color(0xFF1E293B),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        child: Container(
          padding: const EdgeInsets.all(20),
          width: 320,
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  guestName,
                  style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 4),
                SelectableText(
                  passCode,
                  style: const TextStyle(color: Color(0xFF06B6D4), fontSize: 16, fontWeight: FontWeight.bold, letterSpacing: 1),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
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
                const SizedBox(height: 16),

                // Download PNG Button
                Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    ElevatedButton.icon(
                      onPressed: () {
                        _downloadQrImage(passCode, guestName, validUntilStr);
                      },
                      icon: const Icon(Icons.file_download, size: 18, color: Colors.white),
                      label: const Text("DOWNLOAD QR PASS IMAGE", style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF0891B2),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: [
                        TextButton.icon(
                          onPressed: () {
                            Clipboard.setData(ClipboardData(text: passCode));
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text("QR Pass Token '$passCode' copied!")),
                            );
                          },
                          icon: const Icon(Icons.copy, size: 14, color: Color(0xFF06B6D4)),
                          label: const Text("Copy Token", style: TextStyle(color: Color(0xFF06B6D4), fontSize: 11, fontWeight: FontWeight.bold)),
                        ),
                        TextButton(
                          onPressed: () => Navigator.pop(ctx),
                          child: const Text("Close", style: TextStyle(color: Color(0xFF94A3B8), fontWeight: FontWeight.bold, fontSize: 11)),
                        ),
                      ],
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
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E293B),
        title: const Text("Member Portal", style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
        actions: [
          IconButton(icon: const Icon(Icons.logout, color: Colors.redAccent), onPressed: _logout),
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: const Color(0xFF06B6D4),
          labelColor: const Color(0xFF06B6D4),
          unselectedLabelColor: const Color(0xFF94A3B8),
          tabs: const [
            Tab(text: "Generate Pass"),
            Tab(text: "Guest History"),
          ],
        ),
      ),
      body: SafeArea(
        child: TabBarView(
          controller: _tabController,
          children: [
            _buildGeneratePassTab(),
            _buildGuestHistoryTab(),
          ],
        ),
      ),
    );
  }

  Widget _buildGeneratePassTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text("Generate Visitor QR Pass", style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),

          if (_generatedPassCode != null) ...[
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: const Color(0xFF1E293B),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: const Color(0xFF06B6D4)),
              ),
              child: Column(
                children: [
                  const Text("PASS GENERATED!", style: TextStyle(color: Color(0xFF06B6D4), fontWeight: FontWeight.bold)),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: 180,
                    height: 180,
                    child: QrImageView(
                      data: _generatedPassCode!,
                      version: QrVersions.auto,
                      size: 180.0,
                      backgroundColor: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 12),
                  SelectableText(
                    _generatedPassCode!,
                    style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold, letterSpacing: 2),
                  ),
                  const SizedBox(height: 12),
                  ElevatedButton.icon(
                    onPressed: () {
                      _downloadQrImage(_generatedPassCode!, _nameController.text, "");
                    },
                    icon: const Icon(Icons.file_download, color: Colors.white, size: 16),
                    label: const Text("DOWNLOAD QR PASS IMAGE", style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                    style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF0891B2)),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
          ],

          // 1. Guest Name (Compulsory *)
          TextField(
            controller: _nameController,
            style: const TextStyle(color: Colors.white),
            decoration: InputDecoration(
              labelText: "Guest Full Name *",
              labelStyle: const TextStyle(color: Color(0xFF94A3B8)),
              filled: true,
              fillColor: const Color(0xFF1E293B),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
            ),
          ),
          const SizedBox(height: 12),

          // 2. Guest Mobile Number (Optional)
          TextField(
            controller: _phoneController,
            keyboardType: TextInputType.phone,
            style: const TextStyle(color: Colors.white),
            decoration: InputDecoration(
              labelText: "Guest Mobile Number (Optional)",
              labelStyle: const TextStyle(color: Color(0xFF94A3B8)),
              filled: true,
              fillColor: const Color(0xFF1E293B),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
            ),
          ),
          const SizedBox(height: 12),

          // 3. Destination Select / Input (Compulsory *)
          _destinations.isNotEmpty
              ? DropdownButtonFormField<String>(
                  initialValue: _selectedDestinationId,
                  dropdownColor: const Color(0xFF1E293B),
                  style: const TextStyle(color: Colors.white),
                  decoration: InputDecoration(
                    labelText: "Destination (Flat / Dept) *",
                    labelStyle: const TextStyle(color: Color(0xFF94A3B8)),
                    filled: true,
                    fillColor: const Color(0xFF1E293B),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                  items: _destinations.map((d) {
                    return DropdownMenuItem<String>(
                      value: d['id'].toString(),
                      child: Text(d['full_name'] ?? 'Unit'),
                    );
                  }).toList(),
                  onChanged: (val) => setState(() => _selectedDestinationId = val),
                )
              : TextField(
                  controller: _manualDestController,
                  style: const TextStyle(color: Colors.white),
                  decoration: InputDecoration(
                    labelText: "Destination (Flat / Dept #) *",
                    labelStyle: const TextStyle(color: Color(0xFF94A3B8)),
                    filled: true,
                    fillColor: const Color(0xFF1E293B),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                ),
          const SizedBox(height: 12),

          // 4. Pass Valid Date Picker (Compulsory *)
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
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
              decoration: BoxDecoration(
                color: const Color(0xFF1E293B),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFF334155)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text("Valid Date *: ${_selectedDate.year}-${_selectedDate.month.toString().padLeft(2, '0')}-${_selectedDate.day.toString().padLeft(2, '0')}", style: const TextStyle(color: Colors.white)),
                  const Icon(Icons.calendar_today, color: Color(0xFF06B6D4), size: 18),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),

          // 5. Duration Select (Compulsory *)
          DropdownButtonFormField<int>(
            initialValue: _durationHours,
            dropdownColor: const Color(0xFF1E293B),
            style: const TextStyle(color: Colors.white),
            decoration: InputDecoration(
              labelText: "Pass Validity Duration *",
              labelStyle: const TextStyle(color: Color(0xFF94A3B8)),
              filled: true,
              fillColor: const Color(0xFF1E293B),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
            ),
            items: const [
              DropdownMenuItem(value: 4, child: Text("4 Hours")),
              DropdownMenuItem(value: 8, child: Text("8 Hours")),
              DropdownMenuItem(value: 12, child: Text("12 Hours (Default)")),
              DropdownMenuItem(value: 24, child: Text("24 Hours (Full Day)")),
            ],
            onChanged: (val) => setState(() => _durationHours = val ?? 12),
          ),
          const SizedBox(height: 24),

          ElevatedButton(
            onPressed: _isGenerating ? null : _handleCreatePass,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF0891B2),
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            ),
            child: _isGenerating
                ? const CircularProgressIndicator(color: Colors.white)
                : const Text("GENERATE GUEST QR PASS", style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  Widget _buildGuestHistoryTab() {
    return _isLoadingHistory
        ? const Center(child: CircularProgressIndicator(color: Color(0xFF0891B2)))
        : RefreshIndicator(
            onRefresh: _fetchMyPasses,
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                const Text("My Guest Pass History", style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
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
                  if (pass['status'] != 'USED' && pass['status'] != 'REVOKED') {
                    if (isFuture) {
                      computedStatus = 'NOT YET VALID';
                    } else if (isExpired) {
                      computedStatus = 'EXPIRED';
                    } else {
                      computedStatus = 'ACTIVE';
                    }
                  }

                  final canDownload = computedStatus == 'ACTIVE' || computedStatus == 'NOT YET VALID';
                  final displayUntilStr = formatLocalPassDate(pass['valid_until']?.toString());

                  return Card(
                    color: const Color(0xFF1E293B),
                    margin: const EdgeInsets.only(bottom: 8),
                    child: ListTile(
                      title: Text(pass['guest_name'] ?? 'Guest Pass', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                      subtitle: Text("Code: ${pass['pass_code']}\nUntil: $displayUntilStr", style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 11)),
                      trailing: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: computedStatus == 'ACTIVE' ? Colors.cyan.withValues(alpha: 0.2) :
                                     computedStatus == 'NOT YET VALID' ? Colors.blue.withValues(alpha: 0.2) :
                                     computedStatus == 'USED' ? Colors.green.withValues(alpha: 0.2) :
                                     Colors.red.withValues(alpha: 0.2),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              computedStatus,
                              style: TextStyle(
                                color: computedStatus == 'ACTIVE' ? Colors.cyanAccent :
                                       computedStatus == 'NOT YET VALID' ? Colors.lightBlueAccent :
                                       computedStatus == 'USED' ? Colors.greenAccent :
                                       Colors.redAccent,
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                          if (canDownload) ...[
                            const SizedBox(height: 4),
                            ElevatedButton.icon(
                              onPressed: () => _showQrDialog(pass),
                              icon: const Icon(Icons.file_download, size: 12, color: Colors.white),
                              label: const Text("Download / View", style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF0891B2),
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                minimumSize: Size.zero,
                                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  );
                }),
              ],
            ),
          );
  }
}
