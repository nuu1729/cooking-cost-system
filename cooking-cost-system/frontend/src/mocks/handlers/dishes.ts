import { http, HttpResponse } from 'msw';
import { MOCK_DISHES } from './db';

/**
 * 08_dishAPI - お品（完成品）関連のモックハンドラー
 */
export const dishHandlers = [
    // お品一覧取得
    http.get('/api/dishes', async ({ request }) => {
        const url = new URL(request.url);
        const nameQuery = url.searchParams.get('name');
        const minPrice = url.searchParams.get('minPrice');
        const maxPrice = url.searchParams.get('maxPrice');
        const minCost = url.searchParams.get('minCost');
        const maxCost = url.searchParams.get('maxCost');
        const sortBy = url.searchParams.get('sortBy') || 'name';
        const sortOrder = url.searchParams.get('sortOrder') || 'ASC';
        
        let filtered = [...MOCK_DISHES];
        
        // 検索フィルター
        if (nameQuery) {
            filtered = filtered.filter(d => d.name.includes(nameQuery));
        }
        
        // 価格フィルター
        if (minPrice) {
            filtered = filtered.filter(d => d.price >= Number(minPrice));
        }
        if (maxPrice) {
            filtered = filtered.filter(d => d.price <= Number(maxPrice));
        }
        
        // 原価フィルター
        if (minCost) {
            filtered = filtered.filter(d => d.total_cost >= Number(minCost));
        }
        if (maxCost) {
            filtered = filtered.filter(d => d.total_cost <= Number(maxCost));
        }
        
        // ソート
        filtered.sort((a, b) => {
            let valA = a[sortBy];
            let valB = b[sortBy];
            
            if (typeof valA === 'string') {
                return sortOrder === 'ASC' ? valA.localeCompare(valB) : valB.localeCompare(valA);
            } else {
                return sortOrder === 'ASC' ? valA - valB : valB - valA;
            }
        });

        return HttpResponse.json({
            success: true,
            data: filtered,
            count: filtered.length,
            timestamp: new Date().toISOString()
        });
    }),

    // 完成品一覧取得 (エイリアス)
    http.get('/api/foods', async ({ request }) => {
        const url = new URL(request.url);
        const nameQuery = url.searchParams.get('name');
        const minPrice = url.searchParams.get('minPrice');
        const maxPrice = url.searchParams.get('maxPrice');
        const sortBy = url.searchParams.get('sortBy') || 'name';
        const sortOrder = url.searchParams.get('sortOrder') || 'ASC';
        
        let filtered = [...MOCK_DISHES];
        if (nameQuery) filtered = filtered.filter(d => d.name.includes(nameQuery));
        if (minPrice) filtered = filtered.filter(d => d.price >= Number(minPrice));
        if (maxPrice) filtered = filtered.filter(d => d.price <= Number(maxPrice));
        
        // ソート
        filtered.sort((a, b) => {
            let valA = a[sortBy];
            let valB = b[sortBy];
            
            if (typeof valA === 'string') {
                return sortOrder === 'ASC' ? valA.localeCompare(valB) : valB.localeCompare(valA);
            } else {
                return sortOrder === 'ASC' ? valA - valB : valB - valA;
            }
        });
        
        return HttpResponse.json({
            success: true,
            data: filtered,
            count: filtered.length,
            timestamp: new Date().toISOString()
        });
    }),

    // 特定のお品詳細取得
    http.get('/api/dishes/:id', async ({ params }) => {
        const { id } = params;
        const item = MOCK_DISHES.find(d => d.id === Number(id));

        if (!item) {
            return HttpResponse.json({
                success: false,
                message: 'お品データが見つかりません',
                timestamp: new Date().toISOString()
            }, { status: 404 });
        }

        return HttpResponse.json({
            success: true,
            data: item,
            timestamp: new Date().toISOString()
        });
    }),

    // お品データの削除
    http.delete('/api/dishes/:id', async ({ params }) => {
        const { id } = params;
        const index = MOCK_DISHES.findIndex(d => d.id === Number(id));
        
        if (index === -1) {
            return HttpResponse.json({
                success: false,
                message: '削除対象が見つかりません',
                timestamp: new Date().toISOString()
            }, { status: 404 });
        }
        
        MOCK_DISHES.splice(index, 1);
        
        return HttpResponse.json({
            success: true,
            message: '削除が完了しました',
            timestamp: new Date().toISOString()
        });
    }),
    
    // 利益率ランキング (例: /api/dishes/stats/profit)
    http.get('/api/dishes/stats/profit', async () => {
        const sortedByProfit = [...MOCK_DISHES].sort((a, b) => b.profit_rate - a.profit_rate);
        return HttpResponse.json({
            success: true,
            data: sortedByProfit.slice(0, 5),
            timestamp: new Date().toISOString()
        });
    }),
];
