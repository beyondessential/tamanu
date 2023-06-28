import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import Barcode from 'react-barcode';
import { DateDisplay } from '../../DateDisplay';

const Container = styled.div`
  position: relative;
  background: white;
  font-size: 0;

  @media print {
    width: ${props => props.$printWidth}mm;
    height: ${props => props.$printWidth / 2}mm;
  }
`;

const FlexContainer = styled.div`
  // Note: percentage padding is based on the dimensions of the parent element
  padding: 5%;
  display: flex;
`;

const TextContainer = styled.div`
  width: 70%;
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
  transform: rotate(270deg);
  padding-top: 1%;
  width: 30%;
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
 * The labels needs to scale based on a configurable width for printing which is
 * why the whole component is made with svgs
 */
export const LabRequestPrintLabel = React.memo(({ data, printWidth }) => {
  const { patientId, patientName, patientDateOfBirth, testId, labCategory, date } = data;
  return (
    <Container $printWidth={printWidth}>
      <FlexContainer>
        <TextContainer>
          <svg viewBox="0 0 200 120">
            <Item x="0" y="10" label="Patient Name" value={patientName} />
            <Item x="0" y="30" label="Patient ID" value={patientId} />
            <Item x="0" y="50" label="DOB" value={DateDisplay.rawFormat(patientDateOfBirth)} />
            <Item x="0" y="70" label="Test ID" value={testId} />
            <Item x="0" y="90" label="Date collected" value={DateDisplay.rawFormat(date)} />
            <Item x="0" y="110" label="Lab category" value={labCategory} />
          </svg>
        </TextContainer>
        <BarcodeContainer>
          <Barcode value={testId} width={2} height={57} margin={0} font="Roboto" fontSize={24} />
        </BarcodeContainer>
      </FlexContainer>
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
