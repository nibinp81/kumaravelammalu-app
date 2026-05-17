import 'package:flutter/material.dart';
import 'screens/home_screen.dart';

void main() {
  runApp(const KumaravelammaluApp());
}

class KumaravelammaluApp extends StatelessWidget {
  const KumaravelammaluApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Kumaravelammalu',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF6B3FA0),
        ),
        useMaterial3: true,
      ),
      home: const HomeScreen(),
    );
  }
}
