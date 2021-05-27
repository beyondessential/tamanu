import React from 'react';
import styled from 'styled-components';

import { DateDisplay } from '../DateDisplay';
import { PatientBarcode } from './PatientBarcode';

import { printPage, PrintPortal } from '../../print';

const Sticker = styled.div`
  font-family: monospace;
  display: flex;
  flex-direction: row;
  padding: 0.2rem;
`;

export const PatientStickerLabel = ({ patient }) => (
  <Sticker>
    <div>
      <PatientBarcode patient={patient} width="128px" height="35px" />
      <div>
        <strong>{patient.displayId}</strong>
      </div>
      <div>{`${patient.firstName} ${patient.lastName}`}</div>
      {patient.culturalName && <div>{`(${patient.culturalName})`}</div>}
    </div>
    <div>
      <div>{patient.sex?.name}</div>
      <div>
        <DateDisplay date={patient.dateOfBirth} showDuration />
      </div>
    </div>
  </Sticker>
);

const LetterPage = styled.div`
  background: white;
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

export const PatientStickerLabelPage = ({ patient }) => {
  React.useEffect(() => {
    printPage();
  });

  return (
    <PrintPortal>
      <LetterPage>
        <LabelPage>
          {new Array(30).fill(0).map((x, i) => (
            <PatientStickerLabel key={i} patient={patient} />
          ))}
        </LabelPage>
      </LetterPage>
    </PrintPortal>
  );
};
