import React from 'react';

import { Modal } from './Modal';

import { connectApi } from '../api/connectApi';
import { reloadPatient } from '../store/patient';

import { VACCINE_STATUS } from '../constants';
import { ContentPane } from './ContentPane';
import { Button } from './Button';

const ModalContent = React.memo(({ open, onClose, onMarkRecordedInError }) => {
  return (
    <Modal title="Delete Vaccination" open={open} onClose={onClose}>
      <ContentPane>
        <h3>WARNING: This will delete this vaccination from the patients record.</h3>
        <Button onClick={() => onMarkRecordedInError()} variant="contained" color="primary">
          Delete vaccine record
        </Button>
      </ContentPane>
    </Modal>
  );
});

export const EditAdministeredVaccineModal = connectApi(
  (api, dispatch, { patientId, vaccineRecordId }) => ({
    onMarkRecordedInError: async () => {
      await api.put(`patient/${patientId}/administeredVaccine/${vaccineRecordId}`, {
        status: VACCINE_STATUS.RECORDED_IN_ERROR,
      });
      dispatch(reloadPatient(patientId));
    },
  }),
)(ModalContent);
