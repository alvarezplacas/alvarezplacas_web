const net = require('net');

async function scan() {
    console.log('Scanning 192.168.1.x for port 4370 (ZKTeco)...');
    const promises = [];
    for (let i = 1; i < 255; i++) {
        promises.push(new Promise((resolve) => {
            const socket = new net.Socket();
            const ip = `192.168.1.${i}`;
            socket.setTimeout(200);
            
            socket.on('connect', () => {
                console.log(`Port 4370 OPEN on ${ip}`);
                socket.destroy();
                resolve(ip);
            });
            
            socket.on('timeout', () => {
                socket.destroy();
                resolve(null);
            });
            
            socket.on('error', () => {
                socket.destroy();
                resolve(null);
            });
            
            socket.connect(4370, ip);
        }));
    }
    
    await Promise.all(promises);
    console.log('Scan complete.');
}

scan();
