import React from 'react';
import { usePatientAllergiesQuery } from '../../../api/queries';
import PropTypes from 'prop-types';
import { AccordionContainer } from './AccordionContainer';
import { Box, Typography } from '@mui/material';

export const Allergies = ({ patientId }) => {
  const { data: patientAllergies = [] } = usePatientAllergiesQuery(patientId);

  return (
    <AccordionContainer title="Allergies" count={patientAllergies.length} defaultExpanded={true}>
      {patientAllergies.length > 0 ? (
        <Box sx={{ pt: 1 }}>
          {patientAllergies.map((item, index) => (
            <Typography
              key={index}
              variant="body1"
              sx={{
                fontWeight: 'medium',
              }}
            >
              {item.allergy.name} ({item.reaction.name})
            </Typography>
          ))}
        </Box>
      ) : (
        <Typography variant="body1">No allergies.</Typography>
      )}
    </AccordionContainer>
  );
};

Allergies.propTypes = {
  patientId: PropTypes.string.isRequired,
};
