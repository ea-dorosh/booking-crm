import { Business, ChevronRight } from "@mui/icons-material";
import { Box, Typography, Card, Grid, Paper, CardActionArea, Chip } from "@mui/material";
import React from 'react';
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
        <RouterLink to="/categories/create-category" style={{ textDecoration: `none` }}>
          <Box
            component="span"
            sx={{
              display: `inline-block`,
              px: 2,
              py: 1,
              borderRadius: 1,
              backgroundColor: 'primary.main',
              color: 'primary.contrastText',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Add First Category
          </Box>
        </RouterLink>
      </Paper>
    );
  }

  return (
    <Grid
      container
      spacing={{ xs: 2, sm: 3 }}
      sx={{ px: { xs: 1, sm: 0 } }}
    >
      {categories.map((category) => (
        <Grid item xs={12} sm={6} md={4} key={category.id}>
          <Card
            sx={{
              height: '100%',
              width: '100%',
              minWidth: 0,
              display: 'flex',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }
            }}
          >
            <CardActionArea
              component={RouterLink}
              to={`/categories/${category.id}`}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                p: 2,
                width: '100%',
                minWidth: 0,
              }}
            >
              <Box
                sx={{
                  width: 'clamp(44px, 18vw, 72px)',
                  height: 'clamp(44px, 18vw, 72px)',
                  borderRadius: 2,
                  overflow: 'hidden',
                  border: '3px solid',
                  borderColor: 'primary.50',
                  flexShrink: 0,
                }}
              >
                <img
                  src={category.image}
                  alt={category.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </Box>

              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    color: 'text.primary',
                    whiteSpace: 'normal',
                    overflowWrap: 'anywhere',
                    wordBreak: 'break-word',
                  }}
                >
                  {category.name}
                </Typography>

                {category.status && (
                  <Chip
                    label={category.status}
                    size="small"
                    color={String(category.status).toLowerCase() === 'active' ? 'success' : undefined}
                    variant={String(category.status).toLowerCase() === 'active' ? 'filled' : 'outlined'}
                    sx={String(category.status).toLowerCase() !== 'active' ? {
                      mt: 0.75,
                      fontWeight: 600,
                      height: 22,
                      backgroundColor: 'grey.100',
                      color: 'text.secondary',
                    } : { mt: 0.75, fontWeight: 700, height: 22 }}
                  />
                )}
              </Box>

              <ChevronRight sx={{ color: 'grey.500', flexShrink: 0 }} />

            </CardActionArea>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
