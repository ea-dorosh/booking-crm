"use client";

import AddCircle from "@mui/icons-material/AddCircle";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import EditIcon from "@mui/icons-material/Edit";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import IconButton from "@mui/material/IconButton";
import InputLabel from "@mui/material/InputLabel";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import MenuItem from "@mui/material/MenuItem";
import Modal from "@mui/material/Modal";
import Select from "@mui/material/Select";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useState, useEffect } from "react";
import CreateServiceForm from "@/components/CreateServiceForm";
import DayFormRow from "@/components/DayFormRow";
import adminService from "@/services/admin.service";
import servicesService from "@/services/services.service";

export default function AdminPage() {
  const [daysOfWeek, setDaysOfWeek] = useState(null);
  const [services, setServices] = useState(null);
  const [isCreateServiceModalOpen, setIsCreateServiceModalOpen] =
    useState(false);
  const [createServiceErrors, setCreateServiceErrors] =
    useState(null);
  const [employees, setEmployees] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedService, setSelectedService] = useState(null);
  const [employeeAvailability, setEmployeeAvailability] = useState(null);

  useEffect(() => {
    const fetchEmployees = async () => {
      const data = await adminService.getEmployees();
      return setEmployees(data);
    };

    const fetchDaysOfWeek = async () => {
      const data = await adminService.getDaysOfWeek();
      return setDaysOfWeek(data);
    };

    fetchDaysOfWeek();
    fetchEmployees();
    fetchServices();
  }, []);

  const fetchEmployeeAvailability = async (id) => {
    const data = await adminService.getEmployeeAvailability(id);
    return setEmployeeAvailability(data);
  };

  const fetchServices = async () => {
    const data = await servicesService.getServices();
    return setServices(data);
  };

  useEffect(() => {
    if (selectedEmployee) fetchEmployeeAvailability(selectedEmployee);
  }, [selectedEmployee]);

  const getEmployeeAvailabilityByDayId = (dayId) => {
    return employeeAvailability?.find((item) => item.dayId === dayId);
  };

  const applyEmployeeAvailability = async (dayId, startTime, endTime) => {
    await adminService.applyEmployeeAvailability({
      employeeId: selectedEmployee,
      dayId,
      startTime,
      endTime,
    });
    fetchEmployeeAvailability(selectedEmployee);
  };

  const deleteEmployeeAvailability = async (id) => {
    await adminService.deleteEmployeeAvailability(id);
    fetchEmployeeAvailability(selectedEmployee);
  };

  const deleteService = async (id) => {
    await servicesService.deleteService(id);
    setSelectedService(null);
    fetchServices();
  };

  const createNewService = async (service) => {
    try {
      setCreateServiceErrors(null);
      await servicesService.createService(service);

      setIsCreateServiceModalOpen(false);
      setSelectedService(null);
      fetchServices();
    } catch (error) {
      const parsedErrors = await JSON.parse(error.message);
      setCreateServiceErrors(parsedErrors);
    }
  };

  return (
    <main>
      <Box sx={{ width: "100%", maxWidth: 768 }}>
        <Typography variant="h6">
          <Link href="/">Main page</Link>
        </Typography>

        <Typography variant="h2">ADMIN</Typography>

        {employees && (
          <Box
            sx={{
              display: `flex`,
              alignItems: `center`,
              marginBottom: `20px`,
            }}
          >
            <Typography variant="h4" mr={2}>
              Employees:
            </Typography>

            <FormControl>
              <InputLabel id="employee-select-label">Choose Master</InputLabel>

              <Select
                sx={{ width: `200px` }}
                labelId="employee-select-label"
                id="employee-select"
                value={selectedEmployee}
                label="Choose Master"
                onChange={(event) => setSelectedEmployee(event.target.value)}
              >
                {employees.map((employee) => (
                  <MenuItem
                    key={employee.employeeId}
                    value={employee.employeeId}
                  >
                    {employee.employeeName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        )}

        {daysOfWeek && employeeAvailability && (
          <Box mt={3}>
            {daysOfWeek
              .sort((a, b) => a.dayId - b.dayId)
              .map((day) => (
                <DayFormRow
                  key={day.dayId}
                  day={day}
                  employeeAvailability={getEmployeeAvailabilityByDayId(
                    day.dayId
                  )}
                  applyEmployeeAvailability={applyEmployeeAvailability}
                  deleteEmployeeAvailability={deleteEmployeeAvailability}
                />
              ))}
          </Box>
        )}

        <Divider />

        <Box
          sx={{
            display: `flex`,
            alignItems: `center`,
            marginTop: `20px`,
          }}
        >
          <Typography variant="h4" mr={2}>
            Services
          </Typography>

          <IconButton
            color="primary"
            onClick={() => setIsCreateServiceModalOpen(true)}
          >
            <AddCircle />
          </IconButton>
        </Box>

        <List>
          {services &&
            services.map((service) => (
              <ListItem key={service.id}>
                <ListItemText
                  primary={service.name}
                  sx={{ flex: `0 0 200px` }}
                />

                <Box sx={{ width: `30px` }}>
                  <ListItemButton
                    sx={{ padding: `0` }}
                    onClick={() => {
                      setSelectedService(service);
                      setIsCreateServiceModalOpen(true);
                    }}
                  >
                    <ListItemIcon>
                      <EditIcon />
                    </ListItemIcon>
                  </ListItemButton>
                </Box>

                <Box sx={{ width: `30px` }}>
                  <ListItemButton
                    sx={{ padding: `0` }}
                    onClick={() => deleteService(service.id)}
                  >
                    <ListItemIcon>
                      <DeleteForeverIcon />
                    </ListItemIcon>
                  </ListItemButton>
                </Box>
              </ListItem>
            ))}
        </List>
      </Box>

      <Modal
        open={isCreateServiceModalOpen}
        onClose={() => {
          setIsCreateServiceModalOpen(false);
          setSelectedService(null);
          setCreateServiceErrors(null);
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 400,
            bgcolor: "background.paper",
            border: "2px solid #000",
            boxShadow: 24,
            p: 4,
          }}
        >
          <CreateServiceForm
            employees={employees || []}
            service={selectedService}
            createNewService={createNewService}
            formErrors={createServiceErrors}
          />
        </Box>
      </Modal>
    </main>
  );
}
