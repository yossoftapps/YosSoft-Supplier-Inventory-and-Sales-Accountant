/**
 * نظام الفهرسة المتقدم للبيانات الكبيرة
 * 
 * يوفر فهرسة O(1) للبحث السريع بدلاً من O(n) الخطي
 * 
 * الميزات:
 * - فهرسة متعددة المفاتيح 
 * - فهرسة مركبة 
 * - تحديث ديناميكي للفهارس
 * - استهلاك ذاكرة محسّن
 */

/**
 * مدير الفهارس الرئيسي
 */
export class AdvancedIndexer {
    constructor() {
        // فهارس بسيطة (Single-key indexes)
        this.indexes = {
            materialCode: new Map(),     // رمز المادة
            supplier: new Map(),         // المورد
            expiryDate: new Map(),       // تاريخ الصلاحية
            operationDate: new Map(),    // تاريخ العملية
            operationType: new Map(),    // نوع العملية
            unitPrice: new Map(),        // الافرادي
        };

        // فهارس مركبة (Composite indexes)
        this.compositeIndexes = {
            // مفتاح 1: (رمز المادة + الكمية + المورد + تاريخ الصلاحية + الافرادي)
            key1: new Map(),
            // مفتاح 2: (رمز المادة + المورد + تاريخ الصلاحية + الافرادي مقرب)
            key2: new Map(),
            // مفتاح 3: (رمز المادة + المورد + تاريخ الصلاحية)
            key3: new Map(),
            // مفتاح 4: (رمز المادة + تاريخ الصلاحية + الافرادي)
            key4: new Map(),
            // مفتاح 5: (رمز المادة + تاريخ الصلاحية)
            key5: new Map(),
            // مفتاح 6: (رمز المادة + المورد + الافرادي)
            key6: new Map(),
            // مفتاح 7: (رمز المادة + المورد)
            key7: new Map(),
            // مفتاح 8: (رمز المادة)
            key8: new Map(),
        };

        // فهرس الفترات الزمنية (Date range index)
        this.dateRangeIndex = new Map();

        // إحصائيات الأداء
        this.stats = {
            totalRecords: 0,
            indexBuildTime: 0,
            memoryUsage: 0,
            lookupCount: 0,
            avgLookupTime: 0,
        };
    }

    /**
     * بناء جميع الفهارس من البيانات
     */
    buildIndexes(records, recordType = 'default') {
        const startTime = performance.now();
        console.log(`🔨 بناء الفهارس لـ ${records.length} سجل...`);

        this.stats.totalRecords = records.length;

        // مسح الفهارس القديمة
        this.clearIndexes();

        // بناء الفهارس بشكل متوازي
        records.forEach((record, index) => {
            this.indexRecord(record, index);
        });

        this.stats.indexBuildTime = performance.now() - startTime;

        // حساب استهلاك الذاكرة التقريبي
        this.calculateMemoryUsage();

        console.log(`✅ تم بناء الفهارس في ${this.stats.indexBuildTime.toFixed(2)}ms`);
        console.log(`📊 استهلاك الذاكرة: ${(this.stats.memoryUsage / 1024 / 1024).toFixed(2)} MB`);

        return this.stats;
    }

    /**
     * فهرسة سجل واحد
     */
    indexRecord(record, index) {
        const materialCode = record['رمز المادة'];
        const supplier = record['المورد'];
        const expiryDate = record['تاريخ الصلاحية'];
        const operationDate = record['تاريخ العملية'];
        const operationType = record['نوع العملية'];
        const quantity = record['الكمية'];
        const unitPrice = record['الافرادي'];

        // فهرسة بسيطة
        this.addToIndex(this.indexes.materialCode, materialCode, index);
        this.addToIndex(this.indexes.supplier, supplier, index);
        this.addToIndex(this.indexes.expiryDate, expiryDate, index);
        this.addToIndex(this.indexes.operationDate, operationDate, index);
        this.addToIndex(this.indexes.operationType, operationType, index);
        this.addToIndex(this.indexes.unitPrice, unitPrice, index);

        // فهرسة مركبة
        this.buildCompositeIndexes(record, index);

        // فهرسة الفترات الزمنية
        if (operationDate) {
            this.indexDateRange(operationDate, index);
        }
    }

    /**
     * بناء الفهارس المركبة لجميع المفاتيح
     */
    buildCompositeIndexes(record, index) {
        const materialCode = record['رمز المادة'];
        const supplier = record['المورد'];
        const expiryDate = record['تاريخ الصلاحية'];
        const quantity = record['الكمية'];
        const unitPrice = record['الافرادي'];
        const unitPriceRounded = Math.round(unitPrice);

        // مفتاح 1: (رمز المادة + الكمية + المورد + تاريخ الصلاحية + الافرادي)
        const key1 = this.createCompositeKey([materialCode, quantity, supplier, expiryDate, unitPrice]);
        this.addToIndex(this.compositeIndexes.key1, key1, index);

        // مفتاح 2: (رمز المادة + المورد + تاريخ الصلاحية + الافرادي مقرب)
        const key2 = this.createCompositeKey([materialCode, supplier, expiryDate, unitPriceRounded]);
        this.addToIndex(this.compositeIndexes.key2, key2, index);

        // مفتاح 3: (رمز المادة + المورد + تاريخ الصلاحية)
        const key3 = this.createCompositeKey([materialCode, supplier, expiryDate]);
        this.addToIndex(this.compositeIndexes.key3, key3, index);

        // مفتاح 4: (رمز المادة + تاريخ الصلاحية + الافرادي)
        const key4 = this.createCompositeKey([materialCode, expiryDate, unitPrice]);
        this.addToIndex(this.compositeIndexes.key4, key4, index);

        // مفتاح 5: (رمز المادة + تاريخ الصلاحية)
        const key5 = this.createCompositeKey([materialCode, expiryDate]);
        this.addToIndex(this.compositeIndexes.key5, key5, index);

        // مفتاح 6: (رمز المادة + المورد + الافرادي)
        const key6 = this.createCompositeKey([materialCode, supplier, unitPrice]);
        this.addToIndex(this.compositeIndexes.key6, key6, index);

        // مفتاح 7: (رمز المادة + المورد)
        const key7 = this.createCompositeKey([materialCode, supplier]);
        this.addToIndex(this.compositeIndexes.key7, key7, index);

        // مفتاح 8: (رمز المادة)
        const key8 = materialCode;
        this.addToIndex(this.compositeIndexes.key8, key8, index);
    }

    /**
     * إنشاء مفتاح مركب من عدة قيم
     */
    createCompositeKey(values) {
        return values
            .map(v => (v === null || v === undefined ? '__NULL__' : String(v)))
            .join('|||');
    }

    /**
     * إضافة فهرس لقيمة معينة
     */
    addToIndex(indexMap, key, recordIndex) {
        if (key === null || key === undefined) return;

        if (!indexMap.has(key)) {
            indexMap.set(key, []);
        }
        indexMap.get(key).push(recordIndex);
    }

    /**
     * فهرسة الفترات الزمنية
     */
    indexDateRange(dateStr, index) {
        try {
            const date = new Date(dateStr);
            const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            this.addToIndex(this.dateRangeIndex, yearMonth, index);
        } catch (e) {
            console.warn('تاريخ غير صحيح:', dateStr);
        }
    }

    /**
     * البحث باستخدام المفتاح المركب
     */
    searchByCompositeKey(keyNumber, record) {
        const startTime = performance.now();

        let key = null;
        let indexMap = null;

        switch (keyNumber) {
            case 1:
                key = this.createCompositeKey([
                    record['رمز المادة'],
                    record['الكمية'],
                    record['المورد'],
                    record['تاريخ الصلاحية'],
                    record['الافرادي']
                ]);
                indexMap = this.compositeIndexes.key1;
                break;

            case 2:
                key = this.createCompositeKey([
                    record['رمز المادة'],
                    record['المورد'],
                    record['تاريخ الصلاحية'],
                    Math.round(record['الافرادي'])
                ]);
                indexMap = this.compositeIndexes.key2;
                break;

            case 3:
                key = this.createCompositeKey([
                    record['رمز المادة'],
                    record['المورد'],
                    record['تاريخ الصلاحية']
                ]);
                indexMap = this.compositeIndexes.key3;
                break;

            case 4:
                key = this.createCompositeKey([
                    record['رمز المادة'],
                    record['تاريخ الصلاحية'],
                    record['الافرادي']
                ]);
                indexMap = this.compositeIndexes.key4;
                break;

            case 5:
                key = this.createCompositeKey([
                    record['رمز المادة'],
                    record['تاريخ الصلاحية']
                ]);
                indexMap = this.compositeIndexes.key5;
                break;

            case 6:
                key = this.createCompositeKey([
                    record['رمز المادة'],
                    record['المورد'],
                    record['الافرادي']
                ]);
                indexMap = this.compositeIndexes.key6;
                break;

            case 7:
                key = this.createCompositeKey([
                    record['رمز المادة'],
                    record['المورد']
                ]);
                indexMap = this.compositeIndexes.key7;
                break;

            case 8:
                key = record['رمز المادة'];
                indexMap = this.compositeIndexes.key8;
                break;

            default:
                return [];
        }

        const indexes = indexMap.get(key) || [];

        // تحديث إحصائيات البحث
        this.stats.lookupCount++;
        const lookupTime = performance.now() - startTime;
        this.stats.avgLookupTime =
            (this.stats.avgLookupTime * (this.stats.lookupCount - 1) + lookupTime) / this.stats.lookupCount;

        return indexes;
    }

    /**
     * البحث باستخدام فهرس بسيط
     */
    searchByField(fieldName, value) {
        const indexMap = this.indexes[fieldName];
        if (!indexMap) return [];
        return indexMap.get(value) || [];
    }

    /**
     * البحث في فترة زمنية
     */
    searchByDateRange(fromDate, toDate) {
        const startTime = performance.now();
        const results = new Set();

        const from = new Date(fromDate);
        const to = new Date(toDate);

        for (const [yearMonth, indexes] of this.dateRangeIndex.entries()) {
            const [year, month] = yearMonth.split('-').map(Number);
            const date = new Date(year, month - 1, 1);

            if (date >= from && date <= to) {
                indexes.forEach(idx => results.add(idx));
            }
        }

        const lookupTime = performance.now() - startTime;
        console.log(`🔍 بحث في الفترة ${fromDate} - ${toDate}: ${results.size} نتيجة في ${lookupTime.toFixed(2)}ms`);

        return Array.from(results);
    }

    /**
     * البحث المتقدم بمعايير متعددة
     */
    advancedSearch(criteria) {
        const startTime = performance.now();
        let candidateIndexes = null;

        // البدء بأضيق معيار (الأقل نتائج)
        const searchOrder = [
            { field: 'materialCode', value: criteria.materialCode },
            { field: 'supplier', value: criteria.supplier },
            { field: 'expiryDate', value: criteria.expiryDate },
            { field: 'operationDate', value: criteria.operationDate },
        ];

        for (const { field, value } of searchOrder) {
            if (value !== undefined && value !== null) {
                const indexes = this.searchByField(field, value);

                if (candidateIndexes === null) {
                    candidateIndexes = new Set(indexes);
                } else {
                    // تقاطع النتائج (Intersection)
                    const newSet = new Set();
                    for (const idx of indexes) {
                        if (candidateIndexes.has(idx)) {
                            newSet.add(idx);
                        }
                    }
                    candidateIndexes = newSet;
                }

                // إذا لم يبق أي نتائج، توقف
                if (candidateIndexes.size === 0) break;
            }
        }

        const results = candidateIndexes ? Array.from(candidateIndexes) : [];
        const searchTime = performance.now() - startTime;

        console.log(`🔎 بحث متقدم: ${results.length} نتيجة في ${searchTime.toFixed(2)}ms`);

        return results;
    }

    /**
     * حساب استهلاك الذاكرة التقريبي
     */
    calculateMemoryUsage() {
        let totalSize = 0;

        // حساب حجم الفهارس البسيطة
        for (const indexMap of Object.values(this.indexes)) {
            totalSize += this.estimateMapSize(indexMap);
        }

        // حساب حجم الفهارس المركبة
        for (const indexMap of Object.values(this.compositeIndexes)) {
            totalSize += this.estimateMapSize(indexMap);
        }

        // حساب حجم فهرس التواريخ
        totalSize += this.estimateMapSize(this.dateRangeIndex);

        this.stats.memoryUsage = totalSize;
        return totalSize;
    }

    /**
     * تقدير حجم Map بالبايت
     */
    estimateMapSize(map) {
        let size = 0;
        for (const [key, value] of map.entries()) {
            // حجم المفتاح (تقريبي)
            size += key.length * 2; // Unicode characters = 2 bytes each
            // حجم المصفوفة (4 bytes per integer + overhead)
            size += value.length * 4 + 24; // 24 bytes overhead for array
        }
        return size;
    }

    /**
     * مسح جميع الفهارس
     */
    clearIndexes() {
        for (const indexMap of Object.values(this.indexes)) {
            indexMap.clear();
        }
        for (const indexMap of Object.values(this.compositeIndexes)) {
            indexMap.clear();
        }
        this.dateRangeIndex.clear();
    }

    /**
     * الحصول على إحصائيات الأداء
     */
    getStats() {
        return {
            ...this.stats,
            indexCount: {
                simple: Object.keys(this.indexes).length,
                composite: Object.keys(this.compositeIndexes).length,
                dateRange: this.dateRangeIndex.size,
            },
            avgRecordsPerKey: this.stats.totalRecords /
                (Object.values(this.compositeIndexes).reduce((sum, map) => sum + map.size, 0) || 1),
        };
    }

    /**
     * طباعة تقرير الأداء
     */
    printPerformanceReport() {
        const stats = this.getStats();
        console.log('\n📊 ═══════════════════════════════════════');
        console.log('    تقرير أداء نظام الفهرسة');
        console.log('    Advanced Indexer Performance Report');
        console.log('═══════════════════════════════════════\n');
        console.log(`📈 إجمالي السجلات: ${stats.totalRecords.toLocaleString()}`);
        console.log(`⏱️  وقت بناء الفهارس: ${stats.indexBuildTime.toFixed(2)}ms`);
        console.log(`💾 استهلاك الذاكرة: ${(stats.memoryUsage / 1024 / 1024).toFixed(2)} MB`);
        console.log(`🔍 عدد عمليات البحث: ${stats.lookupCount.toLocaleString()}`);
        console.log(`⚡ متوسط وقت البحث: ${stats.avgLookupTime.toFixed(4)}ms`);
        console.log(`📚 عدد الفهارس البسيطة: ${stats.indexCount.simple}`);
        console.log(`🔗 عدد الفهارس المركبة: ${stats.indexCount.composite}`);
        console.log(`📅 عدد فهارس التواريخ: ${stats.indexCount.dateRange}`);
        console.log(`📊 متوسط السجلات لكل مفتاح: ${stats.avgRecordsPerKey.toFixed(2)}`);
        console.log('\n═══════════════════════════════════════\n');
    }
}

/**
 * singleton instance للاستخدام العام
 */
export const globalIndexer = new AdvancedIndexer();

export default AdvancedIndexer;
