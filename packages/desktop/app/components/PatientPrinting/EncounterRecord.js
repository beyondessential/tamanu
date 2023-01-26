import React from 'react';
import styled from 'styled-components';
import { Typography, Box } from '@material-ui/core';

import { LocalisedLabel } from './SimplePrintout';
import { PrintLetterhead } from './PrintLetterhead';
import { CertificateWrapper } from './CertificateWrapper';
import { DateDisplay } from '../DateDisplay';
import { capitaliseFirstLetter } from '../../utils/capitalise';
import { ListTable } from './ListTable';

const RowContainer = styled.div`
  display: flex;
  justify-content: space-between;
`;

const TableName = styled(Typography)`
  font-weight: 600;
  font-size: 12px;
  line-height: 14px;
`;

const FieldValue = styled(LocalisedLabel)`
  font-weight: 600;
  font-size: 12px;
  line-height: 14px;
`;

const Divider = styled.hr`
  border: 0.5px solid #000000;
`;

const columns = {
  diagnoses: [
    {
      key: 'diagnoses',
      title: 'Diagnoses',
      accessor: ({ diagnosis }) => (diagnosis || {}).name,
      style: { width: '60%' },
    },
    {
      key: 'certainty',
      title: 'Certainty',
      accessor: diagnosis => (diagnosis || {}).certainty,
      style: { width: '20%' },
    },
    {
      key: 'date',
      title: 'Date',
      accessor: diagnosis => (diagnosis || {}).date,
      style: { width: '20%' },
    },
  ],

  procedures: [
    {
      key: 'procedure',
      title: 'Procedure',
      accessor: ({ procedureType }) => (procedureType || {}).name,
      style: { width: '80%' },
    },
    {
      key: 'procedureDate',
      title: 'Procedure Date',
      accessor: procedure => (procedure || {}).date,
      style: { width: '20%' },
    },
  ],

  labRequests: {},

  imagingRequests: {},

  medications: [
    {
      key: 'medication',
      title: 'Medication',
      accessor: ({ medication }) => (medication || {}).name,
      style: { width: '60%' },
    },
    {
      key: 'insructions',
      title: 'Instructions',
      accessor: medication => (medication || {}).prescription,
      style: { width: '20%' },
    },
    {
      key: 'route',
      title: 'Route',
      accessor: medication => (medication || {}).route,
      style: { width: '20%' },
    },
    {
      key: 'prescriptionDate',
      title: 'Prescription Date',
      accessor: medication => (medication || {}).date,
      style: { width: '20%' },
    },
  ],
};

export const EncounterRecord = React.memo(({ patient, encounter, certificateData }) => {
  const { firstName, lastName, dateOfBirth, sex, displayId, villageId } = patient;
  const { title, subTitle, logo } = certificateData;
  return (
    <CertificateWrapper>
      <PrintLetterhead
        title={title}
        subTitle={subTitle}
        logoSrc={logo}
        pageTitle="Patient Encounter Record"
      />
      <TableName>Patient Details</TableName>
      <Divider />
      <RowContainer>
        <div>
          <FieldValue name="firstName">
            {firstName} {lastName}
          </FieldValue>
          <LocalisedLabel name="dateOfBirth">
            <DateDisplay date={dateOfBirth} showDate={false} showExplicitDate />
          </LocalisedLabel>
          <LocalisedLabel name="sex">{capitaliseFirstLetter(sex)}</LocalisedLabel>
        </div>
        <div>
          <LocalisedLabel name="displayId">{displayId}</LocalisedLabel>
          <LocalisedLabel name="streetVillage">123 street</LocalisedLabel>
          <LocalisedLabel name="villageName">{villageId}</LocalisedLabel>
        </div>
      </RowContainer>
      <TableName>Encounter Details</TableName>
      <Divider />
      <RowContainer>
        <div>
          <LocalisedLabel name="facility">facility</LocalisedLabel>
          <LocalisedLabel name="supervisingClinician">doctor</LocalisedLabel>
          <LocalisedLabel name="dischargingClinician">doctor</LocalisedLabel>
          <LocalisedLabel name="reasonForEncounter">this is a message</LocalisedLabel>
        </div>
        <div>
          <LocalisedLabel name="department">department</LocalisedLabel>
          <LocalisedLabel name="dateOfAdmission">
            <DateDisplay date={dateOfBirth} showDate={false} showExplicitDate />
          </LocalisedLabel>
          <LocalisedLabel name="dateOfDischarge">
            <DateDisplay date={dateOfBirth} showDate={false} showExplicitDate />
          </LocalisedLabel>
        </div>
      </RowContainer>
      <TableName>Diagnoses</TableName>
      <ListTable data={encounter.diagnoses} columns={columns.diagnoses} />
      <TableName>Procedures</TableName>
      <ListTable data={encounter.procedures} columns={columns.procedures} />
      <TableName>Medications</TableName>
      <ListTable data={encounter.medications} columns={columns.medications} />
    </CertificateWrapper>
  );
});
