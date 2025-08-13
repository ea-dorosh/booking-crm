import {
  ChevronLeft,
  Menu,
} from '@mui/icons-material';
import {
  AppBar as MuiAppBar,
  Box,
  Divider,
  Drawer as MuiDrawer,
  IconButton,
  List,
  Toolbar,
  Typography,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import * as React from 'react';
import { useLocation } from "react-router-dom";
import { MainListItems, SecondaryListItems } from './listItems';

const drawerWidth = 240;

const AppBar = styled(MuiAppBar)(({ theme }) => ({
  zIndex: theme.zIndex.drawer + 1,
}));

const CollapsedDrawer = styled(MuiDrawer)(({ theme }) => ({
  '& .MuiDrawer-paper': {
    position: `relative`,
    whiteSpace: `nowrap`,
    width: 52,
    transition: theme.transitions.create(`width`, {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    boxSizing: `border-box`,
    overflowX: `hidden`,
    '& .MuiListItemText-root': {
      opacity: 0,
    },
    '& .MuiListItemButton-root': {
      paddingLeft: 20,
      paddingRight: 20,
      justifyContent: `center`,
    },
    '& .MuiListItemIcon-root': {
      minWidth: `auto`,
      marginRight: 0,
    },
  },
}));

const ExpandedDrawer = styled(MuiDrawer)(() => ({
  '& .MuiDrawer-paper': {
    width: drawerWidth,
    boxSizing: `border-box`,
  },
}));

export default function PageContainer({
  pageTitle,
  hideSideNav,
  children,
}) {
  const location = useLocation();
  const [open, setOpen] = React.useState(false);

  const toggleDrawer = () => {
    setOpen(!open);
  };

  return (
    <Box
      sx={{ display: `flex` }}
    >
      <AppBar
        position="absolute"
      >
        <Toolbar
          sx={{
            pr: `24px`, // keep right padding when drawer closed
          }}
        >
          <IconButton
            edge="start"
            color="inherit"
            onClick={toggleDrawer}
            sx={{
              marginRight: `28px`,
              ml: `-9px`,

              '&:hover': {
                backgroundColor: `transparent`,
              },
            }}
          >
            <Menu />
          </IconButton>

          <Typography
            component="h1"
            variant="h6"
            color="inherit"
            noWrap
            sx={{ flexGrow: 1 }}
          >
            { pageTitle }
          </Typography>
        </Toolbar>
      </AppBar>

      {!hideSideNav && (
        /* Collapsed menu - always visible on normal pages */
        <CollapsedDrawer
          variant="permanent"
        >
          <Toolbar />
          <Divider />
          <List
            component="nav"
            sx={{ px: .5 }}
          >
            <MainListItems
              location={location}
            />
            <Divider
              sx={{ my: 1 }}
            />
            <SecondaryListItems
              location={location}
            />
          </List>
        </CollapsedDrawer>
      )}

      {/* Expanded menu - overlay when hamburger clicked (on all pages) */}
      <ExpandedDrawer
        variant="temporary"
        open={open}
        onClose={toggleDrawer}
        ModalProps={{
          keepMounted: true,
        }}
      >
        <Toolbar
          sx={{
            display: `flex`,
            alignItems: `center`,
            justifyContent: `flex-end`,
            px: [1],
          }}
        >
          <IconButton
            onClick={toggleDrawer}
          >
            <ChevronLeft />
          </IconButton>
        </Toolbar>

        <Divider />

        <List
          component="nav"
          sx={{ px: 1 }}
        >
          <MainListItems
            location={location}
          />
          <Divider
            sx={{ my: 1 }}
          />
          <SecondaryListItems
            location={location}
          />
        </List>
      </ExpandedDrawer>

      <Box
        component="main"
        sx={{
          backgroundColor: (theme) =>
            theme.palette.mode === `light`
              ? theme.palette.grey[100]
              : theme.palette.grey[900],
          flexGrow: 1,
        }}
      >
        <Toolbar />

        <Box
          sx={{
            padding: `24px`,
            minHeight: `calc(100vh - 64px)`,
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
