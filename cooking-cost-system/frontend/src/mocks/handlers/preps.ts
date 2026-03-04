import { http, HttpResponse } from 'msw';
import { CreatePrepRequest } from '../../types';
import { MOCK_PREPS, MOCK_INGREDIENTS } from './db';

/**
 * 06_prepAPI - 仕込み関連のモックハンドラー
 * @common
 */
export const prepHandlers = [
    // 既存の仕込み一覧取得
    http.get('/api/preps', async ({ request }) => {
        const url = new URL(request.url);
        const nameQuery = url.searchParams.get('name');
        
        let filtered = [...MOCK_PREPS];
        if (nameQuery) {
            filtered = filtered.filter(p => p.prep_name.includes(nameQuery));
        }

        return HttpResponse.json({
            success: true,
            data: filtered,
            timestamp: new Date().toISOString()
        });
    }),

    // 仕込み名重複チェック
    // ※ :id より前に定義する必要がある
    http.get('/api/preps/check-name', async ({ request }) => {
        const url = new URL(request.url);
        const name = url.searchParams.get('name');
        const exists = MOCK_PREPS.some(p => p.prep_name === name);

        return HttpResponse.json({
            success: true,
            data: { exists },
            timestamp: new Date().toISOString()
        });
    }),

    // 商品名検索（仕込み画面用サジェスト）
    // 登録済みの「食材」と「過去の仕込み」の両方を検索対象にする
    // ※ /api/ingredients/:id より前にマッチさせる必要があるため、
    // handlers/index.ts で prepHandlers を先に読み込むか、ここに定義する
    http.get('/api/ingredients/search', async ({ request }) => {
        const url = new URL(request.url);
        const query = url.searchParams.get('q') || '';

        // 食材からの検索
        const ingResults = MOCK_INGREDIENTS.filter(i => i.name.includes(query));
        
        // 仕込みからの検索（※簡易的に食材と同じ形式に変換）
        const prepResults = MOCK_PREPS
            .filter(p => p.prep_name.includes(query))
            .map(p => ({
                id: p.id,
                name: p.prep_name,
                price: p.total_cost,
                quantity: p.yield_amount,
                unit: p.yield_unit,
                store: '自家製',
                genre: 'sauce' // 便宜上のジャンル
            }));

        return HttpResponse.json({
            success: true,
            data: [...ingResults, ...prepResults],
            timestamp: new Date().toISOString()
        });
    }),

    // 特定の仕込み詳細取得
    http.get('/api/preps/:id', async ({ params }) => {
        const { id } = params;
        const item = MOCK_PREPS.find(p => p.id === Number(id));

        if (!item) {
            return HttpResponse.json({
                success: false,
                message: '仕込みデータが見つかりません',
                timestamp: new Date().toISOString()
            }, { status: 404 });
        }

        return HttpResponse.json({
            success: true,
            data: item,
            timestamp: new Date().toISOString()
        });
    }),

    // 仕込みデータの登録 (POST /api/preps)
    http.post('/api/preps', async ({ request }) => {
        const body = await request.json() as CreatePrepRequest;

        // バリデーション
        if (!body.prep_name || body.yield_amount <= 0 || !body.items || body.items.length === 0) {
            return HttpResponse.json({
                success: false,
                message: '入力内容が不足しています（仕込み名、仕込み量、構成リストは必須です）',
                timestamp: new Date().toISOString()
            }, { status: 400 });
        }

        const newPrep = {
            id: 100 + MOCK_PREPS.length + 1,
            ...body,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        MOCK_PREPS.push(newPrep);
        
        return HttpResponse.json({
            success: true,
            data: newPrep,
            message: '仕込みデータを登録しました',
            timestamp: new Date().toISOString()
        });
    }),
    
    // 仕込みデータの削除
    http.delete('/api/preps/:id', async ({ params }) => {
        const { id } = params;
        const index = MOCK_PREPS.findIndex(p => p.id === Number(id));
        
        if (index === -1) {
            return HttpResponse.json({
                success: false,
                message: '削除対象が見つかりません',
                timestamp: new Date().toISOString()
            }, { status: 404 });
        }
        
        MOCK_PREPS.splice(index, 1);
        
        return HttpResponse.json({
            success: true,
            message: '削除が完了しました',
            timestamp: new Date().toISOString()
        });
    }),
];
