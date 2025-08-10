import { Edit } from "@mui/icons-material";
import {
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  Grid,
} from "@mui/material";

export default function SubCategoryDetails({
  subCategory,
  serviceCategories,
  onEditClick,
}) {
  const categoryName = serviceCategories?.find(cat => cat.id === subCategory.categoryId)?.name || '-';

  return (
    <Card sx={{ marginTop: 1, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
      <CardContent sx={{ padding: 2.5 }}>
        {/* Header with Edit Button */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 2,
          paddingBottom: 1.5,
          borderBottom: '1px solid',
          borderColor: 'grey.100'
        }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, marginBottom: 0.5, color: 'text.primary' }}>
              {subCategory.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {categoryName}
            </Typography>
          </Box>

          <Button
            variant="contained"
            startIcon={<Edit sx={{ fontSize: '16px' }} />}
            onClick={onEditClick}
            sx={{
              borderRadius: 1.5,
              padding: '6px 12px',
              fontSize: '0.8rem',
              fontWeight: 600,
              textTransform: 'none',
              minWidth: 'auto',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              }
            }}
          >
            Edit
          </Button>
        </Box>

        {/* Details Grid */}
        <Grid container spacing={1.5}>
          {/* Image */}
          {subCategory.image && (
            <Grid item xs={12}>
              <Box
                sx={{
                  width: '100%',
                  maxWidth: 'clamp(140px, 40vw, 240px)',
                  mx: 'auto',
                  borderRadius: 2,
                  overflow: 'hidden',
                  border: '1px solid',
                  borderColor: 'grey.100',
                  backgroundColor: 'grey.50',
                }}
              >
                <img
                  src={subCategory.image}
                  alt={subCategory.name}
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                />
              </Box>
            </Grid>
          )}

          {/* Category */}
          <Grid item xs={12}>
            <Box sx={{
              padding: 1.5,
              backgroundColor: 'grey.50',
              borderRadius: 1.5,
              border: '1px solid',
              borderColor: 'grey.100'
            }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ marginBottom: 0.25, fontWeight: 600, fontSize: '0.75rem' }}>
                Category
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                {categoryName}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

