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
  sx,
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
    <Box
      sx={{
        width: `100%`,
        ...sx,
      }}
    >
      <Box
        sx={{
          borderBottom: 1,
          borderColor: `divider`,
          backgroundColor: `background.paper`,
          borderRadius: 2,
          overflow: `hidden`,
          boxShadow: `0 1px 3px rgba(0,0,0,0.1)`,
        }}
      >
        <MuiTabs
          value={value}
          onChange={handleChange}
          sx={{
            minHeight: `30px`,
            '& .MuiTabs-indicator': {
              height: 2.5,
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
                minHeight: `30px`,
                padding: `4px 8px`,
                fontSize: `0.875rem`,
                fontWeight: 500,
                textTransform: `none`,
                color: `text.secondary`,
                borderBottom: `2px solid transparent`,
                transition: `all 0.2s ease-in-out`,
                wordBreak: `break-word`,
                whiteSpace: `normal`,
                maxWidth: `50%`,
                lineHeight: 1.2,
                '&.Mui-selected': {
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
