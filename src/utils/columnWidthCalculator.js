/**
 * Utility functions for calculating optimal column widths based on content
 */

// Define default column width mappings based on column type
const DEFAULT_COLUMN_WIDTHS = {
  'index': 50,           // Serial numbers
  'code': 100,           // Material codes
  'name': 180,           // Names
  'unit': 80,            // Units
  'quantity': 100,       // Quantities
  'price': 100,          // Prices
  'amount': 110,         // Amounts/money
  'date': 110,           // Dates
  'supplier': 150,       // Supplier names
  'notes': 150,          // Notes
  'status': 120,         // Status values
  'percentage': 90,      // Percentages
  'default': 120         // Default width
};

// Maximum allowed width to prevent columns from becoming too wide
const MAX_WIDTH = 300;
// Minimum allowed width to ensure readability
const MIN_WIDTH = 50;

/**
 * Calculates optimal width for a single column based on its content
 * @param {string} title - Column title
 * @param {string} dataIndex - Column data index
 * @param {Array} data - Table data
 * @param {number} maxWidth - Maximum allowed width (optional)
 * @returns {number} Optimal column width
 */
export const calculateOptimalWidth = (title, dataIndex, data, maxWidth = MAX_WIDTH) => {
  // First, try to determine width based on common column types
  const lowerTitle = (title || '').toLowerCase();
  const lowerDataIndex = (dataIndex || '').toLowerCase();
  
  // Check for common column patterns
  if (lowerTitle.includes('م') || lowerDataIndex.includes('index')) {
    return DEFAULT_COLUMN_WIDTHS.index;
  }
  if (lowerTitle.includes('رمز') || lowerDataIndex.includes('code')) {
    return DEFAULT_COLUMN_WIDTHS.code;
  }
  if (lowerTitle.includes('اسم') || lowerDataIndex.includes('name')) {
    return DEFAULT_COLUMN_WIDTHS.name;
  }
  if (lowerTitle.includes('وحدة') || lowerDataIndex.includes('unit')) {
    return DEFAULT_COLUMN_WIDTHS.unit;
  }
  if (lowerTitle.includes('كمية') || lowerDataIndex.includes('quantity')) {
    return DEFAULT_COLUMN_WIDTHS.quantity;
  }
  if (lowerTitle.includes('افرادي') || lowerTitle.includes('سعر') || lowerDataIndex.includes('price')) {
    return DEFAULT_COLUMN_WIDTHS.price;
  }
  if (lowerTitle.includes('اجمالي') || lowerTitle.includes('قيمة') || lowerDataIndex.includes('amount')) {
    return DEFAULT_COLUMN_WIDTHS.amount;
  }
  if (lowerTitle.includes('تاريخ') || lowerDataIndex.includes('date')) {
    return DEFAULT_COLUMN_WIDTHS.date;
  }
  if (lowerTitle.includes('مورد') || lowerDataIndex.includes('supplier')) {
    return DEFAULT_COLUMN_WIDTHS.supplier;
  }
  if (lowerTitle.includes('ملاحظات') || lowerDataIndex.includes('notes')) {
    return DEFAULT_COLUMN_WIDTHS.notes;
  }
  if (lowerTitle.includes('نسبة') || lowerTitle.includes('نسبة') || lowerDataIndex.includes('percentage')) {
    return DEFAULT_COLUMN_WIDTHS.percentage;
  }
  if (lowerTitle.includes('حالة') || lowerTitle.includes('بيان') || lowerDataIndex.includes('status')) {
    return DEFAULT_COLUMN_WIDTHS.status;
  }

  // Calculate width based on content length if no pattern matches
  let maxContentLength = title ? title.length * 8 : 0; // Base on title length
  
  // Check data content
  if (data && Array.isArray(data) && data.length > 0) {
    const sampleSize = Math.min(50, data.length); // Sample first 50 records or all if less
    for (let i = 0; i < sampleSize; i++) {
      const value = data[i][dataIndex];
      if (value !== undefined && value !== null) {
        // Convert to string and measure length
        let strValue = String(value);
        
        // For numbers, reduce character count since they're typically shorter visually
        if (typeof value === 'number') {
          // Format money or quantity for realistic length estimation
          if (strValue.includes('.') && (lowerTitle.includes('قيمة') || lowerTitle.includes('سعر'))) {
            strValue = new Intl.NumberFormat('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
          }
        }
        
        const contentLength = strValue.length;
        if (contentLength > maxContentLength) {
          maxContentLength = contentLength;
        }
      }
    }
  }
  
  // Calculate width based on character count (average character width ~8px)
  let calculatedWidth = Math.ceil(maxContentLength * 8);
  
  // Apply min/max constraints
  calculatedWidth = Math.max(MIN_WIDTH, Math.min(maxWidth, calculatedWidth));
  
  // Ensure reasonable default if calculation went wrong
  if (calculatedWidth < MIN_WIDTH) {
    calculatedWidth = DEFAULT_COLUMN_WIDTHS.default;
  }
  
  return calculatedWidth;
};

/**
 * Applies optimal widths to all columns in a table
 * @param {Array} columns - Original columns array
 * @param {Array} data - Table data
 * @param {Object} maxWidths - Optional object with specific max widths for columns
 * @returns {Array} Columns with calculated widths
 */
export const applyOptimalWidths = (columns, data, maxWidths = {}) => {
  if (!columns || !Array.isArray(columns) || !data) {
    return columns;
  }
  
  return columns.map(column => {
    // Skip if width is already defined explicitly
    if (column.width !== undefined && column.width !== null) {
      return column;
    }
    
    // Calculate optimal width
    const optimalWidth = calculateOptimalWidth(
      column.title,
      column.dataIndex || column.key,
      data,
      maxWidths[column.dataIndex || column.key] || MAX_WIDTH
    );
    
    return {
      ...column,
      width: optimalWidth
    };
  });
};

/**
 * Applies optimal width to a single column
 * @param {Object} column - Original column object
 * @param {Array} data - Table data
 * @param {number} maxWidth - Maximum allowed width for this column
 * @returns {Object} Column with calculated width
 */
export const applyOptimalWidth = (column, data, maxWidth) => {
  if (!column || !data) {
    return column;
  }
  
  // Skip if width is already defined explicitly
  if (column.width !== undefined && column.width !== null) {
    return column;
  }
  
  // Calculate optimal width
  const optimalWidth = calculateOptimalWidth(
    column.title,
    column.dataIndex || column.key,
    data,
    maxWidth || MAX_WIDTH
  );
  
  return {
    ...column,
    width: optimalWidth
  };
};

/**
 * Gets the default width for a column based on its type
 * @param {string} title - Column title
 * @param {string} dataIndex - Column data index
 * @returns {number} Default width
 */
export const getDefaultWidth = (title, dataIndex) => {
  const lowerTitle = (title || '').toLowerCase();
  const lowerDataIndex = (dataIndex || '').toLowerCase();
  
  if (lowerTitle.includes('م') || lowerDataIndex.includes('index')) {
    return DEFAULT_COLUMN_WIDTHS.index;
  }
  if (lowerTitle.includes('رمز') || lowerDataIndex.includes('code')) {
    return DEFAULT_COLUMN_WIDTHS.code;
  }
  if (lowerTitle.includes('اسم') || lowerDataIndex.includes('name')) {
    return DEFAULT_COLUMN_WIDTHS.name;
  }
  if (lowerTitle.includes('وحدة') || lowerDataIndex.includes('unit')) {
    return DEFAULT_COLUMN_WIDTHS.unit;
  }
  if (lowerTitle.includes('كمية') || lowerDataIndex.includes('quantity')) {
    return DEFAULT_COLUMN_WIDTHS.quantity;
  }
  if (lowerTitle.includes('افرادي') || lowerTitle.includes('سعر') || lowerDataIndex.includes('price')) {
    return DEFAULT_COLUMN_WIDTHS.price;
  }
  if (lowerTitle.includes('اجمالي') || lowerTitle.includes('قيمة') || lowerDataIndex.includes('amount')) {
    return DEFAULT_COLUMN_WIDTHS.amount;
  }
  if (lowerTitle.includes('تاريخ') || lowerDataIndex.includes('date')) {
    return DEFAULT_COLUMN_WIDTHS.date;
  }
  if (lowerTitle.includes('مورد') || lowerDataIndex.includes('supplier')) {
    return DEFAULT_COLUMN_WIDTHS.supplier;
  }
  if (lowerTitle.includes('ملاحظات') || lowerDataIndex.includes('notes')) {
    return DEFAULT_COLUMN_WIDTHS.notes;
  }
  if (lowerTitle.includes('نسبة') || lowerTitle.includes('نسبة') || lowerDataIndex.includes('percentage')) {
    return DEFAULT_COLUMN_WIDTHS.percentage;
  }
  if (lowerTitle.includes('حالة') || lowerTitle.includes('بيان') || lowerDataIndex.includes('status')) {
    return DEFAULT_COLUMN_WIDTHS.status;
  }
  
  return DEFAULT_COLUMN_WIDTHS.default;
};