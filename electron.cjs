const { app, BrowserWindow, ipcMain, dialog, session } = require('electron');
const path = require('path');
const XLSX = require('xlsx');
const fs = require('fs');

// Enable garbage collection API for memory management
app.commandLine.appendSwitch('js-flags', '--expose-gc');

// Set memory limits
app.commandLine.appendSwitch('max-old-space-size', '4096');

// Additional memory management settings
app.commandLine.appendSwitch('enable-features', 'V8OptimizeForSize');

//

// =================================================================
// دالة مساعدة لتحويل تواريخ Excel (رقمية او نصية) إلى نص بصيغة yyyy-mm-dd
// =================================================================
const convertExcelDates = (data) => {
  return data.map(row => {
    const newRow = [...row];

    // تحويل تاريخ الصلاحية (العمود 6)
    if (newRow[6]) {
      if (typeof newRow[6] === 'number') {
        // تم تصحيح الرقم السحري من 25567 إلى 25569
        const date = new Date((newRow[6] - 25569) * 86400 * 1000);
        newRow[6] = date.toISOString().split('T')[0];
      }
    }

    // تحويل تاريخ العملية للمشتريات (العمود 8)
    if (newRow[8]) {
      if (typeof newRow[8] === 'number') {
        const date = new Date((newRow[8] - 25569) * 86400 * 1000);
        newRow[8] = date.toISOString().split('T')[0];
      }
    }

    // تحويل تاريخ العملية للمبيعات (العمود 7)
    if (newRow[7]) {
      if (typeof newRow[7] === 'number') {
        const date = new Date((newRow[7] - 25569) * 86400 * 1000);
        newRow[7] = date.toISOString().split('T')[0];
      }
    }

    return newRow;
  });
};

// =================================================================
// معالجات الاوامر (IPC Handlers)
// =================================================================

ipcMain.handle('dialog:openFile', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Excel Files', extensions: ['xlsx', 'xls'] }],
  });
  if (!canceled) {
    return { canceled, filePaths };
  } else {
    return { canceled };
  }
});

// Import chunked processing utilities
// Note: Electron main process uses CommonJS, so we need to handle ES modules differently
// For now, we'll keep the existing implementation and plan to refactor later

ipcMain.handle('readExcelFile', async (event, filePath) => {
  try {
    const workbook = XLSX.readFile(filePath);
    const data = {};

    // قراءة البيانات مع العناوين (بدون range لتضمين السطر الاول)
    if (workbook.Sheets['مشتريات']) {
      let rawPurchases = XLSX.utils.sheet_to_json(workbook.Sheets['مشتريات'], { header: 1 });
      data.purchases = convertExcelDates(rawPurchases);
      console.log('Purchases sheet loaded:', data.purchases.length, 'rows');
    }

    if (workbook.Sheets['مبيعات']) {
      let rawSales = XLSX.utils.sheet_to_json(workbook.Sheets['مبيعات'], { header: 1 });
      data.sales = convertExcelDates(rawSales);
      console.log('Sales sheet loaded:', data.sales.length, 'rows');
    }

    if (workbook.Sheets['المخزون']) {
      let rawInventory = XLSX.utils.sheet_to_json(workbook.Sheets['المخزون'], { header: 1 });
      data.physicalInventory = convertExcelDates(rawInventory);
      console.log('Inventory sheet loaded:', data.physicalInventory.length, 'rows');
    }

    if (workbook.Sheets['الارصدة']) {
      let rawBalances = XLSX.utils.sheet_to_json(workbook.Sheets['الارصدة'], { header: 1 });
      data.supplierbalances = rawBalances;
      console.log('Balances sheet loaded:', data.supplierbalances.length, 'rows');
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error reading Excel file:', error);
    return { success: false, error: error.message };
  }
});

// حفظ البيانات في ملف (نسخ احتياطي أو تصدير)
ipcMain.handle('saveFile', async (event, { content, fileName, extension }) => {
  try {
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: 'حفظ الملف',
      defaultPath: path.join(app.getPath('documents'), `${fileName}.${extension}`),
      filters: [{ name: 'All Files', extensions: [extension] }]
    });

    if (canceled) return { success: false, canceled: true };

    fs.writeFileSync(filePath, content);
    return { success: true, filePath };
  } catch (error) {
    console.error('Error saving file:', error);
    return { success: false, error: error.message };
  }
});

// حفظ نسخة احتياطية صامتة (في مجلد التطبيق)
ipcMain.handle('saveSilentBackup', async (event, { content, fileName }) => {
  try {
    const backupDir = path.join(app.getPath('userData'), 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const filePath = path.join(backupDir, fileName);
    fs.writeFileSync(filePath, content);

    // الحفاظ على آخر 10 نسخ فقط
    const files = fs.readdirSync(backupDir)
      .filter(f => f.startsWith('backup_'))
      .map(f => ({ name: f, time: fs.statSync(path.join(backupDir, f)).mtime.getTime() }))
      .sort((a, b) => b.time - a.time);

    if (files.length > 10) {
      for (let i = 10; i < files.length; i++) {
        fs.unlinkSync(path.join(backupDir, files[i].name));
      }
    }

    return { success: true, filePath };
  } catch (error) {
    console.error('Error silent backup:', error);
    return { success: false, error: error.message };
  }
});

// =================================================================
// دوال إدارة النوافذ واحداث التطبيق
// =================================================================

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false, // إخفاء النافذة حتى اكتمال التحميل
    backgroundColor: '#ffffff', // لون خلفية لمنع الشاشة السوداء
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      // تحسينات الأمان والأداء
      webSecurity: true,
      sandbox: false, // مطلوب لـ preload script
    },
  });

  // استخدام المنفذ الديناميكي من متغير البيئة أو الافتراضي
  const startUrl = process.env.ELECTRON_START_URL || 'http://localhost:3001';
  console.log(`تحميل التطبيق من: ${startUrl}`);

  mainWindow.loadURL(startUrl);

  // إظهار النافذة عند اكتمال التحميل
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('✅ اكتمل تحميل التطبيق');
    mainWindow.show();
    mainWindow.focus();
  });

  // معالجة أخطاء التحميل
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error(`❌ فشل تحميل التطبيق: ${errorDescription} (${errorCode})`);
  });

  mainWindow.webContents.openDevTools();

  return mainWindow;
}

app.whenReady().then(() => {
  // Set Content Security Policy to eliminate security warning
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; " +
          "script-src 'self' 'unsafe-inline' http://localhost:* ws://localhost:* blob:; " +
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
          "font-src 'self' https://fonts.gstatic.com; " +
          "img-src 'self' data: https:; " +
          "connect-src 'self' http://localhost:* ws://localhost:*; " +
          "worker-src 'self' blob:;"
        ]
      }
    });
  });

  const mainWindow = createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  // Return the mainWindow to keep a reference
  return mainWindow;
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});