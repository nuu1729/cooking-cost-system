module.exports = {
    // TypeScript設定
    preset: 'ts-jest',
    testEnvironment: 'node',
    
    // ルートディレクトリ
    rootDir: './src',
    
    // テストファイルのパターン
    testMatch: [
        '**/__tests__/**/*.test.ts',
        '**/__tests__/**/*.spec.ts',
        '**/*.test.ts',
        '**/*.spec.ts'
    ],
    
    // 無視するファイル・ディレクトリ
    testPathIgnorePatterns: [
        '/node_modules/',
        '/dist/',
        '/coverage/'
    ],
    
    // モジュールパスマッピング
    moduleNameMapping: {
        '^@/(.*)$': '<rootDir>/$1'
    },
    
    // セットアップファイル
    setupFilesAfterEnv: [
        '<rootDir>/../tests/setup.ts'
    ],
    
    // カバレッジ設定
    collectCoverage: false,
    collectCoverageFrom: [
        'src/**/*.{ts,js}',
        '!src/**/*.d.ts',
        '!src/server.ts',
        '!src/app.ts',
        '!src/**/*.test.ts',
        '!src/**/*.spec.ts',
        '!src/__tests__/**/*'
    ],
    
    coverageDirectory: '../coverage',
    coverageReporters: [
        'text',
        'text-summary',
        'html',
        'lcov',
        'clover'
    ],
    
    // カバレッジしきい値
    coverageThreshold: {
        global: {
            branches: 70,
            functions: 70,
            lines: 70,
            statements: 70
        }
    },
    
    // テストタイムアウト
    testTimeout: 10000,
    
    // グローバル設定
    globals: {
        'ts-jest': {
            tsconfig: {
                compilerOptions: {
                    module: 'commonjs',
                    target: 'es2020',
                    lib: ['es2020'],
                    moduleResolution: 'node',
                    esModuleInterop: true,
                    allowSyntheticDefaultImports: true,
                    experimentalDecorators: true,
                    emitDecoratorMetadata: true,
                    skipLibCheck: true,
                    forceConsistentCasingInFileNames: true,
                    resolveJsonModule: true
                }
            }
        }
    },
    
    // モック設定
    clearMocks: true,
    restoreMocks: true,
    resetMocks: true,
    
    // 詳細出力
    verbose: true,
    
    // 並列実行
    maxWorkers: '50%',
    
    // エラー検出
    errorOnDeprecated: true,
    
    // テスト結果の表示設定
    displayName: {
        name: 'COOKING-COST-API',
        color: 'blue'
    },
    
    // レポーター設定
    reporters: [
        'default',
        [
            'jest-junit',
            {
                outputDirectory: '../coverage',
                outputName: 'junit.xml',
                ancestorSeparator: ' › ',
                uniqueOutputName: 'false',
                suiteNameTemplate: '{filepath}',
                classNameTemplate: '{classname}',
                titleTemplate: '{title}'
            }
        ]
    ],
    
    // 実行前・後のスクリプト
    globalSetup: '<rootDir>/../tests/global-setup.ts',
    globalTeardown: '<rootDir>/../tests/global-teardown.ts',
    
    // モジュール変換設定
    transform: {
        '^.+\\.ts$': 'ts-jest'
    },
    
    // 拡張子の解決順序
    moduleFileExtensions: [
        'ts',
        'js',
        'json',
        'node'
    ],
    
    // ESModules対応
    extensionsToTreatAsEsm: [],
    
    // 環境変数
    setupFiles: [
        '<rootDir>/../tests/env-setup.ts'
    ]
};
