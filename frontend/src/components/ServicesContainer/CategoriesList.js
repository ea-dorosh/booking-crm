import { Box, Typography } from "@mui/material";
import { Link as RouterLink } from 'react-router-dom';

export default function CategoriesList({ categories }) {
  if (!categories || categories.length === 0) {
    return (
      <Box sx={{ padding: '2rem', textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          No categories found
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
      {categories.map((category) => (
        <Box
          key={category.id}
          component={RouterLink}
          to={`/categories/${category.id}`}
          sx={{
            display: `flex`,
            alignItems: `flex-start`,
            justifyContent: `space-between`,
            width: `100%`,
            minHeight: `60px`,
            textDecoration: `none`,
            color: `#333`,
            padding: `.4rem 0 .6rem 0`,
            borderBottom: `1px solid #ddd`,
          }}
        >
          <Typography sx={{
            fontSize: `1.1rem`,
          }}>
            {category.name}
          </Typography>

          <Box
            sx={{
              width: `60px`,
              height: `60px`,
              overflow: `hidden`,
            }}
          >
            <img
              src={category.image}
              style={{ width: `100%` }}
              alt={category.name}
            />
          </Box>
        </Box>
      ))}
    </Box>
  );
}
