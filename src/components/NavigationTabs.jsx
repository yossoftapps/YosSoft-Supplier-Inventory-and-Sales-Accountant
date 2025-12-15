import React from 'react';
import { Radio } from 'antd';

const NavigationTabs = ({ 
  value, 
  onChange, 
  tabs, 
  style = { marginBottom: 16 },
  size = 'middle'
}) => {
  return (
    <Radio.Group 
      value={value} 
      onChange={onChange} 
      style={style}
      size={size}
    >
      {tabs.map(tab => (
        <Radio.Button 
          key={tab.value} 
          value={tab.value}
        >
          {tab.label}
        </Radio.Button>
      ))}
    </Radio.Group>
  );
};

export default NavigationTabs;