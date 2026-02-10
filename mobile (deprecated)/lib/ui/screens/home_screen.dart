import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Home')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            FilledButton(
              onPressed: () => context.push('/signin'),
              child: const Text('Sign In'),
            ),
            const SizedBox(height: 16),
            OutlinedButton(
              onPressed: () => context.push('/signup'),
              child: const Text('Sign Up'),
            ),
          ],
        ),
      ),
    );
  }
}
