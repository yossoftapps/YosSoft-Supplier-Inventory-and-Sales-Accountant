const { spawn } = require('child_process');
const waitOn = require('wait-on');

/**
 * بدء تطبيق Electron بعد التأكد من جاهزية سيرفر Vite
 * تحسينات رئيسية:
 * - الانتظار لأول منفذ متاح بدل انتظار جميع المنافذ (يمنع انتهاء المهلة)
 * - تمرير عنوان السيرفر إلى Electron عبر متغيّر بيئة ELECTRON_START_URL
 *   (سنستخدمه في electron.cjs لتحميل العنوان الصحيح بدل تثبيت منفذ محدد)
 */

// دالة مساعدة: تنتظر أول منفذ يستجيب ضمن قائمة المنافذ المحددة
async function waitForFirstAvailable(ports, perPortTimeout = 20000) {
  for (const port of ports) {
    const url = `http://localhost:${port}`;
    console.log(`محاولة انتظار السيرفر على: ${url}`);
    try {
      await waitOn({ resources: [url], timeout: perPortTimeout });
      console.log(`تم العثور على السيرفر على: ${url}`);
      return url;
    } catch (e) {
      console.warn(`انتهت مهلة الانتظار على ${url}، تجربة المنفذ التالي...`);
    }
  }
  throw new Error('لم يتم العثور على أي منفذ متاح ضمن القائمة المحددة');
}

async function startApp() {
  console.log('في انتظار السيرفر...');
  try {
    // ترتيب الأولويات: 3003 (المستخدم مسبقاً في electron.cjs) ثم 3001 ثم 3002 ثم 3004
    const preferredPorts = [3003, 3001, 3002, 3004];

    // ملاحظة: Vite مضبوط حالياً على 3001 مع strictPort=false، وبالتالي قد يختار منفذاً آخر
    // لذلك نبحث عن أول منفذ متاح ضمن هذه المجموعة.
    const serverUrl = await waitForFirstAvailable(preferredPorts, 25000);

    console.log('السيرفر جاهز! جاري تشغيل التطبيق...');
    const electronPath = require('electron');

    // تمرير عنوان السيرفر لمقدمة Electron عبر متغير بيئة لاستخدامه عند التحميل
    const env = { ...process.env, ELECTRON_START_URL: serverUrl };

    // تأكد من أن Electron لا يعمل بوضع Node العادي
    delete env.ELECTRON_RUN_AS_NODE;

    const electronProcess = spawn(electronPath, ['.'], {
      stdio: 'inherit',
      shell: false,
      env,
    });

    electronProcess.on('close', (code) => {
      console.log(`انتهى Electron بك��د: ${code}`);
      process.exit(code);
    });
  } catch (err) {
    console.error('فشل في بدء التطبيق:', err);
    process.exit(1);
  }
}

startApp();
