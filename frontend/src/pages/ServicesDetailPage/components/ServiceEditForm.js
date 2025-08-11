import { Box, Button } from "@mui/material";
import ServiceForm from "@/components/ServiceForm/ServiceForm";

export default function ServiceEditForm({
  service,
  employees,
  serviceSubCategories,
  serviceCategories,
  updateFormErrors,
  shouldShowServiceForm,
  onUpdateService,
  onCleanError,
  onCleanErrors,
  onDeleteService,
  onCancel,
}) {
  return (
    <Box>
      <ServiceForm
        service={service}
        employees={employees || []}
        serviceSubCategories={serviceSubCategories}
        serviceCategories={serviceCategories}
        createNewService={onUpdateService}
        formErrors={updateFormErrors}
        cleanError={onCleanError}
        cleanErrors={onCleanErrors}
        onCancel={onCancel}
      />

      {!shouldShowServiceForm && (
        <Box sx={{
          padding: 2, borderTop: `1px solid`, borderColor: `grey.100`, 
        }}>
          <Button
            variant="outlined"
            color="info"
            onClick={onDeleteService}
            fullWidth
          >
              Delete Service
          </Button>
        </Box>
      )}
    </Box>
  );
}