import React, { useState, useCallback, useRef, forwardRef, useEffect } from 'react';
import { Table } from 'antd';
import { Resizable } from 'react-resizable';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import SynchronizedHorizontalScrollbar from './SynchronizedHorizontalScrollbar';
import '../assets/styles/unified-styles.css';
import '../assets/styles/unified-table-extra.css'; // Import the new CSS

// --- Resizable Header Component ---
const ResizableTitle = (props) => {
  const { onResize, width, ...restProps } = props;

  if (!width) {
    return <th {...restProps} />;
  }

  return (
    <Resizable
      width={width}
      height={0} // Height doesn't matter for column resizing
      onResize={onResize}
      draggableOpts={{ enableUserSelectHack: false }}
    >
      <th {...restProps} />
    </Resizable>
  );
};

// --- Draggable Header Component ---
const DragableHeaderCell = ({ id, index, moveColumn, children, ...restProps }) => {
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

      // Only perform the move when the mouse has crossed half of the items width
      // This logic helps prevent flickering during drag operations
      // For RTL, we need to consider the direction of the hoverX
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

  return (
    <th
      ref={ref}
      style={{ opacity, cursor: 'grab' }} // Add grab cursor for draggable columns
      data-handler-id={handlerId}
      {...restProps}
    >
      {children}
    </th>
  );
};


const UnifiedTable = forwardRef(({
  dataSource,
  columns: initialColumns, // Rename to initialColumns
  rowKey,
  title,
  summary,
  pagination,
  scroll,
  size = 'small',
  virtualized = false,
  showHorizontalScrollbars = true,
  ...restProps
}, ref) => {
  const tableRef = useRef(null);
  const [columns, setColumns] = useState(initialColumns);

  // Update columns when initialColumns prop changes (e.g., from parent)
  useEffect(() => {
    setColumns(initialColumns);
  }, [initialColumns]);

  // Default pagination settings
  const defaultPagination = {
    position: ['topRight', 'bottomRight'],
    pageSize: 100,
    showSizeChanger: true,
    pageSizeOptions: ['25', '50', '100', '200'],
    showTotal: (total, range) => `${range[0]}-${range[1]} من ${total} عنصر`,
    ...pagination
  };

  // Default scroll settings
  const defaultScroll = {
    x: 1500,
    y: 600,
    ...scroll
  };

  // --- Resizing Logic ---
  const handleResize = useCallback(
    (index) => (e, { size }) => {
      setColumns((prevColumns) => {
        const nextColumns = [...prevColumns];
        nextColumns[index] = {
          ...nextColumns[index],
          width: size.width,
        };
        return nextColumns;
      });
    },
    []
  );

  // --- Dragging Logic ---
  const moveColumn = useCallback(
    (dragIndex, hoverIndex) => {
      setColumns((prevColumns) => {
        const dragColumn = prevColumns[dragIndex];
        const newColumns = [...prevColumns];
        newColumns.splice(dragIndex, 1); // Remove the dragged column
        newColumns.splice(hoverIndex, 0, dragColumn); // Insert it at the new position
        return newColumns;
      });
    },
    []
  );

  // Map columns to include resizing and dragging props
  const mergedColumns = columns.map((col, index) => {
    // Only make columns resizable if they have a width defined
    const resizableProps = col.width ? {
      width: col.width,
      onResize: handleResize(index),
    } : {};

    return {
      ...col,
      onHeaderCell: (column) => ({
        ...resizableProps, // Spread resizable props if applicable
        id: column.key || column.dataIndex, // Unique ID for draggable
        index: index,
        moveColumn: moveColumn,
        ...column.onHeaderCell, // Preserve existing onHeaderCell props if any
      }),
    };
  });

  // Define custom components for the Ant Design Table
  const components = {
    header: {
      cell: (props) => {
        // We need to pass the resizable and draggable props to the custom cell
        const { onResize, width, id, index, moveColumn, ...restProps } = props;
        
        // Render DragableHeaderCell which then wraps ResizableTitle
        return (
          <DragableHeaderCell id={id} index={index} moveColumn={moveColumn} {...restProps}>
            {/* Only make title resizable if width is provided */}
            <ResizableTitle onResize={onResize} width={width} {...restProps}>
                {restProps.children}
            </ResizableTitle>
          </DragableHeaderCell>
        );
      },
    },
  };


  // If virtualized is enabled and we have sufficient data, use virtual scrolling
  if (virtualized && dataSource && dataSource.length > 1000) {
    const tableElement = (
      <Table
        ref={(node) => {
          tableRef.current = node;
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
        }}
        components={components} // Use custom components
        dataSource={dataSource}
        columns={mergedColumns} // Use mergedColumns
        rowKey={rowKey}
        title={() => title && <strong className="unified-table-title">{title}</strong>}
        summary={summary}
        pagination={false}
        scroll={{ ...defaultScroll, y: 800 }}
        size={size}
        className="unified-table"
        {...restProps}
      />
    );
    
    if (showHorizontalScrollbars) {
      return (
        <DndProvider backend={HTML5Backend}> {/* Wrap with DndProvider */}
          <SynchronizedHorizontalScrollbar position="top" />
          {tableElement}
          <SynchronizedHorizontalScrollbar position="bottom" />
        </DndProvider>
      );
    }
    
    return (
        <DndProvider backend={HTML5Backend}> {/* Wrap with DndProvider */}
            {tableElement}
        </DndProvider>
    );
  }

  // Default rendering for smaller datasets
  const tableElement = (
    <Table
      ref={(node) => {
        tableRef.current = node;
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      }}
      components={components} // Use custom components
      dataSource={dataSource}
      columns={mergedColumns} // Use mergedColumns
      rowKey={rowKey}
      title={() => title && <strong className="unified-table-title">{title}</strong>}
      summary={summary}
      pagination={defaultPagination}
      scroll={defaultScroll}
      size={size}
      className="unified-table"
      {...restProps}
    />
  );
  
  if (showHorizontalScrollbars) {
    return (
      <DndProvider backend={HTML5Backend}> {/* Wrap with DndProvider */}
        <SynchronizedHorizontalScrollbar position="top" />
        {tableElement}
        <SynchronizedHorizontalScrollbar position="bottom" />
      </DndProvider>
    );
  }
  
  return (
    <DndProvider backend={HTML5Backend}> {/* Wrap with DndProvider */}
      {tableElement}
    </DndProvider>
  );
});

export default UnifiedTable;