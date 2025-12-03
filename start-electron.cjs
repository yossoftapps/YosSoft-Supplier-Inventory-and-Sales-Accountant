﻿const { spawn } = require('child_process');
const waitOn = require('wait-on');

async function startApp() {
    console.log('في انتظار السيرفر...');
    try {
        const ports = [3001, 3002, 3003, 3004];
                const resources = ports.map(port => `http://localhost:${port}`);
                await waitOn({ resources, timeout: 10000 });
        console.log('السيرفر جاهز! جاري تشغيل التطبيق...');
        
        const electronPath = require('electron');
        
        const electronProcess = spawn(electronPath, ['.'], { 
            stdio: 'inherit',
            shell: false 
        });
        
        electronProcess.on('close', (code) => {
            console.log(`انتهى Electron بكود: ${code}`);
            process.exit(code);
        });
        
    } catch (err) {
        console.error('فشل في بدء التطبيق:', err);
        process.exit(1);
    }
}

startApp();