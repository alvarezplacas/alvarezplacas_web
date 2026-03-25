import type { APIRoute } from 'astro';
import { query } from '@conexiones/lib/db.js';

export const POST: APIRoute = async ({ cookies, redirect }) => {
    // Note: In a real app, we'd check the session token
    const sessionToken = cookies.get('client_session')?.value;
    
    // Placeholder for real session check
    // If not authenticated, return 401
    
    try {
        // Assume we have the user ID from the session
        // For now, this is a placeholder that would be session-based
        const userId = 1; // getUserIdFromSession(sessionToken)

        // Delete user (or mark as inactive/deleted)
        // User requested: "este dashboard de cliente tiene que tener la opcion de eliminar su cuenta"
        await query("DELETE FROM users WHERE id = $1 AND role = 'client'", [userId]);

        // Clear cookies
        cookies.delete('client_session', { path: '/' });

        return new Response(JSON.stringify({ success: true }));
    } catch (e) {
        console.error(e);
        return new Response(JSON.stringify({ error: 'Error del servidor' }), { status: 500 });
    }
};
