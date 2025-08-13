import { Edit, Person, Email, Phone, CalendarMonth } from "@mui/icons-material";
import {
  Button,
  Typography,
  Box,
  Card,
  CardContent,
  Avatar,
  Grid,
  Stack,
  Chip,
} from "@mui/material";
import AppointmentFilters from "@/components/EmployeeAppointments/AppointmentFilters";
import EmployeeAppointments from "@/components/EmployeeAppointments/EmployeeAppointments";
import EmployeeAvailability from "@/components/EmployeeAvailability/EmployeeAvailability";
import EmployeeGoogleCalenderSection from '@/components/EmployeeGoogleCalenderSection/EmployeeGoogleCalenderSection';

export default function EmployeeDetails({
  employee,
  appointmentFilters,
  lastAppointments,
  isLastAppointmentsPending,
  handleFiltersChange,
  handleClearFilters,
  handleAppointmentClick,
  handleEditClick,
}) {
  return (
    <>
      {/* Employee Info Card */}
      <Card
        sx={{
          marginTop: 2,
          borderRadius: 2,
          boxShadow: `0 2px 8px rgba(0,0,0,0.08)`,
        }}>
        <CardContent
          sx={{ padding: 2.5 }}>
          <Box
            sx={{
              display: `flex`,
              justifyContent: `flex-end`,
              marginBottom: 2,
            }}>
            <Button
              variant="contained"
              size="small"
              startIcon={<Edit
                sx={{ fontSize: `16px` }} />}
              onClick={handleEditClick}
              sx={{
                borderRadius: 1.5,
                padding: `6px 12px`,
                fontSize: `0.8rem`,
                fontWeight: 500,
                textTransform: `none`,
                minWidth: `auto`,
              }}
            >
              Edit
            </Button>
          </Box>

          <Grid
            container
            spacing={3}>
            {/* Employee Avatar & Status */}
            <Grid
              item
              xs={12}
              md={4}>
              <Box
                sx={{
                  display: `flex`,
                  flexDirection: `column`,
                  alignItems: `center`,
                  textAlign: `center`,
                }}>
                <Avatar
                  src={employee.image}
                  sx={{
                    width: 100,
                    height: 100,
                    marginBottom: 1.5,
                    border: `3px solid`,
                    borderColor: `primary.50`,
                  }}
                >
                  <Person
                    sx={{ fontSize: 50 }} />
                </Avatar>

                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    marginBottom: 1,
                  }}>
                  {`${employee.firstName} ${employee.lastName}`}
                </Typography>

                <Chip
                  label="Active"
                  color="success"
                  size="small"
                  sx={{ fontWeight: 500 }}
                />
              </Box>
            </Grid>

            {/* Employee Details */}
            <Grid
              item
              xs={12}
              md={8}>
              <Stack
                spacing={2}>
                <Box>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    sx={{
                      marginBottom: 0.5,
                      fontWeight: 600,
                    }}>
                    Contact Information
                  </Typography>
                  <Stack
                    spacing={1}>
                    <Box
                      sx={{
                        display: `flex`,
                        alignItems: `center`,
                        gap: 1,
                      }}>
                      <Email
                        sx={{
                          fontSize: 16,
                          color: `text.secondary`,
                        }} />
                      <Typography
                        variant="body2">{employee.email}</Typography>
                    </Box>
                    <Box
                      sx={{
                        display: `flex`,
                        alignItems: `center`,
                        gap: 1,
                      }}>
                      <Phone
                        sx={{
                          fontSize: 16,
                          color: `text.secondary`,
                        }} />
                      <Typography
                        variant="body2">{employee.phone}</Typography>
                    </Box>
                  </Stack>
                </Box>

                <Box>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    sx={{
                      marginBottom: 0.5,
                      fontWeight: 600,
                    }}>
                    Work Information
                  </Typography>
                  <Stack
                    spacing={1}>
                    <Box
                      sx={{
                        display: `flex`,
                        alignItems: `center`,
                        gap: 1,
                      }}>
                      <CalendarMonth
                        sx={{
                          fontSize: 16,
                          color: `text.secondary`,
                        }} />
                      <Typography
                        variant="body2">
                        Joined: {new Date(employee.createdAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <EmployeeGoogleCalenderSection employeeId={employee.employeeId} />

      {/* Employee Availability */}
      <Card
        sx={{
          marginTop: 2,
          borderRadius: 2,
          boxShadow: `0 2px 8px rgba(0,0,0,0.08)`,
        }}>
        <CardContent
          sx={{ padding: 2.5 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              marginBottom: 1.5,
              fontSize: `1.1rem`,
            }}>
            Work Schedule
          </Typography>
          <EmployeeAvailability
            employeeId={employee.employeeId} />
        </CardContent>
      </Card>

      {/* Recent Appointments with Filters */}
      <Box
        sx={{
          marginTop: 2,
          position: `relative`,
        }}>
        <AppointmentFilters
          filters={appointmentFilters}
          onFiltersChange={handleFiltersChange}
          onClearFilters={handleClearFilters}
          appointmentsCount={lastAppointments?.length || 0}
        />

        {/* Appointments Container with Overlay */}
        <Box
          sx={{ position: `relative` }}>
          {/* Appointments Content */}
          {lastAppointments && lastAppointments.length > 0 && (
            <EmployeeAppointments
              appointments={lastAppointments}
              onAppointmentClick={handleAppointmentClick} />
          )}

          {/* Show message when no appointments */}
          {((lastAppointments && lastAppointments.length === 0) || (!lastAppointments && !isLastAppointmentsPending)) && (
            <Box
              sx={{
                textAlign: `center`,
                py: 4,
                color: `text.secondary`,
              }}>
              <Typography
                variant="body2">
                {lastAppointments ? `No appointments found with current filters` : `No appointments yet`}
              </Typography>
            </Box>
          )}

          {/* Loading Overlay */}
          {isLastAppointmentsPending && (
            <Box
              sx={{
                position: `absolute`,
                top: 0,
                left: 0,
                right: 0,
                bottom: lastAppointments && lastAppointments.length > 0 ? 0 : `auto`,
                minHeight: lastAppointments && lastAppointments.length === 0 ? `200px` : `auto`,
                backgroundColor: `rgba(255, 255, 255, 0.8)`,
                backdropFilter: `blur(2px)`,
                display: `flex`,
                alignItems: `center`,
                justifyContent: `center`,
                zIndex: 10,
                borderRadius: 1,
              }}
            >
              <Box
                sx={{
                  display: `flex`,
                  flexDirection: `column`,
                  alignItems: `center`,
                  gap: 1,
                }}>
                <Typography
                  variant="body2"
                  color="text.secondary">
                  Loading appointments...
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </>
  );
}
