import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import Barcode from 'react-barcode';
import { formatDuration } from 'date-fns';
import { getAgeDurationFromDate } from 'shared/utils/date';
import { formatShort } from '../../DateDisplay';

const Container = styled.div`
  position: relative;
  background: white;
  font-size: 0;

  @media print {
    width: ${props => props.$printWidth}mm;
    height: ${props => props.$printWidth / 2}mm;
  }
`;

const Padding = styled.div`
  // Note: percentage padding is based on the dimensions of the parent element
  padding: 2.5%;
`;

const TextContainer = styled.div`
  svg {
    width: 100%;
  }

  text {
    color: #000;
    font-size: 11px;
    line-height: 1.1;
  }

  .label {
    font-weight: 600;
  }

  .value {
    font-weight: 400;
  }
`;

const Item = ({ label, value, x, y }) => (
  <>
    <text className="label" x={x} y={y}>
      {label}: <tspan className="value">{value}</tspan>
    </text>
  </>
);

const BarcodeContainer = styled.div`
  margin: 0 auto 0;
  padding-top: 1%;
  max-width: 80%;

  svg {
    width: 100%;
    height: 100%;
  }

  svg text {
    // react-barcode api doesn't support font weights
    font-weight: 500 !important;
    // react-barcode sometimes slices off the bottom of the text
    transform: translateY(-1px);
  }
`;

/**
 * Display age in days if patient is less than 1 month old
 * Display age in months if age is between 1 month and 23 months old
 * Display age in years if patient is greater than or equal to 2 years old
 */
function getDisplayAge(dateOfBirth) {
  const ageDuration = getAgeDurationFromDate(dateOfBirth);
  const { years, months } = ageDuration;

  if (years === 0 && months === 0) {
    return formatDuration(ageDuration, { format: ['days'] });
  }
  if (years < 2) {
    return formatDuration(ageDuration, { format: ['months'] });
  }
  return formatDuration(ageDuration, { format: ['years'] });
}

/**
 * The labels needs to scale based on a configurable width for printing which is
 * why the whole component is made with svgs
 */
export const LabRequestPrintLabel = React.memo(({ data, printWidth }) => {
  const { patientId, patientDateOfBirth, testId, date, labCategory } = data;
  const age = getDisplayAge(patientDateOfBirth);

  return (
    <Container $printWidth={printWidth}>
      <Padding>
        <TextContainer>
          <svg viewBox="0 0 300 60">
            <Item x="0" y="11" label="Patient ID" value={patientId} />
            <Item x="50%" y="11" label="Test ID" value={testId} />
            <Item x="0" y="30" label="Age" value={age} />
            <Item x="50%" y="30" label="Date collected" value={formatShort(date)} />
            <Item x="0%" y="50" label="Lab category" value={labCategory} />
          </svg>
        </TextContainer>
        <BarcodeContainer>
          <Barcode value={testId} width={2} height={57} margin={0} font="Roboto" fontSize={15} />
        </BarcodeContainer>
      </Padding>
    </Container>
  );
});

LabRequestPrintLabel.propTypes = {
  data: PropTypes.shape({
    patientId: PropTypes.string,
    testId: PropTypes.string,
    patientDateOfBirth: PropTypes.string,
    date: PropTypes.string,
    labCategory: PropTypes.string,
  }).isRequired,
  printWidth: PropTypes.number, // width for printing in mm
};

LabRequestPrintLabel.defaultProps = {
  printWidth: '185',
};
