import {
  HomeRounded,
  CalendarMonthRounded,
  MiscellaneousServicesRounded,
  GroupsRounded,
  PersonSearchRounded,
  ReceiptLongRounded,
  CorporateFareRounded,
  AccountBoxRounded,
} from '@mui/icons-material';
import {
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { Link } from "react-router-dom";

const isActiveRoute = (currentPath, targetPath) => {
  if (targetPath === `/`) {
    return currentPath === `/`;
  }
  return currentPath.startsWith(targetPath);
};

export const MainListItems = ({ location }) => (
  <>
    <Link
      to={`/`}
      style={{ textDecoration: `none` }}
    >
      <ListItemButton
        selected={isActiveRoute(location?.pathname, `/`)}
      >
        <ListItemIcon>
          <HomeRounded />
        </ListItemIcon>
        <ListItemText
          primary="Dashboard"
        />
      </ListItemButton>
    </Link>

    <Link
      to={`/appointments`}
      style={{ textDecoration: `none` }}
    >
      <ListItemButton
        selected={isActiveRoute(location?.pathname, `/appointments`)}
      >
        <ListItemIcon>
          <CalendarMonthRounded />
        </ListItemIcon>
        <ListItemText
          primary="Appointments"
        />
      </ListItemButton>
    </Link>

    <Link
      to={`/services`}
      style={{ textDecoration: `none` }}
    >
      <ListItemButton
        selected={isActiveRoute(location?.pathname, `/services`)}
      >
        <ListItemIcon>
          <MiscellaneousServicesRounded />
        </ListItemIcon>
        <ListItemText
          primary="Services"
        />
      </ListItemButton>
    </Link>

    <Link
      to={`/employees`}
      style={{ textDecoration: `none` }}
    >
      <ListItemButton selected={isActiveRoute(location?.pathname, `/employees`)}>
        <ListItemIcon>
          <GroupsRounded />
        </ListItemIcon>

        <ListItemText primary="Team Members" />
      </ListItemButton>
    </Link>

    <Link
      to={`/customers`}
      style={{ textDecoration: `none` }}
    >
      <ListItemButton
        selected={isActiveRoute(location?.pathname, `/customers`)}
      >
        <ListItemIcon>
          <PersonSearchRounded />
        </ListItemIcon>
        <ListItemText
          primary="Customers"
        />
      </ListItemButton>
    </Link>

    <Link
      to={`/invoices`}
      style={{ textDecoration: `none` }}
    >
      <ListItemButton
        selected={isActiveRoute(location?.pathname, `/invoices`)}
      >
        <ListItemIcon>
          <ReceiptLongRounded />
        </ListItemIcon>
        <ListItemText
          primary="Invoices"
        />
      </ListItemButton>
    </Link>
  </>
);

export const SecondaryListItems = ({ location }) => (
  <>
    <Link
      to={`/company`}
      style={{ textDecoration: `none` }}
    >
      <ListItemButton
        selected={isActiveRoute(location?.pathname, `/company`)}
      >
        <ListItemIcon>
          <CorporateFareRounded />
        </ListItemIcon>
        <ListItemText
          primary="Company"
        />
      </ListItemButton>
    </Link>

    <Link
      to={`/account`}
      style={{ textDecoration: `none` }}
    >
      <ListItemButton
        selected={isActiveRoute(location?.pathname, `/account`)}
      >
        <ListItemIcon>
          <AccountBoxRounded />
        </ListItemIcon>
        <ListItemText
          primary="Account"
        />
      </ListItemButton>
    </Link>
  </>
);
