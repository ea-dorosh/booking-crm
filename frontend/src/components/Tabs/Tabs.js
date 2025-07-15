import {
  Tabs as MuiTabs,
  Tab,
  Box,
} from '@mui/material';
import { useState } from 'react';

export default function Tabs({
  tabs,
  onChange,
  activeTab,
}) {
  const [internalValue, setInternalValue] = useState(tabs[0].value);

  // Use external activeTab if provided, otherwise use internal state
  const value = activeTab !== undefined ? activeTab : internalValue;

  const handleChange = (_event, newValue) => {
    if (activeTab === undefined) {
      setInternalValue(newValue);
    }

    if (onChange) {
      onChange(newValue);
    }
  };

  return (
    <Box sx={{ width: `100%` }}>
      <Box sx={{ borderBottom: 1, borderColor: `divider` }}>
        <MuiTabs value={value} onChange={handleChange}>
          {tabs.map((tab) => (
            <Tab
              key={tab.value}
              label={tab.label}
              value={tab.value}
              sx={{
                width: `${100 / tabs.length}%`,
              }}
            />
          ))}
        </MuiTabs>
      </Box>
    </Box>
  );
}
