import React from 'react';
import '../assets/styles/unified-styles.css';

const SynchronizedHorizontalScrollbar = React.forwardRef(({
  position = 'top',
  className = '',
  ...restProps
}, ref) => {
  return (
    <div
      ref={ref}
      className={`synchronized-scrollbar synchronized-scrollbar-${position} ${className}`}
      {...restProps}
    >
      <div className="synchronized-scrollbar-content"></div>
    </div>
  );
});

export default SynchronizedHorizontalScrollbar;