import { AddCircle } from "@mui/icons-material";
import { Button } from "@mui/material";
import { Link as RouterLink } from 'react-router-dom';

export default function AddButton({
  to,
  children = `Add Item`,
  icon: Icon = AddCircle,
  ...props
}) {
  return (
    <Button
      component={RouterLink}
      to={to}
      variant="contained"
      startIcon={<Icon
        sx={{ fontSize: `16px` }} />}
      size="small"
      sx={{
        borderRadius: 1,
        padding: `4px 8px`,
        fontSize: `0.75rem`,
        fontWeight: 500,
        textTransform: `none`,
        minWidth: `auto`,
        height: `auto`,
        backgroundColor: `primary.500`,
        color: `white`,
        boxShadow: `none`,
        border: `1px solid transparent`,
        '&:hover': {
          backgroundColor: `primary.600`,
          boxShadow: `none`,
          borderColor: `primary.700`,
        },
        '&:active': {
          backgroundColor: `primary.700`,
        },
        transition: `all 0.15s ease-in-out`,
        ...props.sx,
      }}
      {...props}
    >
      {children}
    </Button>
  );
}