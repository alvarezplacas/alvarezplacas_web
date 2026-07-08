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
    const filename = url.searchParams.get('filename');

    if (!uidStr || !filename) {
        return new Response(JSON.stringify({ error: 'UID de correo y nombre de archivo requeridos' }), { status: 400 });
    }

    const uid = parseInt(uidStr);

    console.log(`[IMAP Sync] Descargando adjunto ${filename} de mail UID ${uid} para la cuenta: ${account}...`);

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
        let attachmentResponse: Response | null = null;

        try {
            const msg = await client.fetchOne(uid, { source: true }, { uid: true });
            
            if (msg) {
                const parsed = await simpleParser(msg.source);
                const attachment = parsed.attachments?.find(att => att.filename === filename);

                if (attachment) {
                    attachmentResponse = new Response(attachment.content, {
                        status: 200,
                        headers: {
                            'Content-Type': attachment.contentType || 'application/octet-stream',
                            'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
                            'Content-Length': (attachment.size || attachment.content.length).toString()
                        }
                    });
                }
            }
        } finally {
            lock.release();
        }

        await client.logout();

        if (attachmentResponse) {
            return attachmentResponse;
        } else {
            return new Response(JSON.stringify({ error: 'Adjunto no encontrado' }), { status: 404 });
        }
    } catch(err: any) {
        console.error("[IMAP Download Error]:", err);
        return new Response(JSON.stringify({ error: 'Error al descargar adjunto: ' + err.message }), { status: 500 });
    }
};
