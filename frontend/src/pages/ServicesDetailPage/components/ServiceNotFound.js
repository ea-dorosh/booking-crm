import { Business } from "@mui/icons-material";
import {
  Box,
  Button,
  Typography,
  Paper,
} from "@mui/material";
import GoBackNavigation from '@/components/GoBackNavigation/GoBackNavigation';

export default function ServiceNotFound({ onBackToServices }) {
  return (
    <Box sx={{ padding: { xs: 2, md: 3 } }}>
      <GoBackNavigation />
      <Paper
        sx={{
          padding: 6,
          textAlign: 'center',
          backgroundColor: 'grey.50',
          border: '2px dashed',
          borderColor: 'grey.300',
          marginTop: 2,
        }}
      >
        <Business sx={{ fontSize: 60, color: 'grey.400', marginBottom: 2 }} />
        <Typography variant="h6" color="text.secondary" sx={{ marginBottom: 1 }}>
          Service not found
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ marginBottom: 3 }}>
          The service you&apos;re looking for doesn&apos;t exist
        </Typography>
        <Button
          variant="contained"
          onClick={onBackToServices}
          size="small"
        >
          Back to Services
        </Button>
      </Paper>
    </Box>
  );
}