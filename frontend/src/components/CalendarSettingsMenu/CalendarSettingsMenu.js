import {
  Menu,
  MenuItem,
  FormControlLabel,
  Checkbox,
} from '@mui/material';

export default function CalendarSettingsMenu({
  open,
  anchorEl,
  onClose,
  settings,
  onSettingsChange,
}) {
  const handleStartTimeChange = (hour) => {
    onSettingsChange({
      ...settings,
      minHour: hour,
    });
    onClose();
  };

  const handleEndTimeChange = (hour) => {
    onSettingsChange({
      ...settings,
      maxHour: hour,
    });
    onClose();
  };

  const handleShowSundayChange = (event) => {
    onSettingsChange({
      ...settings,
      showSunday: event.target.checked,
    });
  };

  const currentMinHour = settings?.minHour ?? 10;
  const currentMaxHour = settings?.maxHour ?? 20;

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
    >
      <MenuItem
        disabled
        sx={{
          px: 2,
          justifyContent: `center`,
          opacity: `1 !important`,
          p: `2px 0 !important`,
          minHeight: `0`,
          fontWeight: 600,
        }}
      >
        Time range
      </MenuItem>

      <MenuItem
        onClick={() => handleStartTimeChange(7)}
        selected={currentMinHour === 7}
      >
        Start: 07:00
      </MenuItem>

      <MenuItem
        onClick={() => handleStartTimeChange(8)}
        selected={currentMinHour === 8}
      >
        Start: 08:00
      </MenuItem>

      <MenuItem
        onClick={() => handleStartTimeChange(9)}
        selected={currentMinHour === 9}
      >
        Start: 09:00
      </MenuItem>

      <MenuItem
        onClick={() => handleStartTimeChange(10)}
        selected={currentMinHour === 10}
        sx={{ borderBottom: `1px solid rgba(0,0,0,0.08)` }}
      >
        Start: 10:00
      </MenuItem>

      <MenuItem
        onClick={() => handleEndTimeChange(18)}
        selected={currentMaxHour === 18}
      >
        End: 18:00
      </MenuItem>

      <MenuItem
        onClick={() => handleEndTimeChange(19)}
        selected={currentMaxHour === 19}
      >
        End: 19:00
      </MenuItem>

      <MenuItem
        onClick={() => handleEndTimeChange(20)}
        selected={currentMaxHour === 20}
      >
        End: 20:00
      </MenuItem>

      <MenuItem
        onClick={() => handleEndTimeChange(21)}
        selected={currentMaxHour === 21}
      >
        End: 21:00
      </MenuItem>

      <MenuItem
        onClick={() => handleEndTimeChange(22)}
        selected={currentMaxHour === 22}
        sx={{ borderBottom: `1px solid rgba(0,0,0,0.08)` }}
      >
        End: 22:00
      </MenuItem>

      <MenuItem>
        <FormControlLabel
          sx={{
            pl: 0,
            pr: 0,
          }}
          control={(
            <Checkbox
              checked={Boolean(settings?.showSunday)}
              onChange={handleShowSundayChange}
              size="small"
            />
          )}
          label="Show Sunday in week view"
        />
      </MenuItem>
    </Menu>
  );
}

