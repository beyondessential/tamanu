import React, { useState, useEffect } from 'react';

import { EncounterRecord } from './EncounterRecord';
import { Modal } from '../Modal';
import { useCertificate } from '../../utils/useCertificate';
import { usePatientData } from '../../api/queries/usePatientData';
// import { FacilityAndSyncVersionIncompatibleError } from 'shared/errors';
// import { DEPARTMENTS } from 'shared/demoData/departments';
import { LoadingIndicator } from '../LoadingIndicator';
// import { useApi } from '../../api';

export const EncounterRecordModal = ({ encounter, open, onClose }) => {
  const patientQuery = usePatientData(encounter.patientId);
  const certificateData = useCertificate();
  const patient = patientQuery.data;

  // ----Encounter Summary
  // Facility
  // department
  // supervising clinician
  // date of admission
  // discharging clinician - STILL TO DO
  // date of discharge - STILL TO DO
  // reason for encounter
  // encounter type
  console.log(encounter);
  // diagnoses

  // notes

  // procedures

  // lab requests

  // imaging requests

  // medications

  return (
    <Modal title="Encounter Record" open={open} onClose={onClose} maxWidth="md">
      {!patientQuery.isSuccess ? (
        <LoadingIndicator />
      ) : (
        <EncounterRecord
          patient={patient}
          encounter={encounter}
          certificateData={certificateData}
        />
      )}
    </Modal>
  );
};
