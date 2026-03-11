import React, { useState } from 'react';
import { useDateTime } from '@tamanu/ui-components';
import { PDFLoader, printPDF } from '../PDFLoader';
import { IDLabelPrintout } from '@tamanu/shared/utils/patientCertificates';
import { Modal } from '../../Modal';
import { useSettings } from '../../../contexts/Settings';

export const PatientStickerLabelPage = React.memo(({ patient }) => {
  const [open, setOpen] = useState(true);
  const { getSetting } = useSettings();
  const { primaryTimeZone } = useDateTime();
  const measures = getSetting('printMeasures.stickerLabelPage');
  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      width="md"
      printable
      onPrint={() => printPDF('patient-label-printout')}
      data-testid="modal-ncnz"
    >
      <PDFLoader id="patient-label-printout" data-testid="pdfloader-di0q">
        <IDLabelPrintout
          patient={patient}
          measures={measures}
          getSetting={getSetting}
          primaryTimeZone={primaryTimeZone}
          data-testid="idlabelprintout-m146"
        />
      </PDFLoader>
    </Modal>
  );
});
