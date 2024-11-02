import {
  ArrowBackIosNew,
} from '@mui/icons-material';
import { 
  Typography,
  Box,
  Divider,
} from "@mui/material";
import { useNavigate } from "react-router-dom";


export default function GoBackNavigation() {
  const navigate = useNavigate();

  return (
    <Box>
      <Typography
        onClick={() => navigate(-1)}
        sx={{
          display: `flex`,
          alignItems: `center`,
          gap: `.4rem`,
          cursor: `pointer`,
        }}
      >
        <ArrowBackIosNew /> Go back
      </Typography>

      <Divider sx={{
        marginTop: 1,
        marginBottom: 1,
      }}/>
    </Box>
  );
}
