# 🍽️ 料理原価計算システム THE MINGERING DINER Edition

> **ダイナー向けのモダンな料理原価管理システム（AI駆動開発により磨き上げられたv2.0）**

[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-blue)](https://tailwindcss.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://typescriptlang.org)
[![Python](https://img.shields.io/badge/Python-3.11-yellow)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-2.3-black)](https://flask.palletsprojects.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0%2B-orange)](https://mysql.com)

## 🚀 概要

飲食店の経営を支える強力なツールです。本プロジェクトは、AI駆動開発（Antigravity）を全面的に採用し、フロントエンドファーストの設計思想で構築されています。ダイナー「THE MINGERING DINER」のブランディングを反映した、プレミアムで直感的なUIが特徴です。

### ✨ 主な特徴

- **🎨 プレミアム・デザイン**: Tailwind CSSによる特製UI。
- **⚡ フロントエンドファースト**: ユーザー体験（UX）を起点とした設計。
- **📊 包括的な原価管理**: 食材から仕込み品、お品（完成品）、最終的な販売価格計算までを一気通貫で管理。
- **🔒 マルチテナントアーキテクチャ**: 各ユーザーごとに独立してデータを管理可能。
- **🤖 音声入力 (Web Speech API)**: 音声による食材の登録・入力機能。

## 🏗️ アーキテクチャ

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │────│   Backend API    │────│   Database      │
│   React + TS    │    │   Python 3.11    │    │   MySQL 8.0     │
│   Tailwind CSS  │    │   Flask + JWT    │    │                 │
│   Framer Motion │    │   SQLAlchemy     │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🎯 機能一覧

- **✅ アカウント管理**: ユーザーごとの認証、データの分離（`user_id`によるアクセス制御）。
- **✅ 食材追加**: 2カラムレイアウト、バリデーション、音声入力の自動パース。
- **✅ 食材検索**: 最安値ハイライト、単位換算（個→g）比較、リアルタイムフィルタ。
- **✅ 仕込み品管理**: 複数の食材を組み合わせた仕込み品の原価計算・構成管理。
- **✅ お品（完成品）管理**: 複数の仕込み品を組み合わせたお品の登録と管理。
- **✅ メモ機能**: 各ユーザーごとのプライベートなメモ機能。

## 🎙️ 音声入力のパース仕様

本システムは、自然な日本語の発話から以下の情報を自動的に抽出します：
- **商品名**: 文頭のキーワード（例：「トマト」）
- **価格**: 「○○円」というパターン（例：「150円」）
- **量・単位**: 「○○グラム」「○○g」「○○個」「○○ml」など
- **購入先**: 文末に近いキーワード（例：「業務スーパー」）

**例**: 「鶏もも肉、880円、1000g、肉のハナマサ」 → すべての項目が自動補完されます。

## 🚀 クイックスタート (ローカル開発環境)

### 1. データベースの立ち上げ (Docker)

```bash
docker-compose up -d database phpmyadmin
```
※ `docker-compose.yml`で定義された `database` サービスを起動します。
初回起動時に `setup.sql` が実行され、テストユーザーとデータがセットアップされます。
(phpMyAdmin: `http://localhost:8080`)

### 2. バックエンド API (Python)

```bash
cd backend
python -m venv venv
# 仮想環境を有効化 (Windows)
venv\Scripts\activate
pip install -r requirements.txt
python app.py
```
(API URL: `http://localhost:3001/api`)

### 3. フロントエンド (React)

```bash
cd frontend
npm install
npm run dev
```
(Frontend URL: `http://localhost:3000`)

## 🔑 テストユーザー情報

初期状態では以下のユーザーでログイン可能です：
- **ユーザー名**: `nuu1729`
- **パスワード**: `test1234`

## 📁 プロジェクト構成

```
cooking-cost-system/
├── 📂 backend/                    # Python Flask API
├── 📂 frontend/                   # React TypeScript SPA
├── 📂 docs/                       # ドキュメント（開発手順書、画面設計）
├── 📄 docker-compose.yml          # データベース・ツールのDocker定義
├── 📄 setup.sql                   # データベース初期化・シードデータ (seed_data.sql)
└── 📄 README.md                   # 本ファイル
```