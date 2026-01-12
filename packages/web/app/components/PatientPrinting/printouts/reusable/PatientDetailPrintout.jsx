import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import { DateOnlyDisplay } from '@tamanu/ui-components';

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
      <RowContainer data-testid="rowcontainer-9y2s">
        <ColumnContainer data-testid="columncontainer-ubl8">
          <LocalisedLabel
            label={
              <TranslatedText
                stringId="general.localisedField.firstName.label"
                fallback="First name"
                data-testid="translatedtext-5rsj"
              />
            }
            data-testid="localisedlabel-ck4r"
          >
            {firstName}
          </LocalisedLabel>
          <LocalisedLabel
            label={
              <TranslatedText
                stringId="general.localisedField.lastName.label"
                fallback="Last name"
                data-testid="translatedtext-sdq1"
              />
            }
            data-testid="localisedlabel-0u8y"
          >
            {lastName}
          </LocalisedLabel>
          <LocalisedLabel
            label={
              <TranslatedText
                stringId="general.localisedField.dateOfBirth.label.short"
                fallback="DOB"
                data-testid="translatedtext-c4aq"
              />
            }
            data-testid="localisedlabel-w9cr"
          >
            <DateOnlyDisplay date={dateOfBirth} data-testid="datedisplay-rkgk" />
          </LocalisedLabel>
          <LocalisedLabel
            label={
              <TranslatedText
                stringId="general.localisedField.sex.label"
                fallback="Sex"
                data-testid="translatedtext-k745"
              />
            }
            data-testid="localisedlabel-jn25"
          >
            {capitaliseFirstLetter(sex)}
          </LocalisedLabel>
          <LocalisedLabel
            label={
              <TranslatedText
                stringId="general.localisedField.streetVillage.label"
                fallback="Residential landmark"
                data-testid="translatedtext-7ny2"
              />
            }
            data-testid="localisedlabel-ul5l"
          >
            {streetVillage}
          </LocalisedLabel>
        </ColumnContainer>
        <ColumnContainer data-testid="columncontainer-sepd">
          <LocalisedLabel
            label={
              <TranslatedText
                stringId="general.localisedField.villageId.label"
                fallback="Village"
                data-testid="translatedtext-2qcn"
              />
            }
            data-testid="localisedlabel-o41l"
          >
            {villageName}
          </LocalisedLabel>
          <LocalisedLabel
            label={
              <TranslatedText
                stringId="general.localisedField.displayId.label.short"
                fallback="NHN"
                data-testid="translatedtext-0d99"
              />
            }
            data-testid="localisedlabel-c33w"
          >
            {displayId}
          </LocalisedLabel>
          <PatientBarcode
            patient={patient}
            barWidth={2}
            barHeight={60}
            margin={0}
            data-testid="patientbarcode-ggzu"
          />
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
