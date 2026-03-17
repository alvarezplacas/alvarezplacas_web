import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ cookies, redirect }) => {
    // Clear all possible session cookies
    cookies.delete('client_session', { path: '/' });
    cookies.delete('seller_session', { path: '/' });
    cookies.delete('admin_session', { path: '/' });

    // Redirect to home as requested
    return redirect('/');
};
