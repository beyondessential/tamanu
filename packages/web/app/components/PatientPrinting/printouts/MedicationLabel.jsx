import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { formatShortest } from '@tamanu/utils/dateTime';
import { useSettings } from '@tamanu/ui-components';
import { TranslatedText } from '../../Translation';
import { Colors } from '../../../constants';

const Label = styled.div`
  width: ${props => props.$width}mm;
  height: ${props => props.$height}mm;
  border: 1px solid ${Colors.black};
  border-radius: 3px;
  position: relative;
  overflow: hidden;
  background-color: ${Colors.white};
  page-break-inside: avoid;
  break-inside: avoid;

  @media print {
    width: ${props => props.$width}mm;
    height: ${props => props.$height}mm;
  }
`;

const LabelTitle = styled.div`
  font-weight: 700;
  font-size: 8px;
  line-height: 15px;
  text-align: center;
  position: absolute;
  top: 6.5px;
  left: 47px;
  right: 48px;
  transform: translateY(-50%);
`;

const LabelContent = styled.div`
  position: absolute;
  top: 14px;
  bottom: 18px;
  left: 7px;
  right: 7px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

const LabelTopSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const LabelMedicationName = styled.div`
  font-weight: 500;
  font-size: 8px;
  line-height: 8px;
`;

const LabelInstructions = styled.div`
  font-weight: 400;
  font-size: 8px;
  line-height: 8px;
`;

const LabelBottomSection = styled.div`
  display: flex;
  justify-content: space-between;
`;

const LabelLeftColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
`;

const LabelRightColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 109px;
`;

const LabelPatientName = styled.div`
  font-weight: 700;
  font-size: 8px;
  line-height: 9px;
  border-bottom: 1px solid ${Colors.black};
  padding-bottom: 2px;
`;

const LabelDate = styled.div`
  font-weight: 400;
  font-size: 8px;
  line-height: 9px;
  border-bottom: 1px solid ${Colors.black};
  padding-bottom: 2px;
`;

const LabelRow = styled.div`
  font-weight: 400;
  font-size: 8px;
  line-height: 9px;
`;

const LabelFooter = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  border-top: 0.5px solid ${Colors.black};
  padding: 4px 0;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const LabelFooterText = styled.div`
  font-weight: 400;
  font-size: 8px;
  line-height: 9px;
  text-align: center;
`;

export const MedicationLabel = React.memo(({ data }) => {
  const { getSetting } = useSettings();
  const labelWidth = getSetting('medications.dispensing.prescriptionLabelSize.width') || 80;
  const labelHeight = getSetting('medications.dispensing.prescriptionLabelSize.height') || 40;

  const {
    medicationName,
    instructions,
    patientName,
    dispensedAt,
    quantity,
    repeatsRemaining,
    prescriberName,
    requestNumber,
    facilityAddress,
    facilityContactNumber,
  } = data;

  return (
    <Label $width={labelWidth} $height={labelHeight}>
      <LabelTitle>
        <TranslatedText
          stringId="modal.medication.dispense.label.title"
          fallback="Keep out of reach of children"
        />
      </LabelTitle>
      <LabelContent>
        <LabelTopSection>
          <LabelMedicationName>{medicationName}</LabelMedicationName>
          <LabelInstructions>{instructions}</LabelInstructions>
        </LabelTopSection>
        <LabelBottomSection>
          <LabelLeftColumn>
            <LabelPatientName>{patientName}</LabelPatientName>
            <LabelRow>{quantity} tablets</LabelRow>
            <LabelRow>
              <TranslatedText
                stringId="medication.dispense.numberOfRepeats"
                fallback="Number of repeats"
              />
              : {repeatsRemaining}
            </LabelRow>
          </LabelLeftColumn>
          <LabelRightColumn>
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
        <LabelFooterText>
          {[facilityAddress, facilityContactNumber && `Ph: ${facilityContactNumber}`]
            .filter(Boolean)
            .join(', ')}
        </LabelFooterText>
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
    repeatsRemaining: PropTypes.number.isRequired,
    prescriberName: PropTypes.string.isRequired,
    requestNumber: PropTypes.string.isRequired,
    facilityAddress: PropTypes.string,
    facilityContactNumber: PropTypes.string,
  }).isRequired,
};

