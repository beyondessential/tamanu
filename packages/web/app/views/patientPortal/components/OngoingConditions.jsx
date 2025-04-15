import React from 'react';
import { usePatientConditionsQuery } from '../../../api/queries';
import PropTypes from 'prop-types';
import { AccordionContainer } from './AccordionContainer';
import { Box, Typography } from '@mui/material';

export const OngoingConditions = ({ patientId }) => {
  const { data: patientConditions = [] } = usePatientConditionsQuery(patientId);
  const formattedConditions = patientConditions.map(item => item?.diagnosis?.name).filter(Boolean);

  return (
    <AccordionContainer
      title="Ongoing conditions"
      count={formattedConditions.length}
      defaultExpanded={true}
    >
      {formattedConditions.length > 0 ? (
        <Box sx={{ pt: 1 }}>
          {formattedConditions.map((condition, index) => (
            <Typography key={index} variant="body1" sx={{ fontWeight: 'medium' }}>
              {condition}
            </Typography>
          ))}
        </Box>
      ) : (
        <Typography variant="body1" sx={{ py: 2 }}>
          No ongoing conditions found.
        </Typography>
      )}
    </AccordionContainer>
  );
};

OngoingConditions.propTypes = {
  patientId: PropTypes.string.isRequired,
};
