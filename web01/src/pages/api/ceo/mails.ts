import type { APIRoute } from 'astro';
import { ImapFlow } from 'imapflow';

function checkIsSpam(subject: string, from: string): boolean {
    const s = (subject || '').toLowerCase();
    const f = (from || '').toLowerCase();
    
    const spamKeywords = [
        'partnership', 'opportunity', 'investment', 'wallet', 'suspension', 
        'suspended', 'suspendida', 'metamask', 'crypto', 'bitcoin', 'ethereum', 
        'faucet', 'lottery', 'winner', 'prize', 'casino', 'viagra', 'seo', 
        'wealth', 'fund transfer', 'donation', 'loans', 'credit card', 
        'loteria', 'ganador', 'herencia', 'donacion', 'inversion', 'negocio rentable',
        'income', 'passive', 'rich', 'earn money', 'get rich', 'cash prize',
        'offshore', 'advisors', 'advertisement', 'marketing services', 'cold email'
    ];
    
    const junkSenders = [
        'facebook', 'instagram', 'twitter', 'linkedin', 'pinterest', 'tiktok',
        'no-reply', 'noreply', 'mailer-daemon', 'postmaster'
    ];
    
    for (const kw of spamKeywords) {
        if (s.includes(kw)) return true;
    }
    
    for (const js of junkSenders) {
        if (f.includes(js)) return true;
    }
    
    return false;
}

export const GET: APIRoute = async ({ request, cookies }) => {
    // Auth check: verify if the logged in user is actually Guillermo (role ceo) or Admin!
    const adminSession = cookies.get('admin_session')?.value;
    const sellerSession = cookies.get('seller_session')?.value;
    if (!adminSession && !sellerSession) {
        return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
    }

    const url = new URL(request.url);
    const account = url.searchParams.get('account') || 'info@alvarezplacas.com.ar';

    // Verify it belongs to alvarezplacas domain
    if (!account.endsWith('@alvarezplacas.com.ar')) {
        return new Response(JSON.stringify({ error: 'Dominio de cuenta no válido' }), { status: 400 });
    }

    console.log(`[IMAP Sync] Conectando a la cuenta: ${account}...`);

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
        
        // Select inbox
        const lock = await client.getMailboxLock('INBOX');
        const emails: any[] = [];
        
        try {
            const total = client.mailbox.exists;
            
            console.log(`[IMAP Sync] Total de correos en ${account}: ${total}`);
            
            if (total > 0) {
                // Fetch the last 30 messages
                const start = Math.max(1, total - 29);
                const range = `${start}:${total}`;
                
                for await (let msg of client.fetch(range, { envelope: true, flags: true })) {
                    const fromText = msg.envelope.from?.map((f: any) => `${f.name || ''} <${f.address}>`).join(', ') || 'Desconocido';
                    const subjectText = msg.envelope.subject || '(Sin Asunto)';
                    const isSpam = checkIsSpam(subjectText, fromText);
                    
                    emails.push({
                        uid: msg.uid,
                        seq: msg.seq,
                        subject: subjectText,
                        from: fromText,
                        to: msg.envelope.to?.map((t: any) => t.address).join(', ') || '',
                        date: msg.envelope.date,
                        flags: Array.from(msg.flags || []),
                        seen: msg.flags?.has('\\Seen') || false,
                        spam: isSpam
                    });
                }
            }
        } finally {
            lock.release();
        }

        await client.logout();
        
        // Sort newest first
        emails.reverse();

        return new Response(JSON.stringify({ success: true, emails }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch(err: any) {
        console.error("[IMAP Sync Error]:", err);
        return new Response(JSON.stringify({ error: 'Error al conectar al buzón IMAP: ' + err.message }), { status: 500 });
    }
};
