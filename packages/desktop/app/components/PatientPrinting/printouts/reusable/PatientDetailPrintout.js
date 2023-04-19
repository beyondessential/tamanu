import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import { DateDisplay } from '../../../DateDisplay';
import { capitaliseFirstLetter } from '../../../../utils/capitalise';

import { LocalisedCertificateLabel } from './CertificateLabels';
import { PatientBarcode } from './PatientBarcode';

const RowContainer = styled.div`
  display: flex;
  justify-content: space-between;
  margin: 20px;
`;

const ColumnContainer = styled.div`
  display: flex;
  justify-content: space-between;
  flex-direction: column;
  &:first-child *:last-child {
    padding-bottom: 18px;
  }
`;

const LocalisedLabel = styled(LocalisedCertificateLabel)`
  font-size: 12px;
  margin-bottom: 5px;
`;

export const PatientDetailPrintout = React.memo(
  ({ patient, village = {}, additionalData = {} }) => {
    const { firstName, lastName, dateOfBirth, sex, displayId } = patient;
    const { streetVillage } = additionalData;
    const { name: villageName } = village;

    return (
      <RowContainer>
        <ColumnContainer>
          <LocalisedLabel name="firstName">{firstName}</LocalisedLabel>
          <LocalisedLabel name="lastName">{lastName}</LocalisedLabel>
          <LocalisedLabel path="fields.dateOfBirth.shortLabel">
            <DateDisplay date={dateOfBirth} />
          </LocalisedLabel>
          <LocalisedLabel name="sex">{capitaliseFirstLetter(sex)}</LocalisedLabel>
          <LocalisedLabel name="streetVillage">{streetVillage}</LocalisedLabel>
        </ColumnContainer>
        <ColumnContainer>
          <LocalisedLabel name="villageName">{villageName}</LocalisedLabel>
          <LocalisedLabel path="fields.displayId.shortLabel">{displayId}</LocalisedLabel>
          <PatientBarcode patient={patient} barWidth={2} barHeight={60} margin={0} />
        </ColumnContainer>
      </RowContainer>
    );
  },
);

PatientDetailPrintout.propTypes = {
  patient: PropTypes.object.isRequired,
  additionalData: PropTypes.object,
  village: PropTypes.object,
};

PatientDetailPrintout.defaultProps = {
  additionalData: {},
  village: {},
};
