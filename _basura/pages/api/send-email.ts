import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
    try {
        const data = await request.json();
        const { type, name, email, message, company, subject } = data;

        // Aquí usaríamos la API de Resend. 
        // Para que funcione, el usuario deberá configurar su RESEND_API_KEY en el VPS.
        
        const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_placeholder';
        
        // Simulación de envío de email
        console.log(`Enviando email de tipo: ${type}`);
        console.log(`Para: info@alvarezplacas.com.ar`);
        console.log(`Cuerpo: ${JSON.stringify(data)}`);

        /* 
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: 'Web Alvarez <web@alvarezplacas.com.ar>',
                to: type === 'supplier' ? ['proveedores@alvarezplacas.com.ar'] : ['info@alvarezplacas.com.ar'],
                subject: type === 'supplier' ? `Propuesta: ${company}` : `Consulta: ${subject}`,
                html: `<p>Nombre: ${name}</p><p>Email: ${email}</p><p>Mensaje: ${message}</p>`,
            }),
        });
        */

        return new Response(JSON.stringify({ success: true, message: 'Email enviado correctamente' }), { status: 200 });
    } catch (e) {
        console.error(e);
        return new Response(JSON.stringify({ error: 'Error al enviar el email' }), { status: 500 });
    }
};
