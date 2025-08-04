import { Add } from "@mui/icons-material";
import { Button } from "@mui/material";
import { Link as RouterLink } from 'react-router-dom';

export default function AddButton({ activeTab, tabs }) {
  const currentTab = tabs[activeTab];

  if (!currentTab) {
    return null;
  }

  return (
    <Button
      component={RouterLink}
      to={currentTab.url}
      variant="contained"
      startIcon={<Add />}
      sx={{
        borderRadius: 2,
        textTransform: 'none',
        fontWeight: 500,
        padding: '8px 16px',
        fontSize: '0.875rem',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        '&:hover': {
          boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
        }
      }}
    >
      {currentTab.buttonText}
    </Button>
  );
}
