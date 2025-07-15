import { Box, Typography } from "@mui/material";
import { Link as RouterLink } from 'react-router-dom';

export default function ServicesList({ services }) {
  if (!services || services.length === 0) {
    return (
      <Box sx={{ padding: '2rem', textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          No services found
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: `flex`,
        flexDirection: `column`,
        gap: `.5rem`,
        marginTop: `2rem`,
        maxWidth: `768px`,
      }}
    >
      {services.map((service) => (
        <Box
          key={service.id}
          component={RouterLink}
          to={`/services/${service.id}`}
          sx={{
            display: `flex`,
            alignItems: `flex-start`,
            justifyContent: `space-between`,
            width: `100%`,
            gap: `1rem`,
            padding: `.4rem 0 .4rem 0`,
            borderBottom: `1px solid #ddd`,
            textDecoration: `none`,
            color: `#333`,
            position: `relative`,
          }}
        >
          <Box>
            <Typography sx={{
              fontSize: `1.1rem`,
              fontWeight: `bold`,
            }}>
              {service.name}
            </Typography>

            <Typography sx={{
              fontSize: `1rem`,
            }}>
              {service.subCategoryName}
            </Typography>
          </Box>
        </Box>
      ))}
    </Box>
  );
}
