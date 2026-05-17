import 'package:flutter/material.dart';
import 'bible_screen.dart';
import 'wishes_screen.dart';
import 'gallery_screen.dart';
import 'puzzle_screen.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        fit: StackFit.expand,
        children: [
          Image.asset('assets/images/scripture_bg.png', fit: BoxFit.cover),
          Container(color: Colors.black.withValues(alpha: 0.45)),
          SafeArea(
            child: Column(
              children: [
                const SizedBox(height: 32),
                Image.asset('assets/images/logo.png', height: 100),
                const SizedBox(height: 12),
                const Text(
                  'குமாரவேலம்மாளு',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 26,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1.2,
                  ),
                ),
                const SizedBox(height: 48),
                Expanded(
                  child: GridView.count(
                    crossAxisCount: 2,
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    mainAxisSpacing: 16,
                    crossAxisSpacing: 16,
                    children: [
                      _MenuCard(
                        icon: Icons.menu_book,
                        label: 'வேத வசனம்',
                        color: const Color(0xFF6B3FA0),
                        onTap: () => Navigator.push(context,
                            MaterialPageRoute(builder: (_) => const BibleScreen())),
                      ),
                      _MenuCard(
                        icon: Icons.celebration,
                        label: 'வாழ்த்துக்கள்',
                        color: const Color(0xFFD4870A),
                        onTap: () => Navigator.push(context,
                            MaterialPageRoute(builder: (_) => const WishesScreen())),
                      ),
                      _MenuCard(
                        icon: Icons.photo_library,
                        label: 'படங்கள்',
                        color: const Color(0xFF2E7D32),
                        onTap: () => Navigator.push(context,
                            MaterialPageRoute(builder: (_) => const GalleryScreen())),
                      ),
                      _MenuCard(
                        icon: Icons.extension,
                        label: 'புதிர்',
                        color: const Color(0xFFC62828),
                        onTap: () => Navigator.push(context,
                            MaterialPageRoute(builder: (_) => const PuzzleScreen())),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _MenuCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _MenuCard({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.88),
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(color: Colors.black26, blurRadius: 8, offset: const Offset(0, 4)),
          ],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 48, color: Colors.white),
            const SizedBox(height: 12),
            Text(
              label,
              style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w600),
            ),
          ],
        ),
      ),
    );
  }
}
