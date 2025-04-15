import React from 'react';
import { usePatientAllergiesQuery } from '../../../api/queries';
import GenericAccordion from './GenericAccordion';
import PropTypes from 'prop-types';

const Allergies = ({ patientId }) => {
  const { data: patientAllergies } = usePatientAllergiesQuery(patientId);
  console.log('patientAllergies', patientAllergies);

  return (
    <GenericAccordion title="Allergies">
      {patientAllergies.length > 0 ? (
        patientAllergies.map((item, index) => (
          <ul key={index}>
            <li>
              {item.allergy.name} ({item.reaction.name})
            </li>
          </ul>
        ))
      ) : (
        <p>No allergies.</p>
      )}
    </GenericAccordion>
  );
};

Allergies.propTypes = {
  patientId: PropTypes.string.isRequired,
};

export default Allergies;
