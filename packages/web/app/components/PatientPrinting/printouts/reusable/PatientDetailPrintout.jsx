import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import { DateDisplay } from '../../../DateDisplay';
import { capitaliseFirstLetter } from '../../../../utils/capitalise';

import { LocalisedCertificateLabel } from './CertificateLabels';
import { PatientBarcode } from './PatientBarcode';
import { TranslatedText } from '../../../Translation/TranslatedText';

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
          <LocalisedLabel
            label={
              <TranslatedText
                stringId="general.localisedField.firstName.label"
                fallback="First name"
              />
            }
          >
            {firstName}
          </LocalisedLabel>
          <LocalisedLabel
            label={
              <TranslatedText
                stringId="general.localisedField.lastName.label"
                fallback="Last name"
              />
            }
          >
            {lastName}
          </LocalisedLabel>
          <LocalisedLabel
            label={
              <TranslatedText
                stringId="general.localisedField.dateOfBirth.label.short"
                fallback="DOB"
              />
            }
          >
            <DateDisplay date={dateOfBirth} />
          </LocalisedLabel>
          <LocalisedLabel
            label={<TranslatedText stringId="general.localisedField.sex.label" fallback="Sex" />}
          >
            {capitaliseFirstLetter(sex)}
          </LocalisedLabel>
          <LocalisedLabel
            label={
              <TranslatedText
                stringId="general.localisedField.streetVillage.label"
                fallback="Residential landmark"
              />
            }
          >
            {streetVillage}
          </LocalisedLabel>
        </ColumnContainer>
        <ColumnContainer>
          <LocalisedLabel
            label={
              <TranslatedText
                stringId="general.localisedField.villageName.label"
                fallback="Village"
              />
            }
          >
            {villageName}
          </LocalisedLabel>
          <LocalisedLabel
            label={
              <TranslatedText
                stringId="general.localisedField.displayId.label.short"
                fallback="NHN"
              />
            }
          >
            {displayId}
          </LocalisedLabel>
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
