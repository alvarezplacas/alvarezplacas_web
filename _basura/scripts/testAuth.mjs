import { google } from 'googleapis';
import path from 'path';

const SPREADSHEET_ID = '16UwHCGUbhox7AVVoXLdQiKdw2lFevrBxeOWBhHA_8Dc';
const CREDENTIALS_PATH = path.resolve('credentials.json');

async function testAuth() {
    const auth = new google.auth.GoogleAuth({
        keyFile: CREDENTIALS_PATH,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    try {
        const response = await sheets.spreadsheets.get({
            spreadsheetId: SPREADSHEET_ID,
        });

        console.log('--- Conexión Exitosa ---');
        console.log('Título:', response.data.properties.title);
        console.log('Hojas disponibles:');
        response.data.sheets.forEach(s => {
            console.log(`- ${s.properties.title} (ID: ${s.properties.sheetId})`);
        });
    } catch (err) {
        console.error('Error de Conexión:', err.message);
    }
}

testAuth();
