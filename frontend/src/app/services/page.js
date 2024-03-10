"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Container from "@mui/material/Container";
import FormControlLabel from "@mui/material/FormControlLabel";
import Typography from "@mui/material/Typography";
import { useState, useEffect } from "react";
import BookServiceForm from '@/components/BookServiceForm';
import MonthCalendar from "@/components/MonthCalendar";
import appointmentsService from '@/services/appointments.service';
import employeesService from "@/services/employees.service";
import servicesService from "@/services/services.service";
import { formattedTime } from '@/utils/formatters';

const FORM_STEPS = {
  SERVICES: 1,
  EMPLOYEES: 2,
  CALENDAR: 3,
  EMPLOYEES_FOR_CURRENT_SLOT: 4,
  CUSTOMER_FORM: 5,
  FINISH: 6,
};

export default function ServicesPage() {
  const [services, setServices] = useState(null);
  const [employees, setEmployees] = useState(null);
  const [filteredEmployees, setFilteredEmployees] = useState(null);

  const [selectedService, setSelectedService] = useState(null);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
  const [selectedEmployeeFromTimeSlotAvailability, setSelectedEmployeeFromTimeSlotAvailability] = useState(null);

  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [createAppointmentErrors, setCreateAppointmentErrors] = useState(null);

  const [formStep, setFormStep] = useState(FORM_STEPS.SERVICES);

  const shouldShowServices = formStep === FORM_STEPS.SERVICES;
  const shouldShowServiceDetails = formStep > FORM_STEPS.SERVICES && formStep < FORM_STEPS.FINISH;
  const shouldShowEmployees = formStep === FORM_STEPS.EMPLOYEES;
  const shouldShowEmployeeDetails = formStep > FORM_STEPS.EMPLOYEES && formStep < FORM_STEPS.FINISH;
  const shouldShowCalendar = formStep === FORM_STEPS.CALENDAR;
  const shouldShowCalendarDetails = formStep > FORM_STEPS.CALENDAR && formStep < FORM_STEPS.FINISH;
  const shouldShowEmployeesForCurrentSlot = formStep === FORM_STEPS.EMPLOYEES_FOR_CURRENT_SLOT;
  const shouldShowCustomerForm = formStep === FORM_STEPS.CUSTOMER_FORM;
  const shouldShowApproveMessage = formStep === FORM_STEPS.FINISH;

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
    setSelectedEmployeeFromTimeSlotAvailability(null);
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
    setSelectedTimeSlot(null);
    setSelectedEmployeeFromTimeSlotAvailability(null);
    setFormStep(FORM_STEPS.EMPLOYEES);
  }

  const onSelectTimeSlotClick = (slot) => {
    setSelectedTimeSlot(slot);

    if (slot.employeeId.length > 1) {
      setFormStep(FORM_STEPS.EMPLOYEES_FOR_CURRENT_SLOT);
    } else {
      setSelectedEmployeeFromTimeSlotAvailability(slot.employeeId[0]);
      setFormStep(FORM_STEPS.CUSTOMER_FORM);
    }
  }

  const onChangeDateAndTimeClick = () => {
    setFormStep(FORM_STEPS.CALENDAR);
    setSelectedTimeSlot(null)
    setSelectedEmployeeFromTimeSlotAvailability(null);
  }

  const createAppointmentHadler = async (formData) => {
    const appointmentData = {
      ...formData,
      date: selectedDay.day,
      time: selectedTimeSlot.startTime,
      serviceId: selectedService.id,
      serviceDuration: selectedService.duration,
      employeeId: selectedEmployeeFromTimeSlotAvailability,
    };

    try {
      await appointmentsService.createAppointment(appointmentData);
      
      // reset form after successful submission
      setFormStep(FORM_STEPS.FINISH);
      setSelectedService(null);
      setSelectedEmployeeIds([]);
      setSelectedDay(null);
      setSelectedTimeSlot(null);
      setCreateAppointmentErrors(null);
      setSelectedEmployeeFromTimeSlotAvailability(null);
    } catch (error) {
      const parsedErrors = await JSON.parse(error.message);
      setCreateAppointmentErrors(parsedErrors);
    }
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
        <Typography variant="body1" gutterBottom>
          selectedService: {selectedService?.toString()}
        </Typography>
        <Typography variant="body1" gutterBottom>
        selectedEmployeeIds: {selectedEmployeeIds?.toString()}
        </Typography>
        <Typography variant="body1" gutterBottom>
        selectedEmployeeFromTimeSlotAvailability: {selectedEmployeeFromTimeSlotAvailability?.toString()}
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
              onClick={onChangeEmployeeClick}
            >Change master</Button>
          </Box>
        }
      </div>

      {shouldShowCalendar && 
        <MonthCalendar 
          service={selectedService}
          employees={selectedEmployeeIds}
          setSelectedDay={setSelectedDay}
          selectedTimeSlot={selectedTimeSlot}
          setSelectedTimeSlot={onSelectTimeSlotClick}
        />
      }

      {shouldShowCalendarDetails && 
        <Box sx={{
          display: 'flex',
          justifyContent: 'flex-start',
          gap: '30px',
          marginTop: '30px',
        }}>
          <Box>
            <Typography>
              Selected day: {selectedDay.day}
            </Typography>

            <Typography>
              Selected time slot: {formattedTime(selectedTimeSlot.startTime)}
            </Typography>
          </Box>

          <Button
            onClick={onChangeDateAndTimeClick}
          >
            Change date and time
          </Button>
        </Box>
      }

      {shouldShowEmployeesForCurrentSlot && 
        <Box sx={{
          marginTop: '30px',
        }}>
          <Typography>
            At this time the following masters are available:
          </Typography>

          {selectedTimeSlot.employeeId.map((employeeId) => {
            const employee = employees.find((emp) => emp.employeeId === employeeId);

            return (
              <Box 
                key={employeeId} 
                sx={{
                  display: 'flex',
                  gap: '30px',
                }}
              >
                <Typography>
                  {employee.firstName} {employee.lastName}
                </Typography>

                <Button onClick={()=>{
                  setSelectedEmployeeFromTimeSlotAvailability(employeeId);
                  setFormStep(FORM_STEPS.CUSTOMER_FORM);
                }}>Choose</Button>
              </Box>
            );
          })}

          <Button onClick={()=>{
            setSelectedEmployeeFromTimeSlotAvailability(selectedTimeSlot.employeeId[0]);
            setFormStep(FORM_STEPS.CUSTOMER_FORM)
          }}>Continue with any Master</Button>
        </Box>
      }

      {shouldShowCustomerForm && 
        <Box>
          <Box sx={{
            marginTop: '20px',
          }}>
            <BookServiceForm 
              createAppointment={createAppointmentHadler}
              formErrors={createAppointmentErrors}
            />
          </Box>
        </Box>
      }

      {shouldShowApproveMessage && 
        <Box>
          <Typography>
            Your appointment has been created!
          </Typography>

          <Button
            onClick={()=> setFormStep(FORM_STEPS.SERVICES)}
          >
            Choose next service
          </Button>
        </Box>
      }
    </Container>
  );
}
