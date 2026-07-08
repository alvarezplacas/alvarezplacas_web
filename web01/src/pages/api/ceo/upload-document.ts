import type { APIRoute } from 'astro';
import { query } from '@conexiones/lib/db.js';

export const POST: APIRoute = async ({ request, cookies }) => {
    const adminSession = cookies.get('admin_session')?.value;
    const sellerSession = cookies.get('seller_session')?.value;

    if (!adminSession && !sellerSession) {
        return new Response(JSON.stringify({ success: false, error: 'No autorizado' }), { 
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const employeeId = formData.get('employee_id') as string;
        const docType = formData.get('doc_type') as string; // 'dni_file_id', 'dni_dorso_file_id', 'cuil_file_id', 'codem_file_id', 'examen_medico_file_id', 'foto_file_id'

        if (!file || !employeeId || !docType) {
            return new Response(JSON.stringify({ success: false, error: 'Campos requeridos faltantes' }), { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Validate docType to prevent SQL injection or schema issues
        const validDocTypes = ['dni_file_id', 'dni_dorso_file_id', 'cuil_file_id', 'codem_file_id', 'examen_medico_file_id', 'foto_file_id'];
        if (!validDocTypes.includes(docType)) {
            return new Response(JSON.stringify({ success: false, error: 'Tipo de documento no válido' }), { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Read Directus environment variables
        const DIRECTUS_URL = process.env.DIRECTUS_URL_INTERNAL || process.env.DIRECTUS_URL || 'https://admin.alvarezplacas.com.ar';
        const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN || 'alvarez-api-token-v16-2026';

        // 1. Get or create the "Personal" folder in Directus
        let folderId = null;
        try {
            console.log(`[Upload] Checking folder "Personal" in Directus: ${DIRECTUS_URL}/folders`);
            const folderQueryRes = await fetch(`${DIRECTUS_URL}/folders?filter[name][_eq]=Personal`, {
                headers: { 'Authorization': `Bearer ${DIRECTUS_TOKEN}` }
            });
            if (folderQueryRes.ok) {
                const folderQueryData = await folderQueryRes.json();
                if (folderQueryData.data && folderQueryData.data.length > 0) {
                    folderId = folderQueryData.data[0].id;
                } else {
                    // Create the "Personal" folder
                    console.log(`[Upload] Creating folder "Personal" in Directus...`);
                    const createFolderRes = await fetch(`${DIRECTUS_URL}/folders`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${DIRECTUS_TOKEN}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ name: 'Personal' })
                    });
                    if (createFolderRes.ok) {
                        const createFolderData = await createFolderRes.json();
                        folderId = createFolderData.data.id;
                        console.log(`[Upload] Created folder "Personal" in Directus with ID: ${folderId}`);
                    }
                }
            }
        } catch (folderErr) {
            console.error("Error getting/creating Directus folder:", folderErr);
        }

        // Prepare file upload to Directus
        const uploadForm = new FormData();
        uploadForm.append('file', file, file.name);
        if (folderId) {
            uploadForm.append('metadata', JSON.stringify({ folder: folderId }));
        }

        console.log(`[Upload] Uploading file ${file.name} to Directus (Folder ID: ${folderId || 'None'}): ${DIRECTUS_URL}/files`);
        const directusRes = await fetch(`${DIRECTUS_URL}/files`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${DIRECTUS_TOKEN}`
            },
            body: uploadForm
        });

        if (!directusRes.ok) {
            const errText = await directusRes.text();
            throw new Error(`Error de Directus: ${errText}`);
        }

        const directusData = await directusRes.json();
        const fileId = directusData.data.id; // UUID returned by Directus

        // Update employee record in Postgres
        await query(`
            UPDATE control_personal 
            SET ${docType} = $1 
            WHERE id = $2
        `, [fileId, parseInt(employeeId)]);

        return new Response(JSON.stringify({ success: true, file_id: fileId }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e: any) {
        console.error("Error uploading document:", e);
        return new Response(JSON.stringify({ success: false, error: e.message || 'Error interno' }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
