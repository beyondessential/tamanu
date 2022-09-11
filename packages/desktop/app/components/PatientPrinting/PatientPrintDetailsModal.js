import React, { useState, useCallback } from 'react';
import styled from 'styled-components';

import { Modal } from '../Modal';
import { Button } from '../Button';
import { Colors } from '../../constants';
import { useApi } from '../../api';
import { useLocalisation } from '../../contexts/Localisation';

import { PatientIDCardPage } from './PatientIDCardPage';
import { PatientStickerLabelPage } from './PatientStickerLabelPage';
import { CovidTestCertificateModal } from './CovidTestCertificateModal';
import { CovidClearanceCertificateModal } from './CovidClearanceCertificateModal';
import { StickerIcon } from './StickerIcon';
import { IDCardIcon } from './IDCardIcon';
import { CertificateIcon } from './CertificateIcon';

const PRINT_OPTIONS = {
  barcode: {
    label: 'Print labels',
    component: PatientStickerLabelPage,
    icon: StickerIcon,
  },
  idcard: {
    label: 'Print ID',
    component: PatientIDCardPage,
    icon: IDCardIcon,
  },
  covidTestCert: {
    label: 'Print COVID-19 test certificate',
    component: CovidTestCertificateModal,
    icon: CertificateIcon,
  },
  covidClearanceCert: {
    label: 'Print COVID-19 clearance certificate',
    component: CovidClearanceCertificateModal,
    icon: CertificateIcon,
    condition: getLocalisation => getLocalisation('features.enableCovidClearanceCertificate'),
  },
};

const PrintOptionList = ({ setCurrentlyPrinting }) => {
  const { getLocalisation } = useLocalisation();

  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      {Object.entries(PRINT_OPTIONS)
        .filter(([, { condition }]) => !condition || condition(getLocalisation))
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

const PrintOptionButton = styled(Button)`
  background: ${Colors.white};
  display: grid;
  justify-content: center;
  text-align: -webkit-center;
  height: 140px;
  width: 180px;
  margin: 1rem;
`;

const PrintOption = ({ label, icon, onPress }) => {
  const [hovered, setHovered] = useState(false);
  const Icon = icon;

  return (
    <PrintOptionButton
      color="default"
      onClick={onPress}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Icon hovered={hovered} />
      {label}
    </PrintOptionButton>
  );
};

async function getPatientProfileImage(api, patientId) {
  try {
    const { data } = await api.get(`patient/${patientId}/profilePicture`);
    return data;
  } catch (e) {
    // 1x1 blank pixel
    return 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  }
}

export const PatientPrintDetailsModal = ({ patient }) => {
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
        <Modal title="Select label" open={isModalOpen} onClose={closeModal}>
          <PrintOptionList setCurrentlyPrinting={setCurrentlyPrinting} />
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
          <Modal title="Working" open>
            <div>Preparing ID card...</div>
          </Modal>
        );
      }
      props.imageData = imageData;
    }
    return <Component {...props} />;
  })();

  return (
    <>
      <Button variant="contained" color="primary" onClick={openModal}>
        Print ID
      </Button>
      {mainComponent}
    </>
  );
};
