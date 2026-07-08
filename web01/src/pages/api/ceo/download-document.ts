import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ url, cookies }) => {
    const adminSession = cookies.get('admin_session')?.value;
    const sellerSession = cookies.get('seller_session')?.value;

    if (!adminSession && !sellerSession) {
        return new Response('No autorizado', { status: 401 });
    }

    const fileId = url.searchParams.get('file_id');
    if (!fileId) {
        return new Response('File ID requerido', { status: 400 });
    }

    try {
        const DIRECTUS_URL = process.env.DIRECTUS_URL_INTERNAL || process.env.DIRECTUS_URL || 'https://admin.alvarezplacas.com.ar';
        const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN || 'alvarez-api-token-v16-2026';

        // Fetch the file from Directus
        const fileRes = await fetch(`${DIRECTUS_URL}/assets/${fileId}`, {
            headers: {
                'Authorization': `Bearer ${DIRECTUS_TOKEN}`
            }
        });

        if (!fileRes.ok) {
            return new Response('Archivo no encontrado en Directus', { status: 404 });
        }

        // Forward headers and stream response
        const headers = new Headers();
        headers.set('Content-Type', fileRes.headers.get('Content-Type') || 'application/octet-stream');
        
        const contentDisp = fileRes.headers.get('Content-Disposition');
        if (contentDisp) {
            headers.set('Content-Disposition', contentDisp);
        } else {
            headers.set('Content-Disposition', `attachment; filename="${fileId}"`);
        }

        return new Response(fileRes.body, {
            status: 200,
            headers
        });
    } catch (e: any) {
        console.error("Error downloading from Directus:", e);
        return new Response('Error interno al descargar el archivo', { status: 500 });
    }
};
