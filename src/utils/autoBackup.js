import { defaultIndexedDbManager } from './indexedDbManager';

/**
 * وظيفة لإجراء النسخ الاحتياطي التلقائي للبيانات
 */
export const performAutoBackup = async () => {
    try {
        console.log('🔄 بدء عملية النسخ الاحتياطي التلقائي...');

        // 1. جمع البيانات من جميع المخازن
        const stores = ['reports', 'processedData', 'advancedReports'];
        const backupData = {
            timestamp: new Date().toISOString(),
            version: '1.1.0',
            data: {}
        };

        for (const store of stores) {
            const data = await defaultIndexedDbManager.getAll(store);
            backupData.data[store] = data;
        }

        // 2. تحويل البيانات إلى JSON
        const jsonContent = JSON.stringify(backupData, null, 2);
        const fileName = `backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;

        // 3. حفظ النسخة صامتاً باستخدام Electron API
        if (window.electronAPI && window.electronAPI.saveSilentBackup) {
            const result = await window.electronAPI.saveSilentBackup(jsonContent, fileName);
            if (result.success) {
                console.log(`✅ تم النسخ الاحتياطي التلقائي بنجاح في: ${result.filePath}`);
                return true;
            } else {
                console.error('❌ فشل النسخ الاحتياطي الصامت:', result.error);
                return false;
            }
        } else {
            console.warn('⚠️ Electron API saveSilentBackup غير متوفرة');
            return false;
        }
    } catch (error) {
        console.error('❌ خطأ غير متوقع أثناء النسخ الاحتياطي:', error);
        return false;
    }
};

/**
 * وظيفة لتصدير البيانات يدوياً بطلب من المستخدم
 */
export const exportDataToFile = async () => {
    try {
        const stores = ['reports', 'processedData', 'advancedReports'];
        const backupData = {
            timestamp: new Date().toISOString(),
            version: '1.1.0',
            data: {}
        };

        for (const store of stores) {
            const data = await defaultIndexedDbManager.getAll(store);
            backupData.data[store] = data;
        }

        const jsonContent = JSON.stringify(backupData, null, 2);
        const fileName = `yossoft_export_${new Date().toISOString().split('T')[0]}`;

        if (window.electronAPI && window.electronAPI.saveFile) {
            const result = await window.electronAPI.saveFile(jsonContent, fileName, 'json');
            return result;
        }
        return { success: false, error: 'Electron API not available' };
    } catch (error) {
        return { success: false, error: error.message };
    }
};
