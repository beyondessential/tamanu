import React, { useState } from 'react';
import { useDateTime } from '@tamanu/ui-components';
import { Modal } from '../../Modal';
import { PDFLoader, printPDF } from '../PDFLoader';
import { IDCardPrintout } from '@tamanu/shared/utils/patientCertificates';
import { useSettings } from '../../../contexts/Settings';
import { useTranslation } from '../../../contexts/Translation';

const cardDimensions = {
  width: '85.6mm',
  height: '53.92mm',
};

export const PatientIDCardPage = React.memo(({ patient, imageData }) => {
  const { getSetting } = useSettings();
  const { getTranslation } = useTranslation();
  const { countryTimeZone } = useDateTime();
  const measures = getSetting('printMeasures.idCardPage');
  const [open, setOpen] = useState(true);

  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      width="md"
      printable
      onPrint={() => printPDF('patient-card-printout')}
      data-testid="modal-cqpt"
    >
      <PDFLoader isLoading={!imageData} id="patient-card-printout" data-testid="pdfloader-2rsf">
        <IDCardPrintout
          cardDimensions={cardDimensions}
          patientImageData={imageData}
          measures={measures}
          patient={patient}
          getTranslation={getTranslation}
          getSetting={getSetting}
          countryTimeZone={countryTimeZone}
          data-testid="idcardprintout-gj3h"
        />
      </PDFLoader>
    </Modal>
  );
});
