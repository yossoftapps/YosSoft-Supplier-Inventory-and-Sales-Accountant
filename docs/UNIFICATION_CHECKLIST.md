# قائمة توحيد التقارير - Checklist

## 📋 المعيار القياسي (NetPurchasesPage.jsx)

### ✅ العناصر الواجب توفرها في كل تقرير:

#### 1. الـ Imports الأساسية:
```javascript
import React, { useState, useMemo, useCallback } from 'react';
import { Typography, Table } from 'antd';
import { formatQuantity, formatMoney } from '../utils/financialCalculations.js';
import { useTranslation } from 'react-i18next';
import UnifiedPageLayout from '../components/UnifiedPageLayout';
import UnifiedTable from '../components/UnifiedTable';
import UnifiedAlert from '../components/UnifiedAlert';
```

#### 2. State Management:
```javascript
const [filters, setFilters] = useState({});
const [columnVisibility, setColumnVisibility] = useState({});
const [sortOrder, setSortOrder] = useState({});
const [pagination, setPagination] = useState({ pageSize: 50 });
const [density, setDensity] = useState('small');
```

#### 3. Data Processing:
```javascript
// Filtered data
const filteredData = useMemo(() => { /* logic */ }, [data, filters]);

// Sorted data
const sortedData = useMemo(() => { /* logic */ }, [filteredData, sortOrder]);

// Grand totals
const grandTotals = useMemo(() => { /* logic */ }, [sortedData]);
```

#### 4. Callbacks:
```javascript
const handleColumnVisibilityChange = useCallback((newVisibility) => setColumnVisibility(newVisibility), []);
const handleSortOrderChange = useCallback((newSortOrder) => setSortOrder(newSortOrder), []);
const handleDensityChange = useCallback((newDensity) => setDensity(newDensity), []);
const handlePaginationChange = useCallback((newPagination) => setPagination(newPagination), []);
```

#### 5. Columns Definition:
```javascript
const allColumns = [
  { title: 'م', dataIndex: 'م', key: 'م', width: 50, align: 'center' },
  { title: 'رمز المادة', dataIndex: 'رمز المادة', key: 'رمز المادة', width: 100, align: 'center' },
  { title: 'اسم المادة', dataIndex: 'اسم المادة', key: 'اسم المادة', width: 180, align: 'left' },
  // ... حسب TODO.md
];

const visibleColumns = allColumns.filter(col => columnVisibility[col.dataIndex || col.key] !== false);
```

#### 6. UnifiedPageLayout Props:
```javascript
<UnifiedPageLayout
  title={`${t('reportName')} (${dataLength} ${t('records')})`}
  description="وصف التقرير"
  interpretation="تفسير التقرير"
  data={currentData}
  columns={visibleColumns}
  filename="report-filename"
  allReportsData={allReportsData}
  availableReports={availableReports}
  reportKey="reportKey"
  onColumnVisibilityChange={handleColumnVisibilityChange}
  onSortOrderChange={handleSortOrderChange}
  onPaginationChange={handlePaginationChange}
  pagination={pagination}
  onDensityChange={handleDensityChange}
  density={density}
  filterData={data}
  filterDataType="dataType" // أو undefined لعدم الفلترة
  onFilterChange={setFilters}
  headerExtra={/* NavigationTabs if needed */}
>
```

#### 7. UnifiedTable Props:
```javascript
<UnifiedTable
  dataSource={data}
  columns={visibleColumns}
  rowKey="م"
  scroll={{ x: 2500 }}
  virtualized={false}
  size={density}
  pagination={{
    ...pagination,
    total: data.length,
    showSizeChanger: true
  }}
  onPaginationChange={handlePaginationChange}
  title={`عنوان الجدول`}
  summary={(pageData) => { /* summary logic */ }}
/>
```

#### 8. Summary (الإجماليات):
```javascript
summary={(pageData) => {
  // حساب إجماليات الصفحة
  let pageTotal = 0;
  pageData.forEach((record) => {
    pageTotal += parseFloat(record['field'] || 0);
  });
  
  return (
    <>
      {/* إجمالي الصفحة */}
      <Table.Summary.Row>
        <Table.Summary.Cell colSpan={n}>
          <strong>إجمالي أرقام هذه الصفحة</strong>
        </Table.Summary.Cell>
        <Table.Summary.Cell>
          <strong>{formatQuantity(pageTotal)}</strong>
        </Table.Summary.Cell>
      </Table.Summary.Row>
      
      {/* الإجمالي الكلي */}
      <Table.Summary.Row>
        <Table.Summary.Cell colSpan={n}>
          <strong>الإجمالي الكلي للقائمة</strong>
        </Table.Summary.Cell>
        <Table.Summary.Cell>
          <strong>{formatQuantity(grandTotal)}</strong>
        </Table.Summary.Cell>
      </Table.Summary.Row>
    </>
  );
}}
```

---

## 📊 مقارنة التقارير

### ✅ صافي المشتريات (NetPurchasesPage.jsx) - القياسي
- [x] جميع العناصر موجودة
- [x] NavigationTabs للتبديل بين القوائم
- [x] الفلترة مفعلة
- [x] الترتيب يعمل
- [x] إعدادات العرض تعمل
- [x] Summary صحيح

### ✅ صافي المبيعات (NetSalesPage.jsx) - ممتاز
- [x] جميع العناصر موجودة
- [x] NavigationTabs للتبديل بين القوائم
- [x] الفلترة مفعلة
- [x] الترتيب يعمل
- [x] إعدادات العرض تعمل
- [x] Summary صحيح
- [x] استخدم memo للأداء

**الحالة**: ✅ **لا يحتاج تعديل**

---

## 🎯 التقارير التالية للمراجعة

### 1. المخزون النهائي (EndingInventoryPage.jsx)
**الأولوية**: عالية جداً

**المطلوب**:
- [ ] إضافة NavigationTabs حسب "بيان الحالة"
- [ ] التأكد من الفلترة
- [ ] التأكد من الترتيب
- [ ] التأكد من إعدادات العرض
- [ ] مراجعة الأعمدة حسب TODO

### 2. الجرد الفعلي (PhysicalInventoryPage.jsx)
**الأولوية**: عالية

**المطلوب**:
- [ ] التأكد من عدم وجود NavigationTabs (غير مطلوب)
- [ ] التأكد من الفلترة
- [ ] التأكد من الترتيب
- [ ] التأكد من إعدادات العرض
- [ ] مراجعة الأعمدة حسب TODO

### 3. فائض المخزون (ExcessInventoryPage.jsx)
**الأولوية**: عالية

**المطلوب**:
- [ ] إضافة/تأكيد NavigationTabs حسب "بيان الفائض"
- [ ] إصلاح إعدادات العرض (حالياً غير مفعلة)
- [ ] التأكد من الفلترة
- [ ] التأكد من الترتيب
- [ ] مراجعة الأعمدة حسب TODO

### 4. دوران المخزون (InventoryTurnoverPage.jsx)
**الأولوية**: عالية

**المطلوب**:
- [ ] إزالة البحث الذكي والفلترة (غير مطلوب)
- [ ] إصلاح إعدادات العرض (حالياً غير مفعلة)
- [ ] إزالة زر مسح الفلاتر
- [ ] التأكد من الترتيب
- [ ] مراجعة الأعمدة حسب TODO

### 5. الجرد الدفتري (BookInventoryPage.jsx)
**الأولوية**: متوسطة

**المطلوب**:
- [ ] التأكد من عدم وجود NavigationTabs (غير مطلوب)
- [ ] التأكد من الفلترة
- [ ] التأكد من الترتيب
- [ ] التأكد من إعدادات العرض
- [ ] مراجعة الأعمدة حسب TODO

---

## 📝 قالب التحقق لكل تقرير

```markdown
### تقرير: [اسم التقرير]
**التاريخ**: [تاريخ المراجعة]
**المراجع**: [اسم المراجع]

#### ✅ الفحوصات الأساسية:
- [ ] الـ imports صحيحة
- [ ] State management كامل
- [ ] useMemo للبيانات المفلترة
- [ ] useMemo للبيانات المرتبة
- [ ] useMemo للإجماليات
- [ ] useCallback للـ handlers
- [ ] تعريف الأعمدة صحيح
- [ ] Props الـ UnifiedPageLayout كاملة
- [ ] Props الـ UnifiedTable كاملة

#### ✅ الميزات الوظيفية:
- [ ] الفلترة تعمل (إذا مطلوبة)
- [ ] الترتيب يعمل
- [ ] إعدادات العرض تعمل
- [ ] Pagination يعمل
- [ ] Density يعمل
- [ ] NavigationTabs (إذا مطلوب)
- [ ] Summary صحيح

#### ✅ حسب TODO.md:
- [ ] خيارات التصدير صحيحة (1 أو 3)
- [ ] زر مسح الفلاتر (حسب القائمة)
- [ ] البحث والفلترة (حسب القائمة)
- [ ] النصوص التوضيحية والتفسير
- [ ] عرض ومحاذاة الأعمدة

#### 📊 النتيجة:
- **الحالة**: [✅ مكتمل / ⚠️ يحتاج تعديلات / 🔴 يحتاج إعادة كتابة]
- **الملاحظات**: [...]
```

---

## 🔧 الأخطاء الشائعة المطلوب تجنبها:

1. ❌ **عدم استخدام useMemo للبيانات**: يؤدي لإعادة حساب البيانات في كل render
2. ❌ **عدم استخدام useCallback للـ handlers**: يؤدي لإعادة إنشاء الدوال
3. ❌ **نسيان `key` في الأعمدة**: قد يسبب مشاكل في React
4. ❌ **عدم توحيد Summary**: يجب أن يكون بنفس الشكل في جميع التقارير
5. ❌ **نسيان `rowKey="م"`**: مهم لـ React لتتبع الصفوف
6. ❌ **عدم التحقق من `data` قبل الاستخدام**: قد يسبب errors
7. ❌ **عرض ومحاذاة الأعمدة غير صحيحة**: راجع TODO.md للتفاصيل
8. ❌ **filterDataType خاطئ أو ناقص**: يجب أن يتطابق مع نوع البيانات

---

## 📈 خطة التنفيذ

### الأسبوع 1:
- [x] صافي المبيعات - مكتمل ✅
- [ ] المخزون النهائي
- [ ] الجرد الفعلي
- [ ] فائض المخزون
- [ ] دوران المخزون

### الأسبوع 2:
- [ ] الجرد الدفتري
- [ ] تجهيز المرتجعات
- [ ] استحقاق الموردين
- [ ] حركة مورد
- [ ] تكلفة المبيعات

### الأسبوع 3:
- [ ] ربحية الأصناف
- [ ] ملخص الحسابات الرئيسية
- [ ] مخاطر انتهاء الصلاحية
- [ ] مخاطر الركود
- [ ] الأصناف الشاذة

### الأسبوع 4:
- [ ] تحليل ABC للمخزون
- [ ] فجوة الشراء المثالية - مكتمل ✅ (منطقياً)
- [ ] أداء الأصناف الجديدة
- [ ] بطاقة تقييم الموردين
- [ ] مقارنة الموردين

---

**آخر تحديث**: 6 يناير 2026  
**الحالة**: 🔄 قيد العمل
