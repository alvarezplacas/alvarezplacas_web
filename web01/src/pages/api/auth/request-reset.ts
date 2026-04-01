import type { APIRoute } from 'astro';
import { directus } from '@conexiones/directus.js';
import { readItems, updateItem } from '@directus/sdk';
import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';

export const POST: APIRoute = async ({ request }) => {
    try {
        const { email } = await request.json();

        if (!email) {
            return new Response(JSON.stringify({ error: 'Email requerido' }), { status: 400 });
        }

        console.log(`[Recovery Request] Email: ${email}`);

        // 1. Buscar en Vendedores
        let userResult = await directus.request(readItems('vendedores', {
            filter: { email: { _eq: email } },
            limit: 1
        }));
        let collection = 'vendedores';

        // 2. Si no es vendedor, buscar en Clientes
        if (!userResult || userResult.length === 0) {
            userResult = await directus.request(readItems('clientes', {
                filter: { email: { _eq: email } },
                limit: 1
            }));
            collection = 'clientes';
        }

        const user = userResult?.[0];

        // Por seguridad, dar una respuesta exitosa incluso si el mail no existe (evita enumeración de usuarios)
        if (!user) {
            console.log(`[Recovery Request] User not found: ${email}`);
            return new Response(JSON.stringify({ 
                success: true, 
                message: 'Si el correo está registrado, recibirás un enlace pronto.' 
            }), { status: 200 });
        }

        // 3. Generar Token y Expiración (1 hora)
        const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const expiry = new Date(Date.now() + 3600000).toISOString();

        await directus.request(updateItem(collection, user.id, {
            recovery_token: token,
            recovery_expiry: expiry
        }));

        // 4. Configurar Mailer (SnappyMail VPS)
        const transporter = nodemailer.createTransport({
            host: 'mail.alvarezplacas.com.ar',
            port: 465,
            secure: true, // SSL
            auth: {
                user: 'info@alvarezplacas.com.ar',
                pass: 'Tecno/315'
            }
        });

        const resetLink = `${new URL(request.url).origin}/auth/reset-password?token=${token}&col=${collection}`;

        await transporter.sendMail({
            from: '"Alvarez Placas - Soporte" <info@alvarezplacas.com.ar>',
            to: email,
            subject: 'Recuperación de Contraseña',
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #111; color: white; padding: 40px; border-radius: 20px;">
                    <h2 style="color: #ff2800; font-size: 24px; font-weight: 900; text-transform: uppercase;">Alvarez Placas</h2>
                    <p>Hola, ${user.nombre || 'Usuario'}.</p>
                    <p>Has solicitado restablecer tu contraseña. Haz clic en el botón de abajo para continuar:</p>
                    <div style="text-align: center; margin: 40px 0;">
                        <a href="${resetLink}" style="background: #ff2800; color: white; padding: 15px 30px; text-decoration: none; border-radius: 10px; font-weight: bold; text-transform: uppercase;">Restablecer Contraseña</a>
                    </div>
                    <p style="font-size: 12px; color: #666;">Este enlace expirará en 1 hora. Si no solicitaste esto, puedes ignorar este correo.</p>
                </div>
            `
        });

        console.log(`[Recovery Request] Success: Email sent to ${email}`);

        return new Response(JSON.stringify({ 
            success: true, 
            message: 'Email enviado con éxito.' 
        }), { status: 200 });

    } catch (e: any) {
        console.error('[Recovery API Error]:', e);
        return new Response(JSON.stringify({ 
            error: 'Error interno al procesar la solicitud.' 
        }), { status: 500 });
    }
};
