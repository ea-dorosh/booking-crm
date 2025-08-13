import { Add } from "@mui/icons-material";
import { Button } from "@mui/material";
import { Link as RouterLink } from 'react-router-dom';

export default function AddButton({
  to,
  children = `Add Item`,
  icon: Icon = Add,
  size = `small`,
  ...props
}) {
  return (
    <Button
      component={RouterLink}
      to={to}
      variant="contained"
      size={size}
      startIcon={<Icon sx={{ fontSize: `16px` }} />}
      {...props}
    >
      {children}
    </Button>
  );
}
