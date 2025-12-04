// Utility to normalize imported data keys to the Arabic keys used throughout the UI
const keyMap = {
  // common English -> Arabic
  'index': 'م',
  'id': 'م',
  'item_code': 'رمز المادة',
  'code': 'رمز المادة',
  'item': 'اسم المادة',
  'name': 'اسم المادة',
  'unit': 'الوحدة',
  'quantity': 'الكمية',
  'qty': 'الكمية',
  'inventory_qty': 'كمية الجرد',
  'inventory_quantity': 'كمية الجرد',
  'price': 'الافرادي',
  'unit_price': 'الافرادي',
  'expiry_date': 'تاريخ الصلاحية',
  'supplier': 'المورد',
  'transaction_date': 'تاريخ العملية',
  'operation_type': 'نوع العملية',
  'record_number': 'رقم السجل',
  'notes': 'ملاحظات',
  'list': 'القائمة'
}

function normalizeRecord(record) {
  if (!record || typeof record !== 'object') return record;
  const out = {};

  // First, copy Arabic keys as-is
  for (const k of Object.keys(record)) {
    out[k] = record[k];
  }

  // Map English/alternative keys to Arabic keys if missing
  for (const [src, dest] of Object.entries(keyMap)) {
    if (out[dest] === undefined) {
      // try various casings
      const candidates = [src, src.toLowerCase(), src.toUpperCase(), capitalize(src)];
      for (const c of candidates) {
        if (record[c] !== undefined) {
          out[dest] = record[c];
          break;
        }
      }
    }
  }

  return out;
}

function normalizeList(list) {
  if (!Array.isArray(list)) return list || [];
  return list.map(normalizeRecord);
}

function capitalize(s) {
  if (!s || typeof s !== 'string') return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function normalizeProcessedData(data) {
  if (!data || typeof data !== 'object') return data;

  const out = { ...data };

  if (data.netPurchases) {
    out.netPurchases = {
      netPurchasesList: normalizeList(data.netPurchases.netPurchasesList || []),
      orphanReturnsList: normalizeList(data.netPurchases.orphanReturnsList || [])
    };
  }

  if (data.netSales) {
    out.netSales = {
      netSalesList: normalizeList(data.netSales.netSalesList || []),
      orphanReturnsList: normalizeList(data.netSales.orphanReturnsList || [])
    };
  }

  if (data.physicalInventory) {
    out.physicalInventory = {
      listE: normalizeList(data.physicalInventory.listE || []),
      listF: normalizeList(data.physicalInventory.listF || [])
    };
  }

  if (data.endingInventory) {
    out.endingInventory = {
      endingInventoryList: normalizeList(data.endingInventory.endingInventoryList || []),
      listB: normalizeList(data.endingInventory.listB || [])
    };
  }

  // fallback for other arrays
  if (Array.isArray(data.bookInventory)) out.bookInventory = normalizeList(data.bookInventory);
  // salesCost may be provided as an array or as an object { costOfSalesList: [] }
  if (Array.isArray(data.salesCost)) {
    out.salesCost = normalizeList(data.salesCost);
  } else if (data.salesCost && Array.isArray(data.salesCost.costOfSalesList)) {
    out.salesCost = normalizeList(data.salesCost.costOfSalesList);
  }

  return out;
}

export { normalizeRecord, normalizeList, normalizeProcessedData };

