import AddCircle from "@mui/icons-material/AddCircle";
import EditIcon from "@mui/icons-material/Edit";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import { Link as RouterLink } from 'react-router-dom';

export default function ServicesContainer({ 
  services,
}) {
  return (
    <Box>
      <Box
        sx={{
          display: `flex`,
          alignItems: `center`,
          marginTop: `20px`,
        }}
      >
        <Typography variant="button" mr={2}>
          add service
        </Typography>

        <RouterLink to={`/services/create-service`}>
          <IconButton
            color="primary"
          >
            <AddCircle />
          </IconButton>
        </RouterLink>
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
                  <RouterLink to={`/services/${service.id}`}>
                    <ListItemButton
                      sx={{ padding: `0` }}
                    >
                      <ListItemIcon>
                        <EditIcon />
                      </ListItemIcon>
                    </ListItemButton>
                  </RouterLink>
                </Box>
              </ListItem>
            ))}
      </List>
    </Box>
  );
}