import AddCircle from "@mui/icons-material/AddCircle";
import EditIcon from "@mui/icons-material/Edit";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Modal from "@mui/material/Modal";
import Typography from "@mui/material/Typography";
import { useState, useEffect } from "react";
import CreateEmployeeForm from "@/components/CreateEmployeeForm";
import adminService from "@/services/admin.service";
import employeesService from "@/services/employees.service";

export default function AdminEmployeesModule({ 
  employees,
  fetchEmployees,
}) {
  const [daysOfWeek, setDaysOfWeek] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeAvailability, setEmployeeAvailability] = useState(null);
  const [isCreateEmployeeModalOpen, setIsCreateEmployeeModalOpen] = useState(false);
  const [createEmployeeErrors, setCreateEmployeeErrors] = useState(null);

  useEffect(() => {
    const fetchDaysOfWeek = async () => {
      const data = await adminService.getDaysOfWeek();
      return setDaysOfWeek(data);
    };

    fetchDaysOfWeek();
  }, []);

  const fetchEmployeeAvailability = async (id) => {
    const data = await employeesService.getEmployeeAvailability(id);
    return setEmployeeAvailability(data);
  };

  useEffect(() => {
    if (selectedEmployee) fetchEmployeeAvailability(selectedEmployee.employeeId);
  }, [selectedEmployee]);

  const applyEmployeeAvailability = async (dayId, startTime, endTime) => {
    await employeesService.applyEmployeeAvailability({
      employeeId: selectedEmployee,
      dayId,
      startTime,
      endTime,
    });
    fetchEmployeeAvailability(selectedEmployee.employeeId);
  };

  const deleteEmployeeAvailability = async (id) => {
    await employeesService.deleteEmployeeAvailability(id);
    fetchEmployeeAvailability(selectedEmployee.employeeId);
  };

  const createEmployee = async (employee) => {
    try {
      setCreateEmployeeErrors(null);

      if (employee.employeeId) {
        await employeesService.updateEmployee(employee);
      } else {
        await employeesService.createEmployee(employee);
      }

      setIsCreateEmployeeModalOpen(false);
      setSelectedEmployee(null);
      fetchEmployees();
    } catch (error) {
      const parsedErrors = await JSON.parse(error.message);
      setCreateEmployeeErrors(parsedErrors);
    }
  };

  return (
    <div>
      <Box
        sx={{
          display: `flex`,
          alignItems: `center`,
          marginTop: `20px`,
        }}
      >
        <Typography variant="h4" mr={2}>
          Employees
        </Typography>

        <IconButton
          color="primary"
          onClick={() => setIsCreateEmployeeModalOpen(true)}
        >
          <AddCircle />
        </IconButton>
      </Box>

      <List>
        {employees && employees.map((employee) => (
          <ListItem key={employee.employeeId}>
            <ListItemText
              primary={`${employee.firstName} ${employee.lastName}`}
              sx={{ flex: `0 0 200px` }}
            />

            <Box sx={{ width: `30px` }}>
              <ListItemButton
                sx={{ padding: `0` }}
                onClick={() => {
                  setSelectedEmployee(employee);
                  setIsCreateEmployeeModalOpen(true);
                }}
              >
                <ListItemIcon>
                  <EditIcon />
                </ListItemIcon>
              </ListItemButton>
            </Box>
          </ListItem>
        ))}
      </List>

      <Modal
        open={isCreateEmployeeModalOpen}
        onClose={() => {
          setIsCreateEmployeeModalOpen(false);
          setSelectedEmployee(null);
          setCreateEmployeeErrors(null);
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
          <CreateEmployeeForm
            employee={selectedEmployee}
            createEmployee={createEmployee}
            formErrors={createEmployeeErrors}
            daysOfWeek={daysOfWeek}
            employeeAvailability={employeeAvailability}
            applyEmployeeAvailability={applyEmployeeAvailability}
            deleteEmployeeAvailability={deleteEmployeeAvailability}
          />
        </Box>
      </Modal>
    </div>
  );
}