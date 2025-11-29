// دالة لتتبع عمليات المطابقة
// Matching audit trail module

/**
 * فئة لتتبع عمليات المطابقة
 * Class to track matching operations
 */
class MatchingAudit {
  constructor() {
    this.auditTrail = [];
  }

  /**
   * تسجيل عملية مطابقة
   * Record a matching operation
   * @param {string} operationType - نوع العملية (NetPurchases, NetSales, etc.)
   * @param {number} keyNumber - رقم المفتاح المستخدم
   * @param {string} sourceRecordId - معرف السجل المصدر
   * @param {string} targetRecordId - معرف السجل الهدف
   * @param {number} matchedQty - الكمية المطابقة
   * @param {Object} sourceRecord - السجل المصدر
   * @param {Object} targetRecord - السجل الهدف
   * @param {Object} additionalInfo - معلومات إضافية (رقم الملف، معرفات السجل القديمة/الجديدة، إلخ)
   */
  recordMatch(operationType, keyNumber, sourceRecordId, targetRecordId, matchedQty, sourceRecord, targetRecord, additionalInfo = {}) {
    const auditEntry = {
      timestamp: new Date().toISOString(),
      operationType,
      keyNumber,
      sourceRecordId,
      targetRecordId,
      matchedQty,
      sourceRecord: { ...sourceRecord },
      targetRecord: { ...targetRecord },
      additionalInfo: { ...additionalInfo }, // تتبع معلومات إضافية
      fileId: additionalInfo.fileId || null, // رقم الملف
      oldRecordId: additionalInfo.oldRecordId || null, // معرف السجل القديم
      newRecordId: additionalInfo.newRecordId || null, // معرف السجل الجديد
      sourceFile: additionalInfo.sourceFile || null, // ملف المصدر
      targetFile: additionalInfo.targetFile || null, // ملف الهدف
    };
    
    this.auditTrail.push(auditEntry);
    console.log(`تم تسجيل عملية مطابقة: ${operationType} - المفتاح ${keyNumber} - الكمية ${matchedQty}`);
  }

  /**
   * الحصول على سجل التدقيق
   * Get audit trail
   * @returns {Array} سجل التدقيق
   */
  getAuditTrail() {
    return [...this.auditTrail];
  }

  /**
   * البحث في سجل التدقيق
   * Search audit trail
   * @param {Object} criteria - معايير البحث
   * @returns {Array} نتائج البحث
   */
  searchAuditTrail(criteria) {
    return this.auditTrail.filter(entry => {
      // البحث حسب نوع العملية
      if (criteria.operationType && entry.operationType !== criteria.operationType) {
        return false;
      }
      
      // البحث حسب رقم المفتاح
      if (criteria.keyNumber && entry.keyNumber !== criteria.keyNumber) {
        return false;
      }
      
      // البحث حسب معرف السجل المصدر
      if (criteria.sourceRecordId && entry.sourceRecordId !== criteria.sourceRecordId) {
        return false;
      }
      
      // البحث حسب معرف السجل الهدف
      if (criteria.targetRecordId && entry.targetRecordId !== criteria.targetRecordId) {
        return false;
      }
      
      // البحث حسب رقم الملف
      if (criteria.fileId && entry.fileId !== criteria.fileId) {
        return false;
      }
      
      // البحث حسب معرف السجل القديم
      if (criteria.oldRecordId && entry.oldRecordId !== criteria.oldRecordId) {
        return false;
      }
      
      // البحث حسب معرف السجل الجديد
      if (criteria.newRecordId && entry.newRecordId !== criteria.newRecordId) {
        return false;
      }
      
      // البحث حسب ملف المصدر
      if (criteria.sourceFile && entry.sourceFile !== criteria.sourceFile) {
        return false;
      }
      
      // البحث حسب ملف الهدف
      if (criteria.targetFile && entry.targetFile !== criteria.targetFile) {
        return false;
      }
      
      // البحث حسب التاريخ (من)
      if (criteria.fromDate && new Date(entry.timestamp) < new Date(criteria.fromDate)) {
        return false;
      }
      
      // البحث حسب التاريخ (إلى)
      if (criteria.toDate && new Date(entry.timestamp) > new Date(criteria.toDate)) {
        return false;
      }
      
      return true;
    });
  }

  /**
   * الحصول على إحصائيات سجل التدقيق
   * Get audit trail statistics
   * @returns {Object} إحصائيات سجل التدقيق
   */
  getAuditStatistics() {
    const stats = {
      totalOperations: this.auditTrail.length,
      operationsByType: {},
      operationsByKey: {},
      totalMatchedQuantity: 0,
      operationsByFile: {},
      operationsBySourceFile: {},
      operationsByTargetFile: {}
    };
    
    this.auditTrail.forEach(entry => {
      // إحصائيات حسب نوع العملية
      if (!stats.operationsByType[entry.operationType]) {
        stats.operationsByType[entry.operationType] = 0;
      }
      stats.operationsByType[entry.operationType]++;
      
      // إحصائيات حسب رقم المفتاح
      if (!stats.operationsByKey[entry.keyNumber]) {
        stats.operationsByKey[entry.keyNumber] = 0;
      }
      stats.operationsByKey[entry.keyNumber]++;
      
      // إجمالي الكمية المطابقة
      stats.totalMatchedQuantity += entry.matchedQty;
      
      // إحصائيات حسب رقم الملف
      if (entry.fileId) {
        if (!stats.operationsByFile[entry.fileId]) {
          stats.operationsByFile[entry.fileId] = 0;
        }
        stats.operationsByFile[entry.fileId]++;
      }
      
      // إحصائيات حسب ملف المصدر
      if (entry.sourceFile) {
        if (!stats.operationsBySourceFile[entry.sourceFile]) {
          stats.operationsBySourceFile[entry.sourceFile] = 0;
        }
        stats.operationsBySourceFile[entry.sourceFile]++;
      }
      
      // إحصائيات حسب ملف الهدف
      if (entry.targetFile) {
        if (!stats.operationsByTargetFile[entry.targetFile]) {
          stats.operationsByTargetFile[entry.targetFile] = 0;
        }
        stats.operationsByTargetFile[entry.targetFile]++;
      }
    });
    
    return stats;
  }

  /**
   * تصدير سجل التدقيق إلى JSON
   * Export audit trail to JSON
   * @returns {string} سجل التدقيق بصيغة JSON
   */
  exportToJSON() {
    return JSON.stringify(this.auditTrail, null, 2);
  }

  /**
   * تصدير سجل التدقيق إلى CSV
   * Export audit trail to CSV
   * @returns {string} سجل التدقيق بصيغة CSV
   */
  exportToCSV() {
    if (this.auditTrail.length === 0) {
      return '';
    }
    
    // رؤوس الأعمدة
    const headers = [
      'Timestamp',
      'Operation Type',
      'Key Number',
      'Source Record ID',
      'Target Record ID',
      'Matched Quantity',
      'File ID',
      'Old Record ID',
      'New Record ID',
      'Source File',
      'Target File'
    ];
    
    // تحويل البيانات إلى صفوف
    const rows = this.auditTrail.map(entry => [
      entry.timestamp,
      entry.operationType,
      entry.keyNumber,
      entry.sourceRecordId,
      entry.targetRecordId,
      entry.matchedQty,
      entry.fileId || '',
      entry.oldRecordId || '',
      entry.newRecordId || '',
      entry.sourceFile || '',
      entry.targetFile || ''
    ]);
    
    // دمج الرؤوس والصفوف
    return [headers, ...rows]
      .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\n');
  }

  /**
   * مسح سجل التدقيق
   * Clear audit trail
   */
  clearAuditTrail() {
    this.auditTrail = [];
  }
}

// إنشاء مثيل عالمي لمتابعة عمليات المطابقة
const matchingAudit = new MatchingAudit();

export default matchingAudit;
export { MatchingAudit };