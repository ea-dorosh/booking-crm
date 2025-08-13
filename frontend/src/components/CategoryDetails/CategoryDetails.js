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
import { categoryStatusEnum } from '@/enums/enums';

export default function CategoryDetails({
  category,
  onEditClick,
  onArchiveToggle,
  onDeactivateToggle,
}) {
  return (
    <Card
      sx={{
        marginTop: 1,
        borderRadius: 2,
        boxShadow: `0 2px 8px rgba(0,0,0,0.08)`,
      }}>
      <CardContent
        sx={{ padding: 2.5 }}>
        {/* Header with Edit Button */}
        <Box
          sx={{
            display: `flex`,
            justifyContent: `space-between`,
            alignItems: `flex-start`,
            marginBottom: 2,
            paddingBottom: 1.5,
            borderBottom: `1px solid`,
            borderColor: `grey.100`,
          }}>
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                marginBottom: 0.5,
                color: `text.primary`,
              }}>
              {category.name}
            </Typography>

            {category.status && (
              <Chip
                label={category.status === categoryStatusEnum.disabled ? `not active` : category.status === categoryStatusEnum.archived ? `deleted` : category.status}
                size="small"
                color={category.status === categoryStatusEnum.active ? `success` : category.status === categoryStatusEnum.disabled ? `info` : `error`}
                variant="filled"
              />
            )}
          </Box>

          <Box
            sx={{
              display: `flex`,
              gap: 1,
            }}>
            <Button
              variant="contained"
              size="small"
              startIcon={
                <Edit />
              }
              onClick={onEditClick}
            >
              Edit
            </Button>
          </Box>
        </Box>

        {/* Details Grid */}
        <Grid
          container
          spacing={1.5}>
          {/* Image Preview */}
          {category.image && (
            <Grid
              item
              xs={12}>
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
                    width: `100%`,
                    height: `auto`,
                    display: `block`,
                  }}
                />
              </Box>
            </Grid>
          )}
        </Grid>

        <Box
          sx={{
            display: `flex`,
            gap: 2,
            alignItems: `center`,
            mt: 2,
            justifyContent: `space-between`,
          }}>
          <Button
            disabled={category.status === categoryStatusEnum.archived}
            variant="outlined"
            color={category.status === categoryStatusEnum.disabled ? `success` : `warning`}
            onClick={onDeactivateToggle}
            size="small"
          >
            {category.status === categoryStatusEnum.disabled ? `Activate` : `Deactivate`}
          </Button>

          <Button
            variant="outlined"
            startIcon={<DeleteOutline />}
            color={category.status === categoryStatusEnum.archived ? `success` : `primary`}
            onClick={onArchiveToggle}
            size="small"
          >
            {category.status === categoryStatusEnum.archived ? `Restore` : `Delete`}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}

