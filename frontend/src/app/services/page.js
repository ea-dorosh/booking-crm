"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Container from "@mui/material/Container";
import FormControlLabel from "@mui/material/FormControlLabel";
import Typography from "@mui/material/Typography";
import { useState, useEffect } from "react";
import MonthCalendar from "@/components/MonthCalendar";
import employeesService from "@/services/employees.service";
import servicesService from "@/services/services.service";

const FORM_STEPS = {
  SERVICES: 1,
  EMPLOYEES: 2,
  CALENDAR: 3,
  CUSTOMER_FORM: 4,
};

export default function ServicesPage() {
  const [services, setServices] = useState(null);
  const [employees, setEmployees] = useState(null);
  const [filteredEmployees, setFilteredEmployees] = useState(null);

  const [selectedService, setSelectedService] = useState(null);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);

  const [formStep, setFormStep] = useState(FORM_STEPS.SERVICES);

  const shouldShowServices = formStep === FORM_STEPS.SERVICES;
  const shouldShowServiceDetails = formStep > FORM_STEPS.SERVICES;
  const shouldShowEmployees = formStep === FORM_STEPS.EMPLOYEES;
  const shouldShowEmployeeDetails = formStep > FORM_STEPS.EMPLOYEES;
  const shouldShowCalendar = formStep === FORM_STEPS.CALENDAR;
  const shouldShowCalendarDetails = formStep > FORM_STEPS.CALENDAR;
  const shouldShowCustomerForm = formStep === FORM_STEPS.CUSTOMER_FORM;

  useEffect(() => {
    if (selectedService) {
      const filtered = employees.filter((employee) => {
        return selectedService.employeeIds.includes(employee.employeeId);
      });

      setFilteredEmployees(filtered);
    } else {
      setFilteredEmployees(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedService]);

  useEffect(() => {
    const fetchServices = async () => {
      const data = await servicesService.getServices();
      return setServices(data);
    };

    const fetchEmployess = async () => {
      const data = await employeesService.getEmployees();
      return setEmployees(data);
    };

    fetchServices();
    fetchEmployess();
  }, []);

  const onSelectServiceClick = (service) => {
    setSelectedService(service);

    setFormStep(FORM_STEPS.EMPLOYEES);
  }

  const onChangeServiceClick = () => {
    setSelectedService(null);
    setSelectedEmployeeIds([]);

    setFormStep(FORM_STEPS.SERVICES);
  }

  const onSelectEmployeeClick = () => {
    if (selectedEmployeeIds.length) {
      setFormStep(FORM_STEPS.CALENDAR)
    }
  }

  const handleEmployeeChange = (event) => {
    const { value, checked } = event.target;
    
    setSelectedEmployeeIds((prevData) => (
      checked ? // eslint-disable-next-line no-undef
        [...new Set([...prevData, Number(value)])]
        : prevData.filter(
          (id) => Number(id) !== Number(value)
        )
    ));
  };

  const onChangeEmployeeClick = () => {
    setSelectedEmployee(null);

    setFormStep(FORM_STEPS.EMPLOYEES);
  }

  return (
    <Container>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Typography variant="body1" gutterBottom>
          Services Page
        </Typography>
      </Box>

      <div>
        {shouldShowServices && services?.map((service) => (
          <Box key={service.id} sx={{marginBottom: 2}}>
            <Typography variant="h6" sx={{width: '200px'}}>{service.name}</Typography>

            <Typography variant="body1">Duration Time: {service.durationTime}</Typography>

            <Typography variant="body1">Buffer Time: {service.bufferTime ?? '-'}</Typography>

            <Button
              sx={{marginLeft: 2}}
              variant="contained"
              onClick={() => onSelectServiceClick(service)}
            >Book an appointment</Button>
          </Box>
        ))}

        {shouldShowServiceDetails && 
          <Box sx={{display: `flex`}}>
            <Typography>
              You chose: {selectedService.name}
            </Typography>

            <Button
              sx={{marginLeft: 2}}
              onClick={onChangeServiceClick}
            >Change service</Button>
          </Box>
        }
      </div>

      <div>
        <Box sx={{display: `flex`, flexDirection: `column`}}>
          {shouldShowEmployees && filteredEmployees?.map((employee) => (
            <FormControlLabel
              key={employee.employeeId}
              control={
                <Checkbox
                  name="employeeName"
                  checked={selectedEmployeeIds.includes(employee.employeeId)}
                  onChange={handleEmployeeChange}
                  value={employee.employeeId}
                />
              }
              label={`${employee.firstName} ${employee.lastName}`}
            />
          ))}
        </Box>
        
        {shouldShowEmployees && <Button
          sx={{marginLeft: 2}}
          variant="contained"
          disabled={selectedEmployeeIds.length === 0}
          onClick={onSelectEmployeeClick}
        >Choose date</Button>}

        {shouldShowEmployeeDetails && 
          <Box sx={{display: `flex`}}>
            <Box sx={{display: `flex`, flexDirection: `column`}}>
              {selectedEmployeeIds.map((employeeId) => {
                const employee = employees.find((emp) => emp.employeeId === employeeId);

                return (
                  <Typography key={employeeId}>
                    {employee.firstName} {employee.lastName}
                  </Typography>
                );
              })}
            </Box>

            <Button
              sx={{marginLeft: 2}}
              onClick={onChangeServiceClick}
            >Change master</Button>
          </Box>
        }
      </div>

      {shouldShowCalendar && 
        <MonthCalendar 
          service={selectedService}
          employees={selectedEmployeeIds}
        />
      }
    </Container>
  );
}
