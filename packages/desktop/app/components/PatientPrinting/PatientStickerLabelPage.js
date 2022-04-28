import React, { useEffect } from 'react';
import styled from 'styled-components';

import { SEX_VALUE_INDEX } from '../../constants';
import { useElectron } from '../../contexts/Electron';

import { PrintPortal } from '../Print';
import { DateDisplay } from '../DateDisplay';

import { PatientBarcode } from './PatientBarcode';

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
      <div>{SEX_VALUE_INDEX[patient.sex].label}</div>
      <div>
        <DateDisplay date={patient.dateOfBirth} showDuration />
      </div>
    </div>
  </Sticker>
);

const A4Page = styled.div`
  background: white;
  width: 8.3in;
  height: 11.7in;
`;

const LabelPage = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 64mm);
  grid-template-rows: repeat(10, 26.7mm);
  grid-column-gap: 3.01mm;
  padding-left: 6.4mm;
  padding-top: 15.09mm;
`;

export const PatientStickerLabelPage = ({ patient }) => {
  const { printPage } = useElectron();
  useEffect(() => {
    printPage();
  });

  return (
    <PrintPortal>
      <A4Page>
        <LabelPage>
          {[...Array(30).keys()].map(x => (
            <PatientStickerLabel key={`label-${x}`} patient={patient} />
          ))}
        </LabelPage>
      </A4Page>
    </PrintPortal>
  );
};
