import React, { useState, useCallback } from 'react';
import styled from 'styled-components';

import { Modal } from '../Modal';
import { Button } from '../Button';
import { Colors } from '../../constants';
import { useApi } from '../../api';

import { PatientIDCardPage } from './PatientIDCardPage';
import { PatientStickerLabelPage } from './PatientStickerLabelPage';
import { StickerIcon } from './StickerIcon';
import { IDCardIcon } from './IDCardIcon';

const PRINT_OPTIONS = {
  barcode: {
    label: "Print labels",
    component: PatientStickerLabelPage,
    icon: StickerIcon,
  },
  idcard: {
    label: "Print ID",
    component: PatientIDCardPage,
    icon: IDCardIcon,
  }
};

const PRINT_OPTION_ENTRIES = Object.entries(PRINT_OPTIONS);

const PrintOptionList = ({ setCurrentlyPrinting }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      {PRINT_OPTION_ENTRIES.map(([key, { label, icon }]) => <PrintOption 
        key={key} 
        label={key} 
        onPress={() => setCurrentlyPrinting(key)} 
        icon={icon}
      />)}
    </div>
  )
}

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
    <PrintOptionButton onClick={onPress} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <Icon hovered={hovered} />
      {label}
    </PrintOptionButton>
  );
}


async function getPatientProfileImage(api, patientId) {
  const { data } = await api.get(`patient/${patientId}/profilePicture`);
  return data;
}

export const PatientPrintDetailsModal = ({ patient }) => {
    const [isModalOpen, setModalOpen] = useState(false);
    const [printType, setPrintType] = useState(null);
    const [imageData, setImageData] = useState("");
    const api = useApi();

    const openModal = useCallback(() => {
      setModalOpen(true);
      setCurrentlyPrinting(null);
    }, [setModalOpen]);
    const closeModal = useCallback(() => {
      setModalOpen(false);
    }, [setModalOpen]);

    const setCurrentlyPrinting = useCallback(async (type) => {
      setPrintType(type);
      setImageData("");
      if (type === 'idcard') {
        const data = await getPatientProfileImage(api, patient.id);
        setImageData(data);
      }
    }, [setPrintType]);


    // The print system & the modals both use React's portal functionality,
    // which unfortunately means a printed page will show up blank if any
    // modal is mounted - so when we are actually printing something, 
    // we make sure to unmount the modal at the same time.
    const mainComponent = (() => {
      if (printType === 'barcode') {
        const Component = PRINT_OPTIONS.barcode.component;
        return <Component patient={patient} />;
      } else if (printType === 'idcard') {
        if (imageData) {
          const Component = PRINT_OPTIONS.idcard.component;
          return <Component patient={patient} imageData={imageData} />;
        } else{
          return (
            <Modal title="Working" open>
              <div>Preparing ID card...</div>
            </Modal>
          );
        }
      } else {
        return (
          <Modal title="Select label" open={isModalOpen} onClose={closeModal}>
            <PrintOptionList setCurrentlyPrinting={setCurrentlyPrinting} />
          </Modal>
        );
      }
    })();

    return (
      <React.Fragment>
        <Button variant="contained" color="primary" onClick={openModal}>
          Print ID
        </Button>
        { mainComponent }
      </React.Fragment>
    );
  };
