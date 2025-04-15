import React from 'react';
import { usePatientAllergiesQuery } from '../../../api/queries';
import PropTypes from 'prop-types';
import { AccordionContainer } from './AccordionContainer';

const Allergies = ({ patientId }) => {
  const { data: patientAllergies } = usePatientAllergiesQuery(patientId);
  console.log('patientAllergies', patientAllergies);

  return (
    <AccordionContainer title="Allergies" count={patientAllergies.length} defaultExpanded={true}>
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
    </AccordionContainer>
  );
};

Allergies.propTypes = {
  patientId: PropTypes.string.isRequired,
};

export default Allergies;
