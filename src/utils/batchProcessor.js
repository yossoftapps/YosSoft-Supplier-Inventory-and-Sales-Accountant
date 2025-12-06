/**
 * معالج الدفعات المحسّن
 * Optimized Batch Processor
 * 
 * يوفر معالجة البيانات الكبيرة على دفعات مع عدم تجميد الواجهة
 * Processes large datasets in batches without blocking the UI
 * 
 * الميزات:
 * - معالجة غير متزامنة (Async processing)
 * - مؤشرات تقدم تفصيلية
 * - إمكانية الإلغاء
 * - معالجة متوازية للعمليات المستقلة
 * - إدارة ذكية للذاكرة
 */

import { AdvancedIndexer } from './advancedIndexer.js';

/**
 * معالج الدفعات مع دعم الإلغاء والتقدم
 * Batch Processor with cancellation and progress support
 */
export class BatchProcessor {
    constructor(options = {}) {
        this.options = {
            batchSize: options.batchSize || 5000,          // حجم الدفعة: 5000 سجل
            delayBetweenBatches: options.delayBetweenBatches || 10, // تأخير 10ms بين الدفعات
            enableMemoryMonitoring: options.enableMemoryMonitoring !== false,
            memoryThreshold: options.memoryThreshold || 1024, // 1GB threshold
            enableIndexing: options.enableIndexing !== false,
            onProgress: options.onProgress || null,
            onComplete: options.onComplete || null,
            onError: options.onError || null,
            onCancel: options.onCancel || null,
        };

        this.isProcessing = false;
        this.isCancelled = false;
        this.currentBatch = 0;
        this.totalBatches = 0;
        this.processedRecords = 0;
        this.totalRecords = 0;
        this.startTime = 0;
        this.errors = [];

        // Advanced Indexer للفهرسة السريعة
        this.indexer = new AdvancedIndexer();
    }

    /**
     * معالجة مصفوفة كبيرة على دفعات
     * Process large array in batches
     */
    async processBatches(data, processorFn) {
        if (this.isProcessing) {
            throw new Error('عملية معالجة أخرى قيد التنفيذ');
        }

        this.reset();
        this.isProcessing = true;
        this.isCancelled = false;
        this.startTime = performance.now();
        this.totalRecords = data.length;
        this.totalBatches = Math.ceil(data.length / this.options.batchSize);

        console.log(`🚀 بدء معالجة ${this.totalRecords.toLocaleString()} سجل على ${this.totalBatches} دفعة`);

        const results = [];

        try {
            // بناء الفهارس إذا كان مفعلاً
            if (this.options.enableIndexing) {
                console.log('🔨 بناء الفهارس...');
                this.indexer.buildIndexes(data);
            }

            // معالجة كل دفعة
            for (let i = 0; i < data.length; i += this.options.batchSize) {
                // التحقق من الإلغاء
                if (this.isCancelled) {
                    console.log('⚠️ تم إلغاء المعالجة من قبل المستخدم');
                    if (this.options.onCancel) {
                        this.options.onCancel(results);
                    }
                    return { cancelled: true, results, processedRecords: this.processedRecords };
                }

                this.currentBatch++;
                const batch = data.slice(i, i + this.options.batchSize);

                console.log(`📦 معالجة الدفعة ${this.currentBatch}/${this.totalBatches} (${batch.length} سجل)`);

                // معالجة الدفعة
                const batchStartTime = performance.now();
                const batchResults = await this.processBatch(batch, processorFn, i);
                const batchTime = performance.now() - batchStartTime;

                results.push(...batchResults);
                this.processedRecords += batch.length;

                // تحديث التقدم
                const progress = this.calculateProgress();
                console.log(`⏱️  الدفعة ${this.currentBatch}: ${batchTime.toFixed(2)}ms (${(batch.length / batchTime * 1000).toFixed(0)} سجل/ثانية)`);

                if (this.options.onProgress) {
                    this.options.onProgress(progress);
                }

                // مراقبة الذاكرة
                if (this.options.enableMemoryMonitoring && this.currentBatch % 10 === 0) {
                    this.checkMemory();
                }

                // تأخير بين الدفعات لتجنب تجميد الواجهة
                if (i + this.options.batchSize < data.length) {
                    await this.delay(this.options.delayBetweenBatches);
                }
            }

            const totalTime = performance.now() - this.startTime;
            const throughput = (this.totalRecords / totalTime * 1000).toFixed(0);

            console.log(`✅ اكتملت المعالجة: ${this.totalRecords.toLocaleString()} سجل في ${totalTime.toFixed(2)}ms`);
            console.log(`📊 معدل المعالجة: ${throughput} سجل/ثانية`);

            if (this.options.onComplete) {
                this.options.onComplete({ results, stats: this.getStats() });
            }

            return {
                success: true,
                results,
                stats: this.getStats(),
                indexer: this.indexer
            };

        } catch (error) {
            console.error('❌ خطأ في المعالجة:', error);
            this.errors.push(error);

            if (this.options.onError) {
                this.options.onError(error);
            }

            throw error;
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * معالجة دفعة واحدة
     * Process a single batch
     */
    async processBatch(batch, processorFn, startIndex) {
        const results = [];

        for (let i = 0; i < batch.length; i++) {
            try {
                const record = batch[i];
                const recordIndex = startIndex + i;

                // استدعاء دالة المعالجة
                const result = await processorFn(record, recordIndex, this.indexer);
                results.push(result);
            } catch (error) {
                console.error(`خطأ في معالجة السجل ${startIndex + i}:`, error);
                this.errors.push({ recordIndex: startIndex + i, error });

                // إضافة null للحفاظ على الفهارس
                results.push(null);
            }
        }

        return results;
    }

    /**
     * معالجة متوازية لعدة دفعات
     * Parallel processing of multiple batches
     */
    async processParallel(data, processorFn, parallelBatches = 3) {
        if (this.isProcessing) {
            throw new Error('عملية معالجة أخرى قيد التنفيذ');
        }

        this.reset();
        this.isProcessing = true;
        this.startTime = performance.now();
        this.totalRecords = data.length;
        this.totalBatches = Math.ceil(data.length / this.options.batchSize);

        console.log(`🚀 بدء معالجة متوازية: ${this.totalRecords.toLocaleString()} سجل`);
        console.log(`⚡ عدد الدفعات المتوازية: ${parallelBatches}`);

        const results = new Array(data.length);

        try {
            // بناء الفهارس
            if (this.options.enableIndexing) {
                this.indexer.buildIndexes(data);
            }

            // تقسيم البيانات إلى دفعات
            const batches = [];
            for (let i = 0; i < data.length; i += this.options.batchSize) {
                batches.push({
                    data: data.slice(i, i + this.options.batchSize),
                    startIndex: i
                });
            }

            // معالجة الدفعات بشكل متوازي
            for (let i = 0; i < batches.length; i += parallelBatches) {
                if (this.isCancelled) {
                    console.log('⚠️ تم إلغاء المعالجة');
                    return { cancelled: true, results };
                }

                const parallelBatchesSlice = batches.slice(i, i + parallelBatches);

                // معالجة متوازية
                const batchPromises = parallelBatchesSlice.map(async ({ data: batchData, startIndex }) => {
                    const batchResults = await this.processBatch(batchData, processorFn, startIndex);
                    return { startIndex, results: batchResults };
                });

                const batchesResults = await Promise.all(batchPromises);

                // دمج النتائج
                for (const { startIndex, results: batchResults } of batchesResults) {
                    for (let j = 0; j < batchResults.length; j++) {
                        results[startIndex + j] = batchResults[j];
                    }
                    this.processedRecords += batchResults.length;
                    this.currentBatch++;
                }

                // تحديث التقدم
                if (this.options.onProgress) {
                    this.options.onProgress(this.calculateProgress());
                }

                await this.delay(this.options.delayBetweenBatches);
            }

            const totalTime = performance.now() - this.startTime;
            console.log(`✅ اكتملت المعالجة المتوازية في ${totalTime.toFixed(2)}ms`);

            if (this.options.onComplete) {
                this.options.onComplete({ results, stats: this.getStats() });
            }

            return {
                success: true,
                results,
                stats: this.getStats(),
                indexer: this.indexer
            };

        } catch (error) {
            console.error('❌ خطأ في المعالجة المتوازية:', error);
            if (this.options.onError) {
                this.options.onError(error);
            }
            throw error;
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * حساب التقدم الحالي
     * Calculate current progress
     */
    calculateProgress() {
        const percent = (this.processedRecords / this.totalRecords) * 100;
        const elapsedTime = performance.now() - this.startTime;
        const estimatedTotalTime = (elapsedTime / this.processedRecords) * this.totalRecords;
        const remainingTime = estimatedTotalTime - elapsedTime;
        const throughput = (this.processedRecords / elapsedTime) * 1000; // records per second

        return {
            currentBatch: this.currentBatch,
            totalBatches: this.totalBatches,
            processedRecords: this.processedRecords,
            totalRecords: this.totalRecords,
            percent: Math.min(100, percent).toFixed(2),
            elapsedTime: elapsedTime.toFixed(0),
            remainingTime: remainingTime.toFixed(0),
            estimatedTotalTime: estimatedTotalTime.toFixed(0),
            throughput: throughput.toFixed(0),
            errorsCount: this.errors.length,
        };
    }

    /**
     * الحصول على إحصائيات المعالجة
     * Get processing statistics
     */
    getStats() {
        const totalTime = performance.now() - this.startTime;
        const throughput = (this.totalRecords / totalTime) * 1000;

        return {
            totalRecords: this.totalRecords,
            processedRecords: this.processedRecords,
            totalBatches: this.totalBatches,
            batchSize: this.options.batchSize,
            totalTime: totalTime.toFixed(2),
            throughput: throughput.toFixed(0),
            avgBatchTime: (totalTime / this.currentBatch).toFixed(2),
            errorsCount: this.errors.length,
            errors: this.errors,
            memoryUsage: this.getMemoryUsage(),
            indexerStats: this.options.enableIndexing ? this.indexer.getStats() : null,
        };
    }

    /**
     * فحص استهلاك الذاكرة
     * Check memory usage
     */
    checkMemory() {
        if (!performance.memory) return;

        const memoryUsage = this.getMemoryUsage();
        const usedMB = memoryUsage.usedJSHeapSize / 1024 / 1024;
        const limitMB = memoryUsage.jsHeapSizeLimit / 1024 / 1024;
        const percent = (usedMB / limitMB) * 100;

        console.log(`💾 استهلاك الذاكرة: ${usedMB.toFixed(2)}MB / ${limitMB.toFixed(2)}MB (${percent.toFixed(1)}%)`);

        // تحذير إذا تجاوزت 80%
        if (percent > 80) {
            console.warn('⚠️ استهلاك ذاكرة عالي! قد تحتاج إلى تقليل حجم الدفعة');
        }

        // إيقاف إذا تجاوزت الحد
        if (usedMB > this.options.memoryThreshold) {
            console.error('❌ تجاوز حد استهلاك الذاكرة!');
            throw new Error(`Memory threshold exceeded: ${usedMB.toFixed(2)}MB > ${this.options.memoryThreshold}MB`);
        }
    }

    /**
     * الحصول على معلومات استهلاك الذاكرة
     * Get memory usage information
     */
    getMemoryUsage() {
        if (performance.memory) {
            return {
                usedJSHeapSize: performance.memory.usedJSHeapSize,
                totalJSHeapSize: performance.memory.totalJSHeapSize,
                jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
            };
        }
        return null;
    }

    /**
     * إلغاء المعالجة
     * Cancel processing
     */
    cancel() {
        if (!this.isProcessing) {
            console.warn('لا توجد عملية معالجة نشطة للإلغاء');
            return;
        }

        console.log('🛑 إلغاء المعالجة...');
        this.isCancelled = true;
    }

    /**
     * إعادة تعيين الحالة
     * Reset state
     */
    reset() {
        this.currentBatch = 0;
        this.totalBatches = 0;
        this.processedRecords = 0;
        this.totalRecords = 0;
        this.startTime = 0;
        this.errors = [];
        this.isCancelled = false;
    }

    /**
     * تأخير غير متزامن
     * Async delay
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * طباعة تقرير الأداء
     * Print performance report
     */
    printPerformanceReport() {
        const stats = this.getStats();

        console.log('\n📊 ═══════════════════════════════════════');
        console.log('    تقرير أداء معالج الدفعات');
        console.log('    Batch Processor Performance Report');
        console.log('═══════════════════════════════════════\n');
        console.log(`📈 إجمالي السجلات: ${stats.totalRecords.toLocaleString()}`);
        console.log(`✅ السجلات المعالجة: ${stats.processedRecords.toLocaleString()}`);
        console.log(`📦 عدد الدفعات: ${stats.totalBatches}`);
        console.log(`📏 حجم الدفعة: ${stats.batchSize.toLocaleString()}`);
        console.log(`⏱️  الوقت الكلي: ${stats.totalTime}ms`);
        console.log(`⚡ معدل المعالجة: ${stats.throughput} سجل/ثانية`);
        console.log(`📊 متوسط وقت الدفعة: ${stats.avgBatchTime}ms`);
        console.log(`❌ عدد الأخطاء: ${stats.errorsCount}`);

        if (stats.memoryUsage) {
            const usedMB = (stats.memoryUsage.usedJSHeapSize / 1024 / 1024).toFixed(2);
            console.log(`💾 استهلاك الذاكرة: ${usedMB} MB`);
        }

        console.log('\n═══════════════════════════════════════\n');

        // طباعة تقرير الفهرسة إذا كان مفعلاً
        if (this.options.enableIndexing && stats.indexerStats) {
            this.indexer.printPerformanceReport();
        }
    }
}

/**
 * معالج الدفعات مع معالجة متقدمة للمطابقات
 * Batch Processor with advanced matching
 */
export class MatchingBatchProcessor extends BatchProcessor {
    constructor(options = {}) {
        super(options);
        this.matches = [];
        this.orphans = [];
    }

    /**
     * معالجة المطابقات على دفعات
     * Process matches in batches
     */
    async processMatching(sourceData, targetData, matchingKeys) {
        console.log('🔍 بدء معالجة المطابقات...');

        // بناء فهارس للبيانات المستهدفة
        if (this.options.enableIndexing) {
            console.log('🔨 بناء فهارس للبيانات المستهدفة...');
            this.indexer.buildIndexes(targetData);
        }

        // إعادة تعيين النتائج
        this.matches = [];
        this.orphans = [];

        // معالجة كل سجل من المصدر
        const result = await this.processBatches(sourceData, async (sourceRecord, index, indexer) => {
            return this.matchRecord(sourceRecord, targetData, matchingKeys, indexer);
        });

        return {
            ...result,
            matches: this.matches,
            orphans: this.orphans,
            matchRate: ((this.matches.length / sourceData.length) * 100).toFixed(2),
        };
    }

    /**
     * مطابقة سجل واحد
     * Match a single record
     */
    async matchRecord(sourceRecord, targetData, matchingKeys, indexer) {
        let matched = false;
        let matchedIndex = -1;
        let usedKey = -1;

        // جرب كل مفتاح بالترتيب
        for (let keyNum = 1; keyNum <= matchingKeys.length; keyNum++) {
            // استخدام الفهرس للبحث السريع
            const candidateIndexes = indexer.searchByCompositeKey(keyNum, sourceRecord);

            if (candidateIndexes.length > 0) {
                // وجدنا مطابقة
                matchedIndex = candidateIndexes[0];
                matched = true;
                usedKey = keyNum;
                this.matches.push({
                    sourceRecord,
                    targetRecord: targetData[matchedIndex],
                    matchedKey: keyNum,
                });
                break;
            }
        }

        if (!matched) {
            this.orphans.push(sourceRecord);
        }

        return {
            matched,
            matchedIndex,
            usedKey,
        };
    }
}

/**
 * دوال مساعدة للاستخدام السريع
 * Helper functions for quick use
 */

/**
 * معالجة بيانات على دفعات بسرعة
 * Quick batch processing
 */
export async function quickBatchProcess(data, processorFn, options = {}) {
    const processor = new BatchProcessor(options);
    return await processor.processBatches(data, processorFn);
}

/**
 * معالجة متوازية سريعة
 * Quick parallel processing
 */
export async function quickParallelProcess(data, processorFn, parallelBatches = 3, options = {}) {
    const processor = new BatchProcessor(options);
    return await processor.processParallel(data, processorFn, parallelBatches);
}

export default BatchProcessor;
