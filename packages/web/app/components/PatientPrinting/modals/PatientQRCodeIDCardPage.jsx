import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { useDateTime } from '@tamanu/ui-components';
import { Modal } from '../../Modal';
import { PDFLoader, printPDF } from '../PDFLoader';
import { QRCodeIDCardPrintout } from '@tamanu/shared/utils/patientCertificates';
import { useSettings } from '../../../contexts/Settings';
import { useTranslation } from '../../../contexts/Translation';

const cardDimensions = {
  width: '85.6mm',
  height: '53.92mm',
};

export const PatientQRCodeIDCardPage = React.memo(({ patient }) => {
  const { getSetting } = useSettings();
  const { getTranslation } = useTranslation();
  const { primaryTimeZone } = useDateTime();
  const measures = getSetting('printMeasures.idCardPage');
  const [open, setOpen] = useState(true);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState(null);

  useEffect(() => {
    const generateQR = async () => {
      const dataUrl = await QRCode.toDataURL(patient.displayId, {
        width: 200,
        margin: 1,
        errorCorrectionLevel: 'M',
      });
      setQrCodeDataUrl(dataUrl);
    };
    generateQR();
  }, [patient.displayId]);

  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      width="md"
      printable
      onPrint={() => printPDF('patient-qrcode-card-printout')}
      data-testid="modal-qrid"
    >
      <PDFLoader
        isLoading={!qrCodeDataUrl}
        id="patient-qrcode-card-printout"
        data-testid="pdfloader-qrid"
      >
        <QRCodeIDCardPrintout
          cardDimensions={cardDimensions}
          qrCodeDataUrl={qrCodeDataUrl}
          measures={measures}
          patient={patient}
          getTranslation={getTranslation}
          getSetting={getSetting}
          primaryTimeZone={primaryTimeZone}
          data-testid="qrcardprintout-qrid"
        />
      </PDFLoader>
    </Modal>
  );
});
