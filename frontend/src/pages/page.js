import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import { useState, useEffect } from "react";
import AdminEmployeesModule from "@/components/AdminEmployeesModule";
import AdminServicesModule from "@/components/AdminServicesModule";
import employeesService from "@/services/employees.service";

export default function AdminPage() {
  const [employees, setEmployees] = useState(null);

  const fetchEmployees = async () => {
    const data = await employeesService.getEmployees();
    return setEmployees(data);
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  return (
    <main>
      <Box sx={{ width: "100%", maxWidth: 768 }}>
        <Typography variant="h2">ADMIN</Typography>

        <AdminEmployeesModule 
          employees={employees || []}
          fetchEmployees={fetchEmployees}
        />

        <Divider />

        <AdminServicesModule employees={employees || []} />

      </Box>
    </main>
  );
}
