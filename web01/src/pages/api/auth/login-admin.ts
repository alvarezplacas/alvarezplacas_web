import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
    const formData = await request.formData();
    const email = formData.get('email')?.toString();
    const password = formData.get('password')?.toString();

    console.log(`[Admin Login Attempt] Email: ${email}`);

    // LOGICA TEMPORAL SEGUN MIDDLEWARE: admin_session = authenticated_javier
    // TODO: Conectar con Directus para validar rol de admin real
    if (email === 'admin@alvarezplacas.com.ar' && password === 'JavierMix2026!') {
        cookies.set('admin_session', 'authenticated_javier', {
            path: '/',
            maxAge: 60 * 60 * 24 // 24 horas
        });
        return redirect('/admin');
    }

    return new Response('Credenciales administrativas inválidas', { status: 401 });
};
