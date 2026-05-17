import 'package:flutter/material.dart';

class GalleryScreen extends StatelessWidget {
  const GalleryScreen({super.key});

  static const List<String> _images = [
    'assets/images/Brown%20Modern%20Bible%20Verse%20Desktop%20Wallpaper.png',
    'assets/images/Brown%20Modern%20Bible%20Verse%20Desktop%20Wallpaper%20(1).png',
    'assets/images/Brown%20Modern%20Bible%20Verse%20Desktop%20Wallpaper%20(2).png',
    'assets/images/Brown%20Modern%20Bible%20Verse%20Desktop%20Wallpaper%20(3).png',
    'assets/images/Brown%20Modern%20Bible%20Verse%20Desktop%20Wallpaper%20(4).png',
    'assets/images/Brown%20Modern%20Bible%20Verse%20Desktop%20Wallpaper%20(5).png',
    'assets/images/Brown%20Modern%20Bible%20Verse%20Desktop%20Wallpaper%20(6).png',
    'assets/images/Purple%20Modern%20Easter%20Christian%20Desktop%20Wallpaper.png',
    'assets/images/Blue%20And%20Yellow%20Illustrative%20Birthday%20Party%20Poster.png',
    'assets/images/Pink%20And%20Blue%20Illustrative%20Birthday%20Party%20Flyer.png',
    'assets/images/Yellow%20And%20Blue%20Illustrative%20Birthday%20Party%20Flyer.png',
    'assets/images/Grey%20and%20Purple%20Illustrative%20Kids%20Birthday%20Invitation.png',
    'assets/images/Red%20and%20Purple%20Playful%20Birthday%20Invitation.png',
    'assets/images/Teal%20Pink%20and%20Yellow%20Playful%20Birthday%20Party%20Invitation.png',
    'assets/images/Pink%20Illustrated%20Happy%20Valentine%27s%20Day%20Instagram%20Post.png',
    'assets/images/Pink%20Illustrated%20Happy%20Valentine%27s%20Day%20LinkedIn%20Post.png',
    'assets/images/Pink%20and%20Red%20Playful%20Happy%20Valentine%27s%20Day%20Instagram%20Post.png',
    'assets/images/Pink%20and%20White%20Playful%20Valentine%27s%20Day%20Instagram%20Post.png',
    'assets/images/car1.jpeg',
    'assets/images/car2.jpeg',
    'assets/images/car3.jpeg',
    'assets/images/car4.jpeg',
    'assets/images/car5.jpeg',
    'assets/images/car6.jpeg',
    'assets/images/Colorful%20Modern%20Community%20Logo.png',
    'assets/images/tree.png',
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('படங்கள்'),
        backgroundColor: const Color(0xFF2E7D32),
        foregroundColor: Colors.white,
      ),
      body: GridView.builder(
        padding: const EdgeInsets.all(8),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          crossAxisSpacing: 8,
          mainAxisSpacing: 8,
        ),
        itemCount: _images.length,
        itemBuilder: (context, index) {
          return GestureDetector(
            onTap: () => _showFullscreen(context, index),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: Image.asset(
                _images[index],
                fit: BoxFit.cover,
                errorBuilder: (context, error, stack) => Container(
                  color: Colors.grey.shade200,
                  child: const Icon(Icons.broken_image, color: Colors.grey),
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  void _showFullscreen(BuildContext context, int startIndex) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => _FullscreenGallery(images: _images, initialIndex: startIndex),
      ),
    );
  }
}

class _FullscreenGallery extends StatefulWidget {
  final List<String> images;
  final int initialIndex;

  const _FullscreenGallery({required this.images, required this.initialIndex});

  @override
  State<_FullscreenGallery> createState() => _FullscreenGalleryState();
}

class _FullscreenGalleryState extends State<_FullscreenGallery> {
  late PageController _controller;

  @override
  void initState() {
    super.initState();
    _controller = PageController(initialPage: widget.initialIndex);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(backgroundColor: Colors.black, foregroundColor: Colors.white),
      body: PageView.builder(
        controller: _controller,
        itemCount: widget.images.length,
        itemBuilder: (context, index) {
          return InteractiveViewer(
            child: Center(
              child: Image.asset(
                widget.images[index],
                fit: BoxFit.contain,
                errorBuilder: (context, error, stack) => const Icon(Icons.broken_image, color: Colors.white, size: 64),
              ),
            ),
          );
        },
      ),
    );
  }
}
