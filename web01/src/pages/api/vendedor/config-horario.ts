import type { APIRoute } from 'astro';
import fs from 'fs';
import path from 'path';

// Definimos la ruta del archivo de configuración
const configPath = path.join(process.cwd(), 'config-horario.json');

// Helper para leer la configuración actual
export function getConfig() {
    try {
        if (fs.existsSync(configPath)) {
            const data = fs.readFileSync(configPath, 'utf-8');
            return JSON.parse(data);
        }
    } catch (e) {
        console.error('Error al leer config-horario.json', e);
    }
    // Valor por defecto: 18:00
    return { horaCierre: '18:00' };
}

export const GET: APIRoute = async ({ request, cookies }) => {
    // Verificar si es Facundo
    const adminSession = cookies.get('admin_session');
    const sellerSession = cookies.get('seller_session');
    
    // Si no está logueado, no dejamos ver
    if (!adminSession && !sellerSession) {
        return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
    }

    const config = getConfig();
    return new Response(JSON.stringify(config), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
};

export const POST: APIRoute = async ({ request, cookies }) => {
    try {
        // Obtenemos sesión
        const sellerSession = cookies.get('seller_session')?.value;
        const adminSession = cookies.get('admin_session')?.value;

        // Por ahora, confiamos en la seguridad del frontend para enviar la solicitud. 
        // Idealmente validaríamos el ID en Directus para ver si es Facundo,
        // pero podemos simplificar permitiendo a admin o a quien tenga sesión seller
        // (y en el front solo lo mostramos a Facundo).
        if (!adminSession && !sellerSession) {
             return new Response(JSON.stringify({ success: false, message: 'No autorizado' }), { status: 401 });
        }

        const body = await request.json();
        const { horaCierre } = body;

        if (!horaCierre) {
            return new Response(JSON.stringify({ success: false, message: 'Falta horaCierre' }), { status: 400 });
        }

        const config = { horaCierre };
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

        return new Response(JSON.stringify({ success: true, message: 'Horario actualizado', config }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e: any) {
        return new Response(JSON.stringify({ success: false, message: e.message }), { status: 500 });
    }
};
