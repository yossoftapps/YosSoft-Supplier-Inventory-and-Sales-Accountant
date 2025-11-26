const { contextBridge, ipcRenderer } = require('electron');

// كشف دالة آمنة لواجهة المستخدم لفتح نافذة اختيار الملفات وقراءة ملفات Excel
contextBridge.exposeInMainWorld('electronAPI', {
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  readExcelFile: (filePath) => ipcRenderer.invoke('readExcelFile', filePath)
});