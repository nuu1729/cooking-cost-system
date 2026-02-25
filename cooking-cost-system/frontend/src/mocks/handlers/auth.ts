import { http, HttpResponse } from 'msw';

// 00_signinAPI, 01_loginAPI
export const authHandlers = [
    // 01_loginAPI
    http.post('/api/auth/login', async ({ request }) => {
        const body = await request.json() as any;
        // Handle both username and email as identifier to support various frontend implementations
        const identity = body.username || body.email || 'mock-user';
        
        return HttpResponse.json({
            success: true,
            data: {
                user: {
                    id: 1,
                    username: identity,
                    email: body.email || 'test@example.com',
                    role: 'admin',
                    is_active: true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                },
                token: 'mock-jwt-token',
                expiresAt: new Date(Date.now() + 3600 * 1000).toISOString()
            },
            timestamp: new Date().toISOString()
        });
    }),

    // 00_signinAPI
    http.post('/api/auth/register', async ({ request }) => {
        const body = await request.json() as any;
        return HttpResponse.json({
            success: true,
            data: {
                id: 2,
                username: body.name || body.username || 'new-user',
                email: body.email,
                role: 'user',
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            },
            timestamp: new Date().toISOString()
        });
    }),

    // Auth Status
    http.get('/api/auth/status', () => {
        return HttpResponse.json({
            success: true,
            data: { authEnabled: true },
            timestamp: new Date().toISOString()
        });
    }),

    // User Profile
    http.get('/api/auth/me', () => {
        return HttpResponse.json({
            success: true,
            data: {
                id: 1,
                username: 'mock-user',
                email: 'test@example.com',
                role: 'admin',
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            },
            timestamp: new Date().toISOString()
        });
    })
];
