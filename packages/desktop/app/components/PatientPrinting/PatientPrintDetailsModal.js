import React from 'react';

import { Modal } from '../Modal';
import { PatientIDCardPage } from './PatientIDCardPage';
import { PatientStickerLabelPage } from './PatientStickerLabelPage';


export const PatientPrintDetailsModal = React.memo(
  ({
    open,
    onClose,
    patient,
    readonly,
  }) => {
    console.log(patient, readonly);
    return ( // TODO: Make PrintPortals only render on button click, so they don't interfere with eachother
      <Modal title="Select label" open={open} onClose={onClose}>
        <div>
          {/* <PatientStickerLabelPage patient={patient} readonly={readonly} /> */}
          <PatientIDCardPage patient={patient} />
        </div>
      </Modal>
    );
  },
);

const PrintOption = ({ patient }) => {

}