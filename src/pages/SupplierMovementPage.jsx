import React, { useState, useMemo } from 'react';
import { Typography, Select, Card, Row, Col, Table, Alert, Button, Space } from 'antd';
import { formatQuantity, formatMoney } from '../utils/financialCalculations.js';

const { Title } = Typography;
const { Option } = Select;

function SupplierMovementPage({ data }) {
    const [selectedSupplier, setSelectedSupplier] = useState(null);

    // 1. إنشاء قائمة فريدة من اسماء الموردين للقائمة المنسدلة
    const supplierOptions = useMemo(() => {
        if (!data?.suppliersPayables) return [];
        const uniqueSuppliers = [...new Set(data.suppliersPayables.map(item => item['المورد']))];
        return uniqueSuppliers.map(supplier => ({ value: supplier, label: supplier }));
    }, [data?.suppliersPayables]);

    // 2. العثور على بيانات المورد المحدد من تقرير استحقاق الموردين
    const selectedSupplierPayable = useMemo(() => {
        if (!selectedSupplier || !data?.suppliersPayables) return null;
        return data.suppliersPayables.find(item => item['المورد'] === selectedSupplier);
    }, [selectedSupplier, data?.suppliersPayables]);

    // 3. تصفية قائمة المخزون النهائي للمورد المحدد
    const supplierInventory = useMemo(() => {
        if (!selectedSupplier || !data?.endingInventoryList) return [];
        return data.endingInventoryList.filter(item => item['المورد'] === selectedSupplier);
    }, [selectedSupplier, data?.endingInventoryList]);

    // 4. إنشاء خريطة لمبيعات كل صنف (للوصول السريع)
    const salesMap = useMemo(() => {
        if (!data?.excessInventory) return new Map();
        return new Map(data.excessInventory.map(item => [item['رمز المادة'], item['المبيعات']]));
    }, [data?.excessInventory]);

    // 5. إعداد البيانات لجداول التفاصيل مع حساب الحقول الإضافية
    const detailedInventoryData = useMemo(() => {
        return supplierInventory.map(item => {
            const purchaseDate = new Date(item['تاريخ الشراء']);
            const today = new Date();
            const ageInDays = item['تاريخ الشراء'] ? Math.floor((today - purchaseDate) / (1000 * 60 * 60 * 24)) : 0;
            const salesForItem = salesMap.get(item['رمز المادة']) || 0;

            return {
                ...item,
                'عمر الصنف': ageInDays,
                'مبيعات الصنف': salesForItem,
            };
        });
    }, [supplierInventory, salesMap]);

    // 6. تصفية الاصناف المعدة للارجاع
    const returnableInventoryData = useMemo(() => {
        return detailedInventoryData.filter(item => item['بيان الحركة'] === 'راكد تماما' || item['بيان الحركة'] === 'مخزون زائد' || item['بيان الصلاحية'] === 'منتهي' || item['بيان الصلاحية'] === 'قريب جدا');
    }, [detailedInventoryData]);

    // Function to safely stringify supplier keys/labels for printing
    const safeSupplierString = (v) => {
        try {
            if (v === null || typeof v === 'undefined') return '';
            if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return String(v);
            if (typeof v === 'object') {
                if ('value' in v && typeof v.value === 'string') return v.value;
                if ('label' in v && typeof v.label === 'string') return v.label;
                if ('name' in v && typeof v.name === 'string') return v.name;
                try { return JSON.stringify(v); } catch (e) { return '[object]'; }
            }
            return String(v);
        } catch (e) {
            return '[unprintable]';
        }
    };

    // Function to handle printing
    const handlePrint = () => {
        if (!selectedSupplier) {
            alert('الرجاء اختيار مورد لطباعة التقرير');
            return;
        }
        
        // Determine the supplier key used in data comparisons (string)
        const supplierKey = (typeof selectedSupplier === 'string') ? selectedSupplier : (selectedSupplier && (selectedSupplier.value || selectedSupplier.name || safeSupplierString(selectedSupplier)));
        const supplierLabel = safeSupplierString(selectedSupplier);

        // Create a printable HTML page with professional formatting
        const printWindow = window.open('', '_blank');
        const summaryHtml = supplierKey && data?.suppliersPayables ? (() => {
            const selectedSupplierPayable = data.suppliersPayables.find(item => item['المورد'] === supplierKey);
            if (selectedSupplierPayable) {
                return `
                    <div class="summary-info"><strong>رصيد المورد:</strong> ${formatMoney(parseInt(selectedSupplierPayable['الرصيد'] || 0))}</div>
                    <div class="summary-info"><strong>قيمة المخزون:</strong> ${formatMoney(parseInt(selectedSupplierPayable['قيمة المخزون'] || 0))}</div>
                    <div class="summary-info"><strong>الاستحقاق:</strong> ${formatMoney(parseInt(selectedSupplierPayable['الاستحقاق'] || 0))}</div>
                    <div class="summary-info"><strong>المبلغ المستحق:</strong> ${formatMoney(parseInt(selectedSupplierPayable['المبلغ المستحق'] || 0))}</div>
                    <div class="summary-info"><strong>قيمة المخزون الراكد:</strong> ${formatMoney(parseInt(selectedSupplierPayable['راكد تماما'] || 0))}</div>
                    <div class="summary-info"><strong>قيمة المخزون الزائد:</strong> ${formatMoney(parseInt(selectedSupplierPayable['مخزون زائد'] || 0))}</div>
                    <div class="summary-info"><strong>قيمة الاحتياج:</strong> ${formatMoney(parseInt(selectedSupplierPayable['الاحتياج'] || 0))}</div>
                    <div class="summary-info"><strong>قيمة المعد للارجاع:</strong> ${formatMoney(parseInt(selectedSupplierPayable['معد للارجاع'] || 0))}</div>
                `;
            }
            return '<p>لا توجد بيانات مورد</p>';
        })() : '<p>لا توجد بيانات مورد</p>';
        
        const inventoryHtml = supplierKey && data?.endingInventoryList ? (() => {
            const supplierInventory = data.endingInventoryList.filter(item => item['المورد'] === supplierKey);
            if (supplierInventory.length > 0) {
                let tableHtml = '<table><thead><tr>';
                tableHtml += '<th>م</th><th>رمز المادة</th><th>اسم المادة</th><th>الوحدة</th><th>الكمية</th><th>الافرادي</th><th>اجمالي الشراء</th><th>تاريخ الصلاحية</th><th>عمر الصنف</th><th>مبيعات الصنف</th><th>بيان الصلاحية</th><th>بيان الحركة</th><th>البيان</th>';
                tableHtml += '</tr></thead><tbody>';
                
                supplierInventory.forEach(item => {
                    const purchaseDate = new Date(item['تاريخ الشراء']);
                    const today = new Date();
                    const ageInDays = item['تاريخ الشراء'] ? Math.floor((today - purchaseDate) / (1000 * 60 * 60 * 24)) : 0;

                    // Safe conversions to avoid runtime coercion errors
                    const safe = v => safeSupplierString(v);
                    const qty = formatQuantity(Number(item['الكمية']) || 0);
                    const indiv = formatMoney(Number(item['الافرادي']) || 0);
                    const total = formatMoney(Number(item['الاجمالي']) || 0);
                    const sales = formatQuantity(Number(item['مبيعات الصنف'] || 0));

                    tableHtml += '<tr>';
                    tableHtml += `<td>${safe(item['م'])}</td>`;
                    tableHtml += `<td>${safe(item['رمز المادة'])}</td>`;
                    tableHtml += `<td>${safe(item['اسم المادة'])}</td>`;
                    tableHtml += `<td>${safe(item['الوحدة'])}</td>`;
                    tableHtml += `<td>${qty}</td>`;
                    tableHtml += `<td>${indiv}</td>`;
                    tableHtml += `<td>${total}</td>`;
                    tableHtml += `<td>${safe(item['تاريخ الصلاحية'])}</td>`;
                    tableHtml += `<td>${ageInDays}</td>`;
                    tableHtml += `<td>${sales}</td>`;
                    tableHtml += `<td>${safe(item['بيان الصلاحية'])}</td>`;
                    tableHtml += `<td>${safe(item['بيان الحركة'])}</td>`;
                    tableHtml += `<td>${safe(item['البيان'])}</td>`;
                    tableHtml += '</tr>';
                });
                
                tableHtml += '</tbody></table>';
                return tableHtml;
            }
            return '<p>لا توجد بيانات جدول</p>';
        })() : '<p>لا توجد بيانات مخزون</p>';
        
        printWindow.document.write(`
            <html dir="rtl">
            <head>
                <title>تقرير حركة مورد - ${supplierLabel}</title>
                <style>
                    body { 
                        font-family: "Arial", "Tahoma", sans-serif; 
                        margin: 20px;
                        direction: rtl;
                    }
                    .header {
                        text-align: center;
                        border-bottom: 2px solid #ccc;
                        padding-bottom: 15px;
                        margin-bottom: 20px;
                    }
                    .company-name {
                        font-size: 24px;
                        font-weight: bold;
                        color: #2c3e50;
                    }
                    .subtitle {
                        font-size: 16px;
                        color: #7f8c8d;
                        margin: 5px 0;
                    }
                    .report-title {
                        font-size: 20px;
                        font-weight: bold;
                        color: #34495e;
                        margin: 10px 0;
                    }
                    .report-details {
                        font-size: 14px;
                        color: #555;
                        margin: 10px 0;
                    }
                    .summary-section {
                        margin: 20px 0;
                        padding: 15px;
                        border: 1px solid #ddd;
                        border-radius: 5px;
                        background-color: #f9f9f9;
                    }
                    .summary-info {
                        margin: 8px 0;
                        padding: 5px 10px;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 20px 0;
                        font-size: 12px;
                    }
                    th, td {
                        border: 1px solid #333;
                        padding: 8px;
                        text-align: right;
                    }
                    th {
                        background-color: #ecf0f1;
                        font-weight: bold;
                    }
                    tr:nth-child(even) {
                        background-color: #f2f2f2;
                    }
                    .footer {
                        margin-top: 30px;
                        text-align: center;
                        font-size: 12px;
                        color: #7f8c8d;
                        border-top: 1px solid #ccc;
                        padding-top: 10px;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="company-name">برنامج يوسوفت للمحاسبة</div>
                    <div class="subtitle">نظام الموردين والمخزون والمبيعات</div>
                    <div class="report-title">تقرير حركة مورد - ${supplierLabel}</div>
                    <div class="report-details">التاريخ: ${new Date().toLocaleDateString('ar-EG')} | الوقت: ${new Date().toLocaleTimeString('ar-EG')}</div>
                </div>
                
                <!-- Supplier Summary -->
                <div class="summary-section">
                    <h2 style="margin-top: 0;">تقرير اجمالي المورد</h2>
                    ${summaryHtml}
                </div>
                
                <!-- Detailed Inventory Table -->
                <h2>تقرير مخزون مورد (${data?.endingInventoryList?.filter(item => item['المورد'] === supplierKey)?.length || 0} صنف)</h2>
                ${inventoryHtml}
                
                <div class="footer">
                    <p>تم إنشاء التقرير بواسطة برنامج يوسوفت للمحاسبة</p>
                    <p>© 2025 جميع الحقوق محفوظة</p>
                </div>
                
                <script>
                    window.onload = function() {
                        setTimeout(function() {
                            window.print();
                            window.close();
                        }, 500);
                    };
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    // Function to handle Excel export
    const handleExportExcel = () => {
        if (!selectedSupplier) {
            alert('الرجاء اختيار مورد لتصدير التقرير');
            return;
        }
        
        // Generate filename with supplier name and current date
        const currentDate = new Date().toISOString().slice(0, 10); // YYYY-MM-DD format
        const fileName = `تقرير-حركة-مورد-${selectedSupplier.replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '_')}-${currentDate}.xlsx`;
        
        alert(`تصدير إلى Excel باسم: ${fileName}`);
        // In a real implementation, this would use a library like xlsx to export data
    };

    // Function to handle PDF export
    const handleExportPDF = () => {
        if (!selectedSupplier) {
            alert('الرجاء اختيار مورد لتصدير التقرير');
            return;
        }
        
        // Generate filename with supplier name and current date
        const currentDate = new Date().toISOString().slice(0, 10); // YYYY-MM-DD format
        const fileName = `تقرير-حركة-مورد-${selectedSupplier.replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '_')}-${currentDate}.pdf`;
        
        // Check if jsPDF is available
        if (typeof window !== 'undefined' && window.jspdf) {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('p', 'mm', 'a4');
            
            // Add company/program header
            doc.setFontSize(18);
            doc.text('برنامج يوسوفت للمحاسبة', 105, 15, null, null, 'center'); // Program name
            
            // Add subtitle
            doc.setFontSize(14);
            doc.text('نظام الموردين والمخزون والمبيعات', 105, 22, null, null, 'center'); // Subtitle
            
            // Add title
            doc.setFontSize(16);
            doc.text(`تقرير حركة مورد - ${selectedSupplier}`, 105, 32, null, null, 'center');
            
            // Add date and time
            const now = new Date();
            doc.setFontSize(12);
            doc.text(`التاريخ: ${now.toLocaleDateString('ar-EG')}`, 20, 42);
            doc.text(`الوقت: ${now.toLocaleTimeString('ar-EG')}`, 150, 42);
            
            // Add supplier summary
            if (selectedSupplier && data?.suppliersPayables) {
                const selectedSupplierPayable = data.suppliersPayables.find(item => item['المورد'] === selectedSupplier);
                if (selectedSupplierPayable) {
                    doc.setFontSize(12);
                    doc.text(`رصيد المورد: ${formatMoney(parseInt(selectedSupplierPayable['الرصيد'] || 0))}`, 20, 52);
                    doc.text(`قيمة المخزون: ${formatMoney(parseInt(selectedSupplierPayable['قيمة المخزون'] || 0))}`, 20, 62);
                    doc.text(`الاستحقاق: ${formatMoney(parseInt(selectedSupplierPayable['الاستحقاق'] || 0))}`, 20, 72);
                    doc.text(`المبلغ المستحق: ${formatMoney(parseInt(selectedSupplierPayable['المبلغ المستحق'] || 0))}`, 20, 82);
                    doc.text(`قيمة المخزون الراكد: ${formatMoney(parseInt(selectedSupplierPayable['راكد تماما'] || 0))}`, 20, 92);
                    doc.text(`قيمة المخزون الزائد: ${formatMoney(parseInt(selectedSupplierPayable['مخزون زائد'] || 0))}`, 20, 102);
                    doc.text(`قيمة الاحتياج: ${formatMoney(parseInt(selectedSupplierPayable['الاحتياج'] || 0))}`, 20, 112);
                    doc.text(`قيمة المعد للارجاع: ${formatMoney(parseInt(selectedSupplierPayable['معد للارجاع'] || 0))}`, 20, 122);
                }
            }
            
            // Save the PDF with the formatted filename
            doc.save(fileName);
        } else {
            // If jsPDF is not available, show a more informative message
            alert('مكتبة jsPDF غير متوفرة. يرجى تثبيت مكتبة jsPDF لتصدير الملف إلى PDF.');
            
            // Alternative: Create a temporary HTML page for printing/PDF conversion
            const printWindow = window.open('', '_blank');
            const summaryHtml = selectedSupplier && data?.suppliersPayables ? (() => {
                const selectedSupplierPayable = data.suppliersPayables.find(item => item['المورد'] === selectedSupplier);
                if (selectedSupplierPayable) {
                    return `
                        <div class="summary-info"><strong>رصيد المورد:</strong> ${formatMoney(parseInt(selectedSupplierPayable['الرصيد'] || 0))}</div>
                        <div class="summary-info"><strong>قيمة المخزون:</strong> ${formatMoney(parseInt(selectedSupplierPayable['قيمة المخزون'] || 0))}</div>
                        <div class="summary-info"><strong>الاستحقاق:</strong> ${formatMoney(parseInt(selectedSupplierPayable['الاستحقاق'] || 0))}</div>
                        <div class="summary-info"><strong>المبلغ المستحق:</strong> ${formatMoney(parseInt(selectedSupplierPayable['المبلغ المستحق'] || 0))}</div>
                        <div class="summary-info"><strong>قيمة المخزون الراكد:</strong> ${formatMoney(parseInt(selectedSupplierPayable['راكد تماما'] || 0))}</div>
                        <div class="summary-info"><strong>قيمة المخزون الزائد:</strong> ${formatMoney(parseInt(selectedSupplierPayable['مخزون زائد'] || 0))}</div>
                        <div class="summary-info"><strong>قيمة الاحتياج:</strong> ${formatMoney(parseInt(selectedSupplierPayable['الاحتياج'] || 0))}</div>
                        <div class="summary-info"><strong>قيمة المعد للارجاع:</strong> ${formatMoney(parseInt(selectedSupplierPayable['معد للارجاع'] || 0))}</div>
                    `;
                }
                return '<p>لا توجد بيانات مورد</p>';
            })() : '<p>لا توجد بيانات مورد</p>';
            
            const inventoryHtml = selectedSupplier && data?.endingInventoryList ? (() => {
                const supplierInventory = data.endingInventoryList.filter(item => item['المورد'] === selectedSupplier);
                if (supplierInventory.length > 0) {
                    let tableHtml = '<table><thead><tr>';
                    tableHtml += '<th>م</th><th>رمز المادة</th><th>اسم المادة</th><th>الوحدة</th><th>الكمية</th><th>الافرادي</th><th>اجمالي الشراء</th><th>تاريخ الصلاحية</th><th>عمر الصنف</th><th>مبيعات الصنف</th><th>بيان الصلاحية</th><th>بيان الحركة</th><th>البيان</th>';
                    tableHtml += '</tr></thead><tbody>';
                    
                    supplierInventory.forEach(item => {
                        const purchaseDate = new Date(item['تاريخ الشراء']);
                        const today = new Date();
                        const ageInDays = item['تاريخ الشراء'] ? Math.floor((today - purchaseDate) / (1000 * 60 * 60 * 24)) : 0;
                        
                        tableHtml += '<tr>';
                        tableHtml += `<td>${item['م']}</td>`;
                        tableHtml += `<td>${item['رمز المادة']}</td>`;
                        tableHtml += `<td>${item['اسم المادة']}</td>`;
                        tableHtml += `<td>${item['الوحدة']}</td>`;
                        tableHtml += `<td>${formatQuantity(item['الكمية'])}</td>`;
                        tableHtml += `<td>${formatMoney(item['الافرادي'])}</td>`;
                        tableHtml += `<td>${formatMoney(item['الاجمالي'])}</td>`;
                        tableHtml += `<td>${item['تاريخ الصلاحية']}</td>`;
                        tableHtml += `<td>${ageInDays}</td>`;
                        tableHtml += `<td>${formatQuantity(item['مبيعات الصنف'] || 0)}</td>`;
                        tableHtml += `<td>${item['بيان الصلاحية']}</td>`;
                        tableHtml += `<td>${item['بيان الحركة']}</td>`;
                        tableHtml += `<td>${item['البيان']}</td>`;
                        tableHtml += '</tr>';
                    });
                    
                    tableHtml += '</tbody></table>';
                    return tableHtml;
                }
                return '<p>لا توجد بيانات جدول</p>';
            })() : '<p>لا توجد بيانات مخزون</p>';
            
            printWindow.document.write(`
                <html dir="rtl">
                <head>
                    <title>تقرير حركة مورد - ${selectedSupplier}</title>
                    <style>
                        body { 
                            font-family: "Arial", "Tahoma", sans-serif; 
                            margin: 20px;
                            direction: rtl;
                        }
                        .header {
                            text-align: center;
                            border-bottom: 2px solid #ccc;
                            padding-bottom: 15px;
                            margin-bottom: 20px;
                        }
                        .company-name {
                            font-size: 24px;
                            font-weight: bold;
                            color: #2c3e50;
                        }
                        .subtitle {
                            font-size: 16px;
                            color: #7f8c8d;
                            margin: 5px 0;
                        }
                        .report-title {
                            font-size: 20px;
                            font-weight: bold;
                            color: #34495e;
                            margin: 10px 0;
                        }
                        .report-details {
                            font-size: 14px;
                            color: #555;
                            margin: 10px 0;
                        }
                        .summary-section {
                            margin: 20px 0;
                            padding: 15px;
                            border: 1px solid #ddd;
                            border-radius: 5px;
                            background-color: #f9f9f9;
                        }
                        .summary-info {
                            margin: 8px 0;
                            padding: 5px 10px;
                        }
                        table {
                            width: 100%;
                            border-collapse: collapse;
                            margin: 20px 0;
                            font-size: 12px;
                        }
                        th, td {
                            border: 1px solid #333;
                            padding: 8px;
                            text-align: right;
                        }
                        th {
                            background-color: #ecf0f1;
                            font-weight: bold;
                        }
                        tr:nth-child(even) {
                            background-color: #f2f2f2;
                        }
                        .footer {
                            margin-top: 30px;
                            text-align: center;
                            font-size: 12px;
                            color: #7f8c8d;
                            border-top: 1px solid #ccc;
                            padding-top: 10px;
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div class="company-name">برنامج يوسوفت للمحاسبة</div>
                        <div class="subtitle">نظام الموردين والمخزون والمبيعات</div>
                        <div class="report-title">تقرير حركة مورد - ${selectedSupplier}</div>
                        <div class="report-details">التاريخ: ${new Date().toLocaleDateString('ar-EG')} | الوقت: ${new Date().toLocaleTimeString('ar-EG')}</div>
                    </div>
                    
                    <!-- Supplier Summary -->
                    <div class="summary-section">
                        <h2 style="margin-top: 0;">تقرير اجمالي المورد</h2>
                        ${summaryHtml}
                    </div>
                    
                    <!-- Detailed Inventory Table -->
                    <h2>تقرير مخزون مورد (${data?.endingInventoryList?.filter(item => item['المورد'] === selectedSupplier)?.length || 0} صنف)</h2>
                    ${inventoryHtml}
                    
                    <div class="footer">
                        <p>تم إنشاء التقرير بواسطة برنامج يوسوفت للمحاسبة</p>
                        <p>© 2025 جميع الحقوق محفوظة</p>
                    </div>
                    
                    <script>
                        setTimeout(function() {
                            window.print();
                            window.close();
                        }, 1000);
                    </script>
                </body>
                </html>
            `);
            printWindow.document.close();
        }
    };

    // تعريف اعمدة جداول التفاصيل
    const detailColumns = [
        { title: 'م', dataIndex: 'م', key: 'م', width: 50, align: 'center' },
        { title: 'رمز المادة', dataIndex: 'رمز المادة', key: 'رمز المادة', width: 100, align: 'center' },
        { title: 'اسم المادة', dataIndex: 'اسم المادة', key: 'اسم المادة', width: 180, align: 'left' },
        { title: 'الوحدة', dataIndex: 'الوحدة', key: 'الوحدة', width: 80, align: 'center' },
        {
            title: 'الكمية', dataIndex: 'الكمية', key: 'الكمية', width: 100, align: 'center',
            render: (text) => formatQuantity(text)
        },
        {
            title: 'الافرادي', dataIndex: 'الافرادي', key: 'الافرادي', width: 100, align: 'center',
            render: (text) => formatMoney(text)
        },
        {
            title: 'اجمالي الشراء', dataIndex: 'الاجمالي', key: 'الاجمالي', width: 100, align: 'center',
            render: (text) => formatMoney(text)
        },
        { title: 'تاريخ الصلاحية', dataIndex: 'تاريخ الصلاحية', key: 'تاريخ الصلاحية', width: 120, align: 'center' },
        { title: 'عمر الصنف', dataIndex: 'عمر الصنف', key: 'عمر الصنف', width: 80, align: 'center' },
        {
            title: 'مبيعات الصنف', dataIndex: 'مبيعات الصنف', key: 'مبيعات الصنف', width: 100, align: 'center',
            render: (text) => formatQuantity(text)
        },
        { title: 'بيان الصلاحية', dataIndex: 'بيان الصلاحية', key: 'بيان الصلاحية', width: 120, align: 'right' },
        { title: 'بيان الحركة', dataIndex: 'بيان الحركة', key: 'بيان الحركة', width: 120, align: 'right' },
        { title: 'البيان', dataIndex: 'البيان', key: 'البيان', width: 120, align: 'right' },
    ];

    if (!data) {
        return (
            <div style={{ padding: '20px' }}>
                <Alert message="لا توجد بيانات" description="يرجى استيراد ملف Excel اولاً لمعالجة البيانات." type="info" showIcon />
            </div>
        );
    }

    return (
        <div style={{ padding: '20px' }}>
            <Title level={4}>تقرير حركة مورد</Title>
            <p>اختر موردًا لعرض تفاصيل الاصناف والإجماليات الخاصة به.</p>

            <Select
                showSearch
                style={{ width: '100%', maxWidth: 400, marginBottom: 24 }}
                placeholder="ابحث واختر اسم المورد"
                optionFilterProp="children"
                onChange={setSelectedSupplier}
                filterOption={(input, option) => {
                    // option.children may be a React node/object in some environments - coerce safely to string
                    const childText = option && option.children ? (typeof option.children === 'string' ? option.children : String(option.children)) : '';
                    return childText.toLowerCase().indexOf(input.toLowerCase()) >= 0;
                }}
            >
                {supplierOptions.map(supplier => (
                    <Option key={supplier.value} value={supplier.value}>
                        {supplier.label}
                    </Option>
                ))}
            </Select>

            {selectedSupplier && (
                <div style={{ marginBottom: 20 }}>
                    <Space size="middle">
                        <Button type="primary" onClick={handlePrint}>
                            طباعة
                        </Button>
                        <Button onClick={handleExportExcel}>
                            تصدير إلى Excel
                        </Button>
                        <Button onClick={handleExportPDF}>
                            تصدير إلى PDF
                        </Button>
                    </Space>
                </div>
            )}

            {selectedSupplier && selectedSupplierPayable && (
                <>
                    {/* القسم الاول: الاجماليات */}
                    <Card title="تقرير اجمالي المورد" style={{ marginBottom: 24 }}>
                        <Row gutter={16}>
                            <Col span={4}><strong>رصيد المورد:</strong></Col>
                            <Col span={4}>{formatMoney(parseInt(selectedSupplierPayable['الرصيد'] || 0))}</Col>

                            <Col span={4}><strong>قيمة المخزون:</strong></Col>
                            <Col span={4}>{formatMoney(parseInt(selectedSupplierPayable['قيمة المخزون'] || 0))}</Col>

                            <Col span={4}><strong>الاستحقاق:</strong></Col>
                            <Col span={4}>{formatMoney(parseInt(selectedSupplierPayable['الاستحقاق'] || 0))}</Col>
                        </Row>
                        <Row gutter={16} style={{ marginTop: 16 }}>
                            <Col span={4}><strong>المبلغ المستحق:</strong></Col>
                            <Col span={4}>{formatMoney(parseInt(selectedSupplierPayable['المبلغ المستحق'] || 0))}</Col>

                            <Col span={4}><strong>قيمة المخزون الراكد:</strong></Col>
                            <Col span={4}>{formatMoney(parseInt(selectedSupplierPayable['راكد تماما'] || 0))}</Col>

                            <Col span={4}><strong>قيمة المخزون الزائد:</strong></Col>
                            <Col span={4}>{formatMoney(parseInt(selectedSupplierPayable['مخزون زائد'] || 0))}</Col>
                        </Row>
                        <Row gutter={16} style={{ marginTop: 16 }}>
                            <Col span={4}><strong>قيمة الاحتياج:</strong></Col>
                            <Col span={4}>{formatMoney(parseInt(selectedSupplierPayable['الاحتياج'] || 0))}</Col>

                            <Col span={4}><strong>قيمة المعد للارجاع:</strong></Col>
                            <Col span={4}>{formatMoney(parseInt(selectedSupplierPayable['معد للارجاع'] || 0))}</Col>
                        </Row>
                    </Card>

                    {/* القسم الثاني: تفاصيل الاصناف */}
                    <Card title={`تقرير مخزون مورد (${detailedInventoryData.length} صنف)`} style={{ marginBottom: 24 }}>
                        <Table
                            dataSource={detailedInventoryData}
                            columns={detailColumns}
                            rowKey={(record) => String(record['م'] || '')}
                            scroll={{ x: 1800 }}
                            pagination={{ pageSize: 10 }}
                        />
                    </Card>

                    {/* القسم الثالث: تفاصيل الاصناف المعدة للارجاع */}
                    <Card title={`تقرير مخزون مورد معد للارجاع (${returnableInventoryData.length} صنف)`}>
                        <Table
                            dataSource={returnableInventoryData}
                            columns={detailColumns}
                            rowKey="م"
                            scroll={{ x: 1800 }}
                            pagination={{ pageSize: 10 }}
                        />
                    </Card>
                </>
            )}
        </div>
    );
}

export default SupplierMovementPage;