import 'package:dio/dio.dart';
import '../core/api_client.dart';

class AuthService {
  final _dio = ApiClient.instance;

  Future<Response> signIn(String email, String password) async {
    try {
      final response = await _dio.post(
        '/auth/sign-in',
        data: {'email': email, 'password': password},
      );
      return response;
    } on DioException {
      rethrow;
    }
  }

  Future<Response> signUp({
    required String name,
    required String email,
    required String password,
  }) async {
    try {
      final response = await _dio.post(
        '/auth/sign-up',
        data: {'name': name, 'email': email, 'password': password},
      );
      return response;
    } on DioException {
      rethrow;
    }
  }
}
