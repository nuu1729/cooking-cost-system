
import { authHandlers } from './auth';
import { homeHandlers } from './home';
import { ingredientHandlers } from './ingredients';

export const handlers = [
    ...authHandlers,
    ...homeHandlers,
    ...ingredientHandlers,
];
