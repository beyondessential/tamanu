import React, { useState } from 'react';
import styled from 'styled-components';

import { SEX_VALUE_INDEX } from '@tamanu/constants';

import { DateDisplay } from '../../DateDisplay';
import { useLocalisation } from '../../../contexts/Localisation';

import { PrintPortal } from '../PrintPortal';
import { PatientBarcode } from '../printouts/reusable/PatientBarcode';
import { PDFViewer } from '../PDFViewer';
import { IDLabelPrintout } from '../../../../../shared/src/utils/patientCertificates/IDLabelPrintout';
import { Modal } from '../../Modal';

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
  howc
  grid-template-columns: repeat(${p => p.columnTotal}, ${p => p.columnWidth});
  grid-template-rows: repeat(${p => p.rowTotal}, ${p => p.rowHeight});
  grid-column-gap: ${p => p.columnGap};
  grid-row-gap: ${p => p.rowGap};
`;

export const PatientStickerLabelPage = React.memo(({ patient }) => {
  const [open, setOpen] = useState(true);
  const { getLocalisation } = useLocalisation();
  const measures = getLocalisation('printMeasures.stickerLabelPage');
  // useEffect(() => { // TODO(web)
  //   printPage();
  // }, [printPage]);
  console.log(measures);

  return (
    <Modal open={open} onClose={() => setOpen(false)} width="md" printable keepMounted>
      {/* <Page {...measures}>
        <LabelPage {...measures}>
          {[...Array(30).keys()].map(x => (
            <PatientStickerLabel key={`label-${x}`} patient={patient} />
          ))}
        </LabelPage>
      </Page> */}
      <PDFViewer id="patient-label-printout">
        <IDLabelPrintout patient={patient} measures={measures} />
      </PDFViewer>
    </Modal>
  );
});
