import { query } from './db.js';
import fs from 'fs';
import path from 'path';

export async function initializeDatabase() {
    console.log('--- Initializing Database Schema ---');
    try {
        const schemaPath = path.join(process.cwd(), 'src', 'lib', 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        // Execute schema in chunks or as a whole if pg supports it
        // Note: Simple query execution
        await query(schema);
        console.log('✅ Database Schema Initialized Successfully');
        return true;
    } catch (e) {
        console.error('❌ Error initializing database:', e.message);
        return false;
    }
}

export async function cleanupMockData() {
    console.log('--- Cleaning Up Mock Data ---');
    try {
        // We delete users with 'client' role and their related data
        // Caution: This is a destructive action for test data
        await query('DELETE FROM order_items');
        await query('DELETE FROM orders');
        await query('DELETE FROM budgets');
        // Delete users but KEEP 'admin' and 'seller' roles if they exist
        await query("DELETE FROM users WHERE role = 'client'");
        
        console.log('✅ Mock Data Cleaned Up');
        return true;
    } catch (e) {
        console.error('❌ Error cleaning up mock data:', e.message);
        return false;
    }
}

export async function seedInitialData() {
    console.log('--- Seeding Initial Data ---');
    try {
        // Check if we have at least one seller
        const sellers = await query("SELECT id FROM users WHERE role = 'seller'");
        if (sellers.rows.length === 0) {
            console.log('Creating default seller: Juan Vendedor...');
            await query(`
                INSERT INTO users (email, password_hash, role, full_name, phone)
                VALUES ($1, $2, $3, $4, $5)
            `, ['vendedor1@alvarezplacas.com.ar', 'no-password-needed-now', 'seller', 'Juan Vendedor', '11-1111-1111']);
            console.log('✅ Default seller created');
        }
        return true;
    } catch (e) {
        console.error('❌ Error seeding initial data:', e.message);
        return false;
    }
}
