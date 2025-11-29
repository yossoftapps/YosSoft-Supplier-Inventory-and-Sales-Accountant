const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const XLSX = require('xlsx');

// =================================================================
// دالة مساعدة لتحويل تواريخ Excel (رقمية أو نصية) إلى نص بصيغة yyyy-mm-dd
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
// معالجات الأوامر (IPC Handlers)
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

ipcMain.handle('readExcelFile', async (event, filePath) => {
  try {
    const workbook = XLSX.readFile(filePath);
    const data = {};

    // قراءة البيانات مع العناوين (بدون range لتضمين السطر الأول)
    if (workbook.Sheets['مشتريات']) {
      let rawPurchases = XLSX.utils.sheet_to_json(workbook.Sheets['مشتريات'], { header: 1 });
      data.purchases = convertExcelDates(rawPurchases);
    }

    if (workbook.Sheets['مبيعات']) {
      let rawSales = XLSX.utils.sheet_to_json(workbook.Sheets['مبيعات'], { header: 1 });
      data.sales = convertExcelDates(rawSales);
    }

    if (workbook.Sheets['المخزون']) {
      let rawInventory = XLSX.utils.sheet_to_json(workbook.Sheets['المخزون'], { header: 1 });
      data.inventory = convertExcelDates(rawInventory);
    }

    if (workbook.Sheets['الارصدة']) {
      let rawBalances = XLSX.utils.sheet_to_json(workbook.Sheets['الارصدة'], { header: 1 });
      data.balances = rawBalances;
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error reading Excel file:', error);
    return { success: false, error: error.message };
  }
});

// =================================================================
// دوال إدارة النوافذ وأحداث التطبيق
// =================================================================

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      // Add Content Security Policy to address security warnings
      sandbox: false, // Required for IPC communication
    },
  });
  
  // Set Content Security Policy
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self'; media-src 'self'; object-src 'none'; child-src 'self'; frame-src 'self';"
        ]
      }
    });
  });
  
  mainWindow.loadFile('dist/index.html');
  mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
}).catch(err => {
  console.error('Failed to create window:', err);
  console.error('Error details:', err.message, err.stack);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});