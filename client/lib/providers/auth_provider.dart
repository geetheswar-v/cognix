import 'package:hooks_riverpod/hooks_riverpod.dart';
import '../services/auth_service.dart';

final authServiceProvider = Provider<AuthService>((ref) {
  return AuthService();
});

class AuthLoadingNotifier extends Notifier<bool> {
  @override
  bool build() => false;

  void setLoading(bool value) => state = value;
}

final authLoadingProvider = NotifierProvider<AuthLoadingNotifier, bool>(
  AuthLoadingNotifier.new,
);
