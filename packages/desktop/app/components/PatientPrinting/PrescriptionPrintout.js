import React, { useEffect, useState } from 'react';
import moment from 'moment';
import styled from 'styled-components';
import { Typography, Box } from '@material-ui/core';

import { useApi } from '../../api';
import { NotesSection, LocalisedLabel } from './SimplePrintout';
import { PrintLetterhead } from './PrintLetterhead';
import { CertificateWrapper } from './CertificateWrapper';
import { DateDisplay } from '../DateDisplay';
import { PatientBarcode } from './PatientBarcode';
import { GridTable } from './GridTable';

const RowContainer = styled.div`
  display: flex;
  justify-content: space-between;
`;

const Text = styled(Typography)`
  font-size: 14px;
`;

const SignatureBox = styled(Box)`
  border: 1px solid black;
  height: 60px;
`;

export const PrescriptionPrintout = React.memo(({ prescriptionData, certificateData }) => {
  const api = useApi();
  const [encounter, setEncounter] = useState({});
  const [patient, setPatient] = useState({});
  const [patientAdditionalData, setPatientAdditionalData] = useState({});
  const [village, setVillage] = useState({});

  useEffect(() => {
    (async () => {
      if (prescriptionData.encounterId) {
        const res = await api.get(`encounter/${prescriptionData.encounterId}`);
        setEncounter(res);
      }
    })();
  }, [api, prescriptionData.encounterId]);

  useEffect(() => {
    (async () => {
      if (encounter.patientId) {
        const res = await api.get(`patient/${encounter.patientId}`);
        setPatient(res);
      }
    })();
  }, [api, encounter.patientId]);

  useEffect(() => {
    (async () => {
      if (encounter.patientId) {
        const res = await api.get(`patient/${encounter.patientId}/additionalData`);
        setPatientAdditionalData(res);
      }
    })();
  }, [api, encounter.patientId]);

  useEffect(() => {
    (async () => {
      if (patient.villageId) {
        const res = await api.get(`referenceData/${encodeURIComponent(patient.villageId)}`);
        setVillage(res);
      }
    })();
  }, [api, patient.villageId]);

  const { firstName, lastName, dateOfBirth, sex, displayId } = patient;
  const { streetVillage } = patientAdditionalData;
  const { name: villageName } = village;
  const { title, subTitle, logo } = certificateData;
  const {
    prescriber,
    medication,
    route,
    prescription,
    quantity,
    repeats,
    date,
    note,
  } = prescriptionData;

  return (
    <CertificateWrapper>
      <PrintLetterhead title={title} subTitle={subTitle} logoSrc={logo} pageTitle="Prescription" />
      <RowContainer>
        <div>
          <LocalisedLabel name="firstName">{firstName}</LocalisedLabel>
          <LocalisedLabel name="lastName">{lastName}</LocalisedLabel>
          <LocalisedLabel name="dateOfBirth">
            <DateDisplay date={dateOfBirth} showDate={false} showExplicitDate />
          </LocalisedLabel>
          <LocalisedLabel name="sex">{sex}</LocalisedLabel>
          <LocalisedLabel name="streetVillage">{streetVillage}</LocalisedLabel>
        </div>
        <div>
          <LocalisedLabel name="villageName">{villageName}</LocalisedLabel>
          <LocalisedLabel name="displayId">{displayId}</LocalisedLabel>
          <PatientBarcode patient={patient} barWidth={2} barHeight={60} margin={0} />
        </div>
      </RowContainer>
      <GridTable
        data={{
          Date: date ? moment(date).format('DD/MM/YYYY') : null,
          Prescriber: prescriber.displayName,
          'Prescriber ID': prescriber.id,
          Facility: encounter?.location?.Facility?.name,
          Medication: medication.name,
          Instructions: prescription,
          Route: route,
          Quantity: quantity,
          Repeats: repeats,
        }}
      />
      <NotesSection notes={[{ content: note }]} />
      <Text>Signed:</Text>
      <SignatureBox />
    </CertificateWrapper>
  );
});
