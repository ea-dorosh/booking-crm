import { Business } from "@mui/icons-material";
import { Box, Typography, Card, CardContent, Grid, Paper, Button } from "@mui/material";
import { Link as RouterLink } from 'react-router-dom';

export default function CategoriesList({ categories }) {
  if (!categories || categories.length === 0) {
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
        <Business sx={{ fontSize: 60, color: 'grey.400', marginBottom: 2 }} />
        <Typography variant="h6" color="text.secondary" sx={{ marginBottom: 1 }}>
          No categories found
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ marginBottom: 3 }}>
          Get started by adding your first category
        </Typography>
        <Button
          component={RouterLink}
          to="/categories/create-category"
          variant="contained"
          size="small"
        >
          Add First Category
        </Button>
      </Paper>
    );
  }

  return (
    <Grid container spacing={3} sx={{ padding: { xs: 0, md: 0 } }}>
      {categories.map((category) => (
        <Grid item xs={12} sm={6} md={4} key={category.id}>
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
              {/* Category Image */}
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
                  src={category.image}
                  alt={category.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              </Box>

              {/* Category Name */}
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  marginBottom: 1,
                  color: 'text.primary'
                }}
              >
                {category.name}
              </Typography>

              {/* Action Button */}
              <Box sx={{ marginTop: 'auto' }}>
                <Button
                  component={RouterLink}
                  to={`/categories/${category.id}`}
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
      ))}
    </Grid>
  );
}
