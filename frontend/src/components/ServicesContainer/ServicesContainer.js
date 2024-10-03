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
          marginLeft: `auto`,
          backgroundColor: `#1976d2`,
          width: `fit-content`,
          padding: `10px 20px 10px 30px`,
          borderRadius: `50px`,
        }}
      >
        <Typography variant="button"
          sx={{color: `#fff`}}
        >
          add service
        </Typography>

        <RouterLink to={`/services/create-service`}>
          <IconButton
            sx={{color: `#fff`}}
          >
            <AddCircle />
          </IconButton>
        </RouterLink>
      </Box>

      <List
        sx={{
          display: `flex`,
          flexDirection: `column`,
          gap: `1.5rem`,
          marginTop: `2rem`,
          maxWidth: `768px`,
        }}
      >
        {services &&
            services.map((service) => (
              <ListItem key={service.id}
                sx={{
                  padding: `10px 20px`,
                  border: `1px solid grey`,
                  borderTopLeftRadius: `20px`,
                  borderBottomLeftRadius: `20px`,
                  borderTopRightRadius: `20px`,
                  borderBottomRightRadius: `20px`,
                }}
              >
                <Box sx={{
                  display: `flex`,
                  flexDirection: `column`,
                  width: `80%`,
                  paddingRight: `1rem`,
                }}>
                  <ListItemText
                    primary={service.name}
                    sx={{
                      fontSize: `1.2rem`,
                      margin: `0`,
                    }}
                  />

                  <ListItemText
                    secondary={service.categoryName}
                    sx={{
                      fontSize: `1.1rem`,
                      margin: `0`,
                    }}
                  />
                </Box>

                <Box sx={{ 
                  width: `20%`,
                  alignSelf: `stretch`,
                  display: `flex`,
                  alignItems: `center`,
                  justifyContent: `center`,
                  borderLeft: `1px solid grey`,
              
                }}>
                  <RouterLink
                    style={{
                      height: `100%`,
                      width: `100%`,
                      display: `flex`,
                      alignItems: `center`,
                      justifyContent: `center`,
                    }}
                    to={`/services/${service.id}`}>
                    <ListItemButton
                      sx={{
                        padding: `0`,
                        display: `flex`,
                        flexGrow: `0`,
                      }}
                    >
                      <ListItemIcon sx={{
                        minWidth: `0`,
                      }}>
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