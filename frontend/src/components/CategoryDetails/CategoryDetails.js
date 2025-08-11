import { Edit, DeleteOutline } from "@mui/icons-material";
import {
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
} from "@mui/material";

export default function CategoryDetails({
  category,
  onEditClick,
  onArchiveToggle,
  onDeactivateToggle,
}) {
  return (
    <Card sx={{
      marginTop: 1, borderRadius: 2, boxShadow: `0 2px 8px rgba(0,0,0,0.08)`, 
    }}>
      <CardContent sx={{ padding: 2.5 }}>
        {/* Header with Edit Button */}
        <Box sx={{
          display: `flex`,
          justifyContent: `space-between`,
          alignItems: `flex-start`,
          marginBottom: 2,
          paddingBottom: 1.5,
          borderBottom: `1px solid`,
          borderColor: `grey.100`,
        }}>
          <Box>
            <Typography variant="h4" sx={{
              fontWeight: 700, marginBottom: 0.5, color: `text.primary`, 
            }}>
              {category.name}
            </Typography>
            {category.status && (
              <Chip
                label={category.status}
                size="small"
                color={String(category.status).toLowerCase() === `active` ? `success` : undefined}
                variant={String(category.status).toLowerCase() === `active` ? `filled` : `outlined`}
                sx={String(category.status).toLowerCase() !== `active` ? {
                  fontWeight: 600,
                  height: 24,
                  backgroundColor: `grey.100`,
                  color: `text.secondary`,
                } : {
                  fontWeight: 700, height: 24, 
                }}
              />
            )}
          </Box>

          <Box sx={{
            display: `flex`, gap: 1, 
          }}>
            <Button
              variant="contained"
              startIcon={<Edit sx={{ fontSize: `16px` }} />}
              onClick={onEditClick}
              sx={{
                borderRadius: 1.5,
                padding: `6px 12px`,
                fontSize: `0.8rem`,
                fontWeight: 600,
                textTransform: `none`,
                minWidth: `auto`,
                boxShadow: `0 2px 8px rgba(0,0,0,0.15)`,
                '&:hover': {
                  boxShadow: `0 4px 12px rgba(0,0,0,0.2)`,
                },
              }}
            >
              Edit
            </Button>
          </Box>
        </Box>

        <Box sx={{
          display: `flex`, gap: 2, alignItems: `center`, mt: 2, justifyContent: `space-between`, 
        }}>
          <Button
            variant="outlined"
            color={String(category.status).toLowerCase() === `disabled` ? `success` : `warning`}
            onClick={onDeactivateToggle}
            sx={{
              borderRadius: 1.5,
              padding: `6px 12px`,
              fontSize: `0.8rem`,
              fontWeight: 600,
              textTransform: `none`,
              minWidth: `auto`,
            }}
          >
            {String(category.status).toLowerCase() === `disabled` ? `Activate` : `Deactivate`}
          </Button>

          <Button
            variant="outlined"
            startIcon={<DeleteOutline sx={{ fontSize: `16px` }} />}
            color={String(category.status).toLowerCase() === `archived` ? `success` : `error`}
            onClick={onArchiveToggle}
            sx={{
              borderRadius: 1.5,
              padding: `6px 12px`,
              fontSize: `0.8rem`,
              fontWeight: 600,
              textTransform: `none`,
              minWidth: `auto`,
            }}
          >
            {String(category.status).toLowerCase() === `archived` ? `Unarchive` : `Archive`}
          </Button>
        </Box>

        {/* Details Grid */}
        <Grid container spacing={1.5}>
          {/* Image Preview */}
          {category.image && (
            <Grid item xs={12}>
              <Box
                sx={{
                  width: `100%`,
                  maxWidth: `clamp(140px, 40vw, 240px)`,
                  mx: `auto`,
                  borderRadius: 2,
                  overflow: `hidden`,
                  border: `1px solid`,
                  borderColor: `grey.100`,
                  backgroundColor: `grey.50`,
                }}
              >
                <img
                  src={category.image}
                  alt={category.name}
                  style={{
                    width: `100%`, height: `auto`, display: `block`, 
                  }}
                />
              </Box>
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  );
}

