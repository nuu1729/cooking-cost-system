
import { http, HttpResponse } from 'msw';
import { Ingredient } from '../../types';
import { MOCK_INGREDIENTS } from "./db";

// 03_addAPI, 04_editAPI, 05_searchAPI
export const ingredientHandlers = [
    // 05_searchAPI - List All (With Query)
    http.get('/api/ingredients', async ({ request }) => {
        const url = new URL(request.url);
        const nameQuery = url.searchParams.get('name');
        
        let filtered = [...MOCK_INGREDIENTS];

        if (nameQuery) {
            filtered = filtered.filter(ing => ing.name.includes(nameQuery));
        }

        return HttpResponse.json({
            success: true,
            data: filtered,
            timestamp: new Date().toISOString()
        });
    }),

    // 05_searchAPI (Detail)
    http.get('/api/ingredients/:id', async ({ params }) => {
        const { id } = params;
        const item = MOCK_INGREDIENTS.find((i: Ingredient) => i.id === Number(id));

        if (!item) {
            return HttpResponse.json({
                success: false,
                message: 'Ingredient not found'
            }, { status: 404 });
        }

        return HttpResponse.json({
            success: true,
            data: item,
            timestamp: new Date().toISOString()
        });
    }),

    // 03_addAPI - Create
    http.post('/api/ingredients', async ({ request }) => {
        const newIng = await request.json() as Partial<Ingredient>;
        const created: Ingredient = {
            id: MOCK_INGREDIENTS.length + 1,
            name: newIng.name || '',
            price: newIng.price || 0,
            quantity: newIng.quantity || 0,
            unit: newIng.unit || 'g',
            // Defaulting logic
            unit_price: (newIng.price! / newIng.quantity!),
            store: newIng.store || 'Unknown',
            genre: newIng.genre || 'vegetable',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        MOCK_INGREDIENTS.push(created);

        return HttpResponse.json({
            success: true,
            data: created,
            timestamp: new Date().toISOString()
        });
    }),

    // 04_editAPI - Update
    http.put('/api/ingredients/:id', async ({ request, params }) => {
        const { id } = params;
        const updates = await request.json() as Partial<Ingredient>;
        const index = MOCK_INGREDIENTS.findIndex((i: Ingredient) => i.id === Number(id));

        if (index === -1) {
            return HttpResponse.json({
                success: false,
                message: 'Ingredient not found'
            }, { status: 404 });
        }

        MOCK_INGREDIENTS[index] = {
            ...MOCK_INGREDIENTS[index],
            ...updates,
            updated_at: new Date().toISOString()
        };

        return HttpResponse.json({
            success: true,
            data: MOCK_INGREDIENTS[index],
            timestamp: new Date().toISOString()
        });
    })
];
