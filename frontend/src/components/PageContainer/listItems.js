import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ConstructionIcon from '@mui/icons-material/Construction';
import DashboardIcon from '@mui/icons-material/Dashboard';
import Face4Icon from '@mui/icons-material/Face4';
import PeopleIcon from '@mui/icons-material/People';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import * as React from 'react';
import { Link } from "react-router-dom";

export const mainListItems = (
  <React.Fragment>
    <Link to={`/`}>
      <ListItemButton>
        <ListItemIcon>
          <DashboardIcon />
        </ListItemIcon>

        <ListItemText primary="Dashboard" />
      </ListItemButton>
    </Link>

    <Link to={`/employees`}>
      <ListItemButton>
        <ListItemIcon>
          <PeopleIcon />
        </ListItemIcon>

        <ListItemText primary="Employees" />
      </ListItemButton>
    </Link>

    <Link to={`/services`}>
      <ListItemButton>
        <ListItemIcon>
          <ConstructionIcon />
        </ListItemIcon>
        <ListItemText primary="Services" />
      </ListItemButton>
    </Link>

    <Link to={`/clients`}>
      <ListItemButton>
        <ListItemIcon>
          <Face4Icon />
        </ListItemIcon>
        <ListItemText primary="Clients" />
      </ListItemButton>
    </Link>
  </React.Fragment>
);

export const secondaryListItems = (
  <React.Fragment>
    <Link to={`/account`}>
      <ListItemButton>
        <ListItemIcon>
          <AccountCircleIcon />
        </ListItemIcon>
        <ListItemText primary="Account" />
      </ListItemButton>
    </Link>
  </React.Fragment>
);