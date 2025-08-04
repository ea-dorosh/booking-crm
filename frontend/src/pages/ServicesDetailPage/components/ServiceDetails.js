import { Edit, AccessTime, Euro } from "@mui/icons-material";
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

export default function ServiceDetails({
  service,
  employees,
  serviceCategories,
  serviceSubCategories,
  onEditClick,
}) {
  const getEmployeeName = (employeeId) => {
    const employee = employees.find(emp => emp.employeeId === employeeId);
    return employee ? `${employee.firstName} ${employee.lastName}` : '';
  };

  const getPriceRange = (employeePrices) => {
    if (!employeePrices || employeePrices.length === 0) return '';

    const prices = employeePrices.map(ep => ep.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    if (minPrice === maxPrice) {
      return `${minPrice}€`;
    }
    return `${minPrice}€ - ${maxPrice}€`;
  };

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
              {service.name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, marginBottom: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Euro sx={{ fontSize: 16, color: 'primary.main' }} />
                <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
                  {getPriceRange(service.employeePrices)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                <AccessTime sx={{ fontSize: 16 }} />
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {service.durationTime}
                </Typography>
              </Box>
            </Box>
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

        {/* Service Details Grid */}
        <Grid container spacing={1.5}>
          {/* Category & Subcategory */}
          <Grid item xs={12} md={6}>
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
                {serviceCategories?.find(category => category.id === service.categoryId)?.name || '-'}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{
              padding: 1.5,
              backgroundColor: 'grey.50',
              borderRadius: 1.5,
              border: '1px solid',
              borderColor: 'grey.100'
            }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ marginBottom: 0.25, fontWeight: 600, fontSize: '0.75rem' }}>
                  Sub-Category
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                {serviceSubCategories?.find(subCategory => subCategory.id === service.subCategoryId)?.name || '-'}
              </Typography>
            </Box>
          </Grid>

          {/* Duration & Buffer Time */}
          <Grid item xs={12} md={6}>
            <Box sx={{
              padding: 1.5,
              backgroundColor: 'grey.50',
              borderRadius: 1.5,
              border: '1px solid',
              borderColor: 'grey.100'
            }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ marginBottom: 0.25, fontWeight: 600, fontSize: '0.75rem' }}>
                  Duration
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                {service.durationTime}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{
              padding: 1.5,
              backgroundColor: 'grey.50',
              borderRadius: 1.5,
              border: '1px solid',
              borderColor: 'grey.100'
            }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ marginBottom: 0.25, fontWeight: 600, fontSize: '0.75rem' }}>
                  Buffer Time
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                {service.bufferTime || '-'}
              </Typography>
            </Box>
          </Grid>

          {/* Note */}
          {service.bookingNote && (
            <Grid item xs={12}>
              <Box sx={{
                padding: 1.5,
                backgroundColor: 'grey.50',
                borderRadius: 1.5,
                border: '1px solid',
                borderColor: 'grey.100'
              }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ marginBottom: 0.25, fontWeight: 600, fontSize: '0.75rem' }}>
                    Note
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.primary' }}>
                  {service.bookingNote}
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>

        {/* Employees Section */}
        <Box sx={{ marginTop: 1.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, marginBottom: 1, fontSize: '1rem' }}>
              Service Providers
          </Typography>

          <Grid container spacing={1.5}>
            {service.employeePrices.map((employeePrice) => {
              const employee = employees.find(emp => emp.employeeId === employeePrice.employeeId);
              return (
                <Grid item xs={6} sm={4} md={3} key={employeePrice.employeeId}>
                  <Card
                    elevation={0}
                    sx={{
                      border: '1px solid',
                      borderColor: 'grey.100',
                      backgroundColor: 'white',
                      borderRadius: 2,
                      // Removed hover styles to prevent jumping
                    }}
                  >
                    <CardContent sx={{ padding: 2, textAlign: 'center' }}>
                      <Avatar
                        src={employee?.image}
                        sx={{
                          width: 48,
                          height: 48,
                          margin: '0 auto 0.75rem',
                          backgroundColor: 'primary.main',
                          fontSize: '1.125rem',
                          fontWeight: 600,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                          border: '2px solid',
                          borderColor: 'primary.100'
                        }}
                      >
                        {getEmployeeName(employeePrice.employeeId).split(' ').map(n => n[0]).join('')}
                      </Avatar>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          marginBottom: 0.75,
                          fontSize: '0.875rem',
                          lineHeight: 1.3,
                          color: 'text.primary'
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
                          fontSize: '0.8rem',
                          height: 24,
                          backgroundColor: 'primary.main',
                          color: 'white',
                          '& .MuiChip-label': {
                            padding: '0 8px'
                          }
                        }}
                      />
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );
}