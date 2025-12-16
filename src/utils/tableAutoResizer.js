/**
 * محسن عرض الجداول التلقائي - Table Auto Resizer
 * يوفر وظائف لضبط عرض الأعمدة تلقائياً بناءً على محتوى البيانات
 *
 * الميزات:
 * - حساب العرض الأمثل للأعمدة
 * - ضبط تلقائي للعرض بناءً على المحتوى
 * - دعم النصوص العربية والإنجليزية
 * - تحسين الأداء مع البيانات الكبيرة
 */

class TableAutoResizer {
  constructor(tableElement, options = {}) {
    this.table = tableElement;
    this.options = {
      minWidth: options.minWidth || 80,
      maxWidth: options.maxWidth || 300,
      padding: options.padding || 20,
      sampleSize: options.sampleSize || 100, // عدد العينات للحساب
      arabicMultiplier: options.arabicMultiplier || 8, // مضاعف عرض النص العربي
      englishMultiplier: options.englishMultiplier || 7, // مضاعف عرض النص الإنجليزي
      ...options
    };

    this.columnWidths = new Map();
    this.setupAutoResize();
  }

  /**
   * إعداد نظام ضبط العرض التلقائي
   */
  setupAutoResize() {
    if (!this.table) return;

    const headers = this.table.querySelectorAll('th');
    headers.forEach((header, index) => {
      const optimalWidth = this.calculateOptimalWidth(index);
      this.columnWidths.set(index, optimalWidth);

      // تطبيق العرض المحسوب
      header.style.width = `${optimalWidth}px`;
      header.style.minWidth = `${optimalWidth}px`;
      header.style.maxWidth = `${this.options.maxWidth}px`;
    });

    // تطبيق نفس العرض على خلايا البيانات
    this.applyWidthsToDataCells();
  }

  /**
   * حساب العرض الأمثل للعمود
   * @param {number} columnIndex - فهرس العمود
   * @returns {number} العرض الأمثل بالبكسل
   */
  calculateOptimalWidth(columnIndex) {
    let maxWidthNeeded = 0;

    // حساب عرض العنوان
    const headerText = this.getHeaderText(columnIndex);
    maxWidthNeeded = Math.max(maxWidthNeeded, this.calculateTextWidth(headerText));

    // حساب عرض العينات من البيانات
    const sampleWidths = this.getDataSampleWidths(columnIndex);
    if (sampleWidths.length > 0) {
      const avgWidth = sampleWidths.reduce((sum, width) => sum + width, 0) / sampleWidths.length;
      const maxSampleWidth = Math.max(...sampleWidths);
      maxWidthNeeded = Math.max(maxWidthNeeded, avgWidth, maxSampleWidth);
    }

    // إضافة الهامش وتطبيق الحدود
    const finalWidth = Math.max(
      this.options.minWidth,
      Math.min(maxWidthNeeded + this.options.padding, this.options.maxWidth)
    );

    return Math.round(finalWidth);
  }

  /**
   * حساب عرض النص
   * @param {string} text - النص المراد قياسه
   * @returns {number} العرض بالبكسل
   */
  calculateTextWidth(text) {
    if (!text) return 0;

    // كشف نوع النص (عربي أو إنجليزي)
    const isArabic = /[\u0600-\u06FF]/.test(text);
    const multiplier = isArabic ? this.options.arabicMultiplier : this.options.englishMultiplier;

    // حساب طول النص مع مراعاة المسافات والرموز
    const charCount = text.length;
    const spaceCount = (text.match(/\s/g) || []).length;
    const specialCharCount = (text.match(/[^\w\s]/g) || []).length;

    // صيغة تقديرية للعرض
    const estimatedWidth = (charCount * multiplier) +
                          (spaceCount * 3) +
                          (specialCharCount * 2);

    return estimatedWidth;
  }

  /**
   * الحصول على نص العنوان
   * @param {number} columnIndex - فهرس العمود
   * @returns {string} نص العنوان
   */
  getHeaderText(columnIndex) {
    const headers = this.table.querySelectorAll('th');
    if (headers[columnIndex]) {
      return headers[columnIndex].textContent || '';
    }
    return '';
  }

  /**
   * الحصول على عينات من عرض البيانات
   * @param {number} columnIndex - فهرس العمود
   * @returns {Array<number>} مصفوفة أعراض العينات
   */
  getDataSampleWidths(columnIndex) {
    const cells = this.table.querySelectorAll(`tbody td:nth-child(${columnIndex + 1})`);
    const widths = [];

    // أخذ عينة من الخلايا (ليس كلها لتحسين الأداء)
    const sampleSize = Math.min(this.options.sampleSize, cells.length);

    for (let i = 0; i < sampleSize; i++) {
      // أخذ عينة عشوائية
      const randomIndex = Math.floor(Math.random() * cells.length);
      const cell = cells[randomIndex];

      if (cell) {
        const text = cell.textContent || '';
        const width = this.calculateTextWidth(text);
        widths.push(width);
      }
    }

    return widths;
  }

  /**
   * تطبيق أعراض الأعمدة على خلايا البيانات
   */
  applyWidthsToDataCells() {
    this.columnWidths.forEach((width, columnIndex) => {
      const cells = this.table.querySelectorAll(`td:nth-child(${columnIndex + 1})`);
      cells.forEach(cell => {
        cell.style.width = `${width}px`;
        cell.style.minWidth = `${width}px`;
        cell.style.maxWidth = `${this.options.maxWidth}px`;
      });
    });
  }

  /**
   * تحديث أعراض الأعمدة بناءً على بيانات جديدة
   * @param {Array} newData - البيانات الجديدة
   */
  updateWidths(newData) {
    if (!newData || newData.length === 0) return;

    // إعادة حساب الأعراض بناءً على البيانات الجديدة
    const headers = this.table.querySelectorAll('th');
    headers.forEach((header, index) => {
      const optimalWidth = this.calculateOptimalWidth(index);
      this.columnWidths.set(index, optimalWidth);

      header.style.width = `${optimalWidth}px`;
    });

    this.applyWidthsToDataCells();
  }

  /**
   * الحصول على أعراض الأعمدة الحالية
   * @returns {Map<number, number>} خريطة أعراض الأعمدة
   */
  getColumnWidths() {
    return new Map(this.columnWidths);
  }

  /**
   * تعيين عرض عمود محدد
   * @param {number} columnIndex - فهرس العمود
   * @param {number} width - العرض الجديد
   */
  setColumnWidth(columnIndex, width) {
    const clampedWidth = Math.max(
      this.options.minWidth,
      Math.min(width, this.options.maxWidth)
    );

    this.columnWidths.set(columnIndex, clampedWidth);

    // تحديث العنوان
    const headers = this.table.querySelectorAll('th');
    if (headers[columnIndex]) {
      headers[columnIndex].style.width = `${clampedWidth}px`;
    }

    // تحديث خلايا البيانات
    const cells = this.table.querySelectorAll(`td:nth-child(${columnIndex + 1})`);
    cells.forEach(cell => {
      cell.style.width = `${clampedWidth}px`;
    });
  }

  /**
   * إعادة تعيين جميع الأعراض
   */
  resetWidths() {
    this.columnWidths.clear();
    this.setupAutoResize();
  }

  /**
   * تصدير إعدادات الأعراض للحفظ
   * @returns {Object} إعدادات الأعراض
   */
  exportSettings() {
    return {
      columnWidths: Array.from(this.columnWidths.entries()),
      options: this.options
    };
  }

  /**
   * استيراد إعدادات الأعراض
   * @param {Object} settings - الإعدادات المحفوظة
   */
  importSettings(settings) {
    if (settings.columnWidths) {
      this.columnWidths = new Map(settings.columnWidths);
      this.applyWidthsToDataCells();
    }

    if (settings.options) {
      this.options = { ...this.options, ...settings.options };
    }
  }
}

/**
 * دالة مساعدة لإنشاء TableAutoResizer
 * @param {Element} tableElement - عنصر الجدول
 * @param {Object} options - خيارات التهيئة
 * @returns {TableAutoResizer} نسخة من TableAutoResizer
 */
export const createTableAutoResizer = (tableElement, options = {}) => {
  return new TableAutoResizer(tableElement, options);
};

export default TableAutoResizer;
