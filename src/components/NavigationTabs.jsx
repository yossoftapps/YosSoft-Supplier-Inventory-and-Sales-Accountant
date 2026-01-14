import React from 'react';
import { Radio } from 'antd';

const NavigationTabs = ({
  value, // القيمة المحددة
  onChange, // دالة تغيير الحالة
  tabs, // مصفوفة علامات التبويب
  style = {}, // نمط العرض
  size = 'middle' // حجم المكون
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