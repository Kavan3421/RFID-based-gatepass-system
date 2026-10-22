import 'dart:math' as math;
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// Deep Ambient Canvas Background with Seamless Indigo & Cyan Chromatic Glows
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
      duration: const Duration(seconds: 16),
    )..repeat(reverse: true);
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
        final pulseA = math.sin(t * math.pi) * 20.0;
        final pulseB = math.cos(t * math.pi) * 25.0;

        return Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: isDark
                  ? const [
                      Color(0xFF070A13),
                      Color(0xFF0A0F1D),
                    ]
                  : const [
                      Color(0xFFF1F5F9),
                      Color(0xFFE2E8F0),
                    ],
            ),
          ),
          child: Stack(
            fit: StackFit.expand,
            children: [
              // Top-left soft ambient indigo chromatic glow
              Positioned(
                top: -120 + pulseA,
                left: -80 + pulseB,
                child: IgnorePointer(
                  child: Container(
                    width: 420,
                    height: 420,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: RadialGradient(
                        colors: isDark
                            ? [
                                const Color(0xFF1E1B4B).withOpacity(0.18),
                                const Color(0xFF312E81).withOpacity(0.08),
                                Colors.transparent,
                              ]
                            : [
                                const Color(0xFF818CF8).withOpacity(0.15),
                                Colors.transparent,
                              ],
                        stops: const [0.0, 0.55, 1.0],
                      ),
                    ),
                  ),
                ),
              ),

              // Bottom-right soft ambient cyan chromatic glow
              Positioned(
                bottom: -140 - pulseA,
                right: -90 - pulseB,
                child: IgnorePointer(
                  child: Container(
                    width: 440,
                    height: 440,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: RadialGradient(
                        colors: isDark
                            ? [
                                const Color(0xFF0D3B42).withOpacity(0.16),
                                const Color(0xFF06B6D4).withOpacity(0.06),
                                Colors.transparent,
                              ]
                            : [
                                const Color(0xFF38BDF8).withOpacity(0.14),
                                Colors.transparent,
                              ],
                        stops: const [0.0, 0.50, 1.0],
                      ),
                    ),
                  ),
                ),
              ),

              // Mid-center subtle micro-refractive ambient sheen
              Positioned(
                top: 280 + pulseB,
                right: -100 + pulseA,
                child: IgnorePointer(
                  child: Container(
                    width: 320,
                    height: 320,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: RadialGradient(
                        colors: [
                          (isDark
                                  ? const Color(0xFF0284C7)
                                  : const Color(0xFF0EA5E9))
                              .withOpacity(isDark ? 0.05 : 0.08),
                          Colors.transparent,
                        ],
                      ),
                    ),
                  ),
                ),
              ),

              // Child UI Layer
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
}

/// Authentic Frosted Glass Card with Dual-Tone Directional Rim (No Corner Artifacts)
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

    return ClipRRect(
      borderRadius: radius,
      child: BackdropFilter(
        filter: ui.ImageFilter.blur(sigmaX: blurSigma, sigmaY: blurSigma),
        child: Stack(
          children: [
            // Glass Base Fill
            Container(
              padding: padding,
              decoration: BoxDecoration(
                borderRadius: radius,
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    Colors.white.withOpacity(isDark ? 0.08 : 0.70),
                    Colors.white.withOpacity(isDark ? 0.02 : 0.35),
                  ],
                ),
                color: backgroundColor,
                border: customBorder ??
                    Border.all(
                      color: Colors.white.withOpacity(isDark ? 0.12 : 0.45),
                      width: 1.0,
                    ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(isDark ? 0.45 : 0.08),
                    blurRadius: 28,
                    offset: const Offset(0, 10),
                  ),
                ],
              ),
              child: Material(
                type: MaterialType.transparency,
                child: child,
              ),
            ),

            // Top-down Specular Edge Highlight (Crisp directional light transmission)
            Positioned(
              top: 0,
              left: 0,
              right: 0,
              height: 1.2,
              child: IgnorePointer(
                child: Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        Colors.white.withOpacity(isDark ? 0.30 : 0.80),
                        Colors.white.withOpacity(isDark ? 0.05 : 0.20),
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

/// Alias for AppGlassSurface
typedef AppGlassSurface = FrostedGlassCard;

/// Alias for AppBackground
typedef AppBackground = AmbientCanvasBackground;

/// Liquid Glass Kinetic Action Button with Spring Physics & Micro-Haptics
class LiquidGlassButton extends StatefulWidget {
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
    this.height = 52,
    this.borderRadius = 18,
  });

  @override
  State<LiquidGlassButton> createState() => _LiquidGlassButtonState();
}

class _LiquidGlassButtonState extends State<LiquidGlassButton> {
  bool _isPressed = false;

  void _handleTapDown(TapDownDetails _) {
    if (widget.isLoading || widget.onPressed == null) return;
    HapticFeedback.lightImpact();
    setState(() => _isPressed = true);
  }

  void _handleTapUp(TapUpDetails _) {
    if (_isPressed) setState(() => _isPressed = false);
  }

  void _handleTapCancel() {
    if (_isPressed) setState(() => _isPressed = false);
  }

  @override
  Widget build(BuildContext context) {
    Widget buttonContent;
    if (widget.isLoading) {
      buttonContent = const SizedBox(
        width: 20,
        height: 20,
        child: CircularProgressIndicator(
          strokeWidth: 2.2,
          valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
        ),
      );
    } else if (widget.label != null) {
      buttonContent = Row(
        mainAxisAlignment: MainAxisAlignment.center,
        mainAxisSize: MainAxisSize.min,
        children: [
          if (widget.icon != null) ...[
            Icon(widget.icon, color: Colors.white, size: 19),
            const SizedBox(width: 8),
          ],
          Flexible(
            child: Text(
              widget.label!,
              style: const TextStyle(
                inherit: false,
                color: Colors.white,
                fontWeight: FontWeight.w700,
                fontSize: 14.5,
                letterSpacing: 0.2,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      );
    } else {
      buttonContent = widget.child ?? const SizedBox.shrink();
    }

    final defaultGradient = LinearGradient(
      colors: [
        const Color(0xFF06B6D4).withOpacity(0.85),
        const Color(0xFF0E7490).withOpacity(0.92),
      ],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    );

    return GestureDetector(
      onTapDown: _handleTapDown,
      onTapUp: _handleTapUp,
      onTapCancel: _handleTapCancel,
      onTap: widget.isLoading ? null : widget.onPressed,
      child: AnimatedScale(
        scale: _isPressed ? 0.97 : 1.0,
        duration: const Duration(milliseconds: 140),
        curve: Curves.easeOutCubic,
        child: Container(
          width: double.infinity,
          height: widget.height,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(widget.borderRadius),
            gradient: widget.gradient ?? defaultGradient,
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF06B6D4).withOpacity(0.25),
                blurRadius: 18,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          child: Stack(
            children: [
              // Top Specular Highlight Rim
              Positioned(
                top: 0,
                left: 0,
                right: 0,
                height: 1.0,
                child: Container(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.vertical(
                      top: Radius.circular(widget.borderRadius),
                    ),
                    color: Colors.white.withOpacity(0.40),
                  ),
                ),
              ),
              // Button Content
              Center(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: buttonContent,
                ),
              ),
            ],
          ),
        ),
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
    final accentColor = color ?? const Color(0xFF22D3EE);
    return ClipRRect(
      borderRadius: BorderRadius.circular(16),
      child: BackdropFilter(
        filter: ui.ImageFilter.blur(sigmaX: 16, sigmaY: 16),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            gradient: LinearGradient(
              colors: [
                accentColor.withOpacity(0.20),
                accentColor.withOpacity(0.08),
              ],
            ),
            border: Border.all(
              color: accentColor.withOpacity(0.35),
              width: 1,
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (icon != null) ...[
                Icon(icon, size: 12, color: accentColor),
                const SizedBox(width: 4),
              ],
              Text(
                label,
                style: TextStyle(
                  color: accentColor,
                  fontWeight: FontWeight.w700,
                  fontSize: 11,
                  letterSpacing: 0.3,
                ),
              ),
              if (onDeleted != null) ...[
                const SizedBox(width: 5),
                GestureDetector(
                  onTap: onDeleted,
                  child: Icon(
                    Icons.close,
                    size: 13,
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

/// High-Contrast Sunken Glass Text Field
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
  final FocusNode _focusNode = FocusNode();
  bool _isFocused = false;

  @override
  void initState() {
    super.initState();
    _obscured = widget.isPassword || widget.obscureText;
    _focusNode.addListener(() {
      setState(() => _isFocused = _focusNode.hasFocus);
    });
  }

  @override
  void dispose() {
    _focusNode.dispose();
    super.dispose();
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
              color: isDark
                  ? Colors.white.withOpacity(0.80)
                  : const Color(0xFF1E293B),
              fontSize: 11.5,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.3,
            ),
          ),
          const SizedBox(height: 6),
        ],
        Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            color: isDark ? const Color(0x59000000) : const Color(0xCCFFFFFF),
            border: Border.all(
              color: _isFocused
                  ? const Color(0xFF06B6D4).withOpacity(0.60)
                  : Colors.white.withOpacity(isDark ? 0.14 : 0.40),
              width: 1.0,
            ),
            boxShadow: [
              if (_isFocused)
                BoxShadow(
                  color: const Color(0xFF06B6D4).withOpacity(0.18),
                  blurRadius: 10,
                ),
            ],
          ),
          child: TextField(
            controller: widget.controller,
            focusNode: _focusNode,
            obscureText: _obscured,
            keyboardType: widget.keyboardType,
            textCapitalization: widget.textCapitalization,
            onChanged: widget.onChanged,
            style: TextStyle(
              color: isDark ? Colors.white : const Color(0xFF0F172A),
              fontSize: 14,
              fontWeight: FontWeight.w600,
            ),
            cursorColor: const Color(0xFF22D3EE),
            decoration: InputDecoration(
              hintText: widget.hintText,
              hintStyle: TextStyle(
                color: isDark
                    ? Colors.white.withOpacity(0.40)
                    : const Color(0xFF94A3B8),
                fontSize: 13,
                fontWeight: FontWeight.w400,
              ),
              prefixIcon: widget.prefixIcon,
              suffixIcon: widget.isPassword
                  ? IconButton(
                      icon: Icon(
                        _obscured ? Icons.visibility_off : Icons.visibility,
                        color: isDark
                            ? Colors.white.withOpacity(0.60)
                            : const Color(0xFF64748B),
                        size: 19,
                      ),
                      onPressed: () => setState(() => _obscured = !_obscured),
                    )
                  : widget.suffixIcon,
              border: InputBorder.none,
              contentPadding:
                  const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            ),
          ),
        ),
      ],
    );
  }
}

/// Streamlined Liquid Glass Plank for Live Feeds & Records
class GlassPlankTile extends StatefulWidget {
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
  State<GlassPlankTile> createState() => _GlassPlankTileState();
}

class _GlassPlankTileState extends State<GlassPlankTile> {
  bool _isPressed = false;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: GestureDetector(
        onTapDown: widget.onTap != null
            ? (_) {
                HapticFeedback.lightImpact();
                setState(() => _isPressed = true);
              }
            : null,
        onTapUp: widget.onTap != null ? (_) => setState(() => _isPressed = false) : null,
        onTapCancel: widget.onTap != null ? () => setState(() => _isPressed = false) : null,
        onTap: widget.onTap,
        child: AnimatedScale(
          scale: _isPressed ? 0.985 : 1.0,
          duration: const Duration(milliseconds: 120),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(16),
            child: BackdropFilter(
              filter: ui.ImageFilter.blur(sigmaX: 16, sigmaY: 16),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  gradient: LinearGradient(
                    colors: [
                      Colors.white.withOpacity(isDark ? 0.06 : 0.70),
                      Colors.white.withOpacity(isDark ? 0.02 : 0.40),
                    ],
                  ),
                  border: Border.all(
                    color: Colors.white.withOpacity(isDark ? 0.09 : 0.35),
                    width: 1.0,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(isDark ? 0.30 : 0.05),
                      blurRadius: 14,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Material(
                  type: MaterialType.transparency,
                  child: Row(
                    children: [
                      widget.leading,
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            widget.title,
                            if (widget.subtitle != null) ...[
                              const SizedBox(height: 2),
                              widget.subtitle!,
                            ],
                          ],
                        ),
                      ),
                      if (widget.trailing != null) widget.trailing!,
                    ],
                  ),
                ),
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
      onTap: () {
        HapticFeedback.selectionClick();
        onTap();
      },
      child: Container(
        margin: const EdgeInsets.only(right: 14),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(2.2),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: LinearGradient(
                  colors: isSelected
                      ? ringColors
                      : [
                          Colors.white.withOpacity(isDark ? 0.18 : 0.40),
                          Colors.white.withOpacity(isDark ? 0.06 : 0.20),
                        ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                boxShadow: isSelected
                    ? [
                        BoxShadow(
                          color: ringColors.first.withOpacity(0.35),
                          blurRadius: 10,
                        ),
                      ]
                    : null,
              ),
              child: Container(
                width: 50,
                height: 50,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: isDark
                      ? const Color(0xFF0F172A)
                      : const Color(0xFFFFFFFF),
                ),
                child: Center(
                  child: Icon(
                    icon,
                    color: isSelected
                        ? ringColors.first
                        : (isDark
                            ? Colors.white.withOpacity(0.65)
                            : const Color(0xFF64748B)),
                    size: 22,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 5),
            Text(
              title,
              style: TextStyle(
                color: isSelected
                    ? (isDark ? Colors.white : const Color(0xFF0F172A))
                    : (isDark
                        ? Colors.white.withOpacity(0.60)
                        : const Color(0xFF94A3B8)),
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

/// Refined Social Media Style Feed Card for Gate Entries
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
      margin: const EdgeInsets.only(bottom: 10),
      child: FrostedGlassCard(
        borderRadius: 20,
        padding: const EdgeInsets.all(15),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Social Author Header
            Row(
              children: [
                Container(
                  width: 38,
                  height: 38,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(12),
                    gradient: LinearGradient(
                      colors: isDelivery
                          ? [const Color(0xFFF59E0B), const Color(0xFFD97706)]
                          : [const Color(0xFF06B6D4), const Color(0xFF0E7490)],
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: (isDelivery
                                ? const Color(0xFFF59E0B)
                                : const Color(0xFF06B6D4))
                            .withOpacity(0.25),
                        blurRadius: 10,
                      ),
                    ],
                  ),
                  child: Icon(
                    isDelivery ? Icons.local_shipping : Icons.person,
                    color: Colors.white,
                    size: 20,
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
                                fontWeight: FontWeight.bold,
                                fontSize: 13.5,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const SizedBox(width: 4),
                          const Icon(Icons.verified,
                              color: Color(0xFF22D3EE), size: 14),
                        ],
                      ),
                      const SizedBox(height: 2),
                      Row(
                        children: [
                          Text(
                            isDelivery ? "Delivery Partner" : "Visitor Guest",
                            style: TextStyle(
                              color: isDelivery
                                  ? const Color(0xFFFBBF24)
                                  : const Color(0xFF38BDF8),
                              fontSize: 10.5,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const Text(" • ",
                              style: TextStyle(
                                  color: Color(0xFF64748B), fontSize: 10)),
                          Text(
                            time,
                            style: TextStyle(
                              color: isDark
                                  ? Colors.white.withOpacity(0.55)
                                  : const Color(0xFF94A3B8),
                              fontSize: 10.5,
                            ),
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
            const SizedBox(height: 10),

            // Destination Pill
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(12),
                color: isDark
                    ? Colors.white.withOpacity(0.04)
                    : const Color(0xFFF1F5F9),
                border: Border.all(
                  color: Colors.white.withOpacity(isDark ? 0.08 : 0.40),
                ),
              ),
              child: Row(
                children: [
                  const Icon(Icons.location_on_outlined,
                      color: Color(0xFF22D3EE), size: 14),
                  const SizedBox(width: 5),
                  Text(
                    "Destinations: ",
                    style: TextStyle(
                      color: isDark
                          ? Colors.white.withOpacity(0.60)
                          : const Color(0xFF64748B),
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  Expanded(
                    child: Text(
                      destinations,
                      style: TextStyle(
                        color: isDark ? Colors.white : const Color(0xFF0F172A),
                        fontSize: 11.5,
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

/// Floating Liquid Glass Navigation Dock Bar
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
      height: 64,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(32),
        child: BackdropFilter(
          filter: ui.ImageFilter.blur(sigmaX: 28, sigmaY: 28),
          child: Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(32),
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  Colors.white.withOpacity(isDark ? 0.08 : 0.75),
                  Colors.white.withOpacity(isDark ? 0.03 : 0.45),
                ],
              ),
              border: Border.all(
                color: Colors.white.withOpacity(isDark ? 0.14 : 0.45),
                width: 1.0,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(isDark ? 0.40 : 0.08),
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
                      onTap: () {
                        HapticFeedback.selectionClick();
                        onTap(index);
                      },
                      behavior: HitTestBehavior.opaque,
                      child: Center(
                        child: item.isPrimary
                            ? Container(
                                width: 44,
                                height: 44,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  gradient: const LinearGradient(
                                    colors: [
                                      Color(0xFF06B6D4),
                                      Color(0xFF0E7490),
                                    ],
                                  ),
                                  boxShadow: [
                                    BoxShadow(
                                      color: const Color(0xFF06B6D4)
                                          .withOpacity(0.40),
                                      blurRadius: 14,
                                      offset: const Offset(0, 3),
                                    ),
                                  ],
                                ),
                                child: Icon(item.icon,
                                    color: Colors.white, size: 23),
                              )
                            : AnimatedContainer(
                                duration: const Duration(milliseconds: 180),
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 8, vertical: 5),
                                decoration: BoxDecoration(
                                  color: isSelected
                                      ? const Color(0xFF06B6D4).withOpacity(0.18)
                                      : Colors.transparent,
                                  borderRadius: BorderRadius.circular(16),
                                  border: isSelected
                                      ? Border.all(
                                          color: const Color(0xFF06B6D4)
                                              .withOpacity(0.35),
                                        )
                                      : null,
                                ),
                                child: Column(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(
                                      item.icon,
                                      color: isSelected
                                          ? const Color(0xFF22D3EE)
                                          : (isDark
                                              ? Colors.white.withOpacity(0.55)
                                              : const Color(0xFF64748B)),
                                      size: 20,
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      item.label,
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      textAlign: TextAlign.center,
                                      style: TextStyle(
                                        inherit: false,
                                        color: isSelected
                                            ? const Color(0xFF22D3EE)
                                            : (isDark
                                                ? Colors.white.withOpacity(0.55)
                                                : const Color(0xFF64748B)),
                                        fontSize: 9.5,
                                        fontWeight: isSelected
                                            ? FontWeight.w700
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
