import React, { useEffect } from 'react';
import styled from 'styled-components';
import { SEX_VALUE_INDEX } from '../../constants';
import { useElectron } from '../../contexts/Electron';

import { PrintPortal } from './PrintPortal';
import { DateDisplay } from '../DateDisplay';
import { PatientBarcode } from './PatientBarcode';
import { useLocalisation } from '../../contexts/Localisation';

const Sticker = styled.div`
  font-family: monospace;
  display: flex;
  flex-direction: column;
  padding: 2mm;
  justify-content: center;
`;

const RowContainer = styled.div`
  display: flex;
`;

export const PatientStickerLabel = ({ patient }) => (
  <Sticker>
    <RowContainer>
      <div>
        <PatientBarcode patient={patient} width="128px" height="22px" margin="2mm" />
        <div>
          <strong>{patient.displayId}</strong>
        </div>
      </div>
      <div>
        <div>{SEX_VALUE_INDEX[patient.sex].label}</div>
        <div>
          <DateDisplay date={patient.dateOfBirth} />
        </div>
      </div>
    </RowContainer>
    <div>{`${patient.firstName} ${patient.lastName}`}</div>
  </Sticker>
);

const Page = styled.div`
  background: white;
  width: ${p => p.pageWidth};
  height: ${p => p.pageHeight};
`;

// The margin properties are set as padding
// to actually get the desired effect.
const LabelPage = styled.div`
  display: grid;
  padding-top: ${p => p.pageMarginTop};
  padding-left: ${p => p.pageMarginLeft};
  grid-template-columns: repeat(${p => p.columnTotal}, ${p => p.columnWidth});
  grid-template-rows: repeat(${p => p.rowTotal}, ${p => p.rowHeight});
  grid-column-gap: ${p => p.columnGap};
  grid-row-gap: ${p => p.rowGap};
`;

export const PatientStickerLabelPage = ({ patient }) => {
  // const { printPage } = useElectron();
  const { getLocalisation } = useLocalisation();
  const measures = getLocalisation('printMeasures.stickerLabelPage');
  // useEffect(() => {
  //   printPage();
  // });

  return (
    <PrintPortal>
      <Page {...measures}>
        <LabelPage {...measures}>
          {[...Array(30).keys()].map(x => (
            <PatientStickerLabel key={`label-${x}`} patient={patient} />
          ))}
        </LabelPage>
      </Page>
    </PrintPortal>
  );
};
