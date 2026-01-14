const { contextBridge, ipcRenderer } = require('electron');

// هنا نكشف الوظائف التي نسمح للواجهة باستخدامها
contextBridge.exposeInMainWorld('electronAPI', {
  // وظيفة لفتح نافذة اختيار الملفات
  openFile: () => ipcRenderer.invoke('dialog:openFile'),

  // وظيفة لقراءة بيانات ملف Excel
  readExcelFile: (filePath) => ipcRenderer.invoke('readExcelFile', filePath),

  // وظيفة لحفظ ملف (تصدير)
  saveFile: (content, fileName, extension) => ipcRenderer.invoke('saveFile', { content, fileName, extension }),

  // وظيفة لحفظ نسخة احتياطية صامتة
  saveSilentBackup: (content, fileName) => ipcRenderer.invoke('saveSilentBackup', { content, fileName }),
});