/* eslint-disable no-unused-vars */
import {
  North,
  South,
  Sort,
} from '@mui/icons-material';
import { 
  Box,
  IconButton,
  Menu,
  MenuItem,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { 
  setSortingRule,
} from '@/features/appointments/appointmentsSlice';

export default function AppointmentsPage() {
  const dispatch = useDispatch();

  const [menuEl, setMenuEl] = useState(null);
  const isSortMenuOpen = Boolean(menuEl);

  const { sortRule, sortDirection } = useSelector((state) => state.appointments);

  const handleMenuClick = (event) => {
    setMenuEl(event.currentTarget);
  };

  const handleClose = () => {
    setMenuEl(null);
  };

  const updateSortOrder = (newSortRule) => {
    const newSortDirection = sortRule === newSortRule &&
    sortDirection === `desc` ? `asc` : `desc`;

    dispatch(setSortingRule({
      sortRule: newSortRule,
      sortDirection: newSortDirection,
    }));

    handleClose();
  };

  return (
    <Box>
      <IconButton
        variant="outlined"
        onClick={handleMenuClick}
      >
        <Sort />
      </IconButton>

      <Menu
        anchorEl={menuEl}
        open={isSortMenuOpen}
        onClose={handleClose}
        sx={{
          '& .MuiList-root': {
            padding: 0,
          }
        }}
      >
        <MenuItem 
          onClick={() => updateSortOrder(`date`)}
          sx={{
            backgroundColor: sortRule === `date` ? `lightgrey` : `initial`,
            display: `flex`,
              
          }}
        >
          <South 
            fontSize='small'
            sx={{
              color: sortRule === `date` && sortDirection === `desc` ? `initial` : `grey`,
            }}
          /> 

          <North 
            fontSize='small'
            sx={{
              color: sortRule === `date` && sortDirection === `asc` ? `initial` : `grey`,
            }}
          />

          <Typography
            sx={{
              marginLeft: 1.5,
            }}
          >
              Date
          </Typography>
        </MenuItem>

        <MenuItem 
          onClick={() => updateSortOrder(`createdDate`)}
          sx={{
            backgroundColor: sortRule === `createdDate` ? `lightgrey` : `initial`,
          }}
        >
          <South 
            fontSize='small'
            sx={{
              color: sortRule === `createdDate` && sortDirection === `desc` ? `initial` : `grey`,
            }}
          /> 

          <North 
            fontSize='small'
            sx={{
              color: sortRule === `createdDate` && sortDirection === `asc` ? `initial` : `grey`,
            }}
          />

          <Typography
            sx={{
              marginLeft: 1.5,
            }}
          >
              Created Date
          </Typography>
        </MenuItem>
      </Menu>
    </Box>
  );
}
