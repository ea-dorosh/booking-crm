import { Category } from "@mui/icons-material";
import { Box, Typography, Card, CardContent, Grid, Paper, Button, Chip } from "@mui/material";
import { Link as RouterLink } from 'react-router-dom';

export default function SubCategoriesList({ subCategories, categories }) {
  if (!subCategories || subCategories.length === 0) {
    return (
      <Paper
        sx={{
          padding: 6,
          textAlign: 'center',
          backgroundColor: 'grey.50',
          border: '2px dashed',
          borderColor: 'grey.300',
        }}
      >
        <Category sx={{ fontSize: 60, color: 'grey.400', marginBottom: 2 }} />
        <Typography variant="h6" color="text.secondary" sx={{ marginBottom: 1 }}>
          No sub-categories found
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ marginBottom: 3 }}>
          Get started by adding your first sub-category
        </Typography>
        <Button
          component={RouterLink}
          to="/sub-categories/create-sub-category"
          variant="contained"
          size="small"
        >
          Add First Sub-Category
        </Button>
      </Paper>
    );
  }

  return (
    <Grid container spacing={3} sx={{ padding: { xs: 0, md: 0 } }}>
      {subCategories.map((subCategory) => {
        const category = categories?.find(cat => cat.id === subCategory.categoryId);
        return (
          <Grid item xs={12} sm={6} md={4} key={subCategory.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                }
              }}
            >
              <CardContent sx={{
                padding: 2.5,
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center'
              }}>
                {/* Sub-Category Image */}
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    marginBottom: 2,
                    borderRadius: 2,
                    overflow: 'hidden',
                    border: '3px solid',
                    borderColor: 'primary.50',
                  }}
                >
                  <img
                    src={subCategory.image}
                    alt={subCategory.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                </Box>

                {/* Sub-Category Name */}
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    marginBottom: 1,
                    color: 'text.primary'
                  }}
                >
                  {subCategory.name}
                </Typography>

                {/* Category Chip */}
                <Chip
                  label={category?.name || 'No category'}
                  size="small"
                  variant="outlined"
                  sx={{
                    marginBottom: 2,
                    borderColor: 'primary.200',
                    color: 'primary.600',
                    backgroundColor: 'primary.50'
                  }}
                />

                {/* Action Button */}
                <Box sx={{ marginTop: 'auto' }}>
                  <Button
                    component={RouterLink}
                    to={`/sub-categories/${subCategory.id}`}
                    variant="outlined"
                    size="small"
                    sx={{
                      borderRadius: 2,
                      borderColor: 'primary.200',
                      color: 'primary.600',
                      '&:hover': {
                        borderColor: 'primary.400',
                        backgroundColor: 'primary.50',
                      }
                    }}
                  >
                    View Details
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
}
