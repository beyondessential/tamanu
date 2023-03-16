import React from 'react';
import styled from 'styled-components';
import Barcode from 'react-barcode';
import { DateDisplay } from '../../DateDisplay';

const Container = styled.div`
  background: white;
  padding: 12px;
  width: 332px;
  border: 1px solid black;
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

export const LabRequestPrintLabel = ({ patientId, testId, patientAge, date, labCategory }) => (
  <Container>
    <Grid>
      <Item label="Patient ID" value={patientId} />
      <Item label="Test ID" value={testId} />
      <Item label="Age" value={`${patientAge} yrs`} />
      <Item label="Date collected" value={<DateDisplay date={date} />} />
      <Item label="Lab category" value={labCategory} />
    </Grid>
    <BarcodeContainer>
      <Barcode value={testId} width={1.5} height={55} margin={0} font="Roboto" fontSize={14} />
    </BarcodeContainer>
  </Container>
);
