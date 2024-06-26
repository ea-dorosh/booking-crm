import Box from "@mui/material/Box";
import { useEffect } from "react";
import { useDispatch, useSelector } from 'react-redux';
import DayFormRow from "@/components/DayFormRow/DayFormRow";
import daysOfWeek from "@/constants/daysOfWeek";
import { 
  fetchEmployeeAvailability,
  cleanEmployeeAvailability,
  applyEmployeeAvailability,
  deleteEmployeeAvailability,
} from '@/features/employees/employeeAvailabilitySlice';

export default function EmployeeAvailability({ employeeId }) {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchEmployeeAvailability(employeeId));

    // cleanup on unmount
    return () => {
      dispatch(cleanEmployeeAvailability());
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const employeeAvailability = useSelector(state => state.employeeAvailability.data);

  const getEmployeeAvailabilityByDayId = (dayId) => {
    return employeeAvailability?.find((item) => item.dayId === dayId);
  };

  const applyEmployeeAvailabilityHandler = async (dayId, startTime, endTime) => {
    await dispatch(applyEmployeeAvailability({
      employeeId,
      dayId,
      startTime,
      endTime,
    }));

    // TODO: fix the problem with the data not being updated
    setTimeout(() => {
      dispatch(fetchEmployeeAvailability(employeeId));
    }, 100);
  };

  const deleteEmployeeAvailabilityHandler = async (id) => {
    await dispatch(deleteEmployeeAvailability(id));

    // TODO: fix the problem with the data not being updated
    setTimeout(() => {
      dispatch(fetchEmployeeAvailability(employeeId));
    }, 100);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box mt={3}>
        {daysOfWeek.map((day) => (
          <DayFormRow
            key={day.id}
            day={day}
            employeeAvailability={getEmployeeAvailabilityByDayId(day.id)}
            applyEmployeeAvailability={applyEmployeeAvailabilityHandler}
            deleteEmployeeAvailability={deleteEmployeeAvailabilityHandler}
          />
        ))}
      </Box>
    </Box>
  );
}
