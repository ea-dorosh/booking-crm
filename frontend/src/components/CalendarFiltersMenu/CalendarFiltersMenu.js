import {
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import {
  Menu,
  Box,
  Typography,
  Button,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel,
  Checkbox,
} from '@mui/material';

export default function CalendarFiltersMenu({
  open,
  anchorEl,
  onClose,
  selectedFilters,
  expandedSections,
  servicesMeta,
  employeeNameMap,
  onToggleCategory,
  onToggleSubCategory,
  onToggleService,
  onToggleEmployee,
  onClearFilters,
  onToggleSection,
}) {
  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            maxHeight: 600,
            width: 360,
          },
        },
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 1,
          display: `flex`,
          justifyContent: `space-between`,
          alignItems: `center`,
        }}
      >
        <Typography
          variant="subtitle2"
          fontWeight={600}
        >
          Filters
        </Typography>

        <Box
          sx={{
            display: `flex`,
            gap: 1,
          }}
        >
          <Button
            size="small"
            color="primary"
            variant="text"
            onClick={() => {
              onClearFilters();
              onClose();
            }}
          >
            Clear All
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={onClose}
          >
            Close
          </Button>
        </Box>
      </Box>

      <Divider />

      {/* Services Accordion */}
      <Accordion
        expanded={expandedSections.services}
        onChange={() => onToggleSection(`services`)}
        disableGutters
        elevation={0}
        sx={{ '&:before': { display: `none` } }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography
            variant="body2"
            fontWeight={500}
          >
            Services ({selectedFilters.categories.size + selectedFilters.subCategories.size + selectedFilters.services.size})
          </Typography>
        </AccordionSummary>

        <AccordionDetails
          sx={{
            p: 0,
            maxHeight: 300,
            overflow: `auto`,
          }}
        >
          {(servicesMeta.categories || []).map((category) => (
            <Accordion
              key={category.id}
              disableGutters
              elevation={0}
              sx={{
                '&:before': { display: `none` },
                boxShadow: `none`,
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon fontSize="small" />}
                sx={{
                  minHeight: 36,
                  '& .MuiAccordionSummary-content': { my: 0.5 },
                }}
              >
                <FormControlLabel
                  control={(
                    <Checkbox
                      checked={selectedFilters.categories.has(category.id)}
                      onChange={(event) => {
                        event.stopPropagation();
                        onToggleCategory(category.id);
                      }}
                      size="small"
                      sx={{ py: 0 }}
                    />
                  )}
                  label={<Typography variant="body2">{category.name}</Typography>}
                  onClick={(event) => event.stopPropagation()}
                  sx={{ m: 0 }}
                />
              </AccordionSummary>

              <AccordionDetails
                sx={{
                  pt: 0,
                  pl: 3,
                }}
              >
                {(servicesMeta.subCategories || [])
                  .filter((subCategory) => subCategory.categoryId === category.id)
                  .map((subCategory) => (
                    <Accordion
                      key={subCategory.id}
                      disableGutters
                      elevation={0}
                      sx={{
                        '&:before': { display: `none` },
                        boxShadow: `none`,
                      }}
                    >
                      <AccordionSummary
                        expandIcon={<ExpandMoreIcon fontSize="small" />}
                        sx={{
                          minHeight: 32,
                          '& .MuiAccordionSummary-content': { my: 0.5 },
                        }}
                      >
                        <FormControlLabel
                          control={(
                            <Checkbox
                              checked={selectedFilters.subCategories.has(subCategory.id)}
                              onChange={(event) => {
                                event.stopPropagation();
                                onToggleSubCategory(subCategory.id);
                              }}
                              size="small"
                              sx={{ py: 0 }}
                            />
                          )}
                          label={<Typography variant="body2">{subCategory.name}</Typography>}
                          onClick={(event) => event.stopPropagation()}
                          sx={{ m: 0 }}
                        />
                      </AccordionSummary>

                      <AccordionDetails
                        sx={{
                          pt: 0,
                          pl: 6,
                          display: `flex`,
                          flexDirection: `column`,
                        }}
                      >
                        {(servicesMeta.services || [])
                          .filter((service) => service.subCategoryId === subCategory.id)
                          .map((service) => (
                            <FormControlLabel
                              key={service.id}
                              control={(
                                <Checkbox
                                  checked={selectedFilters.services.has(service.id)}
                                  onChange={() => onToggleService(service.id)}
                                  size="small"
                                />
                              )}
                              label={<Typography variant="body2">{service.name}</Typography>}
                            />
                          ))}
                      </AccordionDetails>
                    </Accordion>
                  ))}

                {(servicesMeta.services || [])
                  .filter((service) => service.categoryId === category.id && (service.subCategoryId == null))
                  .map((service) => (
                    <FormControlLabel
                      key={service.id}
                      control={(
                        <Checkbox
                          checked={selectedFilters.services.has(service.id)}
                          onChange={() => onToggleService(service.id)}
                          size="small"
                        />
                      )}
                      label={<Typography variant="body2">{service.name}</Typography>}
                    />
                  ))}
              </AccordionDetails>
            </Accordion>
          ))}
        </AccordionDetails>
      </Accordion>

      <Divider />

      {/* Employees Accordion */}
      <Accordion
        expanded={expandedSections.employees}
        onChange={() => onToggleSection(`employees`)}
        disableGutters
        elevation={0}
        sx={{ '&:before': { display: `none` } }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography
            variant="body2"
            fontWeight={500}
          >
            Employees ({selectedFilters.employees.size})
          </Typography>
        </AccordionSummary>

        <AccordionDetails
          sx={{
            pt: 0,
            maxHeight: 300,
            overflow: `auto`,
            display: `flex`,
            flexDirection: `column`,
          }}
        >
          {Array.from(employeeNameMap.entries())
            .sort((a, b) => {
              const nameA = `${a[1].firstName || ``} ${a[1].lastName || ``}`.trim();
              const nameB = `${b[1].firstName || ``} ${b[1].lastName || ``}`.trim();
              return nameA.localeCompare(nameB);
            })
            .map(([employeeId, employee]) => (
              <FormControlLabel
                key={employeeId}
                control={(
                  <Checkbox
                    checked={selectedFilters.employees.has(Number(employeeId))}
                    onChange={() => onToggleEmployee(Number(employeeId))}
                    size="small"
                  />
                )}
                label={(
                  <Typography variant="body2">
                    {`${employee.firstName || ``} ${employee.lastName || ``}`.trim() || `Employee ${employeeId}`}
                  </Typography>
                )}
              />
            ))}
        </AccordionDetails>
      </Accordion>
    </Menu>
  );
}

