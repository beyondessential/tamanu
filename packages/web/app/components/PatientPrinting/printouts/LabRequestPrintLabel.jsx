import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import Barcode from 'react-barcode';
import { useDateTime } from '@tamanu/ui-components';
import { getAgeDurationFromDate } from '@tamanu/utils/date';

export const LAB_LABEL_DIMENSIONS = { width: 40, height: 28 };
const { width: LABEL_WIDTH_MM, height: LABEL_HEIGHT_MM } = LAB_LABEL_DIMENSIONS;

const Container = styled.div`
  position: relative;
  background: white;
  font-size: 0;
  width: ${LABEL_WIDTH_MM}mm;
  height: ${LABEL_HEIGHT_MM}mm;
`;

const FlexContainer = styled.div`
  // Note: percentage padding is based on the dimensions of the parent element
  padding: 5%;
  display: flex;
  flex-direction: column;
`;

const TextContainer = styled.div`
  svg {
    width: 100%;
  }

  text {
    color: #000;
    font-size: 10px;
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
  <text className="label" x={x} y={y}>
    {label}: <tspan className="value">{value}</tspan>
  </text>
);

const BarcodeContainer = styled.div`
  width: 100%;
  svg {
    width: 100%;
    height: auto;
  }

  svg text {
    // react-barcode api doesn't support font weights
    font-weight: 500 !important;
  }
`;

/**
 * The label is a fixed 40 × 28 mm; the text block is built with SVG so it scales
 * cleanly to the label width when printing.
 */
export const LabRequestPrintLabel = React.memo(({ data }) => {
  const { formatShort, formatShortDateTime } = useDateTime();
  const { patientName, patientDateOfBirth, patientId, requestId, date, collectedBy } = data;
  const ageDuration = getAgeDurationFromDate(patientDateOfBirth);
  const dateOfBirth = patientDateOfBirth
    ? `${formatShort(patientDateOfBirth)}${ageDuration ? ` (${ageDuration.years} years)` : ''}`
    : '';
  return (
    <Container data-testid="container-gx0i">
      <FlexContainer data-testid="flexcontainer-24kt">
        <TextContainer data-testid="textcontainer-8y44">
          <svg viewBox="0 0 200 92">
            <Item x="0" y="12" label="Patient name" value={patientName} data-testid="item-asx7" />
            <Item x="0" y="27" label="DOB" value={dateOfBirth} data-testid="item-krnm" />
            <Item x="0" y="42" label="Patient ID" value={patientId} data-testid="item-r5xk" />
            <Item x="0" y="57" label="Request ID" value={requestId} data-testid="item-vcco" />
            <Item
              x="0"
              y="72"
              label="Date collected"
              value={formatShortDateTime(date)}
              data-testid="item-nxfc"
            />
            <Item x="0" y="87" label="Collected by" value={collectedBy} data-testid="item-cby9" />
          </svg>
        </TextContainer>
        <BarcodeContainer data-testid="barcodecontainer-yq9a">
          <Barcode
            value={requestId}
            width={2}
            height={40}
            margin={0}
            font="Roboto"
            fontSize={16}
            data-testid="barcode-s8j3"
          />
        </BarcodeContainer>
      </FlexContainer>
    </Container>
  );
});

LabRequestPrintLabel.propTypes = {
  data: PropTypes.shape({
    patientName: PropTypes.string,
    patientDateOfBirth: PropTypes.string,
    patientId: PropTypes.string,
    requestId: PropTypes.string,
    date: PropTypes.string,
    collectedBy: PropTypes.string,
  }).isRequired,
};
