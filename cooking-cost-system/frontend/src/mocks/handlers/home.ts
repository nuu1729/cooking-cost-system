
import { http, HttpResponse } from 'msw';

// 02_homeAPI (Reports/Dashboard and Mock Data)
export const homeHandlers = [
    // 02_homeAPI - Dashboard Stats
    http.get('/api/reports/dashboard', () => {
        console.log('[MSW Handler] GET /api/reports/dashboard');
        return HttpResponse.json({
            success: true,
            data: {
                totalIngredients: 42,
                totalDishes: 15,
                totalCompletedFoods: 8,
                avgProfitRate: 25.5,
                totalRevenue: 150000,
                totalCost: 110000,
                totalProfit: 40000
            },
            timestamp: new Date().toISOString()
        });
    }),

    // 02_homeAPI - Popular Items
    http.get('/api/reports/popular-items', () => {
        return HttpResponse.json({
            success: true,
            data: {
                popularIngredients: [
                    { id: 1, name: 'トマト', usage_count: 50 },
                    { id: 2, name: '鶏肉', usage_count: 35 },
                    { id: 3, name: '玉ねぎ', usage_count: 30 }
                ]
            },
            timestamp: new Date().toISOString()
        });
    }),

    // Health Check (For initial pings)
    http.get('/health', () => {
        return HttpResponse.json({
            status: 'ok',
            timestamp: new Date().toISOString()
        });
    })
];
