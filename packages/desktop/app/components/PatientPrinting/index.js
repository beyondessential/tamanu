import React, { useState, useCallback } from 'react';
import styled from 'styled-components';

import { Modal } from '../Modal';
import { Button } from '../Button';
import { Colors } from '../../constants';

import { PatientIDCardPage } from './PatientIDCardPage';
import { PatientStickerLabelPage } from './PatientStickerLabelPage';
import { StickerIcon } from './StickerIcon';
import { IDCardIcon } from './IDCardIcon';

const PRINT_OPTIONS = [
  {
    label: "Print labels",
    component: PatientStickerLabelPage,
    icon: StickerIcon,
  },
  {
    label: "Print ID",
    component: PatientIDCardPage,
    icon: IDCardIcon,
  }
];

const PrintOptionList = ({ setCurrentlyPrinting }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      {PRINT_OPTIONS.map(({ label, icon }) => <PrintOption label={label} onPress={() => setCurrentlyPrinting(label)} icon={icon} />)}
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

export const PatientPrintDetailsModal = ({ patient }) => {
    const [isModalOpen, setModalOpen] = useState(false);
    const openModal = useCallback(() => {
      setModalOpen(true);
      setCurrentlyPrinting(null);
    }, [setModalOpen]);
    const closeModal = useCallback(() => {
      setModalOpen(false);
    }, [setModalOpen]);

    const [currentlyPrinting, setCurrentlyPrinting] = useState(null);
    const CurrentlyPrintingComponent = PRINT_OPTIONS.find(({ label }) => label === currentlyPrinting)?.component;

    return (
      <React.Fragment>
        <Button variant="contained" color="primary" onClick={openModal}>
          Print ID
        </Button>
        {
          // The print system & the modals both use React's portal functionality,
          // which unfortunately means a printed page will show up blank if any
          // modal is mounted - so we immediately unmount it when a selection is made
          CurrentlyPrintingComponent  
            ? <CurrentlyPrintingComponent patient={patient} />
            : <Modal title="Select label" open={isModalOpen} onClose={closeModal}>
                <PrintOptionList setCurrentlyPrinting={setCurrentlyPrinting} />
              </Modal>
        }
      </React.Fragment>
    );
  };
