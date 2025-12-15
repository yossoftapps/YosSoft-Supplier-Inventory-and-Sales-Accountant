import React from 'react';
import '../assets/styles/unified-styles.css';

const SynchronizedHorizontalScrollbar = ({ 
  position = 'top', 
  className = '',
  ...restProps 
}) => {
  return (
    <div 
      className={`synchronized-scrollbar synchronized-scrollbar-${position} ${className}`}
      {...restProps}
    >
      <div className="synchronized-scrollbar-content"></div>
    </div>
  );
};

export default SynchronizedHorizontalScrollbar;