import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_qr_gatepass/main.dart';

void main() {
  testWidgets('App load smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const GatifyApp());
    expect(find.byType(GatifyApp), findsOneWidget);
  });
}
