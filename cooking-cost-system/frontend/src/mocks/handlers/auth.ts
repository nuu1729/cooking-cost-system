import { http, HttpResponse } from 'msw';
import { MOCK_ACCOUNTS } from './db';

// 00_signinAPI, 01_loginAPI
export const authHandlers = [
    // 01_loginAPI
    http.post('/api/auth/login', async ({ request }) => {
        try {
            console.log('[MSW Handler] POST /api/auth/login initiated');
            
            let body: any;
            try {
                body = await request.json();
            } catch (jsonError) {
                console.error('[MSW Handler] Failed to parse request JSON:', jsonError);
                return HttpResponse.json({
                    success: false,
                    message: 'リクエストの解析に失敗しました。',
                    timestamp: new Date().toISOString()
                }, { status: 400 });
            }

            console.log('[MSW Handler] Request body:', body);
            const identity = body.username || body.email;
            const password = body.password;

            if (!identity || !password) {
                console.warn('[MSW Handler] Missing identity or password');
                return HttpResponse.json({
                    success: false,
                    message: 'ユーザー名とパスワードが必要です。',
                    timestamp: new Date().toISOString()
                }, { status: 400 });
            }

            console.log('[MSW Handler] Searching for user:', identity);
            if (!MOCK_ACCOUNTS || !Array.isArray(MOCK_ACCOUNTS)) {
                console.error('[MSW Handler] MOCK_ACCOUNTS is not a valid array');
                throw new Error('Database error');
            }

            const user = MOCK_ACCOUNTS.find(u => 
                (u.username === identity || u.email === identity) && u.password === password
            );

            if (!user) {
                console.log('[MSW Handler] User not found or password mismatch:', identity);
                return HttpResponse.json({
                    success: false,
                    message: 'ユーザー名、メールアドレスまたはパスワードが正しくありません。',
                    timestamp: new Date().toISOString()
                }, { status: 401 });
            }
            
            console.log('[MSW Handler] Login successful for:', user.username);
            return HttpResponse.json({
                success: true,
                data: {
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        role: user.role,
                        is_active: user.is_active,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    },
                    token: 'mock-jwt-token',
                    expiresAt: new Date(Date.now() + 3600 * 1000).toISOString()
                },
                timestamp: new Date().toISOString()
            });
        } catch (error: any) {
            console.error('[MSW Handler] Unexpected error in login handler:', error);
            return HttpResponse.json({
                success: false,
                message: 'サーバー内部エラーが発生しました。',
                error: error.message,
                timestamp: new Date().toISOString()
            }, { status: 500 });
        }
    }),

    // 00_signinAPI
    http.post('/api/auth/register', async ({ request }) => {
        const body = await request.json() as any;
        const newUser = {
            id: MOCK_ACCOUNTS.length + 1,
            username: body.name || body.username || 'new-user',
            email: body.email,
            password: body.password || 'default-pass',
            role: 'user' as const,
            is_active: true
        };
        MOCK_ACCOUNTS.push(newUser);

        return HttpResponse.json({
            success: true,
            data: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email,
                role: newUser.role,
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
