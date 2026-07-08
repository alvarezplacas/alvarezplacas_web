import type { APIRoute } from 'astro';
import { directus } from '@conexiones/directus.js';
import { updateItem } from '@directus/sdk';
import bcrypt from 'bcryptjs';

export const POST: APIRoute = async ({ request, cookies }) => {
    const clientId = cookies.get('client_session')?.value;
    
    if (!clientId) {
        return new Response(JSON.stringify({ error: 'Acceso denegado' }), { status: 401 });
    }
    
    try {
        const body = await request.json();
        const { id, name, email, phone, address, cuit_dni, password, company_name, company_description, foto_perfil } = body;
        
        // 🔒 SEGURIDAD: Evitar que modifiquen el perfil de otra cuenta
        if (id && id !== clientId) {
            return new Response(JSON.stringify({ error: 'Operación no permitida' }), { status: 403 });
        }

        const updateData: Record<string, any> = {};

        // Si se provee actualización de datos demográficos
        if (name !== undefined) updateData.name = name;
        if (email !== undefined) {
            // Bloquear email de dominio interno por seguridad
            if (email.toLowerCase().endsWith('@alvarezplacas.com.ar')) {
                return new Response(JSON.stringify({ error: 'No se permite este dominio de correo' }), { status: 403 });
            }
            updateData.email = email.toLowerCase().trim();
        }
        if (phone !== undefined) updateData.phone = phone.replace(/\D/g, '');
        if (address !== undefined) updateData.address = address;
        if (cuit_dni !== undefined) updateData.cuit_dni = cuit_dni.trim();
        if (company_name !== undefined) updateData.company_name = company_name;
        if (company_description !== undefined) updateData.company_description = company_description;
        if (foto_perfil !== undefined) updateData.foto_perfil = foto_perfil;

        // 🔒 SEGURIDAD: Si se está cambiando la contraseña, hashear de forma segura
        if (password) {
            updateData.password_hash = await bcrypt.hash(password, 10);
        }

        console.log(`[UpdateProfile] Updating profile for client: ${clientId}`, Object.keys(updateData));

        // Actualizar registro en Directus
        await directus.request(updateItem('clientes', clientId, updateData));

        return new Response(JSON.stringify({ success: true }));
    } catch (e: any) {
        console.error("Error al actualizar perfil de cliente:", e);
        return new Response(JSON.stringify({ error: 'Error del servidor: ' + e.message }), { status: 500 });
    }
};
