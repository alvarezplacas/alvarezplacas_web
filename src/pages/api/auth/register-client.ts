import type { APIRoute } from 'astro';
import { query } from '@lib/db.js';
import bcrypt from 'bcryptjs';

export const POST: APIRoute = async ({ request, redirect }) => {
    const formData = await request.formData();
    const name = formData.get('name')?.toString();
    const email = formData.get('email')?.toString();
    const phone = formData.get('phone')?.toString();
    const address = formData.get('address')?.toString();
    const password = formData.get('password')?.toString();

    if (!name || !email || !password) {
        return new Response('Campos obligatorios faltantes', { status: 400 });
    }

    try {
        // 1. Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 2. Generate Client Number (ALV-XXXX)
        const lastClient: any = await query("SELECT client_number FROM users WHERE client_number LIKE 'ALV-%' ORDER BY id DESC LIMIT 1");
        let nextNumber = 1;
        if (lastClient.rows && lastClient.rows.length > 0) {
            const lastNum = parseInt(lastClient.rows[0].client_number.split('-')[1]);
            nextNumber = lastNum + 1;
        }
        const clientNumber = `ALV-${nextNumber.toString().padStart(4, '0')}`;

        // 3. Assign Seller (The one with fewer clients)
        const sellers = await query("SELECT id FROM users WHERE role = 'seller' ORDER BY id ASC");
        let assignedSellerId = null;
        if (sellers.rows.length > 0) {
            // Basic assignment: Random or round-robin if we don't have a complex metric yet
            // Based on user request: "se le asigna el que menos venta tiene" (assuming fewer clients for now)
            const sellerStats: any = await query(`
                SELECT u.id, COUNT(c.id) as client_count 
                FROM users u 
                LEFT JOIN users c ON c.assigned_seller_id = u.id 
                WHERE u.role = 'seller' 
                GROUP BY u.id 
                ORDER BY client_count ASC 
                LIMIT 1
            `);
            assignedSellerId = sellerStats.rows[0]?.id;
        }

        // 4. Insert User
        await query(`
            INSERT INTO users (
                email, password_hash, role, full_name, phone, address, 
                client_number, is_club_member, assigned_seller_id, points
            ) VALUES ($1, $2, 'client', $3, $4, $5, $6, TRUE, $7, 1)
        `, [email, hashedPassword, name, phone, address, clientNumber, assignedSellerId]);

        // Redirect to success / login
        return redirect('/login?registered=true');
    } catch (e: any) {
        console.error(e);
        return new Response('Error en el registro: ' + e.message, { status: 500 });
    }
};
