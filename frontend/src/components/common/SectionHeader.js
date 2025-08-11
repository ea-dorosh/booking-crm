import { Typography } from "@mui/material";

const SectionHeader = ({
  title, sx = {}, 
}) => {
  return (
    <Typography
      variant="h6"
      color="text.secondary"
      sx={{
        mt: 2, mb: 1, ...sx, 
      }}
    >
      {title}
    </Typography>
  );
};

export default SectionHeader;