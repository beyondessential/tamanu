import { styled } from '@mui/material/styles';
import React from 'react';
import Box from '@mui/material/Box';
import { Colors } from '../../constants';
import { SelectInput } from '../Field';
import { TranslatedText } from '../Translation';

const Container = styled('div')`
  width: 100%;
  background: ${Colors.white};
  padding: 0.5rem;
  border: 0.063rem solid ${Colors.outline};
`;

export const RepeatingDateField = ({ value, onChange }) => {
  return (
    <Container>
      <Box display="flex">
        <SelectInput
          label={
            <TranslatedText stringId="scheduling.repeatEvery.label" fallback="Repeats every" />
          }
          options={Array.from({ length: 10 }).map((_, i) => ({ value: i, label: i }))}
          value={value}
          onChange={onChange}
        />
      </Box>
    </Container>
  );
};
