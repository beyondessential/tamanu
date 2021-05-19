import React from 'react';
import styled from 'styled-components';

import { Modal } from '../Modal';
import { PatientIDCardPage } from './PatientIDCardPage';
import { PatientStickerLabelPage } from './PatientStickerLabelPage';
import { Button } from '../Button';
import { Colors } from '../../constants';
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

export const PatientPrintDetailsModal =
  ({
    open,
    onClose,
    patient,
  }) => {
    const [currentlyPrinting, setCurrentlyPrinting] = React.useState(null);
    const CurrentlyPrintingComponent = PRINT_OPTIONS.find(({ label }) => label === currentlyPrinting)?.component;

    return (
      <Modal title="Select label" open={open} onClose={() => { onClose(); setCurrentlyPrinting(null); }}>
        {
          CurrentlyPrintingComponent
            ? <CurrentlyPrintingComponent patient={patient} />
            : <PrintOptionList setCurrentlyPrinting={setCurrentlyPrinting} />
        }
      </Modal>
    );
  };

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
  const [hovered, setHovered] = React.useState(false);
  const Icon = icon;

  return (
    <PrintOptionButton onClick={onPress} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <Icon hovered={hovered} />
      {label}
    </PrintOptionButton>
  );
}
