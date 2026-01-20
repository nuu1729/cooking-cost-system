# 🍽️ 料理原価計算システム THE MINGERING DINER Edition

> **AI駆動開発により磨き上げられた、ダイナー向けのモダンな料理原価管理システム**

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-blue)](https://tailwindcss.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://typescriptlang.org)
[![MySQL](https://img.shields.io/badge/MySQL-8.0%2B-orange)](https://mysql.com)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue)](https://docker.com)

## 🚀 概要

料理原価計算システムは、飲食店の経営を支える強力なツールです。本プロジェクトは、AI駆動開発（Antigravity）を全面的に採用し、フロントエンドファーストの設計思想で構築されています。ダイナー「THE MINGERING DINER」のブランディングを反映した、プレミアムで直感的なUIが特徴です。

### ✨ 主な特徴

- **🎨 プレミアム・デザイン**: Tailwind CSSによる「THE MINGERING DINER」特製UI。
- **🤖 AI駆動開発**: Antigravityによる高速な開発と継続的な改善。
- **⚡ フロントエンドファースト**: ユーザー体験（UX）を起点とした設計。
- **📊 包括的な原価管理**: 食材から中料理、大料理、最終的な販売価格計算までを一気通貫で管理。
- **🐳 Docker対応**: コンテナ化により、どんな環境でも即座に展開可能。

## 🏗️ アーキテクチャ

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │────│   Backend API    │────│   Database      │
│   React + TS    │    │   Node.js + TS   │    │   MySQL 8.0     │
│   Tailwind CSS  │    │   Express        │    │                 │
│   Framer Motion │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Docker        │    │   Docker         │    │   Docker        │
│   Container     │    │   Container      │    │   Container     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🎯 機能一覧（現在の進捗）

- **✅ 食材追加**: 2カラムレイアウト、バリデーション、確認モーダル。
- **✅ 音声入力 (Web Speech API)**: 日本語発話からの自動パース（商品名、価格、量、店舗）。
- **✅ 食材編集**: 予測検索機能、変更前後の比較表示、DB連携。
- **✅ 食材検索**: 最安値ハイライト、単位換算（個→g）比較、リアルタイムフィルタ。
- **⏳ 中料理・大料理作成**: 複数の食材や料理を組み合わせた原価計算（次工程以降）。
- **⏳ 販売価格計算**: 目標原価率に基づいた販売価格の算出（次工程以降）。
- **⏳ ダッシュボード**: 利益率や原価傾向の可視化。

## 🎙️ 音声入力のパース仕様

本システムは、自然な日本語の発話から以下の情報を自動的に抽出します：
- **商品名**: 文頭のキーワード（例：「トマト」）
- **価格**: 「○○円」というパターン（例：「150円」）
- **量・単位**: 「○○グラム」「○○g」「○○個」「○○ml」など
- **購入先**: 文末に近いキーワード（例：「業務スーパー」）

**例**: 「鶏もも肉、880円、1000g、肉のハナマサ」 → すべての項目が自動補完されます。

## 🚀 クイックスタート

### 前提条件
- [Docker Desktop](https://www.docker.com/products/docker-desktop)
- [Git](https://git-scm.com/)

### セットアップ

```bash
# 1. リポジトリクローン
git clone <repository-url>
cd cooking-cost-system

# 2. Docker起動
docker-compose up -d --build

# 3. アクセス
echo "📱 フロントエンド: http://localhost:3000"
echo "🔧 API: http://localhost:3001"
echo "🗄️ phpMyAdmin: http://localhost:8080"
```

## 📁 プロジェクト構成

```
cooking-cost-system/
├── 📂 backend/                    # Node.js Express API
├── 📂 frontend/                   # React TypeScript SPA (Tailwind CSS)
├── 📂 docs/                       # ドキュメント（開発手順書、画面設計）
├── 📄 docker-compose.yml          # 開発・実行環境定義
└── 📄 README.md                   # 本ファイル
```

## 🔧 開発手順

詳細な開発フローについては、以下のドキュメントを参照してください：
- [AI駆動開発手順書](docs/開発手順書/料理原価計算システム_AI駆動開発手順書.md)
- [ホームページ画面設計](docs/画面イベント/2ホーム画面/ホーム画面.md)

## 📄 ライセンス

このプロジェクトは MIT License の下で公開されています。

---

<div align="center">

**🍽️ 料理原価計算システム THE MINGERING DINER Edition**

Made with ❤️ using AI-Driven Development

</div>