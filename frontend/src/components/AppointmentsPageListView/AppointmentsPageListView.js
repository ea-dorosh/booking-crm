import {
  Box,
  LinearProgress,
  Card,
  CardContent,
  Stack,
  Chip,
} from "@mui/material";
import AppointmentsContainer from "@/components/AppointmentsContainer/AppointmentsContainer";
import AppointmentsSorting from "@/components/AppointmentsSorting/AppointmentsSorting";
import AppointmentsStartDate from "@/components/AppointmentsStartDate/AppointmentsStartDate";
import AppointmentsStatus from "@/components/AppointmentsStatus/AppointmentsStatus";
import EmployeeFilter from "@/components/EmployeeFilter/EmployeeFilter";

export default function AppointmentsPageListView({
  appointments,
  startDate,
  isPending,
  onStartDateChange,
}) {
  return (
    <>
      <Card
        sx={{
          mt: 1.5,
          mb: 1.5,
        }}
      >
        <CardContent>
          <Stack
            direction={{
              xs: `column`,
              sm: `row`,
            }}
            spacing={2}
            alignItems={{
              xs: `stretch`,
              sm: `center`,
            }}
          >
            <Box
              sx={{
                display: `flex`,
                justifyContent: `space-between`,
                alignItems: `flex-start`,
                mb: 1,
                flexWrap: `wrap`,
                gap: 1,
              }}
            >
              {startDate && (
                <AppointmentsStartDate
                  startDate={startDate}
                  onStartDateChange={onStartDateChange}
                />
              )}

              {appointments && (
                <Chip
                  label={`${appointments.length} found`}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{
                    fontWeight: 600,
                  }}
                />
              )}
            </Box>


            <AppointmentsStatus />

            <EmployeeFilter />

            <Box
              sx={{
                ml: {
                  sm: `auto`,
                },
              }}
            >
              <AppointmentsSorting />
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {isPending && (
        <Box
          sx={{
            mt: 2,
            mb: 2,
          }}
        >
          <LinearProgress />
        </Box>
      )}

      {appointments && (
        <AppointmentsContainer
          appointments={appointments}
        />
      )}
    </>
  );
}


