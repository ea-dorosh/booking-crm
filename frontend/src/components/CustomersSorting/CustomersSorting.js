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
  CUSTOMERS_SORT_RULE,
  SORT_DIRECTION,
} from '@/constants/sorting';
import { setSortingRule } from '@/features/customers/customersSlice';

export default function CustomersSorting() {
  const dispatch = useDispatch();

  const [menuEl, setMenuEl] = useState(null);
  const isSortMenuOpen = Boolean(menuEl);

  const { sortRule, sortDirection } = useSelector((state) => state.customers);

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
          }
        }}
      >
        <MenuItem 
          onClick={() => updateSortOrder(CUSTOMERS_SORT_RULE.LAST_NAME)}
          sx={{
            backgroundColor: sortRule === CUSTOMERS_SORT_RULE.LAST_NAME ? `lightgrey` : `initial`,
            display: `flex`,
              
          }}
        >
          <South 
            fontSize='small'
            sx={{
              color: sortRule === CUSTOMERS_SORT_RULE.LAST_NAME && sortDirection === SORT_DIRECTION.DESC ? `initial` : `grey`,
            }}
          /> 

          <North 
            fontSize='small'
            sx={{
              color: sortRule === CUSTOMERS_SORT_RULE.LAST_NAME && sortDirection === SORT_DIRECTION.ASC ? `initial` : `grey`,
            }}
          />

          <Typography
            sx={{
              marginLeft: 1.5,
            }}
          >
            Last Name
          </Typography>
        </MenuItem>

        <MenuItem
          onClick={() => updateSortOrder(CUSTOMERS_SORT_RULE.FIRST_NAME)}
          sx={{
            backgroundColor: sortRule === CUSTOMERS_SORT_RULE.FIRST_NAME ? `lightgrey` : `initial`,
          }}
        >
          <South 
            fontSize='small'
            sx={{
              color: sortRule === CUSTOMERS_SORT_RULE.FIRST_NAME && sortDirection === SORT_DIRECTION.DESC ? `initial` : `grey`,
            }}
          /> 

          <North 
            fontSize='small'
            sx={{
              color: sortRule === CUSTOMERS_SORT_RULE.FIRST_NAME && sortDirection === SORT_DIRECTION.ASC ? `initial` : `grey`,
            }}
          />

          <Typography
            sx={{
              marginLeft: 1.5,
            }}
          >
            First Name
          </Typography>
        </MenuItem>

        <MenuItem
          onClick={() => updateSortOrder(CUSTOMERS_SORT_RULE.ADDED_DATE)}
          sx={{
            backgroundColor: sortRule === CUSTOMERS_SORT_RULE.ADDED_DATE ? `lightgrey` : `initial`,
          }}
        >
          <South 
            fontSize='small'
            sx={{
              color: sortRule === CUSTOMERS_SORT_RULE.ADDED_DATE && sortDirection === SORT_DIRECTION.DESC ? `initial` : `grey`,
            }}
          /> 

          <North 
            fontSize='small'
            sx={{
              color: sortRule === CUSTOMERS_SORT_RULE.ADDED_DATE && sortDirection === SORT_DIRECTION.ASC ? `initial` : `grey`,
            }}
          />

          <Typography
            sx={{
              marginLeft: 1.5,
            }}
          >
            Added Date
          </Typography>
        </MenuItem>
      </Menu>
    </Box>
  );
}
