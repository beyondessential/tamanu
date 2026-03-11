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
  padding: 1.5mm 2mm 0 2mm;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  flex-grow: 1;
`;

const LabelTopSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.708mm;
  margin-bottom: 0.708mm;
`;

const LabelMedicationName = styled.div`
  font-weight: 500;
  font-size: ${props => props.$fontSize}mm;
  line-height: ${props => props.$fontSize * 1.2}mm;
  word-wrap: break-word;
  overflow-wrap: break-word;
`;

const LabelInstructions = styled.div`
  font-weight: 400;
  font-size: ${props => props.$fontSize}mm;
  line-height: ${props => props.$fontSize * 1.2}mm;
  word-wrap: break-word;
  overflow-wrap: break-word;
`;

const LabelBottomSection = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 2mm;
  margin-top: 0.354mm;
`;

const LabelPatientDateRow = styled.div`
  display: flex;
  gap: 2mm;
  border-bottom: 0.354mm solid ${Colors.black};
  padding-bottom: 0.354mm;
`;

const LabelPatientName = styled.div`
  font-weight: 700;
  font-size: ${props => props.$fontSize}mm;
  line-height: ${props => props.$fontSize * 1.125}mm;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
`;

const LabelDate = styled.div`
  font-weight: 400;
  font-size: ${props => props.$fontSize}mm;
  line-height: ${props => props.$fontSize * 1.125}mm;
  text-align: right;
  white-space: nowrap;
  flex-shrink: 0;
`;

const LabelLeftColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.708mm;
  flex: 1;
  min-width: 0;
`;

const LabelRightColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.708mm;
  flex-shrink: 0;
  text-align: right;
  white-space: nowrap;
`;

const LabelDetailRow = styled.div`
  font-weight: 400;
  font-size: ${props => props.$fontSize}mm;
  line-height: ${props => props.$fontSize * 1.125}mm;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
  font-size: ${props => props.$fontSize}mm;
  line-height: ${props => props.$fontSize * 1.125}mm;
  word-wrap: break-word;
  overflow-wrap: break-word;
`;

export const getMedicationLabel = (quantity, units, getEnumTranslation) => {
  if (!quantity) return '';
  if (!units) return `${quantity}`;
  const enumTranslation = getEnumTranslation(DRUG_UNIT_LABELS, units);
  const translatedUnit = quantity > 1 ? pluralize(enumTranslation) : enumTranslation;
  return `${quantity} ${translatedUnit.toLowerCase()}`;
};

const calculateDynamicFontSizes = (data, labelHeight) => {
  const medicationNameLength = data.medicationName?.length || 0;
  const patientNameLength = data.patientName?.length || 0;
  const prescriberNameLength = data.prescriberName?.length || 0;
  
  // 1. Medication name: scale based on length
  let medicationNameFontSize = labelHeight * 0.09;
  if (medicationNameLength > 50) {
    medicationNameFontSize = labelHeight * 0.075;
  } else if (medicationNameLength > 35) {
    medicationNameFontSize = labelHeight * 0.08;
  } else if (medicationNameLength < 25) {
    medicationNameFontSize = labelHeight * 0.11;
  }
  
  // 2. Instructions: never scale - fixed readable size (20% larger)
  const instructionsFontSize = labelHeight * 0.108; // Fixed 4.32mm for 40mm height
  
  // 3. Patient name and date: scale based on patient name length to stay on one line
  let patientDateFontSize = labelHeight * 0.09;
  if (patientNameLength > 30) {
    patientDateFontSize = labelHeight * 0.075;
  } else if (patientNameLength > 25) {
    patientDateFontSize = labelHeight * 0.08;
  } else if (patientNameLength < 15) {
    patientDateFontSize = labelHeight * 0.095;
  }
  
  // 4. Details (Total prescribed, Repeats, Pres., Request): scale based on prescriber name
  // Prescriber name is the longest, so scale to fit it on one line
  let detailFontSize = labelHeight * 0.08; // Base detail size
  
  if (prescriberNameLength > 35) {
    detailFontSize = labelHeight * 0.06; // Smallest: 2.4mm
  } else if (prescriberNameLength > 28) {
    detailFontSize = labelHeight * 0.07; // 2.8mm
  } else if (prescriberNameLength < 20) {
    detailFontSize = labelHeight * 0.085; // 3.4mm
  }
  
  // 5. Footer: never scale - fixed readable size
  const footerFontSize = labelHeight * 0.075; // Fixed 3mm for 40mm height
  
  return {
    medicationNameFontSize,
    instructionsFontSize,
    patientDateFontSize,
    detailFontSize,
    footerFontSize,
  };
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

  const {
    medicationNameFontSize,
    instructionsFontSize,
    patientDateFontSize,
    detailFontSize,
    footerFontSize,
  } = calculateDynamicFontSizes(data, labelHeight);

  return (
    <Label $width={labelWidth} $height={labelHeight} $fontSize={instructionsFontSize}>
      <LabelContent>
        <LabelTopSection>
          <LabelMedicationName $fontSize={medicationNameFontSize}>
            {medicationName}
          </LabelMedicationName>
          <LabelInstructions $fontSize={instructionsFontSize}>
            {instructions}
          </LabelInstructions>
        </LabelTopSection>
        <LabelPatientDateRow>
          <LabelPatientName $fontSize={patientDateFontSize}>{patientName}</LabelPatientName>
          <LabelDate $fontSize={patientDateFontSize}>{formatShortest(dispensedAt)}</LabelDate>
        </LabelPatientDateRow>
        <LabelBottomSection>
          <LabelLeftColumn>
            <LabelDetailRow $fontSize={detailFontSize}>
              <TranslatedText stringId="medication.prescriber.abbrev" fallback="Pres" />:{' '}
              {prescriberName}
            </LabelDetailRow>
            <LabelDetailRow $fontSize={detailFontSize}>
              <TranslatedText stringId="medication.dispense.request" fallback="Request" />:{' '}
              {requestNumber}
            </LabelDetailRow>
          </LabelLeftColumn>
          <LabelRightColumn>
            <LabelDetailRow $fontSize={detailFontSize}>{getMedicationLabel(quantity, units, getEnumTranslation)}</LabelDetailRow>
            <LabelDetailRow $fontSize={detailFontSize}>
              <TranslatedText
                stringId="medication.dispense.repeats"
                fallback="Repeats"
              />
              : {remainingRepeats}
            </LabelDetailRow>
          </LabelRightColumn>
        </LabelBottomSection>
      </LabelContent>
      <LabelFooter>
        <LabelFooterText $fontSize={footerFontSize}>{facilityName}</LabelFooterText>
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
