/* eslint-disable @next/next/no-img-element */
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import { useState } from "react";
import countryCodes from '@/utils/countryCodes';

const germanyIndex = countryCodes.findIndex((country) => country.code === 'DE');

export default function CountrySelect() {
  const [value, setValue] = useState(countryCodes[germanyIndex]);

  return (
    <Autocomplete
      sx={{ width: 100 }}
      options={countryCodes}
      autoHighlight
      getOptionLabel={(option) => `+${option.phone}`}
      disableClearable
      value={value}
      onChange={(event, newValue) => {
        setValue(newValue);
      }}
      renderOption={(props, option) => (
        <Box component="li" sx={{ 
          '& > img': { mr: 1, flexShrink: 0 },
        }} {...props}>
          <img
            loading="lazy"
            width="20"
            srcSet={`https://flagcdn.com/w40/${option.code.toLowerCase()}.png 2x`}
            src={`https://flagcdn.com/w20/${option.code.toLowerCase()}.png`}
            alt=""
          />
          {option.code} +{option.phone}
        </Box>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          inputProps={{
            ...params.inputProps,
          }}
        />
      )}
    />
  );
}