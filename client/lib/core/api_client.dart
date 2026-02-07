import 'package:dio/dio.dart';
import 'dart:io';

class ApiClient {
  static final Dio _dio = Dio(
    BaseOptions(
      // Android Emulator IP: 10.0.2.2 refers to localhost of host machine
      baseUrl: Platform.isAndroid
          ? 'http://10.0.2.2:8000'
          : 'http://localhost:8000',
      connectTimeout: const Duration(seconds: 5),
      receiveTimeout: const Duration(seconds: 3),
    ),
  );

  static Dio get instance => _dio;
}
