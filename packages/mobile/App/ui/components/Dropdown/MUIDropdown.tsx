import React, { useEffect, useState } from 'react';
import { Select, InputLabel, MenuItem, FormControl } from '@mui/material';
import TextField from '@mui/material/TextField';

export const CustomSelect = ({ handleChange }) => {
  // const [options, setOptions] = useState([]);
  // const [inputValue, setInputValue] = useState('');

  // useEffect(() => {
  //   (async () => {
  //     const suggestions = await endpoint(inputValue);
  //     setOptions(suggestions);
  //   })();
  // }, [inputValue]);

  return (
    <FormControl fullWidth>
      Hello!!!
      <InputLabel id="demo-simple-select-label">Age</InputLabel>
      <Select
        labelId="demo-simple-select-label"
        id="demo-simple-select"
        value={10}
        label="Age"
        onChange={handleChange}
      >
        <MenuItem value={10}>Ten</MenuItem>
        <MenuItem value={20}>Twenty</MenuItem>
        <MenuItem value={30}>Thirty</MenuItem>
      </Select>
    </FormControl>
  );
};