import React from 'react';
import { usePatientConditionsQuery } from '../../../api/queries';
import GenericAccordion from './GenericAccordion';
import PropTypes from 'prop-types';

const OngoingConditions = ({ patientId }) => {
  const { data: patientConditions } = usePatientConditionsQuery(patientId);
  console.log('patientConditions', patientConditions);

  const formattedConditions = patientConditions.map(item => item?.diagnosis?.name);

  return (
    <GenericAccordion title="Ongoing Conditions">
      {formattedConditions.length > 0 ? (
        <ul>
          {formattedConditions.map((condition, index) => (
            <li key={index}>{condition}</li>
          ))}
        </ul>
      ) : (
        <p>No ongoing conditions found.</p>
      )}
    </GenericAccordion>
  );
};

OngoingConditions.propTypes = {
  patientId: PropTypes.string.isRequired,
};

export default OngoingConditions;
