import {
  AccountCircle,
  Construction,
  Dashboard,
  Face4,
  People,
  Event,
} from '@mui/icons-material';
import {
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { Link } from "react-router-dom";

export const mainListItems = (
  <>
    <Link to={`/`}>
      <ListItemButton>
        <ListItemIcon>
          <Dashboard />
        </ListItemIcon>

        <ListItemText primary="Dashboard" />
      </ListItemButton>
    </Link>

    <Link to={`/appointments`}>
      <ListItemButton>
        <ListItemIcon>
          <Event />
        </ListItemIcon>
        <ListItemText primary="Appointments" />
      </ListItemButton>
    </Link>

    <Link to={`/services`}>
      <ListItemButton>
        <ListItemIcon>
          <Construction />
        </ListItemIcon>
        <ListItemText primary="Services" />
      </ListItemButton>
    </Link>

    <Link to={`/employees`}>
      <ListItemButton>
        <ListItemIcon>
          <People />
        </ListItemIcon>

        <ListItemText primary="Employees" />
      </ListItemButton>
    </Link>

    <Link to={`/customers`}>
      <ListItemButton>
        <ListItemIcon>
          <Face4 />
        </ListItemIcon>
        <ListItemText primary="Customers" />
      </ListItemButton>
    </Link>
  </>
);

export const secondaryListItems = (
  <>
    <Link to={`/account`}>
      <ListItemButton>
        <ListItemIcon>
          <AccountCircle />
        </ListItemIcon>
        <ListItemText primary="Account" />
      </ListItemButton>
    </Link>
  </>
);