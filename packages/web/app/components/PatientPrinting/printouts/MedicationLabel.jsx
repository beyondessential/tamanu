import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { useSettings, useTranslation, useDateTime } from '@tamanu/ui-components';
import { DRUG_UNIT_LABELS } from '@tamanu/constants';
import { pluralize } from 'inflection';
import { Colors } from '../../../constants';
import { TranslatedText } from '../../Translation';

const Label = styled.div`
  width: ${props => props.$width}mm;
  height: ${props => props.$height}mm;
  font-size: ${props => props.$fontSize}mm;
  line-height: ${props => props.$fontSize}mm;
  border: 0.354mm solid ${Colors.black};
  border-radius: 1.062mm;
  position: relative;
  overflow: hidden;
  background-color: ${Colors.white};
  page-break-inside: avoid;
  break-inside: avoid;
  display: flex;
  flex-direction: column;

  @media print {
    width: ${props => props.$width}mm;
    height: ${props => props.$height}mm;
  }
`;

const LabelContent = styled.div`
  padding-left: 2mm;
  padding-right: 2mm;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  flex-grow: 1;
`;

const LabelTopSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.708mm;
`;

const LabelMedicationName = styled.div`
  font-weight: 500;
  word-wrap: break-word;
  overflow-wrap: break-word;
`;

const LabelInstructions = styled.div`
  font-weight: 400;
  word-wrap: break-word;
  overflow-wrap: break-word;
`;

const LabelBottomSection = styled.div`
  display: flex;
  justify-content: space-between;
  line-height: ${props => props.$fontSize * 1.125}mm;
`;

const LabelLeftColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.708mm;
  flex: 1;
`;

const LabelRightColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.708mm;
  width: ${props => props.$width * 0.478}mm;
`;

const LabelPatientName = styled.div`
  font-weight: 700;
  border-bottom: 0.354mm solid ${Colors.black};
  padding-bottom: 0.708mm;
`;

const LabelDate = styled.div`
  font-weight: 400;
  border-bottom: 0.354mm solid ${Colors.black};
  padding-bottom: 0.708mm;
`;

const LabelRow = styled.div`
  font-weight: 400;
`;

const LabelFooter = styled.div`
  border-top: 0.177mm solid ${Colors.black};
  padding: 1.416mm 0;
  margin-top: 0.708mm;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const LabelFooterText = styled.div`
  font-weight: 400;
  text-align: center;
`;

export const getMedicationLabel = (quantity, units, getEnumTranslation) => {
  if (!quantity || !units) return;
  const enumTranslation = getEnumTranslation(DRUG_UNIT_LABELS, units);
  const translatedUnit = quantity > 1 ? pluralize(enumTranslation) : enumTranslation;
  return `${quantity} ${translatedUnit.toLowerCase()}`;
};

const calculateDynamicFontSize = (data, labelHeight) => {
  const instructionsLength = data.instructions?.length || 0;
  const medicationNameLength = data.medicationName?.length || 0;
  
  // Base font size (larger than before)
  let fontSize = labelHeight * 0.09;
  
  // Reduce font size for long content to ensure it fits
  if (instructionsLength > 150 || medicationNameLength > 50) {
    fontSize = labelHeight * 0.075;
  } else if (instructionsLength > 100 || medicationNameLength > 35) {
    fontSize = labelHeight * 0.08;
  } else if (instructionsLength < 50 && medicationNameLength < 25) {
    // Increase font size for short content to maximize readability
    fontSize = labelHeight * 0.11;
  } else if (instructionsLength < 80 && medicationNameLength < 30) {
    fontSize = labelHeight * 0.095;
  }
  
  return fontSize;
};

export const MedicationLabel = React.memo(({ data }) => {
  const { formatShortest } = useDateTime();
  const { getEnumTranslation } = useTranslation();
  const { getSetting } = useSettings();
  const labelWidth = getSetting('medications.dispensing.prescriptionLabelSize.width') || 80;
  const labelHeight = getSetting('medications.dispensing.prescriptionLabelSize.height') || 40;

  const {
    medicationName,
    instructions,
    patientName,
    dispensedAt,
    quantity,
    units,
    remainingRepeats,
    prescriberName,
    requestNumber,
    facilityName,
  } = data;

  const fontSize = calculateDynamicFontSize(data, labelHeight);

  return (
    <Label $width={labelWidth} $height={labelHeight} $fontSize={fontSize}>
      <LabelContent>
        <LabelTopSection>
          <LabelMedicationName>{medicationName}</LabelMedicationName>
          <LabelInstructions>{instructions}</LabelInstructions>
        </LabelTopSection>
        <LabelBottomSection $fontSize={fontSize}>
          <LabelLeftColumn>
            <LabelPatientName>{patientName}</LabelPatientName>
            <LabelRow>{getMedicationLabel(quantity, units, getEnumTranslation)}</LabelRow>
            <LabelRow>
              <TranslatedText
                stringId="medication.dispense.numberOfRepeats"
                fallback="Number of repeats"
              />
              : {remainingRepeats}
            </LabelRow>
          </LabelLeftColumn>
          <LabelRightColumn $width={labelWidth}>
            <LabelDate>{formatShortest(dispensedAt)}</LabelDate>
            <LabelRow>
              <TranslatedText stringId="medication.prescriber.label" fallback="Prescriber" />:{' '}
              {prescriberName}
            </LabelRow>
            <LabelRow>
              <TranslatedText stringId="medication.dispense.requestNo" fallback="Request no" />:{' '}
              {requestNumber}
            </LabelRow>
          </LabelRightColumn>
        </LabelBottomSection>
      </LabelContent>
      <LabelFooter>
        <LabelFooterText>{facilityName}</LabelFooterText>
      </LabelFooter>
    </Label>
  );
});

MedicationLabel.propTypes = {
  data: PropTypes.shape({
    medicationName: PropTypes.string.isRequired,
    instructions: PropTypes.string.isRequired,
    patientName: PropTypes.string.isRequired,
    dispensedAt: PropTypes.string.isRequired,
    quantity: PropTypes.number.isRequired,
    units: PropTypes.string,
    remainingRepeats: PropTypes.number.isRequired,
    prescriberName: PropTypes.string.isRequired,
    requestNumber: PropTypes.string.isRequired,
    facilityName: PropTypes.string,
  }).isRequired,
};
