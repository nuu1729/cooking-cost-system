# cooking-cost-system
For all restraunt owner
# 🍽️ 料理原価計算システム（PHP版）v5.0

元のHTML/JavaScriptシステムを完全にPHP/MySQL版に変換した、本格的なWebアプリケーションです。

[![PHP Version](https://img.shields.io/badge/PHP-7.4+-blue.svg)](https://php.net)
[![MySQL Version](https://img.shields.io/badge/MySQL-5.7+-orange.svg)](https://mysql.com)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## 📋 目次

- [機能一覧](#機能一覧)
- [システム要件](#システム要件)
- [ファイル構成](#ファイル構成)
- [インストール手順](#インストール手順)
- [API仕様](#api仕様)
- [使用方法](#使用方法)
- [管理者機能](#管理者機能)
- [カスタマイズ](#カスタマイズ)
- [トラブルシューティング](#トラブルシューティング)
- [貢献方法](#貢献方法)
- [ライセンス](#ライセンス)

## 🎯 機能一覧

### 基本機能
- ✅ **食材管理**: 登録・編集・削除・検索・価格比較
- ✅ **料理作成**: ドラッグ&ドロップでレシピ作成
- ✅ **完成品登録**: 盛り付け・原価計算・利益計算
- ✅ **ジャンル別管理**: 肉・野菜・調味料・ソース・冷凍・ドリンク
- ✅ **価格検索**: 最安値検索・店舗比較
- ✅ **データ管理**: エクスポート・インポート・バックアップ

### 高度機能
- 🎨 **モダンUI**: レスポンシブデザイン・アニメーション
- 📊 **統計・分析**: ダッシュボード・レポート・グラフ
- 🔧 **管理者パネル**: システム監視・メンテナンス
- 📱 **モバイル対応**: タッチ操作・レスポンシブレイアウト
- 🔒 **セキュリティ**: SQLインジェクション対策・入力検証
- ⚡ **パフォーマンス**: インデックス最適化・キャッシュ機能

## 🛠️ システム要件

### 必須要件
- **PHP**: 7.4以上（8.0推奨）
- **MySQL**: 5.7以上 または MariaDB 10.2以上
- **Webサーバー**: Apache 2.4+ または Nginx 1.16+
- **拡張機能**: PDO, PDO_MySQL, JSON, mbstring

### 推奨要件
- **メモリ**: 256MB以上
- **ディスク容量**: 100MB以上
- **PHP拡張**: OPcache, GD, Zip

### 対応ブラウザ
- Chrome 70+
- Firefox 65+
- Safari 12+
- Edge 79+

## 📁 ファイル構成

```
cooking-cost-system/
├── 📄 index.php                     # メインページ
├── 📄 admin.php                     # 管理者パネル
├── 📄 api.php                       # APIエンドポイント
├── 📄 install.php                   # インストールウィザード
├── 📄 config.php                    # 設定ファイル
├── 📄 Database.php                  # データベース接続
├── 📄 utils.php                     # ユーティリティ関数
├── 📄 setup.sql                     # データベースセットアップ
├── 📄 .htaccess                     # Apache設定
├── 📄 README.md                     # このファイル
├── 📁 models/                       # モデルクラス
│   ├── 📄 Ingredient.php           # 食材モデル
│   ├── 📄 Dish.php                 # 料理モデル
│   ├── 📄 CompletedFood.php        # 完成品モデル
│   └── 📄 Memo.php                 # メモモデル
├── 📁 assets/                       # 静的ファイル
│   ├── 📁 css/
│   ├── 📁 js/
│   └── 📁 images/
├── 📁 logs/                         # ログファイル
├── 📁 backups/                      # バックアップファイル
└── 📁 uploads/                      # アップロードファイル
```

## 🚀 インストール手順

### 方法1: 自動インストール（推奨）

1. **ファイルの配置**
   ```bash
   # Webサーバーのドキュメントルートに配置
   cd /var/www/html/
   git clone https://github.com/your-repo/cooking-cost-system.git
   cd cooking-cost-system/
   ```

2. **権限設定**
   ```bash
   chmod 755 -R .
   chmod 644 *.php
   chmod 600 config.php
   chown -R www-data:www-data .
   ```

3. **インストールウィザード実行**
   ```
   ブラウザで http://localhost/cooking-cost-system/install.php にアクセス
   ```

4. **セットアップ完了**
   - システム要件チェック
   - データベース設定
   - 初期データ投入
   - 設定ファイル生成

### 方法2: 手動インストール

1. **データベース作成**
   ```sql
   CREATE DATABASE cooking_cost_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'cooking_user'@'localhost' IDENTIFIED BY 'your_password';
   GRANT ALL PRIVILEGES ON cooking_cost_system.* TO 'cooking_user'@'localhost';
   FLUSH PRIVILEGES;
   ```

2. **テーブル作成**
   ```bash
   mysql -u cooking_user -p cooking_cost_system < setup.sql
   ```

3. **設定ファイル編集**
   ```php
   // config.php
   define('DB_HOST', 'localhost');
   define('DB_NAME', 'cooking_cost_system');
   define('DB_USER', 'cooking_user');
   define('DB_PASS', 'your_password');
   ```

## 📡 API仕様

### 基本URL
```
/api.php/{endpoint}
```

### 認証
現在は認証不要（将来的にAPIキー認証を実装予定）

### エンドポイント一覧

#### 食材管理
```
GET    /api.php/ingredients              # 食材一覧取得
GET    /api.php/ingredients/{id}         # 特定食材取得
POST   /api.php/ingredients              # 食材追加
PUT    /api.php/ingredients/{id}         # 食材更新
DELETE /api.php/ingredients/{id}         # 食材削除
```

#### 料理管理
```
GET    /api.php/dishes                   # 料理一覧取得
GET    /api.php/dishes/{id}              # 特定料理取得
POST   /api.php/dishes                   # 料理作成
PUT    /api.php/dishes/{id}              # 料理更新
DELETE /api.php/dishes/{id}              # 料理削除
```

#### 完成品管理
```
GET    /api.php/foods                    # 完成品一覧取得
GET    /api.php/foods/{id}               # 特定完成品取得
POST   /api.php/foods                    # 完成品登録
PUT    /api.php/foods/{id}               # 完成品更新
DELETE /api.php/foods/{id}               # 完成品削除
```

#### その他
```
GET    /api.php/memo                     # メモ取得
POST   /api.php/memo                     # メモ保存
GET    /api.php/price-search             # 価格検索
GET    /api.php/data                     # 全データエクスポート
POST   /api.php/data                     # 全データインポート
```

### レスポンス形式

#### 成功時
```json
{
  "success": true,
  "message": "Success",
  "data": { ... }
}
```

#### エラー時
```json
{
  "success": false,
  "message": "Error message",
  "details": "Detailed error information"
}
```

## 💡 使用方法

### 基本的な使い方

1. **食材の登録**
   - 「➕ 追加」ボタンをクリック
   - 食材情報を入力（名前、店舗、数量、価格等）
   - ジャンルを選択して「追加」

2. **料理の作成**
   - 食材パネルから食材をドラッグ
   - 料理作成エリアにドロップ
   - 使用量を入力
   - 料理名を入力して「料理を作成」

3. **完成品の登録**
   - 料理パネルから料理をドラッグ
   - FOODエリアにドロップ
   - 使用量・説明を入力
   - 完成品名と販売価格を入力して「完成品として登録」

### 高度な使い方

#### 価格検索
```
🔍 価格検索 → 食材名・店舗でフィルタ → 最安値確認
```

#### データ管理
```
💾 保存 → JSONファイルでエクスポート
📁 読み込み → JSONファイルをインポート
```

#### 管理者機能
```
admin.php → ダッシュボード・統計・システム管理
```

## 👑 管理者機能

### ダッシュボード
- 📊 リアルタイム統計
- 📈 ジャンル別グラフ
- 📋 活動ログ
- 💻 システム情報

### 機能一覧
- **統計分析**: 食材数・料理数・原価分析
- **システム監視**: CPU・メモリ・ディスク使用量
- **データ管理**: バックアップ・復元・最適化
- **メンテナンス**: キャッシュクリア・ログ管理

### アクセス方法
```
http://your-domain.com/admin.php
```

## 🎨 カスタマイズ

### テーマカスタマイズ

#### CSS変数でカラー変更
```css
:root {
  --primary-color: #667eea;
  --secondary-color: #764ba2;
  --success-color: #4caf50;
  --warning-color: #ff9800;
  --error-color: #f44336;
}
```

#### ダークモード対応
```css
@media (prefers-color-scheme: dark) {
  /* ダークモード用スタイル */
}
```

### 機能拡張

#### 新しいジャンル追加
```php
// genreInfo に追加
const genreInfo = {
    // 既存ジャンル...
    'custom': { name: 'カスタム', icon: '🔧', color: '#9c27b0' }
};
```

#### カスタムAPI追加
```php
// api.php に新しいエンドポイント追加
case 'custom-endpoint':
    handleCustomAPI($request_method, $id, $input, $query_params, $database);
    break;
```

### 多言語対応

#### 言語ファイル作成
```javascript
const translations = {
    'ja': { /* 日本語 */ },
    'en': { /* English */ },
    'zh': { /* 中文 */ }
};
```

## 🔧 トラブルシューティング

### よくある問題

#### 1. データベース接続エラー
```
症状: "データベース接続エラー"
原因: config.php の設定が間違っている
解決: DB_HOST, DB_USER, DB_PASS を確認
```

#### 2. APIエラー500
```
症状: Internal Server Error
原因: PHPエラー、ファイル権限
解決: error.log を確認、chmod 755 実行
```

#### 3. 画面が表示されない
```
症状: 白い画面
原因: JavaScript エラー、CSS読み込み失敗
解決: ブラウザの開発者ツールでエラー確認
```

#### 4. ドラッグ&ドロップが動作しない
```
症状: 食材をドラッグできない
原因: ブラウザ互換性、JavaScript無効
解決: モダンブラウザ使用、JavaScript有効化
```

### ログ確認方法

#### PHPエラーログ
```bash
tail -f /var/log/php_errors.log
```

#### アプリケーションログ
```bash
tail -f logs/app.log
```

#### データベースログ
```bash
tail -f /var/log/mysql/error.log
```

### パフォーマンス最適化

#### MySQL最適化
```sql
-- インデックス確認
SHOW INDEX FROM ingredients;

-- スロークエリ確認
SHOW PROCESSLIST;

-- テーブル最適化
OPTIMIZE TABLE ingredients, dishes, completed_foods;
```

#### PHP最適化
```php
// OPcache 設定
opcache.enable=1
opcache.memory_consumption=128
opcache.max_accelerated_files=4000
```

## 🤝 貢献方法

### 開発に参加する

1. **リポジトリをフォーク**
   ```bash
   git clone https://github.com/your-username/cooking-cost-system.git
   ```

2. **開発ブランチを作成**
   ```bash
   git checkout -b feature/new-feature
   ```

3. **変更をコミット**
   ```bash
   git commit -am 'Add new feature'
   ```

4. **プルリクエスト作成**
   ```bash
   git push origin feature/new-feature
   ```

### 報告・要望

- 🐛 **バグ報告**: [Issues](https://github.com/your-repo/issues) でバグを報告
- 💡 **機能要望**: [Discussions](https://github.com/your-repo/discussions) で機能を提案
- 📖 **ドキュメント**: README.md の改善提案

### コーディング規約

#### PHP
```php
// PSR-4 準拠
class ClassName {
    public function methodName($parameter) {
        return $result;
    }
}
```

#### JavaScript
```javascript
// ES6+ 使用
const functionName = (parameter) => {
    return result;
};
```

#### SQL
```sql
-- 大文字でキーワード、小文字でテーブル名
SELECT column_name 
FROM table_name 
WHERE condition = 'value';
```

## 📋 TODO / 今後の予定

### v5.1 予定機能
- [ ] ユーザー認証システム
- [ ] 多店舗対応
- [ ] 在庫管理機能
- [ ] レシピ写真アップロード
- [ ] PDF レポート出力

### v5.2 予定機能
- [ ] モバイルアプリ（PWA）
- [ ] リアルタイム同期
- [ ] AI による価格予測
- [ ] 栄養成分計算
- [ ] 多言語対応（英語・中国語）

### v6.0 予定機能
- [ ] マイクロサービス化
- [ ] GraphQL API
- [ ] React/Vue.js フロントエンド
- [ ] Docker 対応
- [ ] Kubernetes 対応

## 📄 ライセンス

このプロジェクトは [MIT License](LICENSE) の下で公開されています。

```
MIT License

Copyright (c) 2024 料理原価計算システム開発チーム

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

## 🙏 謝辞

このプロジェクトの開発にあたり、以下の方々に感謝いたします：

- **オープンソースコミュニティ**: PHP、MySQL、Apache の開発者の皆様
- **デザインインスピレーション**: モダンWebデザインの先駆者の皆様
- **テスター**: ベータ版をテストしていただいた皆様
- **貢献者**: プルリクエストやIssue報告をしていただいた皆様

## 📞 サポート・連絡先

- **公式サイト**: https://cooking-cost-system.example.com
- **ドキュメント**: https://docs.cooking-cost-system.example.com
- **サポート**: support@cooking-cost-system.example.com
- **GitHub**: https://github.com/your-repo/cooking-cost-system

---

**🍽️ 料理原価計算システム v5.0** - より良い料理管理のために

*Made with ❤️ by Development Team*
