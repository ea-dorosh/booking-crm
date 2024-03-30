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
        }}
      >
        <Typography variant="button" mr={2}>
          add employee
        </Typography>

        <RouterLink to={`/employees/create-employee`}>
          <IconButton
            color="primary"
            onClick={()=>{}}
          >
            <AddCircle />
          </IconButton>
        </RouterLink>
      </Box>

      <List>
        {employees.map((employee) => (
          <ListItem key={employee.employeeId}>
            <ListItemText
              primary={`${employee.firstName} ${employee.lastName}`}
              sx={{ flex: `0 0 200px` }}
            />

            <Box sx={{ width: `30px` }}>
              <RouterLink to={`/employees/${employee.employeeId}`}>
                <ListItemButton
                  sx={{ padding: `0` }}
                  onClick={() => {}}
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