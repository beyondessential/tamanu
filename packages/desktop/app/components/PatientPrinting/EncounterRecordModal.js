import React, { useState, useEffect } from 'react';

// import { PrescriptionPrintout } from './PrescriptionPrintout';
import { Modal } from '../Modal';
// import { useCertificate } from '../../utils/useCertificate';
import { usePatientData } from '../../api/queries/usePatientData';
// import { FacilityAndSyncVersionIncompatibleError } from 'shared/errors';
// import { DEPARTMENTS } from 'shared/demoData/departments';
// import { LoadingIndicator } from '../LoadingIndicator';
// import { useApi } from '../../api';

export const EncounterRecordModal = ({ encounter, open, onClose }) => {
  // const encounterQuery = useEncounterData(encounter.id);
  const patientQuery = usePatientData(encounter.patientId);
  // console.log(encounterQuery);
  // console.log('encounter id = ' + encounter.id);
  // console.log('patient id = ' + encounter.patientId);

  // DATA TO FETCH
  // ----Patient Summary
  // name
  // id
  // addresss
  // sex
  // village
  const patient = patientQuery.data;
  console.log('Patient Summary');
  if (patient) {
    console.log(patient);
    console.log(`${patient.firstName} ${patient.lastName}`);
    console.log(patient.id);
    // ADDRESS MADE FROM PAD DATA
    console.log(patient.sex);
    console.log(patient.villageId);
  }

  // ----Encounter Summary
  // Facilityf X=
  // department
  // supervising clinician
  // date of admission
  // discharging clinician - STILL TO DO
  // date of discharge - STILL TO DO
  // reason for encounter
  // encounter type
  console.log('Encounter Summary');
  console.log(encounter);
  if (encounter) {
    console.log(encounter.department.facilityId);
    console.log(encounter.departmentId);
    console.log(encounter.examinerId);
    console.log(encounter.startDate);
    console.log(encounter.reasonForEncounter);
    // DISCHARGE DETAILS
    console.log(encounter.encounterType);
  }

  // diagnoses

  // notes

  // procedures

  // lab requests

  // imaging requests

  // medications

  return (
    <Modal title="Discharge" open={open} onClose={onClose}>
      abc
    </Modal>
  );
};
