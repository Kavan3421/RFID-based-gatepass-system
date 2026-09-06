import 'dart:math' as math;
import 'dart:ui' as ui;
import 'package:flutter/material.dart';

/// Deep Ambient Canvas Background with Dynamic Chromatic Mesh Gradients
class AmbientCanvasBackground extends StatefulWidget {
  final Widget child;

  const AmbientCanvasBackground({super.key, required this.child});

  @override
  State<AmbientCanvasBackground> createState() =>
      _AmbientCanvasBackgroundState();
}

class _AmbientCanvasBackgroundState extends State<AmbientCanvasBackground>
    with SingleTickerProviderStateMixin {
  late final AnimationController _flowController;

  @override
  void initState() {
    super.initState();
    _flowController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 14),
    )..repeat();
  }

  @override
  void dispose() {
    _flowController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return AnimatedBuilder(
      animation: _flowController,
      builder: (context, _) {
        final t = _flowController.value;
        final pulseA = 0.5 + (0.5 * math.sin(t * math.pi * 2));
        final pulseB = 0.5 + (0.5 * math.sin((t * math.pi * 2) + 1.8));

        return Container(
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF070D18) : const Color(0xFFEEF3FB),
          ),
          child: Stack(
            fit: StackFit.expand,
            children: [
              Positioned(
                top: -90,
                left: -60,
                child: Container(
                  width: 320,
                  height: 320,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: RadialGradient(
                      colors: [
                        const Color(0xFF79CBFF)
                            .withValues(alpha: isDark ? 0.2 : 0.16),
                        Colors.transparent,
                      ],
                    ),
                  ),
                ),
              ),
              Positioned(
                bottom: -110,
                right: -90,
                child: Container(
                  width: 310,
                  height: 310,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: RadialGradient(
                      colors: [
                        const Color(0xFF72DBBF)
                            .withValues(alpha: isDark ? 0.16 : 0.12),
                        Colors.transparent,
                      ],
                    ),
                  ),
                ),
              ),
              Positioned(
                top: 90 + (pulseA * 24),
                left: 34 + (pulseB * 18),
                child: _floatingDroplet(
                  size: 120,
                  opacity: isDark ? 0.16 : 0.13,
                ),
              ),
              Positioned(
                bottom: 140 + (pulseB * 30),
                right: 42 + (pulseA * 20),
                child: _floatingDroplet(
                  size: 92,
                  opacity: isDark ? 0.14 : 0.12,
                ),
              ),
              Positioned.fill(
                child: IgnorePointer(
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [
                          Colors.white.withValues(alpha: isDark ? 0.07 : 0.15),
                          Colors.transparent,
                        ],
                        stops: const [0.0, 0.38],
                      ),
                    ),
                  ),
                ),
              ),
              Material(
                type: MaterialType.transparency,
                child: widget.child,
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _floatingDroplet({required double size, required double opacity}) {
    return IgnorePointer(
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          border:
              Border.all(color: Colors.white.withValues(alpha: opacity * 0.95)),
          gradient: RadialGradient(
            center: const Alignment(-0.28, -0.34),
            colors: [
              Colors.white.withValues(alpha: opacity * 1.35),
              const Color(0xFFB4DCFF).withValues(alpha: opacity * 0.7),
              Colors.transparent,
            ],
            stops: const [0.0, 0.34, 1.0],
          ),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF4876A6).withValues(alpha: opacity * 0.55),
              blurRadius: 18,
              offset: const Offset(0, 8),
            ),
          ],
        ),
      ),
    );
  }
}

/// Authentic Frosted Glass Card with Dual-Stop Directional Border & Light Transmission
class FrostedGlassCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;
  final double borderRadius;
  final Color? backgroundColor;
  final BoxBorder? customBorder;
  final double blurSigma;

  const FrostedGlassCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(20),
    this.borderRadius = 24,
    this.backgroundColor,
    this.customBorder,
    this.blurSigma = 24.0,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final radius = BorderRadius.circular(borderRadius);
    final fallbackBackground =
        isDark ? const Color(0x9916233A) : const Color(0x99FFFFFF);

    return ClipRRect(
      borderRadius: radius,
      child: BackdropFilter(
        filter: ui.ImageFilter.blur(sigmaX: blurSigma, sigmaY: blurSigma),
        child: Stack(
          children: [
            Container(
              padding: padding,
              decoration: BoxDecoration(
                borderRadius: radius,
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    Colors.white.withValues(alpha: isDark ? 0.16 : 0.56),
                    (backgroundColor ?? fallbackBackground),
                    isDark ? const Color(0x8816233A) : const Color(0x9EF3F8FF),
                  ],
                ),
                border: customBorder ??
                    Border.all(
                      color: isDark
                          ? Colors.white.withValues(alpha: 0.22)
                          : const Color(0x8093AACB),
                      width: 1.0,
                    ),
                boxShadow: [
                  BoxShadow(
                    color: isDark
                        ? const Color(0xCC020816)
                        : const Color(0x667698C3),
                    blurRadius: 24,
                    offset: const Offset(0, 10),
                  ),
                ],
              ),
              child: Material(
                type: MaterialType.transparency,
                child: child,
              ),
            ),
            Positioned.fill(
              child: IgnorePointer(
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    borderRadius: radius,
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.center,
                      colors: [
                        Colors.white.withValues(alpha: isDark ? 0.26 : 0.45),
                        Colors.transparent,
                      ],
                    ),
                  ),
                ),
              ),
            ),
            Positioned(
              top: -18,
              right: -16,
              child: IgnorePointer(
                child: Container(
                  width: 72,
                  height: 72,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: RadialGradient(
                      colors: [
                        Colors.white.withValues(alpha: isDark ? 0.28 : 0.40),
                        Colors.transparent,
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Liquid Glass Primary Action Button with Guaranteed 100% High-Contrast Text
class LiquidGlassButton extends StatelessWidget {
  final VoidCallback? onPressed;
  final Widget? child;
  final String? label;
  final IconData? icon;
  final bool isLoading;
  final Gradient? gradient;
  final double height;
  final double borderRadius;

  const LiquidGlassButton({
    super.key,
    required this.onPressed,
    this.child,
    this.label,
    this.icon,
    this.isLoading = false,
    this.gradient,
    this.height = 54,
    this.borderRadius = 20,
  });

  @override
  Widget build(BuildContext context) {
    Widget buttonContent;
    if (isLoading) {
      buttonContent = const SizedBox(
        width: 22,
        height: 22,
        child: CircularProgressIndicator(
          strokeWidth: 2.5,
          valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF06213F)),
        ),
      );
    } else if (label != null) {
      buttonContent = Row(
        mainAxisAlignment: MainAxisAlignment.center,
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, color: const Color(0xFF06213F), size: 20),
            const SizedBox(width: 8),
          ],
          Flexible(
            child: Text(
              label!,
              style: const TextStyle(
                inherit: false,
                color: Color(0xFF06213F),
                fontWeight: FontWeight.w800,
                fontSize: 15,
                letterSpacing: 0.1,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      );
    } else {
      buttonContent = child ?? const SizedBox.shrink();
    }

    return Container(
      width: double.infinity,
      height: height,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(borderRadius),
        gradient: gradient ??
            const LinearGradient(
              colors: [Color(0xFFC8EBFF), Color(0xFF79CBFF), Color(0xFF72DBBF)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF5FA5E9).withValues(alpha: 0.32),
            blurRadius: 16,
            offset: const Offset(0, 7),
          ),
        ],
      ),
      child: Stack(
        children: [
          Positioned.fill(
            child: IgnorePointer(
              child: DecoratedBox(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(borderRadius),
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomCenter,
                    colors: [
                      Colors.white.withValues(alpha: 0.48),
                      Colors.transparent,
                    ],
                    stops: const [0.0, 0.45],
                  ),
                ),
              ),
            ),
          ),
          Positioned.fill(
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.transparent,
                shadowColor: Colors.transparent,
                foregroundColor: const Color(0xFF06213F),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(borderRadius),
                ),
                padding: const EdgeInsets.symmetric(horizontal: 16),
              ),
              onPressed: isLoading ? null : onPressed,
              child: buttonContent,
            ),
          ),
        ],
      ),
    );
  }
}

/// Frosted Glass Pill Chip
class GlassPillChip extends StatelessWidget {
  final String label;
  final VoidCallback? onDeleted;
  final Color? color;
  final IconData? icon;

  const GlassPillChip({
    super.key,
    required this.label,
    this.onDeleted,
    this.color,
    this.icon,
  });

  @override
  Widget build(BuildContext context) {
    final accentColor = color ?? const Color(0xFF79CBFF);
    return ClipRRect(
      borderRadius: BorderRadius.circular(20),
      child: BackdropFilter(
        filter: ui.ImageFilter.blur(sigmaX: 16, sigmaY: 16),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            gradient: LinearGradient(
              colors: [
                accentColor.withValues(alpha: 0.24),
                accentColor.withValues(alpha: 0.12),
              ],
            ),
            border: Border.all(
              color: accentColor.withValues(alpha: 0.48),
              width: 1,
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (icon != null) ...[
                Icon(icon, size: 13, color: accentColor),
                const SizedBox(width: 5),
              ],
              Text(
                label,
                style: TextStyle(
                  color: accentColor,
                  fontWeight: FontWeight.w900,
                  fontSize: 12,
                ),
              ),
              if (onDeleted != null) ...[
                const SizedBox(width: 6),
                GestureDetector(
                  onTap: onDeleted,
                  child: Icon(
                    Icons.close,
                    size: 14,
                    color: accentColor,
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

/// High-Contrast Frosted Glass Text Field
class GlassTextField extends StatefulWidget {
  final TextEditingController controller;
  final String hintText;
  final String? labelText;
  final Widget? prefixIcon;
  final Widget? suffixIcon;
  final bool obscureText;
  final bool isPassword;
  final TextInputType keyboardType;
  final TextCapitalization textCapitalization;
  final ValueChanged<String>? onChanged;

  const GlassTextField({
    super.key,
    required this.controller,
    required this.hintText,
    this.labelText,
    this.prefixIcon,
    this.suffixIcon,
    this.obscureText = false,
    this.isPassword = false,
    this.keyboardType = TextInputType.text,
    this.textCapitalization = TextCapitalization.none,
    this.onChanged,
  });

  @override
  State<GlassTextField> createState() => _GlassTextFieldState();
}

class _GlassTextFieldState extends State<GlassTextField> {
  late bool _obscured;

  @override
  void initState() {
    super.initState();
    _obscured = widget.isPassword || widget.obscureText;
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (widget.labelText != null) ...[
          Text(
            widget.labelText!,
            style: TextStyle(
              inherit: false,
              color: isDark ? const Color(0xFFF1F5F9) : const Color(0xFF0F172A),
              fontSize: 12,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.2,
            ),
          ),
          const SizedBox(height: 6),
        ],
        Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(18),
            gradient: LinearGradient(
              colors: isDark
                  ? [
                      const Color(0xCA12233C),
                      const Color(0xA5142A47),
                    ]
                  : [
                      const Color(0xEFFFFFFF),
                      const Color(0xCCF3F8FF),
                    ],
            ),
            border: Border.all(
              color: isDark
                  ? Colors.white.withValues(alpha: 0.28)
                  : const Color(0xFF93AACB),
              width: 1.0,
            ),
            boxShadow: [
              BoxShadow(
                color:
                    isDark ? const Color(0x7A020816) : const Color(0x4A7E9EC7),
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: TextField(
            controller: widget.controller,
            obscureText: _obscured,
            keyboardType: widget.keyboardType,
            textCapitalization: widget.textCapitalization,
            onChanged: widget.onChanged,
            style: TextStyle(
              color: isDark ? const Color(0xFFF5F9FF) : const Color(0xFF12294A),
              fontSize: 14,
              fontWeight: FontWeight.w700,
            ),
            cursorColor: const Color(0xFF79CBFF),
            decoration: InputDecoration(
              hintText: widget.hintText,
              hintStyle: TextStyle(
                color:
                    isDark ? const Color(0xFF8EA3BF) : const Color(0xFF6581A5),
                fontSize: 13,
                fontWeight: FontWeight.w400,
              ),
              prefixIcon: widget.prefixIcon,
              suffixIcon: widget.isPassword
                  ? IconButton(
                      icon: Icon(
                        _obscured ? Icons.visibility_off : Icons.visibility,
                        color: isDark
                            ? const Color(0xFFAFC3DD)
                            : const Color(0xFF4F6B93),
                        size: 20,
                      ),
                      onPressed: () => setState(() => _obscured = !_obscured),
                    )
                  : widget.suffixIcon,
              border: InputBorder.none,
              contentPadding:
                  const EdgeInsets.symmetric(horizontal: 16, vertical: 15),
            ),
          ),
        ),
      ],
    );
  }
}

/// Fluid Frosted Plank for Live Feeds & Records
class GlassPlankTile extends StatelessWidget {
  final Widget leading;
  final Widget title;
  final Widget? subtitle;
  final Widget? trailing;
  final VoidCallback? onTap;

  const GlassPlankTile({
    super.key,
    required this.leading,
    required this.title,
    this.subtitle,
    this.trailing,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(18),
        child: BackdropFilter(
          filter: ui.ImageFilter.blur(sigmaX: 18, sigmaY: 18),
          child: Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(18),
              gradient: LinearGradient(
                colors: isDark
                    ? [
                        const Color(0xFF0F172A).withValues(alpha: 0.85),
                        const Color(0xFF131D31).withValues(alpha: 0.70),
                      ]
                    : [
                        const Color(0xFFFFFFFF).withValues(alpha: 0.95),
                        const Color(0xFFF8FAFC).withValues(alpha: 0.90),
                      ],
              ),
              border: Border.all(
                color: isDark
                    ? Colors.white.withValues(alpha: 0.16)
                    : const Color(0xFFE2E8F0),
                width: 1,
              ),
              boxShadow: [
                BoxShadow(
                  color: isDark
                      ? Colors.black.withValues(alpha: 0.25)
                      : const Color(0xFF94A3B8).withValues(alpha: 0.08),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Material(
              type: MaterialType.transparency,
              child: Row(
                children: [
                  leading,
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        title,
                        if (subtitle != null) ...[
                          const SizedBox(height: 3),
                          subtitle!,
                        ],
                      ],
                    ),
                  ),
                  if (trailing != null) trailing!,
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Social Media Style Story Status Item
class StoryStatusAvatar extends StatelessWidget {
  final String title;
  final String count;
  final IconData icon;
  final List<Color> ringColors;
  final bool isSelected;
  final VoidCallback onTap;

  const StoryStatusAvatar({
    super.key,
    required this.title,
    required this.count,
    required this.icon,
    required this.ringColors,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(right: 14),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(2.5),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: LinearGradient(
                  colors: isSelected
                      ? ringColors
                      : [
                          Colors.white.withValues(alpha: 0.22),
                          Colors.white.withValues(alpha: 0.08)
                        ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                boxShadow: isSelected
                    ? [
                        BoxShadow(
                          color: ringColors.first.withValues(alpha: 0.45),
                          blurRadius: 12,
                        ),
                      ]
                    : null,
              ),
              child: Container(
                width: 54,
                height: 54,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: isDark
                      ? const Color(0xFF0F172A)
                      : const Color(0xFFFFFFFF),
                ),
                child: Center(
                  child: Icon(icon,
                      color: isSelected
                          ? ringColors.first
                          : (isDark ? Colors.white70 : const Color(0xFF64748B)),
                      size: 24),
                ),
              ),
            ),
            const SizedBox(height: 5),
            Text(
              title,
              style: TextStyle(
                color: isSelected
                    ? (isDark ? Colors.white : const Color(0xFF0F172A))
                    : const Color(0xFF94A3B8),
                fontSize: 11,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
              ),
            ),
            Text(
              count,
              style: TextStyle(
                color: isSelected ? ringColors.first : const Color(0xFF64748B),
                fontSize: 10,
                fontWeight: FontWeight.w800,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Social Media Style Feed Card for Gate Entries
class SocialActivityFeedCard extends StatelessWidget {
  final String personName;
  final String entryType;
  final String destinations;
  final String status;
  final String time;
  final VoidCallback? onAction;

  const SocialActivityFeedCard({
    super.key,
    required this.personName,
    required this.entryType,
    required this.destinations,
    required this.status,
    required this.time,
    this.onAction,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isDelivery = entryType == 'DELIVERY';
    final isInside = status == 'INSIDE';

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      child: FrostedGlassCard(
        borderRadius: 22,
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Social Author Header
            Row(
              children: [
                Container(
                  width: 42,
                  height: 42,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(14),
                    gradient: LinearGradient(
                      colors: isDelivery
                          ? [const Color(0xFFF59E0B), const Color(0xFFD97706)]
                          : [const Color(0xFF79CBFF), const Color(0xFF4D88D2)],
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: (isDelivery
                                ? const Color(0xFFF59E0B)
                                : const Color(0xFF79CBFF))
                            .withValues(alpha: 0.35),
                        blurRadius: 10,
                      ),
                    ],
                  ),
                  child: Icon(
                    isDelivery ? Icons.local_shipping : Icons.person,
                    color: Colors.white,
                    size: 22,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Flexible(
                            child: Text(
                              personName,
                              style: TextStyle(
                                color: isDark
                                    ? Colors.white
                                    : const Color(0xFF0F172A),
                                fontWeight: FontWeight.w900,
                                fontSize: 14,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const SizedBox(width: 4),
                          const Icon(Icons.verified,
                              color: Color(0xFF79CBFF), size: 14),
                        ],
                      ),
                      const SizedBox(height: 2),
                      Row(
                        children: [
                          Text(
                            isDelivery ? "Delivery Partner" : "Visitor Guest",
                            style: TextStyle(
                              color: isDelivery
                                  ? const Color(0xFFEAB167)
                                  : const Color(0xFF8DD7FF),
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const Text(" • ",
                              style: TextStyle(
                                  color: Color(0xFF64748B), fontSize: 11)),
                          Text(
                            time,
                            style: const TextStyle(
                                color: Color(0xFF94A3B8), fontSize: 11),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                GlassPillChip(
                  label: status,
                  color: isInside
                      ? const Color(0xFF10B981)
                      : const Color(0xFF94A3B8),
                  icon: isInside ? Icons.login : Icons.logout,
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Social Content Box
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(14),
                gradient: LinearGradient(
                  colors: isDark
                      ? [
                          const Color(0xFF0F172A).withValues(alpha: 0.80),
                          const Color(0xFF0B1120).withValues(alpha: 0.70),
                        ]
                      : [
                          const Color(0xFFF1F5F9),
                          const Color(0xFFE2E8F0).withValues(alpha: 0.8),
                        ],
                ),
                border: Border.all(
                  color: isDark
                      ? Colors.white.withValues(alpha: 0.10)
                      : const Color(0xFFCBD5E1).withValues(alpha: 0.5),
                ),
              ),
              child: Row(
                children: [
                  const Icon(Icons.location_on,
                      color: Color(0xFF79CBFF), size: 16),
                  const SizedBox(width: 6),
                  const Text("Destinations: ",
                      style: TextStyle(
                          color: Color(0xFF94A3B8),
                          fontSize: 12,
                          fontWeight: FontWeight.w600)),
                  Expanded(
                    child: Text(
                      destinations,
                      style: TextStyle(
                        color: isDark ? Colors.white : const Color(0xFF0F172A),
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Floating Liquid Glass Social Dock Navigation Bar (Equal Width Slots)
class FloatingGlassDock extends StatelessWidget {
  final int currentIndex;
  final ValueChanged<int> onTap;
  final List<DockItem> items;

  const FloatingGlassDock({
    super.key,
    required this.currentIndex,
    required this.onTap,
    required this.items,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      height: 68,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(34),
        child: BackdropFilter(
          filter: ui.ImageFilter.blur(sigmaX: 30, sigmaY: 30),
          child: Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(34),
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  Colors.white.withValues(alpha: isDark ? 0.17 : 0.66),
                  isDark ? const Color(0xA516233A) : const Color(0xC2F6FAFF),
                ],
              ),
              border: Border.all(
                color: isDark
                    ? Colors.white.withValues(alpha: 0.24)
                    : const Color(0x9693AACB),
              ),
              boxShadow: [
                BoxShadow(
                  color: isDark
                      ? const Color(0xC9020816)
                      : const Color(0x667698C3),
                  blurRadius: 24,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            child: Material(
              type: MaterialType.transparency,
              child: Row(
                children: List.generate(items.length, (index) {
                  final item = items[index];
                  final isSelected = currentIndex == index;

                  return Expanded(
                    child: GestureDetector(
                      onTap: () => onTap(index),
                      behavior: HitTestBehavior.opaque,
                      child: Center(
                        child: item.isPrimary
                            ? Container(
                                width: 48,
                                height: 48,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  gradient: const LinearGradient(
                                    colors: [
                                      Color(0xFF93D8FF),
                                      Color(0xFF74D8BF)
                                    ],
                                  ),
                                  boxShadow: [
                                    BoxShadow(
                                      color: const Color(0xFF5FA5E9)
                                          .withValues(alpha: 0.50),
                                      blurRadius: 16,
                                      offset: const Offset(0, 4),
                                    ),
                                  ],
                                ),
                                child: Icon(item.icon,
                                    color: Colors.white, size: 26),
                              )
                            : AnimatedContainer(
                                duration: const Duration(milliseconds: 200),
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 6, vertical: 6),
                                decoration: BoxDecoration(
                                  color: isSelected
                                      ? const Color(0xFF79CBFF)
                                          .withValues(alpha: 0.16)
                                      : Colors.transparent,
                                  borderRadius: BorderRadius.circular(16),
                                ),
                                child: Column(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(
                                      item.icon,
                                      color: isSelected
                                          ? const Color(0xFF79CBFF)
                                          : const Color(0xFF8EA3BF),
                                      size: 22,
                                    ),
                                    const SizedBox(height: 3),
                                    Text(
                                      item.label,
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      textAlign: TextAlign.center,
                                      style: TextStyle(
                                        inherit: false,
                                        color: isSelected
                                            ? const Color(0xFF79CBFF)
                                            : const Color(0xFF8EA3BF),
                                        fontSize: 10,
                                        fontWeight: isSelected
                                            ? FontWeight.w900
                                            : FontWeight.w500,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                      ),
                    ),
                  );
                }),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class DockItem {
  final IconData icon;
  final String label;
  final bool isPrimary;

  const DockItem({
    required this.icon,
    required this.label,
    this.isPrimary = false,
  });
}
