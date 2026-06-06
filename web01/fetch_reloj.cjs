const ZKLib = require('node-zklib');

async function testClock(ip) {
    let zkInstance = new ZKLib(ip, 4370, 5000, 4000); 

    try {
        await zkInstance.createSocket();
        const users = await zkInstance.getUsers();
        console.log(`[${ip}] Found ${users.data.length} users`);
        users.data.forEach(u => {
            if (u.name) console.log(`- ID: ${u.userId}, Name: ${u.name}`);
        });
        await zkInstance.disconnect();
    } catch (e) {
        console.error(`[${ip}] Error:`, e.message);
    }
}

testClock('192.168.1.57');
