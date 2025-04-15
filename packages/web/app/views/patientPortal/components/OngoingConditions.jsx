import React from 'react';
import { usePatientConditionsQuery } from '../../../api/queries';
import PropTypes from 'prop-types';
import AccordionContainer from './AccordionContainer';

const OngoingConditions = ({ patientId }) => {
  const { data: patientConditions } = usePatientConditionsQuery(patientId);
  console.log('patientConditions', patientConditions);

  const formattedConditions = patientConditions.map(item => item?.diagnosis?.name);

  return (
    <AccordionContainer
      title="Ongoing Conditions"
      count={formattedConditions.length}
      defaultExpanded={true}
    >
      {formattedConditions.length > 0 ? (
        <ul>
          {formattedConditions.map((condition, index) => (
            <li key={index}>{condition}</li>
          ))}
        </ul>
      ) : (
        <p>No ongoing conditions found.</p>
      )}
    </AccordionContainer>
  );
};

OngoingConditions.propTypes = {
  patientId: PropTypes.string.isRequired,
};

export default OngoingConditions;
