# 🍽️ 料理原価計算システム v5.0

> **食材管理から完成品まで、包括的な原価計算を実現するWebアプリケーション**

[![PHP Version](https://img.shields.io/badge/PHP-7.4%2B-blue)](https://php.net)
[![MySQL](https://img.shields.io/badge/MySQL-8.0%2B-orange)](https://mysql.com)
[![License](https://img.shields.io/badge/License-MIT-green)](#license)
[![Status](https://img.shields.io/badge/Status-Active%20Development-yellow)](#)

## 📋 **概要**

料理原価計算システムは、飲食業界や家庭での料理原価管理を効率化するWebアプリケーションです。食材の購入から最終的な完成品まで、段階的な原価計算と利益率分析を提供します。

### 🎯 **主な特徴**

- **📊 3段階の原価管理**: 食材 → 料理 → 完成品
- **🎨 直感的なUI**: ドラッグ&ドロップによる操作
- **📈 分析機能**: 統計、トレンド、利益率分析
- **💾 データ管理**: エクスポート/インポート、バックアップ
- **🔍 価格検索**: 食材価格の比較と最適化
- **📱 レスポンシブ**: PC・タブレット・スマートフォン対応

## 🚀 **主な機能**

### 1. 食材管理
- 食材の登録・編集・削除
- 購入場所・価格・数量管理
- ジャンル別分類（肉・野菜・調味料・ソース・冷凍・ドリンク）
- 単価自動計算
- 価格検索・比較

### 2. 料理作成
- 食材をドラッグ&ドロップで料理作成
- 使用量と原価の自動計算
- 料理の保存・管理
- レシピ情報の記録

### 3. 完成品管理
- 料理を組み合わせて完成品作成
- 販売価格設定
- 利益率自動計算
- 原価分析

### 4. 分析・レポート
- 統計ダッシュボード
- ジャンル別分布チャート
- コスト効率分析
- 人気料理ランキング
- 月次サマリー

### 5. 管理機能
- データバックアップ・復元
- システム監視
- エラーログ管理
- 設定管理

## 🛠️ **技術スタック**

### バックエンド
- **PHP 7.4+**: サーバーサイドロジック
- **MySQL 8.0+**: データベース
- **Apache**: Webサーバー

### フロントエンド
- **HTML5/CSS3**: ユーザーインターフェース
- **JavaScript (ES6+)**: インタラクティブ機能
- **RESTful API**: バックエンド通信

### 開発環境
- **XAMPP**: ローカル開発環境
- **Docker**: コンテナ化（オプション）
- **phpMyAdmin**: データベース管理

## 📦 **インストール**

### 🔧 **方法1: XAMPP使用（推奨）**

#### 前提条件
- [XAMPP](https://www.apachefriends.org/) がインストール済み
- PHP 7.4以上
- MySQL/MariaDB

#### インストール手順

1. **プロジェクトのダウンロード**
   ```bash
   git clone https://github.com/your-repo/cooking-cost-system.git
   cd cooking-cost-system
   ```

2. **XAMPP htdocsに配置**
   ```
   C:\xampp\htdocs\cooking-cost-system\
   ```

3. **XAMPP起動**
   - XAMPP Control Panel を開く
   - Apache「Start」をクリック
   - MySQL「Start」をクリック

4. **データベースセットアップ**
   
   **オプションA: phpMyAdmin使用（推奨）**
   ```
   1. http://localhost/phpmyadmin にアクセス
   2. 「新規作成」をクリック
   3. データベース名: cooking_cost_system
   4. 照合順序: utf8mb4_unicode_ci
   5. 「作成」をクリック
   6. 「インポート」タブでsetup.sqlをアップロード
   ```

   **オプションB: コマンドライン**
   ```sql
   mysql -u root -p
   CREATE DATABASE cooking_cost_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   USE cooking_cost_system;
   SOURCE /path/to/setup.sql;
   ```

5. **設定ファイル確認**
   ```php
   // config.php
   define('DB_HOST', 'localhost');
   define('DB_NAME', 'cooking_cost_system');
   define('DB_USER', 'root');
   define('DB_PASS', ''); // XAMPPの場合は空
   ```

6. **動作確認**
   ```
   http://localhost/cooking-cost-system/
   ```

### 🐳 **方法2: Docker使用**

#### 前提条件
- [Docker Desktop](https://www.docker.com/products/docker-desktop) がインストール済み

#### インストール手順

1. **プロジェクトのダウンロード**
   ```bash
   git clone https://github.com/your-repo/cooking-cost-system.git
   cd cooking-cost-system
   ```

2. **Docker起動**
   ```bash
   docker-compose up -d
   ```

3. **アクセス**
   ```
   アプリケーション: http://localhost
   phpMyAdmin: http://localhost:8080
   管理画面: http://localhost/admin.php
   ```

4. **停止**
   ```bash
   docker-compose down
   ```

## 📁 **プロジェクト構成**

```
cooking-cost-system/
├── 📄 index.php              # メイン画面
├── 📄 admin.php              # 管理者パネル
├── 📄 api.php                # RESTful API
├── 📄 reports_api.php        # レポート API
├── 📄 config.php             # データベース設定
├── 📄 Database.php           # データベース接続クラス
├── 📄 Response.php           # APIレスポンスクラス
├── 📄 Validator.php          # バリデーションクラス
├── 📄 utils.php              # ユーティリティ関数
├── 📄 setup.sql              # データベースセットアップ
├── 📄 install.php            # インストールウィザード
├── 📄 maintenance.php        # メンテナンスモード
├── 📄 export.php             # データエクスポート
├── 📄 app.js                 # フロントエンドJS
├── 📄 .htaccess              # Apache設定
├── 📄 docker-compose.yml     # Docker設定
├── 📄 Dockerfile             # Dockerイメージ
├── 📂 models/                # データモデル
│   ├── 📄 Ingredient.php     # 食材モデル
│   ├── 📄 Dish.php           # 料理モデル
│   ├── 📄 CompletedFood.php  # 完成品モデル
│   └── 📄 Memo.php           # メモモデル
├── 📂 logs/                  # ログファイル
└── 📂 docker/                # Docker設定ファイル
```

## 🎮 **使用方法**

### 基本的なワークフロー

#### 1. 食材登録
```
1. 「食材管理」セクションで「+」ボタンをクリック
2. 食材情報を入力（名前、購入場所、数量、単価等）
3. ジャンルを選択
4. 「追加」ボタンで保存
```

#### 2. 料理作成
```
1. 登録した食材を「DISH」エリアにドラッグ&ドロップ
2. 使用量を入力
3. 料理名を入力
4. 「料理を作成」ボタンで保存
```

#### 3. 完成品作成
```
1. 作成した料理を「FOOD」エリアにドラッグ&ドロップ
2. 使用量と販売価格を設定
3. 完成品名を入力
4. 「完成品を登録」ボタンで保存
```

#### 4. 分析確認
```
1. 管理画面（admin.php）にアクセス
2. 統計情報、チャート、レポートを確認
3. 利益率や効率性を分析
```

### 🔑 **主要なURL**

- **メイン画面**: `http://localhost/cooking-cost-system/`
- **管理画面**: `http://localhost/cooking-cost-system/admin.php`
- **phpMyAdmin**: `http://localhost/phpmyadmin`（XAMPP）
- **API**: `http://localhost/cooking-cost-system/api.php`

## 🔧 **トラブルシューティング**

### よくある問題と解決策

#### 1. 白い画面が表示される
```php
// debug-index.php を作成してアクセス
<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
echo "PHPテスト成功!";
?>
```

#### 2. データベース接続エラー
```
- XAMPPでMySQLが起動しているか確認
- config.phpの認証情報を確認
- データベースが作成されているか確認
```

#### 3. localhost接続拒否
```
- XAMPP Control PanelでApacheが起動しているか確認
- ポート80が他のアプリケーションで使用されていないか確認
- ファイアウォール設定を確認
```

#### 4. ファイルが見つからない
```
- 必要なファイルがすべて配置されているか確認
- models/フォルダとその中のファイルを確認
- .htaccessファイルの配置を確認
```

### 🩺 **デバッグツール**

システムには以下のデバッグツールが含まれています：

- **debug-index.php**: システム状態の確認
- **db-check.php**: データベース接続テスト
- **エラーログ**: `logs/app.log`でエラー確認

## 📊 **API仕様**

### 基本形式
```
BASE URL: http://localhost/cooking-cost-system/api.php
Content-Type: application/json
```

### エンドポイント一覧

#### 食材管理
```
GET    /api.php/ingredients          # 食材一覧取得
POST   /api.php/ingredients          # 食材追加
PUT    /api.php/ingredients/{id}     # 食材更新
DELETE /api.php/ingredients/{id}     # 食材削除
```

#### 料理管理
```
GET    /api.php/dishes               # 料理一覧取得
POST   /api.php/dishes               # 料理作成
PUT    /api.php/dishes/{id}          # 料理更新
DELETE /api.php/dishes/{id}          # 料理削除
```

#### 完成品管理
```
GET    /api.php/foods                # 完成品一覧取得
POST   /api.php/foods                # 完成品作成
PUT    /api.php/foods/{id}           # 完成品更新
DELETE /api.php/foods/{id}           # 完成品削除
```

#### レポート
```
GET    /reports_api.php?type=summary           # 概要統計
GET    /reports_api.php?type=cost_analysis     # コスト分析
GET    /reports_api.php?type=efficiency        # 効率分析
```

## 🔐 **セキュリティ**

### 実装済みセキュリティ機能

- **SQLインジェクション対策**: プリペアドステートメント使用
- **XSS対策**: 出力時のエスケープ処理
- **CSRF対策**: トークンベース認証
- **ファイルアクセス制限**: .htaccessによる保護
- **入力値検証**: Validatorクラスによる厳密なチェック

### セキュリティ推奨事項

1. **本番環境では**:
   - `error_reporting(E_ALL)`を無効にする
   - `display_errors`を無効にする
   - 強力なデータベースパスワードを設定
   - HTTPS通信を使用

2. **ファイル権限**:
   ```bash
   chmod 755 ディレクトリ
   chmod 644 PHPファイル
   chmod 600 config.php
   ```

## 🧪 **テスト**

### 動作確認テスト

1. **基本機能**:
   ```
   □ 食材の追加・編集・削除
   □ 料理の作成・表示・削除
   □ 完成品の作成・表示・削除
   □ 原価の自動計算
   ```

2. **UI機能**:
   ```
   □ ドラッグ&ドロップ操作
   □ リアルタイム計算
   □ レスポンシブデザイン
   □ モーダル表示
   ```

3. **データ管理**:
   ```
   □ データエクスポート/インポート
   □ バックアップ・復元
   □ 検索・フィルタリング
   □ 統計・分析表示
   ```

## 🤝 **貢献**

### 開発に参加するには

1. **フォーク**: このリポジトリをフォーク
2. **ブランチ作成**: `git checkout -b feature/amazing-feature`
3. **変更をコミット**: `git commit -m 'Add amazing feature'`
4. **プッシュ**: `git push origin feature/amazing-feature`
5. **プルリクエスト作成**: GitHub上でプルリクエストを作成

### 開発ガイドライン

- **コーディング規約**: PSR-12に準拠
- **コメント**: 日本語で記述
- **テスト**: 新機能には適切なテストを追加
- **ドキュメント**: README更新が必要な場合は含める

## 📝 **更新履歴**

### v5.0 (Current)
- 🆕 完全なUI/UX刷新
- 🆕 ドラッグ&ドロップ機能
- 🆕 Docker対応
- 🆕 レポート・分析機能強化
- 🆕 レスポンシブデザイン
- 🔧 セキュリティ強化
- 🔧 パフォーマンス改善

### v4.0
- 基本的な原価計算機能
- MySQL対応
- 基本的なWeb UI

## 📜 **ライセンス**

MIT License

```
Copyright (c) 2024 料理原価計算システム

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 📞 **サポート**

### 問題が発生した場合

1. **FAQ確認**: よくある問題をREADMEで確認
2. **デバッグツール使用**: debug-index.phpで状態確認
3. **ログ確認**: logs/app.logでエラーログ確認
4. **Issue作成**: GitHubで問題を報告

### 連絡先

- **開発者**: [開発者名]
- **Email**: [メールアドレス]
- **GitHub**: [GitHubリポジトリURL]

---

## 🙏 **謝辞**

このプロジェクトは以下の技術・ライブラリを使用しています：

- **PHP**: サーバーサイド開発
- **MySQL**: データベース管理
- **Apache**: Webサーバー
- **Bootstrap Icons**: アイコン
- **Font Awesome**: UI要素

---

<div align="center">

**🍽️ 料理原価計算システム v5.0**

Made with ❤️ for the culinary community

</div>
