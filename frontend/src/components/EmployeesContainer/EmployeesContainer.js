import {
  Person,
  Email,
} from "@mui/icons-material";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Button,
  Grid,
  Paper,
  Chip,
} from "@mui/material";
import { Link as RouterLink } from 'react-router-dom';
import AddButton from '@/components/common/AddButton';

export default function EmployeesContainer({
  employees,
}) {
  return (
    <Box sx={{ padding: { xs: 0, md: 0 } }}>
      {/* Header */}
      <Box sx={{ marginBottom: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, marginBottom: 1 }}>
          Team Members
        </Typography>
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <Typography variant="body1" color="text.secondary">
            Manage your employees and their information
          </Typography>

          <AddButton
            to="/employees/create-employee"
            ml={1}
          >
            Add Employee
          </AddButton>
        </Box>
      </Box>

      {/* Employees Grid */}
      <Grid container spacing={3}>
        {employees.map((employee) => (
          <Grid item xs={12} sm={6} md={4} key={employee.employeeId}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Card Content */}
              <CardContent sx={{
                padding: 3,
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center'
              }}>
                {/* Avatar */}
                <Avatar
                  src={employee.image}
                  sx={{
                    width: 80,
                    height: 80,
                    marginBottom: 2,
                    border: '4px solid',
                    borderColor: 'primary.50',
                  }}
                >
                  <Person sx={{ fontSize: 40 }} />
                </Avatar>

                {/* Name */}
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    marginBottom: 0.5,
                    color: 'text.primary'
                  }}
                >
                  {`${employee.firstName} ${employee.lastName}`}
                </Typography>

                {/* Email */}
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  marginBottom: 2,
                  color: 'text.secondary'
                }}>
                  <Email sx={{ fontSize: 16 }} />
                  <Typography variant="body2">
                    {employee.email}
                  </Typography>
                </Box>

                {/* Status Chip */}
                <Chip
                  label="Active"
                  color="success"
                  size="small"
                  sx={{
                    fontWeight: 500,
                    marginBottom: 2
                  }}
                />

                {/* Action Button */}
                <Box sx={{ marginTop: 'auto' }}>
                  <Button
                    component={RouterLink}
                    to={`/employees/${employee.employeeId}`}
                    variant="outlined"
                    size="small"
                    sx={{
                      borderRadius: 2,
                      borderColor: 'primary.200',
                      color: 'primary.600',
                      '&:hover': {
                        borderColor: 'primary.400',
                        backgroundColor: 'primary.50',
                      }
                    }}
                  >
                    Details
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Empty State */}
      {employees.length === 0 && (
        <Paper
          sx={{
            padding: 6,
            textAlign: 'center',
            backgroundColor: 'grey.50',
            border: '2px dashed',
            borderColor: 'grey.300',
          }}
        >
          <Person sx={{ fontSize: 60, color: 'grey.400', marginBottom: 2 }} />
          <Typography variant="h6" color="text.secondary" sx={{ marginBottom: 1 }}>
            No employees found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ marginBottom: 3 }}>
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