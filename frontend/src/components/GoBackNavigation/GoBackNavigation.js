import {
  ArrowBack,
} from '@mui/icons-material';
import {
  Button,
  Box,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function GoBackNavigation() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{ marginBottom: 2 }}>
      <Button
        onClick={() => navigate(-1)}
        startIcon={<ArrowBack
          sx={{ fontSize: `18px` }} />}
        variant="outlined"
        size="small"
        sx={{
          borderRadius: 2,
          padding: `6px 12px`,
          fontSize: `0.85rem`,
          fontWeight: 500,
          textTransform: `none`,
          color: `text.primary`,
          borderColor: `grey.300`,
          backgroundColor: `white`,
          '&:hover': {
            backgroundColor: `grey.50`,
            borderColor: `grey.400`,
            transform: `translateX(-2px)`,
          },
          transition: `all 0.2s ease-in-out`,
          minWidth: `auto`,
        }}
      >
        Go back
      </Button>
    </Box>
  );
}
