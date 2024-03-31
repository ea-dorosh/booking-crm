/* eslint-disable no-unused-vars */
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import { useState, useEffect } from "react";
// import { useDispatch, useSelector } from 'react-redux';
import { Link } from "react-router-dom";
import AdminServicesModule from "@/components/AdminServicesModule";
import PageContainer from '@/components/PageContainer/PageContainer';
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
    <PageContainer pageTitle="Services">
      <AdminServicesModule employees={employees || []} />
    </PageContainer>
  );
}
