import {
  Person,
  Email,
} from "@mui/icons-material";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  Avatar,
  Grid,
  Paper,
  Chip,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import { Link as RouterLink } from 'react-router-dom';
import AddButton from '@/components/common/AddButton';
import { employeeStatusEnum } from '@/enums/enums';

export default function EmployeesContainer({
  employees, statusFilter, onStatusChange,
}) {
  return (
    <Box
      sx={{
        padding: {
          xs: 0,
          md: 0,
        },
      }}
    >

      {/* Header */}
      <Box sx={{ marginBottom: 3 }}>
        <Typography
          variant="h4"
          sx={{ marginBottom: 1 }}
        >
          Team Members
        </Typography>

        <Box
          sx={{
            display: `flex`,
            justifyContent: `space-between`,
            alignItems: `flex-start`,
          }}
        >
          <Typography
            variant="body1"
            color="text.secondary"
          >
            Manage your employees and their information
          </Typography>

          <AddButton
            to="/employees/create-employee"
            sx={{ ml: 1 }}
          >
            Add Employee
          </AddButton>
        </Box>
      </Box>

      {/* Status Filter */}
      <Box
        sx={{ marginBottom: 3 }}
      >
        <Typography
          variant="h6"
          sx={{ marginBottom: 2 }}
        >
          Status Filter
        </Typography>
        <ToggleButtonGroup
          value={statusFilter}
          exclusive
          onChange={(event, newValue) => {
            if (newValue !== null) {
              onStatusChange(newValue);
            }
          }}
          aria-label="employee status filter"
          size="small"
        >
          <ToggleButton
            value="all"
            aria-label="all employees"
          >
            all
          </ToggleButton>
          <ToggleButton
            value={employeeStatusEnum.active}
            aria-label="active employees"
          >
            active
          </ToggleButton>
          <ToggleButton
            value={employeeStatusEnum.disabled}
            aria-label="disabled employees"
          >
            disabled
          </ToggleButton>
          <ToggleButton
            value={employeeStatusEnum.archived}
            aria-label="archived employees"
          >
            deleted
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Employees Grid */}
      <Grid
        container
        spacing={3}
      >
        {employees.map((employee) => (
          <Grid
            item
            xs={12}
            sm={6}
            md={4}
            key={employee.employeeId}
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
                to={`/employees/${employee.employeeId}`}
                sx={{
                  height: `100%`,
                  display: `flex`,
                  flexDirection: `column`,
                }}
                aria-label={`View ${employee.firstName} ${employee.lastName}`}
              >
                {/* Card Content */}
                <CardContent
                  sx={{
                    padding: 3,
                    flexGrow: 1,
                    display: `flex`,
                    flexDirection: `column`,
                    alignItems: `center`,
                    textAlign: `center`,
                  }}
                >
                  {/* Avatar */}
                  <Avatar
                    src={employee.image}
                    sx={{
                      width: 80,
                      height: 80,
                      marginBottom: 2,
                      border: `4px solid`,
                      borderColor: `primary.50`,
                    }}
                  >
                    <Person sx={{ fontSize: 40 }} />
                  </Avatar>

                  {/* Name */}
                  <Typography
                    variant="h6"
                    sx={{ marginBottom: 0.5 }}
                  >
                    {`${employee.firstName} ${employee.lastName}`}
                  </Typography>

                  {/* Email */}
                  <Box
                    sx={{
                      display: `flex`,
                      alignItems: `center`,
                      gap: 0.5,
                      marginBottom: 2,
                      color: `text.secondary`,
                    }}
                  >
                    <Email sx={{ fontSize: 16 }} />

                    <Typography variant="body2">
                      {employee.email}
                    </Typography>
                  </Box>

                  {/* Status Chip */}
                  <Chip
                    label={employee.status === employeeStatusEnum.archived ? `deleted` : employee.status === employeeStatusEnum.disabled ? `not active` : `active`}
                    color={
                      employee.status === employeeStatusEnum.active ? `success` :
                        employee.status === employeeStatusEnum.archived ? `error` :
                          employee.status === employeeStatusEnum.disabled ? `warning` : `default`
                    }
                    size="small"
                  />
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Empty State */}
      {employees.length === 0 && (
        <Paper
          sx={{
            padding: 6,
            textAlign: `center`,
            backgroundColor: `grey.50`,
            border: `2px dashed`,
            borderColor: `grey.300`,
            marginTop: 3,
          }}
        >
          <Person
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
            No employees found
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ marginBottom: 3 }}
          >
            Get started by adding your first team member
          </Typography>

          <AddButton to="/employees/create-employee">
            Add First Employee
          </AddButton>
        </Paper>
      )}
    </Box>
  );
}
