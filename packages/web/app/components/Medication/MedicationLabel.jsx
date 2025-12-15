import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { formatShortest } from '@tamanu/utils/dateTime';
import { Colors } from '../../constants';

const LabelContainer = styled.div`
  position: relative;
  background: white;
  border: 1px solid ${Colors.outline};
  margin-bottom: 20px;
  padding: 12px;
  box-sizing: border-box;
  width: ${props => props.$width}mm;
  height: ${props => props.$height}mm;
  font-size: 10px;
  line-height: 1.3;
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  @media print {
    page-break-inside: avoid;
    margin: 0;
    border: none;
  }
`;

const WarningBox = styled.div`
  border: 2px solid ${Colors.darkText};
  padding: 4px 8px;
  margin-bottom: 8px;
  font-weight: bold;
  text-align: center;
  font-size: 9px;
`;

const LabelContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

const MedicationName = styled.div`
  font-weight: bold;
  font-size: 11px;
  margin-bottom: 6px;
  word-wrap: break-word;
`;

const Instructions = styled.div`
  margin-bottom: 8px;
  word-wrap: break-word;
`;

const PatientInfo = styled.div`
  margin-bottom: 4px;
`;

const LabelRow = styled.div`
  margin-bottom: 2px;
  font-size: 9px;
`;

const FacilityDetails = styled.div`
  margin-top: 8px;
  font-size: 8px;
  border-top: 1px solid ${Colors.outline};
  padding-top: 4px;
`;

export const MedicationLabel = React.memo(
  ({
    medicationName,
    instructions,
    patientName,
    dateOfDispensing,
    quantity,
    repeatsRemaining,
    prescriber,
    requestNumber,
    facility,
    width = 80,
    height = 40,
  }) => {
    const facilityDetails = facility
      ? [
          facility.streetAddress,
          facility.cityTown,
          facility.contactNumber && `Ph: ${facility.contactNumber}`,
        ]
          .filter(Boolean)
          .join(', ')
      : '';

    return (
      <LabelContainer $width={width} $height={height}>
        <WarningBox>Keep out of reach of children</WarningBox>
        <LabelContent>
          <div>
            <MedicationName>{medicationName}</MedicationName>
            <Instructions>{instructions}</Instructions>
          </div>
          <div>
            <PatientInfo>
              <LabelRow>
                <strong>Patient:</strong> {patientName}
              </LabelRow>
              <LabelRow>
                <strong>Date of dispensing:</strong> {formatShortest(dateOfDispensing)}
              </LabelRow>
              <LabelRow>
                <strong>Quantity:</strong> {quantity}
              </LabelRow>
              {repeatsRemaining !== null && repeatsRemaining !== undefined && (
                <LabelRow>
                  <strong>Number of repeats:</strong> {repeatsRemaining}
                </LabelRow>
              )}
              {prescriber && (
                <LabelRow>
                  <strong>Prescriber:</strong> {prescriber}
                </LabelRow>
              )}
              {requestNumber && (
                <LabelRow>
                  <strong>Request no:</strong> {requestNumber}
                </LabelRow>
              )}
            </PatientInfo>
            {facilityDetails && <FacilityDetails>{facilityDetails}</FacilityDetails>}
          </div>
        </LabelContent>
      </LabelContainer>
    );
  },
);

MedicationLabel.propTypes = {
  medicationName: PropTypes.string.isRequired,
  instructions: PropTypes.string.isRequired,
  patientName: PropTypes.string.isRequired,
  dateOfDispensing: PropTypes.string.isRequired,
  quantity: PropTypes.number.isRequired,
  repeatsRemaining: PropTypes.number,
  prescriber: PropTypes.string,
  requestNumber: PropTypes.string,
  facility: PropTypes.shape({
    streetAddress: PropTypes.string,
    cityTown: PropTypes.string,
    contactNumber: PropTypes.string,
  }),
  width: PropTypes.number,
  height: PropTypes.number,
};
