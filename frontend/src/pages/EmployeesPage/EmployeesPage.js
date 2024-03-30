import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import { useEffect } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { Link } from "react-router-dom";
import EmployeesContainer from "@/components/EmployeesContainer/EmployeesContainer";
import { fetchEmployees } from '@/features/employees/employeesSlice';


export default function EmployeesPage() {
  const dispatch = useDispatch();
  const employees = useSelector(state => state.employees.data);

  useEffect(() => {
    if (!employees.length) {
      dispatch(fetchEmployees());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main>
      <Box sx={{ width: "100%", maxWidth: 768 }}>
        <Typography variant="h2">Employees</Typography>

        <Divider />

        <Link to={`/`}>Dashboard</Link>

        <Divider />

        {employees.length > 0 && <EmployeesContainer 
          employees={employees}
        />}
      </Box>
    </main>
  );
}
