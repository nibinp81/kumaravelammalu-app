import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class BibleScreen extends StatefulWidget {
  const BibleScreen({super.key});

  @override
  State<BibleScreen> createState() => _BibleScreenState();
}

class _BibleScreenState extends State<BibleScreen> {
  List<Map<String, dynamic>> _verses = [];
  int _currentIndex = 0;

  @override
  void initState() {
    super.initState();
    _loadVerses();
  }

  Future<void> _loadVerses() async {
    final data = await rootBundle.loadString('assets/bible_verses.json');
    final List list = json.decode(data);
    setState(() {
      _verses = list.cast<Map<String, dynamic>>();
      _currentIndex = (DateTime.now().dayOfYear % list.length);
    });
  }

  void _next() {
    setState(() => _currentIndex = (_currentIndex + 1) % _verses.length);
  }

  void _prev() {
    setState(() => _currentIndex = (_currentIndex - 1 + _verses.length) % _verses.length);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('வேத வசனம்'),
        backgroundColor: const Color(0xFF6B3FA0),
        foregroundColor: Colors.white,
      ),
      body: _verses.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : Stack(
              fit: StackFit.expand,
              children: [
                Image.asset('assets/images/scripture_bg.png', fit: BoxFit.cover),
                Container(color: Colors.black.withValues(alpha: 0.55)),
                Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(24),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: Colors.white.withValues(alpha: 0.3)),
                        ),
                        child: Column(
                          children: [
                            Text(
                              '${_verses[_currentIndex]['athikaram']} ${_verses[_currentIndex]['vasanam_no']}',
                              style: const TextStyle(
                                color: Colors.amberAccent,
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 16),
                            Text(
                              _verses[_currentIndex]['text'],
                              textAlign: TextAlign.center,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 20,
                                height: 1.6,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 32),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                        children: [
                          IconButton.filled(
                            onPressed: _prev,
                            icon: const Icon(Icons.arrow_back_ios),
                            style: IconButton.styleFrom(backgroundColor: Colors.white.withValues(alpha: 0.24)),
                            color: Colors.white,
                            iconSize: 28,
                          ),
                          Text(
                            '${_currentIndex + 1} / ${_verses.length}',
                            style: const TextStyle(color: Colors.white70),
                          ),
                          IconButton.filled(
                            onPressed: _next,
                            icon: const Icon(Icons.arrow_forward_ios),
                            style: IconButton.styleFrom(backgroundColor: Colors.white.withValues(alpha: 0.24)),
                            color: Colors.white,
                            iconSize: 28,
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
    );
  }
}

extension on DateTime {
  int get dayOfYear {
    return difference(DateTime(year, 1, 1)).inDays;
  }
}
