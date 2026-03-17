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
        const lastClient: any = await query("SELECT client_number FROM \"Clientes\" WHERE client_number LIKE 'ALV-%' ORDER BY id DESC LIMIT 1");
        let nextNumber = 1;
        if (lastClient.rows && lastClient.rows.length > 0) {
            const lastNum = parseInt(lastClient.rows[0].client_number.split('-')[1]);
            nextNumber = lastNum + 1;
        }
        const clientNumber = `ALV-${nextNumber.toString().padStart(4, '0')}`;

        // 3. Assign Seller (The one with fewer clients)
        let assignedSellerId = null;
        const sellerStats: any = await query(`
            SELECT v.id, COUNT(c.id) as client_count 
            FROM "Vendedores" v 
            LEFT JOIN "Clientes" c ON c.vendedor_asignado = v.id 
            GROUP BY v.id 
            ORDER BY client_count ASC 
            LIMIT 1
        `);
        
        if (sellerStats.rows.length > 0) {
            assignedSellerId = sellerStats.rows[0].id;
        }

        // 4. Insert into new "Clientes" table
        await query(`
            INSERT INTO "Clientes" (
                nombre_empresa, whatsapp, direccion, email, 
                password_hash, client_number, vendedor_asignado, puntaje, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, 1, 'published')
        `, [name, phone, address, email, hashedPassword, clientNumber, assignedSellerId]);

        // Redirect to success / login
        return redirect('/login?registered=true');
    } catch (e: any) {
        console.error('Registration Error:', e);
        
        // PostgreSQL "Unique Violation" error code
        if (e.code === '23505') {
            return new Response('Este correo electrónico ya está registrado. Por favor, intenta iniciar sesión.', { 
                status: 400,
                statusText: 'Email Already Registered'
            });
        }

        return new Response('Error en el registro: ' + (e.message || 'Error desconocido'), { status: 500 });
    }
};
