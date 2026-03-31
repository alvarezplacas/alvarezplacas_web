import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ redirect }) => {
    return redirect('/admin/login');
};

export const POST: APIRoute = async ({ request, cookies }) => {
    try {
        const formData = await request.formData();
        const email = formData.get('email')?.toString();
        const password = formData.get('password')?.toString();

        console.log(`[Admin Login Attempt] Email: ${email}`);

        // LOGICA TEMPORAL SEGUN MIDDLEWARE: admin_session = authenticated_javier
        if (email === 'admin@alvarezplacas.com.ar' && password === 'JavierMix2026!') {
            cookies.set('admin_session', 'authenticated_javier', {
                path: '/',
                maxAge: 60 * 60 * 24 // 24 horas
            });
            return new Response(JSON.stringify({ 
                success: true, 
                message: 'Acceso administrativo concedido',
                redirectUrl: '/admin'
            }), { 
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({ 
            success: false, 
            message: 'Credenciales administrativas inválidas' 
        }), { 
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e: any) {
        return new Response(JSON.stringify({ 
            success: false, 
            message: 'Error en el servidor: ' + e.message 
        }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
