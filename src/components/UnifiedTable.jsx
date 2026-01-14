import React, { useState, useCallback, useRef, forwardRef, useEffect } from 'react';
import { Table, Pagination } from 'antd';
import { useDrag, useDrop } from 'react-dnd'; // يفترض استخدام DndProvider و HTML5Backend من الخارج
import SynchronizedHorizontalScrollbar from './SynchronizedHorizontalScrollbar';
import { applyOptimalWidths, applyOptimalWidth } from '../utils/columnWidthCalculator';
import '../assets/styles/unified-styles.css';
import '../assets/styles/unified-table-extra.css';

// --- مكون خلية الرأس القابلة للسحب ---
const DragableHeaderCell = ({ id, index, moveColumn, children, align, ...restProps }) => {
  const ref = useRef(null);
  const [{ handlerId }, drop] = useDrop({
    accept: 'column',
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(item, monitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) {
        return;
      }

      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleX = (hoverBoundingRect.right - hoverBoundingRect.left) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientX = clientOffset.x - hoverBoundingRect.left;

      // تنفيذ النقل فقط عندما يتجاوز الماوس نصف عرض العنصر
      // هذا المنطق يساعد على منع الارتعاش أثناء عمليات السحب
      // بالنسبة للاتجاه من اليمين لليسار (RTL)، نحتاج لمراعاة اتجاه hoverX
      const isRTL = document.documentElement.dir === 'rtl';

      if (isRTL) {
        if (dragIndex < hoverIndex && hoverClientX > hoverMiddleX) {
          return;
        }
        if (dragIndex > hoverIndex && hoverClientX < hoverMiddleX) {
          return;
        }
      } else {
        if (dragIndex < hoverIndex && hoverClientX < hoverMiddleX) {
          return;
        }
        if (dragIndex > hoverIndex && hoverClientX > hoverMiddleX) {
          return;
        }
      }

      moveColumn(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: 'column',
    item: () => ({ id, index }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const opacity = isDragging ? 0 : 1;
  drag(drop(ref));

  // Apply alignment style
  const cellStyle = {
    opacity,
    cursor: 'grab',
    ...(align ? { textAlign: align } : {})
  };

  return (
    <th
      ref={ref}
      style={cellStyle} // إضافة مؤشر اليد للأعمدة القابلة للسحب
      data-handler-id={handlerId}
      {...restProps}
    >
      {children}
    </th>
  );
};

/**
 * المكون الموحد للجدول (UnifiedTable)
 * يوفر ميزات متقدمة مثل السحب والإفلات، التمرير المتزامن، والوضع الافتراضي (Virtualization).
 */
const UnifiedTable = forwardRef(({
  dataSource,
  columns: initialColumns,
  rowKey,
  title, // ملاحظة: نستخدم هذا لتمثيل الصف الخامس (Row 5)
  summary,
  pagination,
  scroll,
  size = 'small',
  virtualized = false,
  showHorizontalScrollbars = true, // تفعيل الشريط العلوي والسفلي افتراضيًا بناءً على طلب المستخدم
  onRowSelection,
  headerExtra, // يمرر من UnifiedPageLayout (تبوابات التنقل)
  onPaginationChange,
  useDynamicWidths = false, // Dynamic widths are disabled by default
  ...restProps
}, ref) => {
  const tableRef = useRef(null);
  const [columns, setColumns] = useState(initialColumns);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  // تحديث الأعمدة عند تغير خاصية initialColumns أو عند تغير البيانات
  useEffect(() => {
    if (useDynamicWidths && dataSource && dataSource.length > 0) {
      // Apply dynamic widths based on data content
      const optimizedColumns = applyOptimalWidths(initialColumns, dataSource);
      setColumns(optimizedColumns);
    } else {
      setColumns(initialColumns);
    }
  }, [initialColumns, dataSource, useDynamicWidths]);

  // إعدادات الترحيل الافتراضية (Pagination)
  const defaultPagination = {
    position: ['bottomRight'], // إزالة الترحيل العلوي ليتم التعامل معه يدويًا في الصف 5
    pageSize: 100,
    hideOnSinglePage: false, // ضمان ظهور الترحيل دائمًا حتى لو صفحة واحدة
    pageSizeOptions: ['50', '100', '200', '500'],
    showTotal: (total, range) => (
      <span className="unified-pagination-total">
        {range[0]}-{range[1]} من {total} سجل
      </span>
    ),
    showSizeChanger: true,
    ...pagination
  };

  const currentPagination = {
    ...defaultPagination,
    ...pagination,
    position: ['bottomRight'] // تجاهل أي موضع ممرر لضمان عدم وجود تكرار في الأعلى
  };

  // التحكم في الوضع الافتراضي (Virtualization) يعتمد كليًا على المكون الأب
  // تم إزالة الشرط التلقائي (dataSource.length > 150) الذي كان يسبب اختفاء الترقيق
  const isVirtualized = virtualized;

  // عرض الترحيل إذا لم يتم تعطيله صراحةً ولم يكن في وضع Virtualization
  const showPagination = pagination !== false && !isVirtualized;

  // إعدادات التمرير الافتراضية
  const defaultScroll = {
    x: 1500,
    y: 600,
    ...scroll
  };

  // --- منطق مزامنة التمرير (Synchronized Scroll) ---
  const tableContainerRef = useRef(null);
  const topScrollRef = useRef(null);
  const bottomScrollRef = useRef(null);

  useEffect(() => {
    // إذا لم يتم عرض أشرطة التمرير الأفقية، فلا تفعل شيئًا
    if (!showHorizontalScrollbars) return;

    const container = tableContainerRef.current;
    if (!container) return;

    const topScroll = topScrollRef.current;
    const bottomScroll = bottomScrollRef.current;

    let tableBody = null;
    let observerCleanup = null;
    let scrollListenersCleanup = null;
    let timeoutId = null;

    // وظيفة لتهيئة مزامنة التمرير
    const initializeSync = () => {
      if (tableBody) {
        // تحديث عرض شريط التمرير بناءً على عرض محتوى الجدول
        const updateScrollWidth = () => {
          const scrollWidth = tableBody.scrollWidth;
          if (topScroll?.firstChild) topScroll.firstChild.style.width = `${scrollWidth}px`;
          if (bottomScroll?.firstChild) bottomScroll.firstChild.style.width = `${scrollWidth}px`;
        };

        updateScrollWidth(); // تحديث مبدئي
        // مراقبة تغيير حجم جسم الجدول لتحديث عرض شريط التمرير
        const resizeObserver = new ResizeObserver(updateScrollWidth);
        resizeObserver.observe(tableBody);

        let isSyncing = false;
        // وظيفة لمزامنة التمرير بين العناصر
        const syncScroll = (source, targets) => {
          if (isSyncing) return; // منع التكرار اللانهائي
          isSyncing = true;
          targets.forEach(target => {
            if (target && target !== source) {
              target.scrollLeft = source.scrollLeft;
            }
          });
          isSyncing = false;
        };

        // معالجات أحداث التمرير
        const handleTableScroll = (e) => syncScroll(e.target, [topScroll, bottomScroll]);
        const handleTopScroll = (e) => syncScroll(e.target, [tableBody, bottomScroll]);
        const handleBottomScroll = (e) => syncScroll(e.target, [tableBody, topScroll]);

        // إضافة مستمعي الأحداث
        tableBody.addEventListener('scroll', handleTableScroll);
        if (topScroll) topScroll.addEventListener('scroll', handleTopScroll);
        if (bottomScroll) bottomScroll.addEventListener('scroll', handleBottomScroll);

        // وظيفة لتنظيف مستمعي الأحداث ومراقب الحجم
        scrollListenersCleanup = () => {
          tableBody.removeEventListener('scroll', handleTableScroll);
          if (topScroll) topScroll.removeEventListener('scroll', handleTopScroll);
          if (bottomScroll) bottomScroll.removeEventListener('scroll', handleBottomScroll);
          resizeObserver.disconnect();
        };
      }
    };

    // وظيفة للبحث عن عنصر جسم الجدول
    const findTableBody = () => {
      const selectors = [
        '.ant-table-body',
        '.ant-table-container .ant-table-content',
        '.ant-table-content',
        '.ant-table-tbody'
      ];
      for (const selector of selectors) {
        const element = container.querySelector(selector);
        if (element) return element;
      }
      return null;
    };

    tableBody = findTableBody();
    if (tableBody) {
      initializeSync(); // إذا تم العثور على جسم الجدول، قم بالتهيئة فورًا
    } else {
      // إذا لم يتم العثور على جسم الجدول، استخدم MutationObserver لمراقبته
      const mutationObserver = new MutationObserver(() => {
        tableBody = findTableBody();
        if (tableBody) {
          initializeSync();
          mutationObserver.disconnect(); // بمجرد العثور عليه، افصل المراقب
        }
      });
      mutationObserver.observe(container, { childList: true, subtree: true });
      observerCleanup = () => mutationObserver.disconnect();
      // إضافة مهلة زمنية لضمان التنظيف في حالة عدم العثور على جسم الجدول
      timeoutId = setTimeout(() => {
        if (observerCleanup) observerCleanup();
        const finalCheck = findTableBody();
        if (finalCheck) {
          tableBody = finalCheck;
          initializeSync();
        }
      }, 5000); // مهلة 5 ثوانٍ
    }

    // وظيفة التنظيف عند إلغاء تحميل المكون
    return () => {
      if (observerCleanup) observerCleanup();
      if (scrollListenersCleanup) scrollListenersCleanup();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [showHorizontalScrollbars, dataSource?.length, columns?.length]); // إعادة التشغيل عند تغيير هذه الخصائص

  // --- منطق السحب ---
  const moveColumn = useCallback((dragIndex, hoverIndex) => {
    setColumns((prevColumns) => {
      const dragColumn = prevColumns[dragIndex];
      const newColumns = [...prevColumns];
      newColumns.splice(dragIndex, 1);
      newColumns.splice(hoverIndex, 0, dragColumn);
      return newColumns;
    });
  }, []);

  const mergedColumns = columns.map((col, index) => {
    let columnWidth = col.width;
    if (useDynamicWidths && !col.width && dataSource && dataSource.length > 0) {
      const optimizedCol = applyOptimalWidth(col, dataSource);
      columnWidth = optimizedCol.width;
    }
    
    return {
      ...col,
      width: columnWidth,
      align: col.align,
      onHeaderCell: (column) => ({
        id: column.key || column.dataIndex,
        index: index,
        moveColumn: moveColumn,
        align: col.align,
        ...column.onHeaderCell,
      }),
    };
  });

  const components = {
    header: {
      cell: DragableHeaderCell,
    },
  };

  // الصف الخامس: تبويبات التنقل + الترحيل + معلومات الصفحة
  const renderRow5 = () => {
    // تحديد العدد الإجمالي للترحيل اليدوي
    const total = currentPagination.total !== undefined ? currentPagination.total : (dataSource?.length || 0);

    // إذا لم يكن هناك تبويبات تنقل (headerExtra) والترحيل مخفي/معطل، لا تعرض هذا الصف
    if (!headerExtra && !showPagination) return null;

    return (
      <div className="unified-row-5-container" style={{
        display: 'flex',
        justifyContent: 'flex-start', // لضمان ظهور الترقيق بجانب التبويبات وتجنب اختفائه مع التمرير
        alignItems: 'center',
        marginBottom: '8px',
        marginTop: '4px',
        flexWrap: 'wrap',
        gap: '12px',
        padding: '0 4px',
        width: '100%' // ضمان أخذ العرض الكامل 100%
      }}>
        {/* الجهة اليمنى (في العربية): تبويبات التنقل أو العناصر الإضافية */}
        <div className="unified-row-5-right-content" style={{ flex: '1', minWidth: '200px' }}>
          {headerExtra}
        </div>

        {/* الجهة اليسرى (في العربية): أدوات التحكم في الترحيل */}
        <div className="unified-row-5-left-content" style={{ flexShrink: 0 }}>
          {showPagination && (
            <Pagination
              {...currentPagination}
              total={total}
              onChange={(page, pageSize) => {
                const newPagination = { ...currentPagination, current: page, pageSize };
                if (onPaginationChange) onPaginationChange(newPagination);
              }}
              style={{ margin: 0 }}
              showSizeChanger={currentPagination.showSizeChanger}
            />
          )}
        </div>
      </div>
    );
  };

  const tableElement = (
    <div ref={tableContainerRef} className="unified-table-wrapper">
      <Table
        ref={(node) => {
          tableRef.current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
        }}
        components={components}
        dataSource={dataSource}
        columns={mergedColumns}
        rowKey={rowKey}
        // عرض الصف الخامس دائمًا عبر خاصية title. الدالة renderRow5() تتعامل مع منطق الإخفاء إذا كان فارغًا.
        title={() => renderRow5()}
        summary={summary}
        rowSelection={onRowSelection ? {
          selectedRowKeys,
          onChange: (selectedKeys, selectedRows) => {
            setSelectedRowKeys(selectedKeys);
            onRowSelection(selectedKeys, selectedRows);
          },
          selections: true,
        } : undefined}
        pagination={isVirtualized ? false : {
          ...currentPagination,
          position: ['bottomRight'], // تحكم صارم: الأسفل فقط عبر منطق AntD الداخلي
          onChange: (page, pageSize) => {
            const newPagination = { ...currentPagination, current: page, pageSize };
            if (onPaginationChange) onPaginationChange(newPagination);
          },
        }}
        scroll={defaultScroll}
        virtual={isVirtualized}
        size={size}
        className="unified-table"
        {...restProps}
      />
    </div>
  );

  return (
    <div className="unified-table-container">
      {/* الصف 4: شريط التمرير العلوي */}
      {showHorizontalScrollbars && (
        <SynchronizedHorizontalScrollbar ref={topScrollRef} position="top" />
      )}

      {/* الصفوف 5، 6، 7 داخل عنصر الجدول */}
      {tableElement}

      {/* الصف 3 السفلي: تكرار الترحيل يتم التعامل معه عبر موضع 'bottomRight' للجدول */}
      {showHorizontalScrollbars && (
        <SynchronizedHorizontalScrollbar ref={bottomScrollRef} position="bottom" />
      )}
    </div>
  );
});

export default UnifiedTable;