/**
 * Defines a unique, professional color for each report in the application.
 * These colors are used to style the report headers and sidebar icons.
 */

export const REPORT_COLORS = {
    // Basic Reports
    netPurchases: '#2563eb',      // Blue 600
    netSales: '#16a34a',          // Green 600
    physicalInventory: '#0891b2', // Cyan 600
    excessInventory: '#f59e0b',   // Amber 500

    // Inventory Reports
    endingInventory: '#7c3aed',   // Violet 600
    bookInventory: '#4f46e5',     // Indigo 600
    preparingReturns: '#db2777',  // Pink 600

    // Financial Reports
    suppliersPayables: '#ea580c', // Orange 600
    supplierMovement: '#9333ea',  // Purple 600
    salesCost: '#b45309',         // Amber 700
    itemProfitability: '#65a30d', // Lime 600
    mainAccounts: '#475569',      // Slate 600

    // Risk Reports
    expiryRisk: '#dc2626',        // Red 600
    stagnationRisk: '#ca8a04',    // Yellow 600
    abnormalItems: '#be123c',     // Rose 700

    // Analytical Reports
    inventoryABC: '#0d9488',      // Teal 600
    inventoryTurnover: '#0284c7', // Sky 600
    idealReplenishment: '#059669',// Emerald 600
    newItemPerformance: '#8b5cf6',// Violet 500
    supplierScorecards: '#be185d',// Pink 700
    supplierComparison: '#c026d3',// Fuchsia 600

    // Dashboard & Others
    dashboard: '#3b82f6',         // Blue 500
    import: '#10b981',            // Emerald 500
    logs: '#64748b',              // Slate 500
};

/**
 * Returns a lighter version of the color (for backgrounds)
 * This is a simple approximation by using standard CSS opacity or distinct light colors if needed.
 * For true hex manipulation without a library, we'll return an rgba string.
 * @param {string} hexColor 
 * @param {number} opacity 
 * @returns {string} rgba color
 */
export const getLightColor = (hexColor, opacity = 0.08) => {
    if (!hexColor) return 'rgba(0,0,0,0.02)';

    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    const hex = hexColor.replace(shorthandRegex, (m, r, g, b) => {
        return r + r + g + g + b + b;
    });

    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
        const r = parseInt(result[1], 16);
        const g = parseInt(result[2], 16);
        const b = parseInt(result[3], 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    return hexColor;
};
