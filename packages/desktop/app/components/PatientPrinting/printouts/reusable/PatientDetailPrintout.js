import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import { DateDisplay } from '../../../DateDisplay';
import { capitaliseFirstLetter } from '../../../../utils/capitalise';

import { LocalisedLabel } from './SimplePrintout';
import { PatientBarcode } from './PatientBarcode';

const RowContainer = styled.div`
  display: flex;
  justify-content: space-between;
`;

export const PatientDetailPrintout = React.memo(({ patient, village, additionalData }) => {
  const { firstName, lastName, dateOfBirth, sex, displayId } = patient;
  const { streetVillage } = additionalData;
  const { name: villageName } = village;

  return (
    <RowContainer>
      <div>
        <LocalisedLabel name="firstName">{firstName}</LocalisedLabel>
        <LocalisedLabel name="lastName">{lastName}</LocalisedLabel>
        <LocalisedLabel name="dateOfBirth" length="short">
          <DateDisplay date={dateOfBirth} />
        </LocalisedLabel>
        <LocalisedLabel name="sex">{capitaliseFirstLetter(sex)}</LocalisedLabel>
        <LocalisedLabel name="streetVillage">{streetVillage}</LocalisedLabel>
      </div>
      <div>
        <LocalisedLabel name="villageName">{villageName}</LocalisedLabel>
        <LocalisedLabel name="displayId" length="short">
          {displayId}
        </LocalisedLabel>
        <PatientBarcode patient={patient} barWidth={2} barHeight={60} margin={0} />
      </div>
    </RowContainer>
  );
});

PatientDetailPrintout.propTypes = {
  patient: PropTypes.object.isRequired,
  additionalData: PropTypes.object,
  village: PropTypes.object,
};

PatientDetailPrintout.defaultProps = {
  additionalData: {},
  village: {},
};
