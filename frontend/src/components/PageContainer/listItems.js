import {
  AccountCircle,
  Construction,
  Dashboard,
  Description,
  Face4,
  People,
  Business,
  Event,
} from '@mui/icons-material';
import {
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { Link } from "react-router-dom";

export const MainListItems = ({location}) => (
  <>
    <Link to={`/`} style={{ textDecoration: `none`, color: `#0000008a` }}>
      <ListItemButton>
        <ListItemIcon>
          <Dashboard sx={{ color: location?.pathname === `/` ? `primary.main` : `#0000008a` }} />
        </ListItemIcon>

        <ListItemText primary="Dashboard" sx={{
          color: location?.pathname === `/` ? `primary.main` : `#0000008a`,
        }}/>
      </ListItemButton>
    </Link>

    <Link to={`/appointments`} style={{ textDecoration: `none`, color: `#0000008a` }}>
      <ListItemButton>
        <ListItemIcon>
          <Event sx={{ color: location?.pathname === `/appointments` ? `primary.main` : `#0000008a` }} />
        </ListItemIcon>
        <ListItemText primary="Appointments" sx={{
          color: location?.pathname === `/appointments` ? `primary.main` : `#0000008a`,
        }}/>
      </ListItemButton>
    </Link>

    <Link to={`/services`} style={{ textDecoration: `none`, color: `#0000008a` }}>
      <ListItemButton>
        <ListItemIcon>
          <Construction sx={{ color: location?.pathname === `/services` ? `primary.main` : `#0000008a` }} />
        </ListItemIcon>
        <ListItemText primary="Services" sx={{
          color: location?.pathname === `/services` ? `primary.main` : `#0000008a`,
        }}/>
      </ListItemButton>
    </Link>

    <Link to={`/employees`} style={{ textDecoration: `none`, color: `#0000008a` }}>
      <ListItemButton>
        <ListItemIcon>
          <People sx={{ color: location?.pathname === `/employees` ? `primary.main` : `#0000008a` }} />
        </ListItemIcon>

        <ListItemText primary="Employees" sx={{
          color: location?.pathname === `/employees` ? `primary.main` : `#0000008a`,
        }}/>
      </ListItemButton>
    </Link>

    <Link to={`/customers`} style={{ textDecoration: `none`, color: `#0000008a` }}>
      <ListItemButton>
        <ListItemIcon>
          <Face4 sx={{ color: location?.pathname === `/customers` ? `primary.main` : `#0000008a` }} />
        </ListItemIcon>
        <ListItemText primary="Customers" sx={{
          color: location?.pathname === `/customers` ? `primary.main` : `#0000008a`,
        }}/>
      </ListItemButton>
    </Link>

    <Link to={`/invoices`} style={{ textDecoration: `none`, color: `#0000008a` }}>
      <ListItemButton>
        <ListItemIcon>
          <Description sx={{ color: location?.pathname === `/invoices` ? `primary.main` : `#0000008a` }} />
        </ListItemIcon>
        <ListItemText primary="Invoices" sx={{
          color: location?.pathname === `/invoices` ? `primary.main` : `#0000008a`,
        }}/>
      </ListItemButton>
    </Link>
  </>
);

export const SecondaryListItems = ({location}) => (
  <>
    <Link to={`/company`} style={{ textDecoration: `none`, color: `#0000008a` }}>
      <ListItemButton>
        <ListItemIcon>
          <Business sx={{ color: location?.pathname === `/company` ? `primary.main` : `#0000008a` }} />
        </ListItemIcon>
        <ListItemText primary="Company" sx={{
          color: location?.pathname === `/company` ? `primary.main` : `#0000008a`,
        }}/>
      </ListItemButton>
    </Link>

    <Link to={`/account`} style={{ textDecoration: `none`, color: `#0000008a` }}>
      <ListItemButton>
        <ListItemIcon>
          <AccountCircle sx={{ color: location?.pathname === `/account` ? `primary.main` : `#0000008a` }} />
        </ListItemIcon>
        <ListItemText primary="Account" sx={{
          color: location?.pathname === `/account` ? `primary.main` : `#0000008a`,
        }}/>
      </ListItemButton>
    </Link>
  </>
);