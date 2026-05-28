import { directus, readItems } from './Backend/conexiones/directus.js';

async function testFetch() {
    const FOLDER_ID = 'b11e9dc3-8cdb-49d6-ad2f-8d231ce0a528';
    try {
        console.log('Fetching files for folder:', FOLDER_ID);
        const files = await directus.request(readItems('directus_files', {
            filter: {
                folder: { _eq: FOLDER_ID }
            },
            fields: ['id', 'type', 'filename_download']
        }));
        console.log('Files found:', files.length);
        files.forEach(f => console.log(`- ${f.filename_download} (${f.type}) ID: ${f.id}`));
    } catch (e) {
        console.error('Error fetching files:', e.message);
        if (e.errors) console.error('Details:', JSON.stringify(e.errors, null, 2));
    }
}

testFetch();
