/* eslint-disable no-unused-vars */
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import { useState, useEffect } from "react";
// import { useDispatch, useSelector } from 'react-redux';
import { Link } from "react-router-dom";
import AdminServicesModule from "@/components/AdminServicesModule";
import employeesService from "@/services/employees.service";


export default function ServicesPage() {
  const [employees, setEmployees] = useState(null);

  const fetchEmployees = async () => {
    const data = await employeesService.getEmployees();
    return setEmployees(data);
  };

  useEffect(() => {
    // fetchEmployees();
  }, []);

  return (
    <main>
      <Box sx={{ width: "100%", maxWidth: 768 }}>
        <Typography variant="h2">Services</Typography>

        <Divider />

        <Link to={`/`}>Dashboard</Link>

        <Divider />

        <AdminServicesModule employees={employees || []} />
      </Box>
    </main>
  );
}
