# Flutterとswift/kotlin連携
主な連携方法としては、以下の2つがあります。

## 1. Platform Channels（プラットフォームチャンネル）
- これはFlutterが提供する最も一般的な連携方法です。
- Flutter（Dart）とネイティブコード（Swift/Kotlin）の間でメッセージをやり取りするためのメカニズムです。
- Dart側から特定のメソッド呼び出しをネイティブコードに送信し、ネイティブコード側でその処理を実行し、結果をDart側に返します。
- これにより、Flutterアプリからカメラ、GPS、Bluetoothなど、OSのネイティブ機能や特定のSDK（例えば、Apple PayなどのiOS固有の機能）にアクセスできます。
- 簡単なデータやメソッド呼び出しのやり取りに適しています。

## 2. Dart FFI (Foreign Function Interface) / package:ffigen
- Dart 2.18で導入されたFFIは、Dartコードから直接C言語のAPIを呼び出すための機能です。
- SwiftはCとの相互運用性があるため、SwiftのコードをCのインターフェースとして公開し、それをDartからFFI経由で呼び出すことができます。
- package:ffigenというツールを使うと、Objective-CのヘッダーファイルからDart FFIのバインディングコードを自動生成でき、SwiftのAPIもObjective-Cのラッパーを介して利用できるようになります。
- より低レベルで、パフォーマンスが重視されるような、大量のデータ交換や複雑なネイティブ処理を伴う場合に適しています。

### 利用イメージ

- Flutter (UI担当): アプリの画面表示、ユーザー入力の受け付け、ビジネスロジックの大部分をFlutterで記述します。
- Swift (iOS固有処理担当):
  - OSの特定のセンサーへのアクセス（例: HealthKit）
  - 特定の認証機能（例: Face ID/Touch ID）
  - Apple PayなどのiOS固有の決済サービス
  - 高度な画像処理や機械学習（Core MLなど）
  - 複雑なアニメーションやグラフィック処理でネイティブのパフォーマンスが必要な場合
  - 既存のSwiftライブラリやSDKを再利用したい場合
  - このように、FlutterはクロスプラットフォームでのUI開発の効率性を最大化しつつ、必要に応じてネイティブのSwiftコードと連携することで、iOSアプリのフル機能を活用することができます。

