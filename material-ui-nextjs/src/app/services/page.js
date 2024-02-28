"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import { useState, useEffect } from "react";
import MonthCalendar from "@/components/MonthCalendar";
import servicesService from "@/services/services.service";

export default function ServicesPage() {
  const [services, setServices] = useState(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  useEffect(() => {
    const fetchServices = async () => {
      const data = await servicesService.getServices();
      return setServices(data);
    };

    fetchServices();
  }, []);

  const onBookAppointmentClick = (service) => {
    // setIsCalendarOpen(null)
    setIsCalendarOpen(prevState => {
      console.log(prevState);
      // Ensure that it's set to null regardless of its previous value
      return null;
    });

    setIsCalendarOpen(true)
    setSelectedService(service)
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
        {services?.map((service) => (
          <Box key={service.id} sx={{marginBottom: 2}}>
            <Typography variant="h6" sx={{width: '200px'}}>{service.name}</Typography>

            <Typography variant="body1">Duration Time: {service.durationTime}</Typography>

            <Typography variant="body1">Buffer Time: {service.bufferTime ?? '-'}</Typography>

            <Button
              sx={{marginLeft: 2}}
              variant="contained"
              onClick={() => onBookAppointmentClick(service)}
            >Book an appointment</Button>
          </Box>
        ))}
      </div>

      {isCalendarOpen && 
        <MonthCalendar service={selectedService} />
      }
    </Container>
  );
}
