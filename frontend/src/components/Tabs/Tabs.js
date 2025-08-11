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
      <Box sx={{
        borderBottom: 1,
        borderColor: `divider`,
        backgroundColor: `background.paper`,
        borderRadius: 2,
        overflow: `hidden`,
        boxShadow: `0 1px 3px rgba(0,0,0,0.1)`,
      }}>
        <MuiTabs
          value={value}
          onChange={handleChange}
          sx={{
            minHeight: `48px`,
            '& .MuiTabs-indicator': {
              backgroundColor: `primary.main`,
              height: 3,
            },
            '& .MuiTabs-flexContainer': {
              gap: 0,
            },
          }}
        >
          {tabs.map((tab) => (
            <Tab
              key={tab.value}
              label={tab.label}
              value={tab.value}
              sx={{
                flex: 1,
                minHeight: `48px`,
                padding: `8px 12px`,
                fontSize: `0.875rem`,
                fontWeight: 500,
                textTransform: `none`,
                color: `text.secondary`,
                borderBottom: `2px solid transparent`,
                transition: `all 0.2s ease-in-out`,
                wordBreak: `break-word`,
                whiteSpace: `normal`,
                lineHeight: 1.2,
                '&.Mui-selected': {
                  color: `primary.main`,
                },
                '&:hover': {
                  backgroundColor: `action.hover`,
                  color: `primary.main`,
                },
                '&.Mui-focusVisible': {
                  backgroundColor: `action.focus`,
                },
              }}
            />
          ))}
        </MuiTabs>
      </Box>
    </Box>
  );
}
