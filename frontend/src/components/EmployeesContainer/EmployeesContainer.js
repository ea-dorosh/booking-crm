import { 
  AddCircle,
  Edit,
} from "@mui/icons-material";
import { 
  Box,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  Typography,
  Card, 
  CardHeader,
  Avatar,
} from "@mui/material";
import { Link as RouterLink } from 'react-router-dom';

export default function EmployeesContainer({ 
  employees,
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
          add employee
        </Typography>

        <RouterLink to={`/employees/create-employee`}>
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
        {employees.map((employee) => (
          <Card 
            key={employee.employeeId}
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
                title={`${employee.firstName} ${employee.lastName}`}
                subheader={employee.email}
                avatar={
                  <Avatar src={employee.image}/>
                }
              />
            </Box>            

            <Box sx={{ width: `30px` }}>
              <RouterLink
                style={{
                  height: `100%`,
                  width: `100%`,
                  display: `flex`,
                  alignItems: `center`,
                  justifyContent: `center`,
                }}
                to={`/employees/${employee.employeeId}`}
              >
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