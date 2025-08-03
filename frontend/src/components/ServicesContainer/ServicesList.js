import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Divider
} from "@mui/material";
import { useState, useEffect, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Link as RouterLink } from 'react-router-dom';

const STORAGE_KEY = 'services-accordion-state';
const SCROLL_SERVICE_KEY = 'services-scroll-to-service';
const SERVICES_PAGE_SCROLL_KEY = 'services-page-scroll-position';

export default function ServicesList({ services, employees, categories }) {
  const [expandedAccordions, setExpandedAccordions] = useState({});
  const serviceRefs = useRef({});
  const selectedEmployees = useSelector(state => state.services.selectedEmployees);

  useEffect(() => {
    const savedState = sessionStorage.getItem(STORAGE_KEY);
    if (savedState) {
      try {
        setExpandedAccordions(JSON.parse(savedState));
      } catch (error) {
        console.error('Error parsing accordion state from sessionStorage:', error);
      }
    }
  }, []);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(expandedAccordions));
  }, [expandedAccordions]);

  useEffect(() => {
    const scrollToServiceId = sessionStorage.getItem(SCROLL_SERVICE_KEY);

    if (scrollToServiceId && services && categories) {
      const targetService = services.find(service => service.id.toString() === scrollToServiceId);

      if (targetService) {
        const categoryAccordionId = `category-${targetService.categoryId}`;
        const subCategoryAccordionId = `subcategory-${targetService.categoryId}-${targetService.subCategoryId}`;

        setExpandedAccordions(prev => ({
          ...prev,
          [categoryAccordionId]: true,
          [subCategoryAccordionId]: true
        }));

        setTimeout(() => {
          const serviceElement = serviceRefs.current[scrollToServiceId];
          if (serviceElement) {
            const elementRect = serviceElement.getBoundingClientRect();
            const offset = 80;

            window.scrollTo({
              top: window.scrollY + elementRect.top - offset,
              behavior: 'smooth'
            });
          }

          sessionStorage.removeItem(SCROLL_SERVICE_KEY);
        }, 500);
      }
    }
  }, [services, categories]);

  const handleServiceClick = (serviceId) => {
    sessionStorage.setItem(SCROLL_SERVICE_KEY, serviceId.toString());

    // Save current page scroll position for general navigation
    sessionStorage.setItem(SERVICES_PAGE_SCROLL_KEY, window.scrollY.toString());
  };

  // Auto-expand accordions when employee filter changes
  useEffect(() => {
    if (!services || !categories || selectedEmployees.length === 0) return;

    const accordionsToExpand = {};

    // Find all categories and subcategories that contain filtered services
    services.forEach(service => {
      // Check if this service has any of the selected employees
      const hasSelectedEmployee = service.employeePrices?.some(empPrice =>
        selectedEmployees.includes(empPrice.employeeId)
      );

      if (hasSelectedEmployee) {
        const categoryAccordionId = `category-${service.categoryId}`;
        const subCategoryAccordionId = `subcategory-${service.categoryId}-${service.subCategoryId}`;

        accordionsToExpand[categoryAccordionId] = true;
        accordionsToExpand[subCategoryAccordionId] = true;
      }
    });

    // Update expanded accordions to include the new ones
    setExpandedAccordions(prev => ({
      ...prev,
      ...accordionsToExpand
    }));
  }, [selectedEmployees, services, categories]);

  const groupedServices = useMemo(() => {
    if (!services || !categories) return {};

    const grouped = {};

    services.forEach(service => {
      const category = categories.find(cat => cat.id === service.categoryId);
      const categoryName = category?.name || `Category ${service.categoryId}`;

      if (!grouped[service.categoryId]) {
        grouped[service.categoryId] = {
          categoryName,
          subCategories: {}
        };
      }

      if (!grouped[service.categoryId].subCategories[service.subCategoryId]) {
        grouped[service.categoryId].subCategories[service.subCategoryId] = {
          subCategoryName: service.subCategoryName,
          services: []
        };
      }

      grouped[service.categoryId].subCategories[service.subCategoryId].services.push(service);
    });

    return grouped;
  }, [services, categories]);

  const getEmployeeName = (employeeId) => {
    if (!employees) return '';
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

  const handleAccordionChange = (accordionId) => (event, isExpanded) => {
    setExpandedAccordions(prev => ({
      ...prev,
      [accordionId]: isExpanded
    }));
  };

  if (!services || services.length === 0) {
    return (
      <Box sx={{ padding: '2rem', textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          No services found
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ marginTop: '1rem', maxWidth: '100%' }}>
      {Object.entries(groupedServices).map(([categoryId, categoryData]) => (
        <Accordion
          key={`category-${categoryId}`}
          expanded={expandedAccordions[`category-${categoryId}`] || false}
          onChange={handleAccordionChange(`category-${categoryId}`)}
          sx={{
            marginBottom: '1rem',
            border: '1px solid #e0e0e0',
            borderRadius: '8px !important',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            '&:before': { display: 'none' },
            '&.Mui-expanded': {
              margin: '0 0 1rem 0'
            }
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{
              backgroundColor: '#f5f5f5',
              borderRadius: '8px 8px 0 0',
              '& .MuiAccordionSummary-content': {
                margin: '12px 0'
              }
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: 'bold',
                fontSize: '1.1rem'
              }}
            >
              {categoryData.categoryName}
            </Typography>
          </AccordionSummary>

          <AccordionDetails sx={{ padding: 0 }}>
            {Object.entries(categoryData.subCategories).map(([subCategoryId, subCategoryData]) => (
              <Accordion
                key={`subcategory-${categoryId}-${subCategoryId}`}
                expanded={expandedAccordions[`subcategory-${categoryId}-${subCategoryId}`] || false}
                onChange={handleAccordionChange(`subcategory-${categoryId}-${subCategoryId}`)}
                sx={{
                  boxShadow: 'none',
                  border: 'none',
                  borderTop: '1px solid #e0e0e0',
                  '&:before': { display: 'none' },
                  borderRadius: 0,
                  '&.Mui-expanded': {
                    margin: 0
                  }
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  sx={{
                    backgroundColor: '#fafafa',
                    minHeight: '48px',
                    '& .MuiAccordionSummary-content': {
                      margin: '8px 0'
                    }
                  }}
                >
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: '500',
                      fontSize: '1.05rem'
                    }}
                  >
                    {subCategoryData.subCategoryName}
                  </Typography>
                </AccordionSummary>

                <AccordionDetails sx={{ padding: '8px 16px' }}>
                  {subCategoryData.services.map((service, index) => (
                    <Box key={service.id}>
                      <Box
                        ref={(el) => serviceRefs.current[service.id] = el}
                        component={RouterLink}
                        to={`/services/${service.id}`}
                        onClick={() => handleServiceClick(service.id)}
                        sx={{
                          display: 'block',
                          padding: '12px 0',
                          textDecoration: 'none',
                          color: 'inherit',
                          '&:hover': {
                            backgroundColor: '#f9f9f9'
                          }
                        }}
                      >
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontWeight: 'bold',
                            marginBottom: '4px',
                            fontSize: '1.1rem'
                          }}
                        >
                          {service.name}
                        </Typography>

                        <Box sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '8px'
                        }}>
                          <Typography
                            variant="body2"
                            color="primary"
                            sx={{ fontWeight: '500', fontSize: '1rem' }}
                          >
                            {getPriceRange(service.employeePrices)}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                          >
                            {service.durationTime}
                          </Typography>
                        </Box>

                        {service.employeePrices && service.employeePrices.length > 0 && (
                          <Box sx={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '4px',
                            marginTop: '8px'
                          }}>
                            {service.employeePrices.map((empPrice) => (
                              <Chip
                                key={empPrice.employeeId}
                                label={`${getEmployeeName(empPrice.employeeId)} - ${empPrice.price}€`}
                                size="small"
                                variant="outlined"
                                sx={{
                                  fontSize: '0.8rem',
                                  height: '28px',
                                  borderColor: '#e0e0e0',
                                  color: '#666'
                                }}
                              />
                            ))}
                          </Box>
                        )}
                      </Box>

                      {index < subCategoryData.services.length - 1 && (
                        <Divider sx={{ margin: '0 -16px' }} />
                      )}
                    </Box>
                  ))}
                </AccordionDetails>
              </Accordion>
            ))}
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
}
