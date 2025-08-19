import { Edit, AccessTime, DeleteOutline } from "@mui/icons-material";
import {
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Avatar,
} from "@mui/material";
import { serviceStatusEnum } from '@/enums/enums';

export default function ServiceDetails({
  service,
  employees,
  serviceCategories,
  serviceSubCategories,
  onEditClick,
  onArchiveToggle,
  onDeactivateToggle,
}) {
  const getEmployeeName = (employeeId) => {
    const employee = employees.find(emp => emp.employeeId === employeeId);
    return employee ? `${employee.firstName} ${employee.lastName}` : ``;
  };

  const getPriceRange = (employeePrices) => {
    if (!employeePrices || employeePrices.length === 0) return ``;

    const prices = employeePrices.map(ep => ep.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    if (minPrice === maxPrice) {
      return `${minPrice}€`;
    }
    return `${minPrice}€ - ${maxPrice}€`;
  };

  return (
    <Card
      sx={{
        marginTop: 1,
        borderRadius: 2,
        boxShadow: `0 2px 8px rgba(0,0,0,0.08)`,
      }}
    >
      <CardContent
        sx={{ padding: 2.5 }}
      >
        {/* Header with Edit Button */}
        <Box>
          <Box
            sx={{
              display: `flex`,
              gap: 1,
              alignItems: `flex-start`,
              justifyContent: `space-between`,
            }}
          >
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                marginBottom: 0.5,
                color: `text.primary`,
                hyphens: `auto`,
                wordBreak: `break-word`,
              }}
            >
              {service.name}
            </Typography>

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

          <Box marginTop={1}>
            {service.status && (
              <Chip
                label={service.status === serviceStatusEnum.disabled ? `not active` : service.status === serviceStatusEnum.archived ? `deleted` : service.status}
                size="small"
                color={service.status === serviceStatusEnum.active ? `success` : service.status === serviceStatusEnum.disabled ? `warning` : `error`}
                variant="filled"
                sx={{ marginBottom: 1 }}
              />
            )}

            <Box
              sx={{
                display: `flex`,
                alignItems: `center`,
                gap: 1.5,
                marginBottom: 0,
              }}
            >
              <Box
                sx={{
                  display: `flex`,
                  alignItems: `center`,
                  gap: 0.5,
                }}
              >
                <Typography
                  variant="h6"
                  color="primary"
                  sx={{ fontWeight: 700 }}
                >
                  {getPriceRange(service.employeePrices)}
                </Typography>
              </Box>
              <Box
                sx={{
                  display: `flex`,
                  alignItems: `center`,
                  gap: 0.5,
                  color: `text.secondary`,
                }}
              >
                <AccessTime
                  sx={{ fontSize: 16 }}
                />
                <Typography
                  variant="body1"
                  sx={{ fontWeight: 500 }}
                >
                  {service.durationTime}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Service Details Grid */}
        <Grid
          container
          spacing={1.5}
          marginTop={1}
        >
          {/* Category & Subcategory */}
          <Grid
            item
            xs={12}
            md={6}
          >
            <Box
              sx={{
                padding: 1.5,
                backgroundColor: `grey.50`,
                borderRadius: 1.5,
                border: `1px solid`,
                borderColor: `grey.100`,
              }}
            >
              <Typography
                variant="subtitle2"
                color="text.secondary"
                sx={{
                  marginBottom: 0.25,
                  fontWeight: 600,
                  fontSize: `0.75rem`,
                }}
              >
                  Category
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: `text.primary`,
                }}
              >
                {serviceCategories?.find(category => category.id === service.categoryId)?.name || `-`}
              </Typography>
            </Box>
          </Grid>

          <Grid
            item
            xs={12}
            md={6}
          >
            <Box
              sx={{
                padding: 1.5,
                backgroundColor: `grey.50`,
                borderRadius: 1.5,
                border: `1px solid`,
                borderColor: `grey.100`,
              }}
            >
              <Typography
                variant="subtitle2"
                color="text.secondary"
                sx={{
                  marginBottom: 0.25,
                  fontWeight: 600,
                  fontSize: `0.75rem`,
                }}
              >
                  Sub-Category
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: `text.primary`,
                }}
              >
                {serviceSubCategories?.find(subCategory => subCategory.id === service.subCategoryId)?.name || `-`}
              </Typography>
            </Box>
          </Grid>

          {/* Duration & Buffer Time */}
          <Grid
            item
            xs={12}
            md={6}
          >
            <Box
              sx={{
                padding: 1.5,
                backgroundColor: `grey.50`,
                borderRadius: 1.5,
                border: `1px solid`,
                borderColor: `grey.100`,
              }}
            >
              <Typography
                variant="subtitle2"
                color="text.secondary"
                sx={{
                  marginBottom: 0.25,
                  fontWeight: 600,
                  fontSize: `0.75rem`,
                }}
              >
                Duration
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: `text.primary`,
                }}
              >
                {service.durationTime}
              </Typography>
            </Box>
          </Grid>

          <Grid
            item
            xs={12}
            md={6}
          >
            <Box
              sx={{
                padding: 1.5,
                backgroundColor: `grey.50`,
                borderRadius: 1.5,
                border: `1px solid`,
                borderColor: `grey.100`,
              }}
            >
              <Typography
                variant="subtitle2"
                color="text.secondary"
                sx={{
                  marginBottom: 0.25,
                  fontWeight: 600,
                  fontSize: `0.75rem`,
                }}
              >
                Buffer Time
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: `text.primary`,
                }}
              >
                {service.bufferTime || `-`}
              </Typography>
            </Box>
          </Grid>

          {/* Note */}
          {service.bookingNote && (
            <Grid
              item
              xs={12}
            >
              <Box
                sx={{
                  padding: 1.5,
                  backgroundColor: `grey.50`,
                  borderRadius: 1.5,
                  border: `1px solid`,
                  borderColor: `grey.100`,
                }}
              >
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  sx={{
                    marginBottom: 0.25,
                    fontWeight: 600,
                    fontSize: `0.75rem`,
                  }}
                >
                  Note
                </Typography>

                <Typography
                  variant="body2"
                  sx={{ color: `text.primary` }}
                >
                  {service.bookingNote}
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>

        {/* Employees Section */}
        <Box
          sx={{ marginTop: 1.5 }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              marginBottom: 1,
              fontSize: `1rem`,
            }}
          >
              Service Providers
          </Typography>

          <Grid
            container
            spacing={1.5}
          >
            {service.employeePrices.map((employeePrice) => {
              const employee = employees.find(emp => emp.employeeId === employeePrice.employeeId);
              return (
                <Grid
                  item
                  xs={6}
                  sm={4}
                  md={3}
                  key={employeePrice.employeeId}
                >
                  <Card
                    elevation={0}
                    sx={{
                      border: `1px solid`,
                      borderColor: `grey.100`,
                      backgroundColor: `white`,
                      borderRadius: 2,
                    }}
                  >
                    <CardContent
                      sx={{
                        padding: 2,
                        textAlign: `center`,
                      }}
                    >
                      <Avatar
                        src={employee?.image}
                        sx={{
                          width: 48,
                          height: 48,
                          margin: `0 auto 0.75rem`,
                          backgroundColor: `primary.main`,
                          fontSize: `1.125rem`,
                          fontWeight: 600,
                          boxShadow: `0 2px 8px rgba(0,0,0,0.15)`,
                          border: `2px solid`,
                          borderColor: `primary.100`,
                        }}
                      >
                        {getEmployeeName(employeePrice.employeeId).split(` `).map(n => n[0]).join(``)}
                      </Avatar>

                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          marginBottom: 0.75,
                          fontSize: `0.875rem`,
                          lineHeight: 1.3,
                          color: `text.primary`,
                        }}
                      >
                        {getEmployeeName(employeePrice.employeeId)}
                      </Typography>

                      <Chip
                        label={`${employeePrice.price}€`}
                        color="primary"
                        size="small"
                        sx={{
                          fontWeight: 700,
                          fontSize: `0.8rem`,
                          height: 24,
                          backgroundColor: `primary.main`,
                          color: `white`,
                          '& .MuiChip-label': {
                            padding: `0 8px`,
                          },
                        }}
                      />
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Box>

        {/* Status Management Buttons */}
        <Box
          sx={{
            display: `flex`,
            gap: 2,
            alignItems: `center`,
            mt: 2,
            justifyContent: `space-between`,
          }}
        >
          <Button
            disabled={service.status === serviceStatusEnum.archived}
            variant="outlined"
            size="small"
            color={service.status === serviceStatusEnum.disabled ? `secondary` : `warning`}
            onClick={onDeactivateToggle}
          >
            {service.status === serviceStatusEnum.disabled ? `Activate` : `Deactivate`}
          </Button>

          <Button
            variant="outlined"
            size="small"
            startIcon={
              <DeleteOutline
                sx={{ fontSize: `16px` }}
              />
            }
            color={service.status === serviceStatusEnum.archived ? `success` : `primary`}
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
            {service.status === serviceStatusEnum.archived ? `Restore` : `Delete`}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
