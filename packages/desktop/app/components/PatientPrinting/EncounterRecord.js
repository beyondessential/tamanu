import React from 'react';
import styled from 'styled-components';
import { Typography, Box } from '@material-ui/core';

import { LocalisedLabel } from './SimplePrintout';
import { PrintLetterhead } from './PrintLetterhead';
import { CertificateWrapper } from './CertificateWrapper';
import { DateDisplay } from '../DateDisplay';
import { capitaliseFirstLetter } from '../../utils/capitalise';
import { ListTable } from './ListTable';
import { CertificateLabel } from './CertificateLabels';

// STYLES
const Table = styled.table`
  border: 1px solid black;
  margin-top: 10px;
  margin-bottom: 16px;
  border-spacing: 0px;
  border-collapse: collapse;
  width: 100%;
`;

const Row = styled.tr`
  border-bottom: 1px solid black;
`;

const Cell = styled.td`
  border-right: 1px solid black;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
  font-size: 14px;
`;

const RowContainer = styled.div`
  display: flex;
  justify-content: space-between;
  div {
    width: 50%;
  }
`;

const TableName = styled(Typography)`
  font-weight: 600;
  font-size: 12px;
  line-height: 14px;
  margin-left: 3px;
`;

const LocalisedDisplayValue = styled(LocalisedLabel)`
  font-size: 10px;
  line-height: 12px;
`;

const DisplayValue = styled(CertificateLabel)`
  font-size: 10px;
  line-height: 12px;
  margin-bottom: 9px;
`;

const Divider = styled.hr`
  border: 0.5px solid #000000;
`;

// COLUMN LAYOUTS
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
      accessor: ({ certainty }) => certainty || {},
      style: { width: '20%' },
    },
    {
      key: 'date',
      title: 'Date',
      accessor: ({ date }) => date || {},
      style: { width: '20%' },
    },
  ],

  // this is a different form of table. likely will need to be done differently
  notes: [],

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
      accessor: ({ date }) => date || {},
      style: { width: '20%' },
    },
  ],

  labRequests: [
    {
      key: 'testType',
      title: 'Test Type',
      accessor: ({ tests }) => tests.map(test => test.labTestType.name).join(', '),
      style: { width: '60%' },
    },
    {
      key: 'testCategory',
      title: 'Test Category',
      accessor: ({ category }) => (category || {}).name,
      style: { width: '20%' },
    },
    {
      key: 'requestDate',
      title: 'Request Date',
      accessor: ({ requestedDate }) => requestedDate || {},
      style: { width: '20%' },
    },
  ],

  imagingRequests: [
    {
      key: 'imagingType',
      title: 'Imaging request type',
      accessor: ({ imagingType }) => imagingType || {},
      style: { width: '60%' },
    },
    {
      key: 'areaToBeImaged',
      title: 'Area to be imaged',
      accessor: '',
      style: { width: '20%' },
    },
    {
      key: 'requestDate',
      title: 'Request Date',
      accessor: ({ requestedDate }) => requestedDate || {},
      style: { width: '20%' },
    },
  ],

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
      accessor: ({ prescription }) => prescription || {},
      style: { width: '20%' },
    },
    {
      key: 'route',
      title: 'Route',
      accessor: ({ route }) => route || {},
      style: { width: '20%' },
    },
    {
      key: 'prescriptionDate',
      title: 'Prescription Date',
      accessor: ({ date }) => date || {},
      style: { width: '20%' },
    },
  ],
};

export const EncounterRecord = React.memo(
  ({ patient, encounter, certificateData, labRequests, imagingRequests, notes }) => {
    const { firstName, lastName, dateOfBirth, sex, displayId, villageId } = patient;
    const { department, examiner, reasonForEncounter, startDate, endDate } = encounter;
    const { title, subTitle, logo } = certificateData;

    console.log(notes);

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
            <LocalisedDisplayValue name="firstName">
              {firstName} {lastName}
            </LocalisedDisplayValue>
            <LocalisedDisplayValue name="dateOfBirth">
              <DateDisplay date={dateOfBirth} showDate={false} showExplicitDate />
            </LocalisedDisplayValue>
            <LocalisedDisplayValue name="sex">{capitaliseFirstLetter(sex)}</LocalisedDisplayValue>
          </div>
          <div>
            <LocalisedDisplayValue name="displayId">{displayId}</LocalisedDisplayValue>
            <LocalisedDisplayValue name="streetVillage">123 street</LocalisedDisplayValue>
            <LocalisedDisplayValue name="villageName">{villageId}</LocalisedDisplayValue>
          </div>
        </RowContainer>

        <TableName>Encounter Details</TableName>
        <Divider />
        <RowContainer>
          <div>
            <LocalisedDisplayValue name="facility">{department.facilityId}</LocalisedDisplayValue>
            <DisplayValue name="Supervising clinician" size="10px">
              {examiner.displayName}
            </DisplayValue>
            <DisplayValue name="Discharging clinician" size="10px">
              doctor
            </DisplayValue>
            <DisplayValue name="Reason for encounter" size="10px">
              {reasonForEncounter}
            </DisplayValue>
          </div>
          <div>
            <DisplayValue name="Department" size="10px">
              {department.name}
            </DisplayValue>
            <DisplayValue name="Date of admission" size="10px">
              <DateDisplay date={startDate} showDate={false} showExplicitDate />
            </DisplayValue>
            <DisplayValue name="Date of discharge" size="10px">
              <DateDisplay date={endDate} showDate={false} showExplicitDate />
            </DisplayValue>
          </div>
        </RowContainer>

        <TableName>Diagnoses</TableName>
        <ListTable data={encounter.diagnoses} columns={columns.diagnoses} />

        <TableName>Notes</TableName>
        <Table>
          {notes.data.map(note => (
            <>
              <Row>
                <Cell>Note Type</Cell>
                <Cell>Date</Cell>
              </Row>
              <br />
              <Row>
                <Cell colSpan={2}>The quick brown fox jumped over the lazy dog</Cell>
              </Row>
            </>
          ))}
        </Table>

        <TableName>Procedures</TableName>
        <ListTable data={encounter.procedures} columns={columns.procedures} />

        <TableName>Lab Requests</TableName>
        <ListTable data={labRequests.data} columns={columns.labRequests} />

        <TableName>Imaging Requests</TableName>
        <ListTable data={imagingRequests.data} columns={columns.imagingRequests} />

        <TableName>Medications</TableName>
        <ListTable data={encounter.medications} columns={columns.medications} />
      </CertificateWrapper>
    );
  },
);
