import { ExpandMore } from '@mui/icons-material';
import FilterListIcon from '@mui/icons-material/FilterList';
import {
  Button,
  Popover,
  FormControlLabel,
  Checkbox,
  Box,
  Badge,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
} from "@mui/material";
import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  toggleEmployeeFilter,
  toggleCategoryFilter,
  toggleSubCategoryFilter,
  clearServicesFilters,
} from '@/features/services/servicesSlice';

export default function FilterButton({
  employees, categories, subCategories, sx,
}) {
  const dispatch = useDispatch();
  const selectedEmployees = useSelector(state => state.services.selectedEmployees);
  const selectedCategories = useSelector(state => state.services.selectedCategories || []);
  const selectedSubCategories = useSelector(state => state.services.selectedSubCategories || []);
  const [anchorEl, setAnchorEl] = useState(null);

  const handleFilterClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setAnchorEl(null);
  };

  const handleEmployeeToggle = (employeeId) => {
    dispatch(toggleEmployeeFilter(employeeId));
  };

  const handleCategoryToggle = (categoryId) => {
    dispatch(toggleCategoryFilter(categoryId));
  };

  const handleSubCategoryToggle = (subCategoryId) => {
    dispatch(toggleSubCategoryFilter(subCategoryId));
  };

  const handleClearFilter = () => {
    dispatch(clearServicesFilters());
  };

  const isOpen = Boolean(anchorEl);
  const totalSelected = selectedEmployees.length + selectedCategories.length + selectedSubCategories.length;

  if (!employees || employees.length === 0) {
    return null;
  }

  return (
    <>
      <Button
        variant="outlined"
        size="small"
        startIcon={
          <Badge
            badgeContent={totalSelected}
            color="primary"
          >
            <FilterListIcon fontSize='18px'/>
          </Badge>
        }
        onClick={handleFilterClick}
        color={`secondary`}
        sx={{
          ...sx,
        }}
      >
        Filter
      </Button>

      <Popover
        open={isOpen}
        anchorEl={anchorEl}
        onClose={handleFilterClose}
        anchorOrigin={{
          vertical: `bottom`,
          horizontal: `center`,
        }}
        transformOrigin={{
          vertical: `top`,
          horizontal: `center`,
        }}
        slotProps={{
          paper: {
            sx: {
              width: {
                xs: `90vw`,
                sm: `90vw`,
                md: `600px`,
              },
              maxWidth: `600px`,
              maxHeight: {
                xs: `70vh`,
                sm: `75vh`,
                md: `80vh`,
              },
              overflow: `hidden`,
              boxShadow: `0 4px 12px rgba(0,0,0,0.15)`,
              borderRadius: {
                xs: 2,
                sm: 2,
              },
              margin: {
                xs: `8px auto`,
                sm: `auto`,
              },
              left: {
                xs: `5vw !important`,
                sm: `auto`,
              },
              right: {
                xs: `5vw !important`,
                sm: `auto`,
              },
            },
          },
        }}
      >
        <Box
          sx={{
            padding: `12px`,
            maxHeight: {
              xs: `70vh`,
              sm: `75vh`,
              md: `80vh`,
            },
            overflow: `auto`,
          }}
        >
          <Box
            sx={{
              display: `flex`,
              justifyContent: `flex-end`,
              alignItems: `center`,
              marginBottom: `12px`,
            }}
          >
            {totalSelected > 0 && (
              <Button
                size="small"
                onClick={handleClearFilter}
                sx={{ fontSize: `0.75rem` }}
              >
                Clear All
              </Button>
            )}
          </Box>

          {/* Employees */}
          <Box
            sx={{ marginBottom: `16px` }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 600,
                marginBottom: `8px`,
              }}
            >
              Employees
            </Typography>
            <Grid
              container
              spacing={0.5}
            >
              {employees.map((employee) => (
                <Grid
                  item
                  xs={12}
                  sm={6}
                  key={employee.employeeId}
                >
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={selectedEmployees.includes(employee.employeeId)}
                        onChange={() => handleEmployeeToggle(employee.employeeId)}
                        size="small"
                      />
                    }
                    label={
                      <Typography
                        sx={{ fontSize: `0.85rem` }}
                      >
                        {`${employee.firstName} ${employee.lastName}`}
                      </Typography>
                    }
                    sx={{
                      display: `flex`,
                      alignItems: `center`,
                      width: `100%`,
                      margin: `0`,
                      padding: `0`,
                      borderRadius: `4px`,
                      '&:hover': {
                        backgroundColor: `#f5f5f5`,
                      },
                    }}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Categories */}
          {categories && categories.length > 0 && (
            <Box
              sx={{ marginBottom: `16px` }}
            >
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 600,
                  marginBottom: `8px`,
                }}
              >
                Categories
              </Typography>
              <Grid
                container
                spacing={0.5}
              >
                {categories.map((category) => (
                  <Grid
                    item
                    xs={12}
                    sm={6}
                    key={category.id}
                  >
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={selectedCategories.includes(category.id)}
                          onChange={() => handleCategoryToggle(category.id)}
                          size="small"
                        />
                      }
                      label={
                        <Typography
                          sx={{ fontSize: `0.85rem` }}
                        >
                          {category.name}
                        </Typography>
                      }
                      sx={{
                        display: `flex`,
                        alignItems: `center`,
                        width: `100%`,
                        margin: `0`,
                        padding: `0`,
                        borderRadius: `4px`,
                        '&:hover': {
                          backgroundColor: `#f5f5f5`,
                        },
                      }}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* Sub-Categories */}
          {subCategories && subCategories.length > 0 && (
            <Box>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 600,
                  marginBottom: `8px`,
                }}
              >
                Sub-Categories
              </Typography>

              {/* Group subcategories by category */}
              {categories && categories.map((category) => {
                const categorySubCategories = subCategories.filter(
                  subCat => subCat.categoryId === category.id,
                );

                if (categorySubCategories.length === 0) return null;

                return (
                  <Accordion
                    key={category.id}
                    sx={{
                      boxShadow: `none`,
                      border: `1px solid #e0e0e0`,
                      marginBottom: `6px`,
                      '&:before': { display: `none` },
                    }}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMore />}
                      sx={{
                        minHeight: `36px`,
                        '& .MuiAccordionSummary-content': {
                          margin: `8px 0`,
                        },
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 500,
                          color: `text.secondary`,
                        }}
                      >
                        {category.name}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails
                      sx={{ padding: `8px 12px` }}
                    >
                      <Grid
                        container
                        spacing={0.5}
                      >
                        {categorySubCategories.map((subCategory) => (
                          <Grid
                            item
                            xs={12}
                            sm={6}
                            key={subCategory.id}
                          >
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={selectedSubCategories.includes(subCategory.id)}
                                  onChange={() => handleSubCategoryToggle(subCategory.id)}
                                  size="small"
                                />
                              }
                              label={
                                <Typography
                                  sx={{ fontSize: `0.8rem` }}
                                >
                                  {subCategory.name}
                                </Typography>
                              }
                              sx={{
                                display: `flex`,
                                alignItems: `center`,
                                width: `100%`,
                                margin: `1px 0`,
                                padding: `2px 4px`,
                                borderRadius: `3px`,
                                '&:hover': {
                                  backgroundColor: `#f5f5f5`,
                                },
                              }}
                            />
                          </Grid>
                        ))}
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                );
              })}
            </Box>
          )}
        </Box>
      </Popover>
    </>
  );
}
