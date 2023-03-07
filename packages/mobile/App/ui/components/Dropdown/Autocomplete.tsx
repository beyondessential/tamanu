import React, { useEffect, useState } from 'react';
import { Autocomplete } from '@mui/material';
import TextField from '@mui/material/TextField';

export const CustomAutocomplete = ({ endpoint }) => {
  const [options, setOptions] = useState([]);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    (async () => {
      const suggestions = await endpoint(inputValue);
      setOptions(suggestions);
    })();
  }, [inputValue]);

  return (
    <Autocomplete
      disablePortal
      id="combo-box-demo"
      options={options}
      sx={{ width: 300 }}
      renderInput={(params) => <TextField {...params} label="Movie" />}
    />
  );
};