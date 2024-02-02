"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import { useState, useEffect } from "react";
import servicesService from "@/services/services.service";

export default function ServicesPage() {
  const [services, setServices] = useState(null);

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

      <ul>
        {services?.map((service) => (
          <li key={service.id}>
            {service.name}

            <Button variant="contained">Book an appointment</Button>
          </li>
        ))}
      </ul>
    </Container>
  );
}
