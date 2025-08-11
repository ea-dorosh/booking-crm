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
  APPOINTMENTS_SORT_RULE,
  SORT_DIRECTION,
} from '@/constants/sorting';
import { 
  setSortingRule,
} from '@/features/appointments/appointmentsSlice';

export default function AppointmentsPage() {
  const dispatch = useDispatch();

  const [menuEl, setMenuEl] = useState(null);
  const isSortMenuOpen = Boolean(menuEl);

  const {
    sortRule, sortDirection, 
  } = useSelector((state) => state.appointments);

  const handleMenuClick = (event) => {
    setMenuEl(event.currentTarget);
  };

  const handleClose = () => {
    setMenuEl(null);
  };

  const updateSortOrder = (newSortRule) => {
    const newSortDirection = sortRule === newSortRule &&
    sortDirection === SORT_DIRECTION.DESC ? SORT_DIRECTION.ASC : SORT_DIRECTION.DESC;

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
          },
        }}
      >
        <MenuItem 
          onClick={() => updateSortOrder(APPOINTMENTS_SORT_RULE.DATE)}
          sx={{
            backgroundColor: sortRule === APPOINTMENTS_SORT_RULE.DATE ? 
              `lightgrey` : `initial`,
            display: `flex`,
              
          }}
        >
          <North 
            fontSize='small'
            sx={{
              color: sortRule === APPOINTMENTS_SORT_RULE.DATE && sortDirection === SORT_DIRECTION.ASC ? `initial` : `grey`,
            }}
          />

          <South 
            fontSize='small'
            sx={{
              color: sortRule === APPOINTMENTS_SORT_RULE.DATE && sortDirection === SORT_DIRECTION.DESC
                ? `initial` : `grey`,
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
          onClick={() => updateSortOrder(APPOINTMENTS_SORT_RULE.CREATED_DATE)}
          sx={{
            backgroundColor: sortRule === APPOINTMENTS_SORT_RULE.CREATED_DATE ? `lightgrey` : `initial`,
          }}
        >
          <North 
            fontSize='small'
            sx={{
              color: sortRule === APPOINTMENTS_SORT_RULE.CREATED_DATE && sortDirection === SORT_DIRECTION.ASC ? `initial` : `grey`,
            }}
          />
          
          <South 
            fontSize='small'
            sx={{
              color: sortRule === APPOINTMENTS_SORT_RULE.CREATED_DATE && sortDirection === SORT_DIRECTION.DESC ? `initial` : `grey`,
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
