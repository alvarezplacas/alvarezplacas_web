import type { APIRoute } from 'astro';
import { query } from '../../../lib/db.js';

export const POST: APIRoute = async ({ request, cookies }) => {
    const session = cookies.get('admin_session');
    if (!session || session.value !== 'authenticated_javier') {
        return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
    }

    try {
        const data = await request.json();
        const { id, pass, branch, phone, email } = data;
        
        let queryStr = "UPDATE users SET ";
        const values = [];
        let count = 1;

        if (pass) {
            queryStr += `password = $${count++}, `;
            values.push(pass);
        }
        if (branch) {
            queryStr += `branch = $${count++}, `;
            values.push(branch);
        }
        if (phone) {
            queryStr += `phone = $${count++}, `;
            values.push(phone);
        }
        if (email) {
            queryStr += `email = $${count++}, `;
            values.push(email);
        }

        // Remove last comma and space
        queryStr = queryStr.slice(0, -2);
        queryStr += ` WHERE id = $${count}`;
        values.push(id);

        await query(queryStr, values);

        return new Response(JSON.stringify({ success: true }));
    } catch (e) {
        console.error(e);
        return new Response(JSON.stringify({ error: 'Error del servidor' }), { status: 500 });
    }
};
