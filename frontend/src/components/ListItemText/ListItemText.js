import { ListItemText as MuiListItemText } from "@mui/material";

export default function ListItemText({
  value,
  label,
}) {
  return <MuiListItemText
    primary={value ? value : `-`}
    secondary={label}
    sx={{
      flex: `0 0 200px`,
      display: `flex`,
      flexDirection: `column-reverse`,
    }}
  />;
}