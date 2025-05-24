import {
  Tabs as MuiTabs,
  Tab,
  Box,
} from '@mui/material';
import { useState } from 'react';

export default function Tabs({
  tabs,
  onChange,
}) {
  const [value, setValue] = useState(tabs[0].value);

  const handleChange = (event, newValue) => {
    setValue(newValue);
    console.log(newValue);

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