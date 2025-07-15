import { AddCircle } from "@mui/icons-material";
import { IconButton, Typography, Box } from "@mui/material";
import { Link as RouterLink } from 'react-router-dom';

export default function AddButton({ activeTab, tabs }) {
  const currentTab = tabs[activeTab];

  if (!currentTab) {
    return null;
  }

  return (
    <Box
      sx={{
        display: `flex`,
        alignItems: `center`,
        marginTop: `20px`,
        marginLeft: `auto`,
        backgroundColor: `#1976d2`,
        width: `fit-content`,
        padding: `10px 20px 10px 30px`,
        borderRadius: `50px`,
      }}
    >
      <Typography
        variant="button"
        sx={{ color: `#fff` }}
      >
        {currentTab.buttonText}
      </Typography>

      <RouterLink to={currentTab.url}>
        <IconButton
          sx={{ color: `#fff` }}
        >
          <AddCircle />
        </IconButton>
      </RouterLink>
    </Box>
  );
}
