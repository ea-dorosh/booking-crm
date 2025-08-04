import { Person } from "@mui/icons-material";
import {
  Typography,
  Card,
  CardContent,
} from "@mui/material";

export default function EmployeeNotFound() {
  return (
    <Card sx={{ marginTop: 2, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
      <CardContent sx={{ padding: 4, textAlign: 'center' }}>
        <Person sx={{ fontSize: 48, color: 'grey.400', marginBottom: 1.5 }} />
        <Typography variant="h6" color="text.secondary" sx={{ marginBottom: 1, fontSize: '1.1rem' }}>
          Employee not found
        </Typography>
        <Typography variant="body2" color="text.secondary">
          The employee you&apos;re looking for doesn&apos;t exist or has been removed.
        </Typography>
      </CardContent>
    </Card>
  );
}