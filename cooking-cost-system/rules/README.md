# 開発規約・AIルール

このディレクトリにはコード品質を維持するための開発規約と、AIアシスタント向けのルール定義（`.mdc` ファイル）が格納されています。

---

## ディレクトリ構成

```
rules/
├── app/          # アプリケーション開発規約
└── docs/         # ドキュメント作成規約
```

---

## app/ — アプリケーション開発規約

| ファイル | 内容 |
|---------|------|
| `backend-coding-standard.mdc` | バックエンド（Python/Flask）コーディング規約 |
| `frontend-coding-standard.mdc` | フロントエンド（React/TypeScript）コーディング規約 |
| `python-dto-and-response-rules.mdc` | Python DTO・レスポンス形式のルール |
| `python_code_generation.mdc` | Python コード生成ガイドライン |
| `python_common.mdc` | Python 共通規約 |
| `python_docstring.mdc` | Python docstring 記述ルール |
| `python_openapi2code.mdc` | OpenAPI 定義からのコード生成ルール |
| `python_project_structure.mdc` | Python プロジェクト構成規約 |
| `typescript-code-generation.mdc` | TypeScript コード生成ガイドライン |
| `business-common-rules.mdc` | 業務共通ルール |
| `project-structure.mdc` | プロジェクト全体の構成規約 |
| `api-doc-rules.mdc` | API ドキュメント記述ルール |
| `api-integration-test-rules.mdc` | API 結合テストのルール |
| `backend-productivity-improvement.mdc` | バックエンド生産性向上のTips |
| `code-review-checklist.mdc` | コードレビューチェックリスト |
| `easy_api_it_generation.mdc` | API 結合テスト簡易生成ガイド |
| `pr_review_code_python.mdc` | Python PR コードレビュー規約 |
| `pr_review_youken_python.mdc` | Python PR 要件レビュー規約 |
| `pt-test-instructions.mdc` | PT テスト手順 |
| `sql-authoring-rules.mdc` | SQL 記述規約 |
| `testing-guidelines.mdc` | テスト全般のガイドライン |

## docs/ — ドキュメント作成規約

| ファイル | 内容 |
|---------|------|
| `openapi-rules.mdc` | OpenAPI（OAS）定義書の記述規約 |
| `ddl_rules.mdc` | DDL（テーブル定義）の記述規約 |
| `ai-review-ddl-rules.mdc` | DDL の AI レビュールール |
| `ai-review-openapi-rules.mdc` | OpenAPI の AI レビュールール |
| `ai-review-process-rules.mdc` | AI レビュープロセスのルール |
| `development-procedure-modification-rules.mdc` | 開発手順書の変更ルール |
| `help-api-process-doc.mdc` | API 処理定義書の作成ガイド |
| `help-batch-process-doc.mdc` | バッチ処理定義書の作成ガイド |
| `testcase-rule.mdc` | テストケース記述ルール |
| `testcase-review-rule.mdc` | テストケースレビュールール |
