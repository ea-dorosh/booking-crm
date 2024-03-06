import AddCircle from "@mui/icons-material/AddCircle";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
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
import CreateServiceForm from "@/components/CreateServiceForm";
import servicesService from "@/services/services.service";

export default function AdminServicesModule({ employees }) {
  const [services, setServices] = useState(null);
  const [isCreateServiceModalOpen, setIsCreateServiceModalOpen] = useState(false);
  const [createServiceErrors, setCreateServiceErrors] = useState(null);
  const [selectedService, setSelectedService] = useState(null);

  const fetchServices = async () => {
    const data = await servicesService.getServices();
    return setServices(data);
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

  useEffect(() => {
    fetchServices();
  }, []);

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
    </div>
  );
}