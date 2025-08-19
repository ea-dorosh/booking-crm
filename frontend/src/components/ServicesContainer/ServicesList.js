import { Business, AccessTime } from "@mui/icons-material";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Grid,
  Paper,
  Button,
  CardActionArea,
} from "@mui/material";
import { useMemo } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { serviceStatusEnum } from '@/enums/enums';

export default function ServicesList({
  services, employees, categories,
}) {
  const groupedServices = useMemo(() => {
    if (!services || !categories) return {};

    const grouped = {};

    services.forEach(service => {
      const category = categories.find(cat => cat.id === service.categoryId);
      const categoryName = category?.name || `Category ${service.categoryId}`;

      if (!grouped[service.categoryId]) {
        grouped[service.categoryId] = {
          categoryName,
          subCategories: {},
        };
      }

      if (!grouped[service.categoryId].subCategories[service.subCategoryId]) {
        grouped[service.categoryId].subCategories[service.subCategoryId] = {
          subCategoryName: service.subCategoryName,
          services: [],
        };
      }

      grouped[service.categoryId].subCategories[service.subCategoryId].services.push(service);
    });

    return grouped;
  }, [services, categories]);

  const getEmployeeName = (employeeId) => {
    if (!employees) return ``;
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

  if (!services || services.length === 0) {
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
        <Business
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
          No services found
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ marginBottom: 3 }}
        >
          Get started by adding your first service
        </Typography>

        <Button
          component={RouterLink}
          to="/services/create-service"
          variant="contained"
          size="small"
        >
          Add First Service
        </Button>
      </Paper>
    );
  }

  return (
    <Box
      sx={{
        padding: {
          xs: 0,
          md: 0,
        },
      }}
    >
      {Object.entries(groupedServices).map(([categoryId, categoryData]) => (
        <Box
          key={categoryId}
          sx={{ marginBottom: 4 }}
        >
          {/* Category Header */}
          <Box
            sx={{ marginBottom: 2 }}
          >
            <Typography
              variant="h5"
              sx={{
                fontWeight: 600,
                marginBottom: 1,
              }}
            >
              {categoryData.categoryName}
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
            >
              {Object.values(categoryData.subCategories).reduce((total, subCat) => total + subCat.services.length, 0)} services
            </Typography>
          </Box>

          {/* Sub Categories */}
          {Object.entries(categoryData.subCategories).map(([subCategoryId, subCategoryData]) => (
            <Box
              key={subCategoryId}
              sx={{ marginBottom: 3 }}
            >
              {/* Sub Category Header */}
              <Box
                sx={{ marginBottom: 2 }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 500,
                    color: `text.secondary`,
                  }}
                >
                  {subCategoryData.subCategoryName}
                </Typography>
              </Box>

              {/* Services Grid */}
              <Grid
                container
                spacing={2}
              >
                {subCategoryData.services.map((service) => (
                  <Grid
                    item
                    xs={12}
                    sm={6}
                    md={4}
                    key={service.id}
                  >
                    <Card
                      sx={{
                        height: `100%`,
                        display: `flex`,
                        flexDirection: `column`,
                      }}
                    >
                      <CardActionArea
                        component={RouterLink}
                        to={`/services/${service.id}`}
                        sx={{ height: `100%` }}
                      >
                        <CardContent
                          sx={{
                            padding: 2.5,
                            flexGrow: 1,
                            display: `flex`,
                            flexDirection: `column`,
                            alignItems: `flex-start`,
                          }}
                        >
                          <Box
                            sx={{
                              display: `flex`,
                              alignItems: `flex-start`,
                              gap: 1,
                              justifyContent: `space-between`,
                              width: `100%`,
                              marginBottom: 1,
                              maxWidth: `100%`,
                              wordBreak: `break-word`,
                            }}
                          >
                            {/* Service Name */}
                            <Typography
                              variant="h6"
                              sx={{
                                fontWeight: 600,
                                color: `text.primary`,
                                fontSize: `1.1rem`,
                                hyphens: `auto`,
                                width: `auto`,
                              }}
                            >
                              {service.name}
                            </Typography>

                            {/* Service Status */}
                            {service.status && (
                              <Chip
                                label={service.status === serviceStatusEnum.disabled ? `not active` : service.status === serviceStatusEnum.archived ? `deleted` : service.status}
                                size="small"
                                color={service.status === serviceStatusEnum.active ? `success` : service.status === serviceStatusEnum.disabled ? `warning` : `error`}
                                variant="filled"
                                sx={{ mb: 1.5 }}
                              />
                            )}
                          </Box>

                          {/* Price and Duration */}
                          <Box
                            sx={{
                              display: `flex`,
                              alignItems: `center`,
                              gap: 1,
                              marginBottom: 1.5,
                            }}
                          >
                            <Typography
                              variant="body1"
                              color="primary"
                              sx={{
                                fontWeight: 600,
                                fontSize: `1rem`,
                              }}
                            >
                              {getPriceRange(service.employeePrices)}
                            </Typography>
                          </Box>

                          <Box
                            sx={{
                              display: `flex`,
                              alignItems: `center`,
                              gap: 1,
                              marginBottom: 2,
                              color: `text.secondary`,
                            }}
                          >
                            <AccessTime sx={{ fontSize: 16 }} />

                            <Typography variant="body2">
                              {service.durationTime}
                            </Typography>
                          </Box>

                          {/* Employee Chips */}
                          {service.employeePrices && service.employeePrices.length > 0 && (
                            <Box
                              sx={{
                                display: `flex`,
                                flexWrap: `wrap`,
                                gap: 0.5,
                                flexGrow: 1,
                              }}
                            >
                              {service.employeePrices.map((empPrice) => (
                                <Chip
                                  key={empPrice.employeeId}
                                  label={`${getEmployeeName(empPrice.employeeId)} - ${empPrice.price}€`}
                                  size="small"
                                  variant="outlined"
                                />
                              ))}
                            </Box>
                          )}
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          ))}
        </Box>
      ))}
    </Box>
  );
}
