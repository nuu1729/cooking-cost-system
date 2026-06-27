import { http, HttpResponse } from 'msw';
import { authHandlers } from './auth';
import { homeHandlers } from './home';
import { ingredientHandlers } from './ingredients';
import { prepHandlers } from './preps';
import { dishHandlers } from './dishes';

export const handlers = [
    http.get('/health', () => {
        return HttpResponse.json({ status: 'healthy' })
    }),
    ...authHandlers,
    ...homeHandlers,
    ...prepHandlers,
    ...ingredientHandlers,
    ...dishHandlers,
];
