import { 
  AddCircle,
  Edit,
} from "@mui/icons-material";
import { 
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  Typography,
  Box,
  Card, 
  CardHeader,
} from "@mui/material";
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
              <Card 
                key={service.id}
                sx={{
                  display: `flex`,
                  alignItems: `center`,
                  gap: `1rem`,
                }}
              >
                <Box sx={{
                  width: `80%`,
                  paddingRight: `1rem`,
                }}>
                  <CardHeader
                    sx={{
                      '& .MuiCardHeader-title': {
                        fontSize: `1.2rem`,
                      },
                    }}
                    title={service.name}
                    subheader={service.categoryName}
                  />
                </Box>

                <Box>
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
                        <Edit />
                      </ListItemIcon>
                    </ListItemButton>
                  </RouterLink>
                </Box>
              </Card>
            ))}
      </List>
    </Box>
  );
}