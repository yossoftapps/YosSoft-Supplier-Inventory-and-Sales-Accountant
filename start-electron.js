const { spawn } = require('child_process');
const waitOn = require('wait-on');

async function startApp() {
    console.log('في انتظار السيرفر...');
    try {
        await waitOn({ resources: ['http://localhost:3001'], timeout: 10000 });
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
