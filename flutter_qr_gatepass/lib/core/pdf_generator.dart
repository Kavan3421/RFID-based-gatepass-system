import 'dart:convert';
import 'dart:typed_data';

class SimplePdfGenerator {
  static Uint8List createReportPdf({
    required String orgName,
    required List<dynamic> records,
    String? filterInfo,
  }) {
    final buffer = StringBuffer();

    // Helper: Draw text block with escaping
    void drawText(String text, double x, double y, {double fontSize = 10, bool isBold = false}) {
      final safeText = text
          .replaceAll('\\', '\\\\')
          .replaceAll('(', '\\(')
          .replaceAll(')', '\\)');
      final fontName = isBold ? '/F2' : '/F1';
      buffer.writeln('BT');
      buffer.writeln('$fontName $fontSize Tf');
      buffer.writeln('1 0 0 1 $x $y Tm');
      buffer.writeln('($safeText) Tj');
      buffer.writeln('ET');
    }

    // Draw header box background
    buffer.writeln('0.04 0.09 0.16 rg'); // Dark slate background for header
    buffer.writeln('40 760 515 55 re f');

    // Header Text (White)
    buffer.writeln('1 1 1 rg');
    drawText("GATIFY SECURITY AUDIT REPORT", 55, 792, fontSize: 14, isBold: true);

    buffer.writeln('0.14 0.84 0.93 rg'); // Cyan text
    drawText("Spatial Access & Intelligent Visitor OS", 55, 776, fontSize: 8, isBold: false);

    // Meta details (Dark grey text)
    buffer.writeln('0.1 0.1 0.1 rg');
    drawText("Organization: $orgName", 40, 740, fontSize: 10, isBold: true);
    final filterText = (filterInfo != null && filterInfo.isNotEmpty) ? " | Filters: $filterInfo" : "";
    drawText("Generated On: ${DateTime.now().toLocal().toString().split('.')[0]}$filterText", 40, 725, fontSize: 8, isBold: false);
    drawText("Total Matching Records: ${records.length}", 40, 710, fontSize: 8, isBold: false);

    // Table Header Row Background
    buffer.writeln('0.92 0.95 0.98 rg');
    buffer.writeln('40 685 515 18 re f');

    // Table Header Text
    buffer.writeln('0.1 0.1 0.1 rg');
    drawText("Visitor Name", 45, 690, fontSize: 8, isBold: true);
    drawText("Type", 170, 690, fontSize: 8, isBold: true);
    drawText("Destinations", 230, 690, fontSize: 8, isBold: true);
    drawText("Status", 370, 690, fontSize: 8, isBold: true);
    drawText("Entry Time", 440, 690, fontSize: 8, isBold: true);

    // Border line below table header
    buffer.writeln('0.7 0.7 0.7 RG');
    buffer.writeln('0.5 w');
    buffer.writeln('40 685 m 555 685 l S');

    double currentY = 668;
    for (int i = 0; i < records.length && currentY > 50; i++) {
      final r = records[i];
      final name = (r['person_name'] ?? 'Visitor').toString();
      final type = (r['entry_type'] ?? 'GUEST').toString();
      final dests = (r['destinations'] is List
          ? (r['destinations'] as List).join(', ')
          : (r['destinations'] ?? '').toString());
      final status = (r['status'] ?? '').toString();
      final time = (r['entry_time'] ?? r['created_at'] ?? '').toString();
      final displayTime = time.contains('T') ? time.split('T')[1].split('.')[0] : time;

      // Row alternating highlight
      if (i % 2 == 1) {
        buffer.writeln('0.97 0.98 0.99 rg');
        buffer.writeln('40 ${currentY - 4} 515 15 re f');
      }

      buffer.writeln('0.15 0.15 0.15 rg');
      drawText(name.length > 20 ? '${name.substring(0, 18)}..' : name, 45, currentY, fontSize: 8);
      drawText(type, 170, currentY, fontSize: 8);
      drawText(dests.length > 22 ? '${dests.substring(0, 20)}..' : dests, 230, currentY, fontSize: 8);

      if (status == 'INSIDE') {
        buffer.writeln('0.06 0.72 0.51 rg'); // Green
      } else {
        buffer.writeln('0.4 0.4 0.4 rg');
      }
      drawText(status, 370, currentY, fontSize: 8, isBold: status == 'INSIDE');

      buffer.writeln('0.3 0.3 0.3 rg');
      drawText(displayTime.length > 12 ? displayTime.substring(0, 10) : displayTime, 440, currentY, fontSize: 7);

      // Light row divider
      buffer.writeln('0.85 0.85 0.85 RG');
      buffer.writeln('40 ${currentY - 5} m 555 ${currentY - 5} l S');

      currentY -= 17;
    }

    // Footer
    buffer.writeln('0.5 0.5 0.5 rg');
    drawText("Report generated automatically by Gatify Security Hub", 40, 30, fontSize: 8);

    final contentBytes = utf8.encode(buffer.toString());
    final contentLength = contentBytes.length;

    final List<int> pdf = [];
    final List<int> offsets = [];

    void write(String s) {
      pdf.addAll(utf8.encode(s));
    }

    // 0. Header with binary comment
    write('%PDF-1.4\n%âãÏÓ\n');

    // 1. Catalog
    offsets.add(pdf.length);
    write('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

    // 2. Pages tree
    offsets.add(pdf.length);
    write('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');

    // 3. Page object
    offsets.add(pdf.length);
    write('3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Contents 4 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> /F2 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> >> >> >>\nendobj\n');

    // 4. Content stream
    offsets.add(pdf.length);
    write('4 0 obj\n<< /Length $contentLength >>\nstream\n');
    pdf.addAll(contentBytes);
    write('\nendstream\nendobj\n');

    // Cross-reference table
    final startXref = pdf.length;
    write('xref\n0 5\n0000000000 65535 f \n');
    for (final offset in offsets) {
      write('${offset.toString().padLeft(10, '0')} 00000 n \n');
    }

    // Trailer
    write('trailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n$startXref\n%%EOF\n');

    return Uint8List.fromList(pdf);
  }
}
