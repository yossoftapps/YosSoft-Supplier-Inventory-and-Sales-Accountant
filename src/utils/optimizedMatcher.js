// Optimized matcher utility using indexing structures for better performance
import { compare, roundToDecimalPlaces } from './financialCalculations.js';

/**
 * Indexed matcher for efficient record matching
 */
export class IndexedMatcher {
  constructor(records) {
    this.records = records;
    this.indexes = {};
    this.buildIndexes();
  }

  /**
   * Build indexes for common search fields
   */
  buildIndexes() {
    // Index by material code
    this.indexes.material = {};
    // Index by expiration date
    this.indexes.expiry = {};
    // Index by operation date
    this.indexes.operationDate = {};

    this.records.forEach((record, index) => {
      // Material code index
      const materialCode = record['رمز المادة'];
      if (materialCode) {
        if (!this.indexes.material[materialCode]) {
          this.indexes.material[materialCode] = [];
        }
        this.indexes.material[materialCode].push({ record, index });
      }

      // Expiration date index
      const expiryDate = record['تاريخ الصلاحية'];
      if (expiryDate) {
        if (!this.indexes.expiry[expiryDate]) {
          this.indexes.expiry[expiryDate] = [];
        }
        this.indexes.expiry[expiryDate].push({ record, index });
      }

      // Operation date index
      const operationDate = record['تاريخ العملية'];
      if (operationDate) {
        if (!this.indexes.operationDate[operationDate]) {
          this.indexes.operationDate[operationDate] = [];
        }
        this.indexes.operationDate[operationDate].push({ record, index });
      }
    });
  }

  /**
   * Get records by material code
   */
  getByMaterialCode(materialCode) {
    return this.indexes.material[materialCode] || [];
  }

  /**
   * Get records by expiration date
   */
  getByExpiryDate(expiryDate) {
    return this.indexes.expiry[expiryDate] || [];
  }

  /**
   * Get records by operation date
   */
  getByOperationDate(operationDate) {
    return this.indexes.operationDate[operationDate] || [];
  }

  /**
   * Get records matching multiple criteria
   */
  getMatchingRecords(criteria) {
    let candidates = this.records.map((record, index) => ({ record, index }));

    // Filter by material code if provided
    if (criteria.materialCode) {
      const materialMatches = this.getByMaterialCode(criteria.materialCode);
      candidates = candidates.filter(candidate => 
        materialMatches.some(match => match.index === candidate.index)
      );
    }

    // Filter by expiration date if provided
    if (criteria.expiryDate) {
      const expiryMatches = this.getByExpiryDate(criteria.expiryDate);
      candidates = candidates.filter(candidate => 
        expiryMatches.some(match => match.index === candidate.index)
      );
    }

    // Filter by date range if provided
    if (criteria.dateFrom || criteria.dateTo) {
      candidates = candidates.filter(candidate => {
        const recordDate = new Date(candidate.record['تاريخ العملية']);
        if (criteria.dateFrom && recordDate < new Date(criteria.dateFrom)) return false;
        if (criteria.dateTo && recordDate > new Date(criteria.dateTo)) return false;
        return true;
      });
    }

    return candidates;
  }

  /**
   * Apply matching key function to filtered candidates
   */
  applyMatchingKey(keyFunction, candidates) {
    return candidates.filter(candidate => keyFunction(candidate.record));
  }

  /**
   * Update record quantity
   */
  updateQuantity(index, newQuantity) {
    if (index >= 0 && index < this.records.length) {
      this.records[index]['الكمية'] = roundToDecimalPlaces(newQuantity, 2);
    }
  }

  /**
   * Get record by index
   */
  getRecord(index) {
    return this.records[index];
  }

  /**
   * Find record index by ID
   */
  findIndexById(id) {
    return this.records.findIndex(record => record['م'] === id);
  }
}

/**
 * Optimized matching function using indexed matcher
 */
export const optimizedMatch = (matcher, returnRecord, netPurchasesList, matchingKeys, matchingAudit) => {
  const returnQuantity = roundToDecimalPlaces(returnRecord['الكمية'] || 0, 2);
  let remainingReturnQty = returnQuantity;
  let matched = false;
  let usedKeyNumber = 0;

  // Try each matching key in order
  for (let keyIndex = 0; keyIndex < matchingKeys.length; keyIndex++) {
    if (compare(remainingReturnQty, 0) <= 0) break;

    const keyFunction = matchingKeys[keyIndex];

    // Use indexing to get initial candidates
    const materialCode = returnRecord['رمز المادة'];
    const candidates = matcher.getMatchingRecords({ materialCode });
    
    // Apply the specific key function to filter candidates
    const matchingPurchases = matcher.applyMatchingKey(keyFunction, candidates);

    // Sort matching purchases: newest first
    matchingPurchases.sort((a, b) => {
      const dateDiff = new Date(b.record['تاريخ العملية']) - new Date(a.record['تاريخ العملية']);
      if (dateDiff !== 0) return dateDiff;
      return a.record['م'] - b.record['م'];
    });

    // Process matching purchases
    for (const purchase of matchingPurchases) {
      if (compare(remainingReturnQty, 0) <= 0) break;

      const purchaseQty = purchase.record['الكمية'];

      if (compare(purchaseQty, remainingReturnQty) >= 0) {
        // Full match: deduct entire return quantity
        matcher.updateQuantity(purchase.index, purchaseQty - remainingReturnQty);
        netPurchasesList[purchase.index]['ملاحظات'] = `مطابق (مفتاح ${keyIndex + 1})`;
        
        // Record audit trail
        matchingAudit.recordMatch(
          'NetPurchases',
          keyIndex + 1,
          returnRecord['م'],
          purchase.record['م'],
          remainingReturnQty,
          returnRecord,
          purchase.record
        );
        
        remainingReturnQty = 0;
        matched = true;
        usedKeyNumber = keyIndex + 1;
        break;
      } else {
        // Partial match: deduct entire purchase quantity
        matcher.updateQuantity(purchase.index, 0);
        netPurchasesList[purchase.index]['ملاحظات'] = `مطابق جزئي (مفتاح ${keyIndex + 1})`;
        
        // Record audit trail
        matchingAudit.recordMatch(
          'NetPurchases',
          keyIndex + 1,
          returnRecord['م'],
          purchase.record['م'],
          purchaseQty,
          returnRecord,
          purchase.record
        );
        
        remainingReturnQty = remainingReturnQty - purchaseQty;
        matched = true;
        usedKeyNumber = keyIndex + 1;
      }
    }
  }

  return {
    remainingReturnQty,
    matched,
    usedKeyNumber
  };
};