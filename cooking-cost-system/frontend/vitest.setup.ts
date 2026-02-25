import '@testing-library/jest-dom'
import { beforeAll, afterEach, afterAll } from 'vitest'
import { server } from './src/mocks/server'

// MSWのサーバー起動
beforeAll(() => server.listen())

// 各テスト後にハンドラーリセット
afterEach(() => server.resetHandlers())

// テスト終了後にサーバー停止
afterAll(() => server.close())
