-- マイグレーション: 001
-- 日付: 2026-05-01
-- 内容: 初回スキーマ作成（setup.sql と同内容・参考用）
-- 備考: 実際の初回作成は docker-entrypoint-initdb.d/setup.sql が担う
--       このファイルは後続マイグレーションの番号基準として配置
--
-- ロールバック: DROP DATABASE cooking_cost_system; （初回のみ・全データ消失）

-- このファイルは実行しないこと。setup.sql を参照すること。
