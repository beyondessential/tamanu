import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { formatDuration } from 'date-fns';
import { getAgeFromDate } from 'shared/utils/date';
import Barcode from 'react-barcode';
import { DateDisplay } from '../../DateDisplay';

const SCREEN_WIDTH = 332;

const Container = styled.div`
  background: white;
  padding: 12px;
  width: ${`${SCREEN_WIDTH}px`};
  border: 1px solid black;

  @media print {
    transform: ${({ $scale }) => `scale(${$scale})`};
    transform-origin: top left;
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
`;

const Text = styled.div`
  margin: 2px 0;
  font-weight: 600;
  font-size: 11px;
  line-height: 13px;
  color: #000;

  span {
    margin-left: 2px;
    font-weight: 400;
  }
`;

const Item = ({ label, value }) => (
  <Text>
    {label}: <span>{value}</span>
  </Text>
);

const BarcodeContainer = styled.div`
  display: flex;
  justify-content: center;
  margin: 10px 0 5px;

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
  const ageDuration = getAgeFromDate(dateOfBirth);
  const { years, months } = ageDuration;

  if (months === 0) {
    return formatDuration(ageDuration, { format: ['days'] });
  }

  if (years < 2) {
    return formatDuration(ageDuration, { format: ['months'] });
  }
  return formatDuration(ageDuration, { format: ['years'] });
}

// My Dell monitor U2518D Pixel Per Inch (PPI): 117.5

// Requirements  50.80mm x 25.40mm
// 1 inch = 25.4mm
// pixelValue = DPI x width (inches)
// Scale = calculatedPixelValue / fixedWidth

// Example: 50.80mm
// Inches: 2
// pixelValue: 600

const getPrintScale = width => {
  const printDPI = 72;
  const inches = width / 25.4;
  const pixelValue = printDPI * inches;
  return pixelValue / SCREEN_WIDTH;
};

export const LabRequestPrintLabel = ({ data, width = '50.8' }) => {
  const { patientId, patientDateOfBirth, testId, date, labCategory } = data;
  const age = getDisplayAge(patientDateOfBirth);
  const scale = getPrintScale(width);
  console.log('scale', scale);

  return (
    <Container $scale={scale}>
      <Grid>
        <Item label="Patient ID" value={patientId} />
        <Item label="Test ID" value={testId} />
        <Item label="Age" value={age} />
        <Item label="Date collected" value={<DateDisplay date={date} />} />
        <Item label="Lab category" value={labCategory} />
      </Grid>
      <BarcodeContainer>
        <Barcode value={testId} width={1.5} height={55} margin={0} font="Roboto" fontSize={14} />
      </BarcodeContainer>
    </Container>
  );
};

LabRequestPrintLabel.propTypes = {
  data: PropTypes.shape({
    patientId: PropTypes.string,
    testId: PropTypes.string,
    patientDateOfBirth: PropTypes.string,
    date: PropTypes.string,
    labCategory: PropTypes.string,
  }).isRequired,
  scale: PropTypes.number,
};

LabRequestPrintLabel.defaultProps = {
  scale: 1,
};
