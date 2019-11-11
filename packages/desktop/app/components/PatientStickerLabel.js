import React from 'react';
import styled from 'styled-components';

import { SEX_VALUE_INDEX } from '../constants';
import { DateDisplay } from './DateDisplay';

const Sticker = styled.div`
  font-family: monospace;
  display: flex;
  flex-direction: row;
  border: 1px solid blue;
  padding: 0.2rem;
`;

const BarcodeFrame = styled.div`
  width: 3cm;
  height: 1cm;
  border: 1px solid blue;
  margin-right: 1rem;
`;

const Barcode = ({ patient }) => (
  <div>
    <BarcodeFrame />
    <div>{patient.displayId}</div>
  </div>
);

export const PatientStickerLabel = ({ patient }) => (
  <Sticker>
    <Barcode patient={patient} />
    <div>
      <div>{`${patient.firstName} ${patient.lastName}`}</div>
      <div>{patient.culturalName}</div>
      <div>{SEX_VALUE_INDEX[patient.sex].label}</div>
      <div><DateDisplay date={patient.dateOfBirth} showDuration /></div>
    </div>
  </Sticker>
);

const LetterPage = styled.div`
  background: white;
  border: 1px solid green;
  width: 8.5in;
  height: 11in;
`;

const LabelPage = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 2.5935in);
  grid-template-rows: repeat(10, 1in);
  grid-column-gap: 0.14in;
  margin-left: 0.2198in;
  margin-top: 0.5in;
`;

export const PatientStickerLabelPage = ({ patient }) => (
  <LetterPage>
    <LabelPage>
      { 
        new Array(30)
          .fill(0)
          .map((x, i) => (<PatientStickerLabel key={i} patient={patient} />))
      }
    </LabelPage>
  </LetterPage>
);
