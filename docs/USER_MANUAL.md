classDiagram
    class Config {
        +BASE_DIR: string
        +DATA_DIR: string
        +DATABASE_DIR: string
        +BACKUP_DIR: string
        +LOG_DIR: string
        +DB_PATHS: object
        +BACKUP_INTERVAL_DAYS: number
        +MAX_BACKUPS: number
        +LOG_LEVEL: string
        +LOG_FORMAT: string
        +APP_TITLE: string
        +APP_VERSION: string
        +WINDOW_WIDTH: number
        +WINDOW_HEIGHT: number
        +DEFAULT_LANGUAGE: string
        +SUPPORTED_LANGUAGES: array
    }

    class ExcelProcessor {
        +processExcelData(filePath)
        +convertExcelDates(data)
        +readExcelFile(filePath)
    }

    class DataNormalizer {
        +normalizeRecord(record)
        +normalizeList(list)
        +normalizeProcessedData(data)
    }

    class FinancialCalculations {
        +roundToInteger(value)
        +roundToDecimalPlaces(value, decimals)
        +formatMoney(value)
        +formatQuantity(value)
        +parseQuantity(value)
        +parseMoney(value)
        +multiply(a, b)
        +divide(a, b)
        +add(a, b)
        +subtract(a, b)
        +compare(a, b)
    }

    class DataFilter {
        +filterData(data, filters)
        +filterPurchasesData(data, filters)
        +filterSalesData(data, filters)
        +filterInventoryData(data, filters)
        +filterEndingInventoryData(data, filters)
        +filterGenericData(data, filters, arrayKey)
    }

    class ViewSettingsManager {
        +getViewSettings(reportKey)
        +saveViewSettings(reportKey, settings)
        +clearViewSettings(reportKey)
        +clearAllViewSettings()
        +getColumnVisibility(reportKey)
        +saveColumnVisibility(reportKey, visibility)
        +getSortOrder(reportKey)
        +saveSortOrder(reportKey, sortOrder)
        +getPaginationSettings(reportKey)
        +savePaginationSettings(reportKey, pagination)
    }

    class I18n {
        +init()
        +changeLanguage(lng)
        +t(key, options)
    }

    class ElectronMain {
        +createWindow()
        +handleFileOpen()
        +handleExcelRead()
        +convertExcelDates()
    }

    class ChunkedProcessor {
        +processFileInChunks(filePath, chunkSize, processChunk)
        +processExcelDataInChunks(data, chunkSize, processChunk)
        +createProgressTracker(totalRecords)
        +parseLine(line)
    }

    class MemoryMonitor {
        +getMemoryUsage()
        +logMemoryUsage(label)
        +isWithinMemoryLimits(maxHeapMB)
    }

    class IndexedDbManager {
        +init()
        +set(store, key, value, ttl)
        +get(store, key)
        +getAll(store)
        +delete(store, key)
        +clear(store)
    }

    class CacheManager {
        +set(cache, key, value, ttl)
        +get(cache, key)
        +delete(cache, key)
        +clear(cache)
    }

    Config --> ExcelProcessor : uses
    ExcelProcessor --> DataNormalizer : processes
    DataNormalizer --> FinancialCalculations : uses
    FinancialCalculations --> DataFilter : uses
    DataFilter --> ViewSettingsManager : uses
    ViewSettingsManager --> I18n : uses
    ElectronMain --> ExcelProcessor : uses
    ChunkedProcessor --> MemoryMonitor : monitors
    IndexedDbManager --> CacheManager : fallbacks to