import { Card, CardContent, Typography } from "@mui/material";
import EmployeeForm from "@/components/EmployeeForm/EmployeeForm";

export default function EmployeeEditForm({
  employee,
  shouldShowCreateEmployeeForm,
  updateEmployeeHandler,
  formErrors,
  handleCleanError,
  handleCleanErrors,
  handleCancelEdit,
}) {
  return (
    <Card sx={{
      marginTop: 2, borderRadius: 2, boxShadow: `0 2px 8px rgba(0,0,0,0.08)`, 
    }}>
      <CardContent sx={{ padding: 2.5 }}>
        <Typography variant="h6" sx={{
          marginBottom: 2, fontWeight: 700, fontSize: `1.2rem`, color: `text.primary`, 
        }}>
          {shouldShowCreateEmployeeForm ? `Create New Employee` : `Edit Employee Information`}
        </Typography>

        <EmployeeForm
          employee={employee}
          createEmployee={updateEmployeeHandler}
          formErrors={formErrors}
          cleanError={handleCleanError}
          cleanErrors={handleCleanErrors}
          onCancel={handleCancelEdit}
        />
      </CardContent>
    </Card>
  );
}