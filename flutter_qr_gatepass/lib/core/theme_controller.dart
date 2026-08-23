import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ThemeController {
  static final ValueNotifier<bool> isDarkMode = ValueNotifier<bool>(true);

  static Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    isDarkMode.value = prefs.getBool('gatify_dark_mode') ?? true;
  }

  static Future<void> toggleTheme() async {
    final next = !isDarkMode.value;
    isDarkMode.value = next;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('gatify_dark_mode', next);
  }
}
