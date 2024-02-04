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
  const [isCalendarOpen, setIsCalendarOpen] = useState(null);

  useEffect(() => {
    const fetchServices = async () => {
      const data = await servicesService.getServices();
      return setServices(data);
    };

    fetchServices();
  }, []);

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
          <div key={service.id}>
            {service.name}

            <Button 
              variant="contained"
              onClick={() => setIsCalendarOpen(service.id)}
            >Book an appointment</Button>
          </div>
        ))}
      </div>

      {isCalendarOpen && 
        <MonthCalendar />
      }
    </Container>
  );
}
