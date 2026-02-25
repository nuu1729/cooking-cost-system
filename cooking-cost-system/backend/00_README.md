# バックエンド開発ガイド

## ディレクトリ構成

- `api/`: APIモジュール
    - `controllers/`: APIエンドポイント（ルーティング，リクエスト・レスポンス処理）
    - `models/`: DBモデル（SQLAlchemyモデル定義）
    - `services/`: ビジネスロジック（認証，システム設定等）
    - `validators/`: 入力値バリデーション
    - `database.py`: DB接続設定
    - `error.py`: エラーハンドリング
- `tests/`: 単体テスト（pytest）
- `app.py`: Flaskアプリケーションのエントリポイント
- `config.py`: 環境設定（ローカル開発用）
- `config_staging.py`: 環境設定（ステージング用）
- `config_production.py`: 環境設定（本番用）
- `requirements.txt`: pythonパッケージ依存関係

## セットアップ

1. 仮想環境を作成し、有効化します。
2. 依存関係をインストールします:
   ```bash
   pip install -r requirements.txt
   ```
3. `.env.example` を基に `.env` ファイルを設定します。

## アプリケーションの実行

```bash
python app.py
```
