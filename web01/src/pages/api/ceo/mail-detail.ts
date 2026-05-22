import type { APIRoute } from 'astro';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';

export const GET: APIRoute = async ({ request, cookies }) => {
    const adminSession = cookies.get('admin_session')?.value;
    const sellerSession = cookies.get('seller_session')?.value;
    if (!adminSession && !sellerSession) {
        return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
    }

    const url = new URL(request.url);
    const account = url.searchParams.get('account') || 'info@alvarezplacas.com.ar';
    const uidStr = url.searchParams.get('uid');

    if (!uidStr) {
        return new Response(JSON.stringify({ error: 'UID de correo requerido' }), { status: 400 });
    }

    const uid = parseInt(uidStr);

    console.log(`[IMAP Sync] Obteniendo detalle de mail UID ${uid} para la cuenta: ${account}...`);

    const client = new ImapFlow({
        host: '144.217.163.13', // VPS IP
        port: 143,              // IMAP port
        secure: false,          // Use STARTTLS or plain text
        auth: {
            user: `${account}*master`,
            pass: 'Tecno/315'
        },
        tls: {
            rejectUnauthorized: false
        },
        logger: false
    });

    try {
        await client.connect();
        const lock = await client.getMailboxLock('INBOX');
        let emailDetail: any = null;

        try {
            // Fetch the message by UID using fetchOne
            const msg = await client.fetchOne(uid, { source: true, flags: true }, { uid: true });
            
            if (msg) {
                // Parse source with simpleParser
                const parsed = await simpleParser(msg.source);
                emailDetail = {
                    uid: msg.uid,
                    subject: parsed.subject || '(Sin Asunto)',
                    from: parsed.from?.text || 'Desconocido',
                    to: parsed.to?.text || '',
                    date: parsed.date,
                    text: parsed.text || '',
                    html: parsed.html || parsed.textAsHtml || parsed.text || '',
                    attachments: parsed.attachments?.map(att => ({
                        filename: att.filename,
                        contentType: att.contentType,
                        size: att.size
                    })) || [],
                    flags: Array.from(msg.flags || []),
                    seen: msg.flags?.has('\\Seen') || false
                };

                // Mark message as seen dynamically when read!
                if (!emailDetail.seen) {
                    await client.messageFlagsAdd([uid], ['\\Seen'], { uid: true });
                }
            }
        } finally {
            lock.release();
        }

        await client.logout();

        if (!emailDetail) {
            return new Response(JSON.stringify({ error: 'Correo no encontrado en el servidor' }), { status: 404 });
        }

        return new Response(JSON.stringify({ success: true, email: emailDetail }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch(err: any) {
        console.error("[IMAP Detail Error]:", err);
        return new Response(JSON.stringify({ error: 'Error al obtener detalle del mail: ' + err.message }), { status: 500 });
    }
};
