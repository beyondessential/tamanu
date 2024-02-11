import React, { useCallback, useState } from 'react';
import styled from 'styled-components';

import { Modal } from '../../Modal';
import { Button } from '../../Button';
import { Colors } from '../../../constants';
import { isErrorUnknownAllow404s, useApi } from '../../../api';
import { useLocalisation } from '../../../contexts/Localisation';
import { useAuth } from '../../../contexts/Auth';

import { PatientIDCardPage } from './PatientIDCardPage';
import { PatientStickerLabelPage } from './PatientStickerLabelPage';
import { CovidTestCertificateModal } from './CovidTestCertificateModal';
import { CovidClearanceCertificateModal } from './CovidClearanceCertificateModal';
import { BirthNotificationCertificateModal } from './BirthNotificationCertificateModal';
import { TranslatedText } from '../../Translation/TranslatedText';
import { IPSQRCodeModal } from './IPSQRCodeModal';

const PRINT_OPTIONS = {
  barcode: {
    label: <TranslatedText stringId="patientDetails.print.action.idLabels" fallback="ID Labels" />,
    component: PatientStickerLabelPage,
  },
  idcard: {
    label: <TranslatedText stringId="patientDetails.print.action.idCard" fallback="ID Card" />,
    component: PatientIDCardPage,
  },
  covidTestCert: {
    label: (
      <TranslatedText
        stringId="patientDetails.print.action.covid19TestCertificate"
        fallback="COVID-19 test certificate"
      />
    ),
    component: CovidTestCertificateModal,
  },
  covidClearanceCert: {
    label: (
      <TranslatedText
        stringId="patientDetails.print.action.covid19ClearanceCertificate"
        fallback="COVID-19 clearance certificate"
      />
    ),
    component: CovidClearanceCertificateModal,
    condition: getLocalisation => getLocalisation('features.enableCovidClearanceCertificate'),
  },
  birthNotification: {
    label: (
      <TranslatedText
        stringId="patientDetails.print.action.birthNotification"
        fallback="Birth notification"
      />
    ),
    component: BirthNotificationCertificateModal,
  },
  ipsQrCode: {
    label: 'International Patient Summary',
    component: IPSQRCodeModal,
    condition: (_, ability) => ability?.can('create', 'IPSRequest'),
  },
};

const PrintOptionList = ({ className, setCurrentlyPrinting }) => {
  const { getLocalisation } = useLocalisation();
  const { ability } = useAuth();

  return (
    <div className={className}>
      {Object.entries(PRINT_OPTIONS)
        .filter(([, { condition }]) => !condition || condition(getLocalisation, ability))
        .map(([type, { label, icon }]) => (
          <PrintOption
            key={type}
            label={label}
            onPress={() => setCurrentlyPrinting(type)}
            icon={icon}
          />
        ))}
    </div>
  );
};
const StyledPrintOptionList = styled(PrintOptionList)`
  padding: 20px 50px;
  display: flex;
  flex-direction: column;
`;

const PrintOptionButton = styled(Button)`
  background: ${Colors.white};
  border: 2px solid ${Colors.primary};
  border-radius: 5px;
  color: ${Colors.primary};

  justify-content: center;
  text-align: -webkit-center;

  height: 63px;
  width: 100%;
  margin: 14px 0px;
`;

const PrintOption = ({ label, onPress }) => (
  <PrintOptionButton color="default" onClick={onPress}>
    {label}
  </PrintOptionButton>
);

async function getPatientProfileImage(api, patientId) {
  try {
    const { data } = await api.get(
      `patient/${patientId}/profilePicture`,
      {},
      { isErrorUnknown: isErrorUnknownAllow404s },
    );
    return data;
  } catch (e) {
    // 1x1 blank pixel
    return 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  }
}

export const PrintPatientDetailsModal = ({ patient }) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [printType, setPrintType] = useState(null);
  const [imageData, setImageData] = useState('');
  const api = useApi();

  const setCurrentlyPrinting = useCallback(
    async type => {
      setPrintType(type);
      setImageData('');
      if (type === 'idcard') {
        const data = await getPatientProfileImage(api, patient.id);
        setImageData(data);
      }
    },
    [api, patient.id],
  );

  const openModal = useCallback(() => {
    setModalOpen(true);
    setCurrentlyPrinting(null);
  }, [setCurrentlyPrinting]);

  const closeModal = useCallback(() => {
    setModalOpen(false);
  }, [setModalOpen]);

  // The print system & the modals both use React's portal functionality,
  // which unfortunately means a printed page will show up blank if any
  // modal is mounted - so when we are actually printing something,
  // we make sure to unmount the modal at the same time.
  const mainComponent = (() => {
    if (!printType) {
      // no selection yet -- show selection modal
      return (
        <Modal title="Select item to print" open={isModalOpen} onClose={closeModal}>
          <StyledPrintOptionList setCurrentlyPrinting={setCurrentlyPrinting} />
        </Modal>
      );
    }
    const Component = PRINT_OPTIONS[printType].component;
    const props = {
      patient,
    };

    if (printType === 'idcard') {
      // printing ID card -- wait until profile pic download completes
      // (triggered in the callback above)
      if (!imageData) {
        return (
          <Modal
            title={
              <TranslatedText
                stringId="patientDetails.print.idCard.modal.submitting.title"
                fallback="Working"
              />
            }
            open
          >
            <div>
              <TranslatedText
                stringId="patientDetails.print.idCard.modal.submitting.loading"
                fallback="Preparing ID card..."
              />
            </div>
          </Modal>
        );
      }
      props.imageData = imageData;
    }
    return <Component {...props} />;
  })();

  return (
    <>
      <Button size="small" onClick={openModal}>
        <TranslatedText
          stringId="patient.detailsSidebar.action.printIdForms"
          fallback="Print ID forms"
        />
      </Button>
      {mainComponent}
    </>
  );
};
