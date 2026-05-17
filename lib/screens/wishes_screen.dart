import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class WishesScreen extends StatefulWidget {
  const WishesScreen({super.key});

  @override
  State<WishesScreen> createState() => _WishesScreenState();
}

class _WishesScreenState extends State<WishesScreen> {
  Map<String, List<String>> _wishes = {};
  String _selectedCategory = 'birthday';

  final Map<String, String> _categoryLabels = {
    'birthday': 'பிறந்தநாள்',
    'anniversary': 'திருமண நாள்',
  };

  @override
  void initState() {
    super.initState();
    _loadWishes();
  }

  Future<void> _loadWishes() async {
    final data = await rootBundle.loadString('assets/wishes.json');
    final Map<String, dynamic> json = jsonDecode(data);
    setState(() {
      _wishes = json.map((k, v) => MapEntry(k, List<String>.from(v)));
    });
  }

  @override
  Widget build(BuildContext context) {
    final wishes = _wishes[_selectedCategory] ?? [];
    return Scaffold(
      appBar: AppBar(
        title: const Text('வாழ்த்துக்கள்'),
        backgroundColor: const Color(0xFFD4870A),
        foregroundColor: Colors.white,
      ),
      body: Column(
        children: [
          Container(
            color: const Color(0xFFD4870A).withValues(alpha: 0.1),
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: _categoryLabels.entries.map((e) {
                final selected = e.key == _selectedCategory;
                return Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 8),
                  child: ChoiceChip(
                    label: Text(e.value),
                    selected: selected,
                    onSelected: (_) => setState(() => _selectedCategory = e.key),
                    selectedColor: const Color(0xFFD4870A),
                    labelStyle: TextStyle(
                      color: selected ? Colors.white : Colors.black87,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
          Expanded(
            child: wishes.isEmpty
                ? const Center(child: CircularProgressIndicator())
                : ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: wishes.length,
                    separatorBuilder: (context, index) => const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      return Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [
                              const Color(0xFFD4870A).withValues(alpha: 0.15),
                              const Color(0xFFD4870A).withValues(alpha: 0.05),
                            ],
                          ),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFFD4870A).withValues(alpha: 0.3)),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.format_quote, color: Color(0xFFD4870A)),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                wishes[index],
                                style: const TextStyle(fontSize: 16, height: 1.5),
                              ),
                            ),
                            IconButton(
                              icon: const Icon(Icons.copy, size: 20),
                              onPressed: () {
                                Clipboard.setData(ClipboardData(text: wishes[index]));
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(content: Text('நகலெடுக்கப்பட்டது!')),
                                );
                              },
                            ),
                          ],
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}
