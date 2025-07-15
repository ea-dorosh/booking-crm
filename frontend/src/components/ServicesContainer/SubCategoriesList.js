import { Box, Typography } from "@mui/material";
import { Link as RouterLink } from 'react-router-dom';

export default function SubCategoriesList({ subCategories, categories }) {
  if (!subCategories || subCategories.length === 0) {
    return (
      <Box sx={{ padding: '2rem', textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          No sub categories found
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
      {subCategories.map((subCategory) => {
        const category = categories?.find(cat => cat.id === subCategory.categoryId);
        return (
          <Box
            key={subCategory.id}
            component={RouterLink}
            to={`/sub-categories/${subCategory.id}`}
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
            <Box>
              <Typography sx={{
                fontSize: `1.1rem`,
                fontWeight: `bold`,
              }}>
                {subCategory.name}
              </Typography>

              <Typography sx={{
                fontSize: `1rem`,
              }}>
                {category?.name || `No category`}
              </Typography>
            </Box>

            <Box
              sx={{
                width: `60px`,
                height: `60px`,
                overflow: `hidden`,
              }}
            >
              <img
                src={subCategory.image}
                style={{ width: `100%` }}
                alt={subCategory.name}
              />
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
