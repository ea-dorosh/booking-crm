import { Category, ChevronRight } from "@mui/icons-material";
import { Box, Typography, Card, Grid, Paper, CardActionArea, Chip } from "@mui/material";
import { useMemo } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { subCategoryStatusEnum } from '@/enums/enums';

export default function SubCategoriesList({
  subCategories, categories,
}) {
  if (!subCategories || subCategories.length === 0) {
    return (
      <Paper
        sx={{
          padding: 6,
          textAlign: `center`,
          backgroundColor: `grey.50`,
          border: `2px dashed`,
          borderColor: `grey.300`,
        }}
      >
        <Category
          sx={{
            fontSize: 60,
            color: `grey.400`,
            marginBottom: 2,
          }}
        />

        <Typography
          variant="h6"
          color="text.secondary"
          sx={{ marginBottom: 1 }}
        >
          No sub-categories found
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ marginBottom: 3 }}
        >
          Get started by adding your first sub-category
        </Typography>

        <RouterLink
          to="/sub-categories/create-sub-category"
          style={{ textDecoration: `none` }}
        >
          <Box
            component="span"
            sx={{
              display: `inline-block`,
              px: 2,
              py: 1,
              borderRadius: 1,
              backgroundColor: `primary.main`,
              color: `primary.contrastText`,
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Add First Sub-Category
          </Box>
        </RouterLink>
      </Paper>
    );
  }

  const groupedSubCategories = useMemo(() => {
    if (!subCategories || !categories) return {};
    const grouped = {};
    subCategories.forEach((subCategory) => {
      const categoryId = subCategory.categoryId;
      const category = categories.find((cat) => cat.id === categoryId);
      const categoryName = category?.name || `Category ${categoryId}`;
      if (!grouped[categoryId]) {
        grouped[categoryId] = {
          categoryName,
          items: [],
        };
      }
      grouped[categoryId].items.push(subCategory);
    });
    return grouped;
  }, [subCategories, categories]);

  return (
    <Box
      sx={{
        padding: {
          xs: 0,
          md: 0,
        },
      }}
    >
      {Object.entries(groupedSubCategories).map(([categoryId, categoryData]) => (
        <Box
          key={categoryId}
          sx={{ mb: 4 }}
        >
          <Box
            sx={{ mb: 2 }}
          >
            <Typography
              variant="h5"
              sx={{
                fontWeight: 600,
                mb: 0.5,
              }}
            >
              {categoryData.categoryName}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
            >
              {categoryData.items.length} sub-categories
            </Typography>
          </Box>

          <Grid
            container
            spacing={{
              xs: 2,
              sm: 3,
            }}
            sx={{
              px: {
                xs: 1,
                sm: 0,
              },
            }}
          >
            {categoryData.items.map((subCategory) => (
              <Grid
                item
                xs={12}
                sm={6}
                md={4}
                key={subCategory.id}
              >
                <Card
                  sx={{
                    height: `100%`,
                    width: `100%`,
                    minWidth: 0,
                    display: `flex`,
                    transition: `all 0.2s ease-in-out`,
                    '&:hover': {
                      transform: `translateY(-2px)`,
                      boxShadow: `0 4px 12px rgba(0,0,0,0.15)`,
                    },
                  }}
                >
                  <CardActionArea
                    component={RouterLink}
                    to={`/sub-categories/${subCategory.id}`}
                    sx={{
                      display: `flex`,
                      alignItems: `center`,
                      gap: 2,
                      p: 2,
                      width: `100%`,
                      minWidth: 0,
                    }}
                  >
                    <Box
                      sx={{
                        width: `clamp(44px, 18vw, 72px)`,
                        height: `clamp(44px, 18vw, 72px)`,
                        borderRadius: 2,
                        overflow: `hidden`,
                        border: `3px solid`,
                        borderColor: `primary.50`,
                        flexShrink: 0,
                      }}
                    >
                      <img
                        src={subCategory.image}
                        alt={subCategory.name}
                        style={{
                          width: `100%`,
                          height: `100%`,
                          objectFit: `cover`,
                        }}
                      />
                    </Box>

                    <Box
                      sx={{
                        flex: 1,
                        minWidth: 0,
                        display: `flex`,
                        flexDirection: `column`,
                        alignItems: `flex-start`,
                      }}
                    >
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 600,
                          color: `text.primary`,
                          whiteSpace: `normal`,
                          overflowWrap: `anywhere`,
                          wordBreak: `break-word`,
                        }}
                      >
                        {subCategory.name}
                      </Typography>
                      {subCategory.status && (
                        <Chip
                          label={subCategory.status === subCategoryStatusEnum.disabled ? `not active` : subCategory.status === subCategoryStatusEnum.archived ? `deleted` : subCategory.status}
                          size="small"
                          color={subCategory.status === subCategoryStatusEnum.active ? `success` : subCategory.status === subCategoryStatusEnum.disabled ? `info` : `error`}
                          variant="filled"
                          sx={{ mt: 0.75 }}
                        />
                      )}
                    </Box>

                    <ChevronRight
                      sx={{
                        color: `grey.500`,
                        flexShrink: 0,
                      }}
                    />
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      ))}
    </Box>
  );
}
