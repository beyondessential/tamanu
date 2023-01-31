import React from 'react';
import styled from 'styled-components';
import { Typography } from '@material-ui/core';

import { LocalisedLabel } from './SimplePrintout';
import { PrintLetterhead } from './PrintLetterhead';
import { CertificateWrapper } from './CertificateWrapper';
import { DateDisplay } from '../DateDisplay';
import { capitaliseFirstLetter } from '../../utils/capitalise';
import { ListTable } from './ListTable';
import { CertificateLabel } from './CertificateLabels';
import { noteTypes, DRUG_ROUTE_VALUE_TO_LABEL, CERTAINTY_OPTIONS_BY_VALUE } from '../../constants';
import { useLocalisation } from '../../contexts/Localisation';

import { ImagingRequestAreas } from './ImagingRequestAreas';

// STYLES
const CompactListTable = styled(ListTable)`
  td,
  th {
    font-size: 10px;
    line-height: 12px;
    text-align: left;
  }
`;

const Table = styled.table`
  border: 1px solid black;
  border-spacing: 0px;
  border-collapse: collapse;
  margin-top: 10px;
  margin-bottom: 16px;
  width: 100%;
`;

const Row = styled.tr`
  border-bottom: 1px solid black;
`;

const Cell = styled.td`
  border-right: 1px solid black;
  padding-top: 0.5rem;
  padding-left: 0.5rem;
  padding-bottom: 0.5rem;
  font-size: 10px;
  line-height: 12px;
`;

const BoldText = styled.strong`
  font-weight: 600;
  margin-right: 3px;
`;

const RowContainer = styled.div`
  display: flex;
  justify-content: space-between;
  div {
    width: 50%;
  }
`;

const SummaryHeading = styled(Typography)`
  font-weight: 600;
  font-size: 12px;
  line-height: 14px;
`;

const TableHeading = styled(SummaryHeading)`
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
  border-bottom: 0.5px solid #000000;
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
      accessor: ({ certainty }) => CERTAINTY_OPTIONS_BY_VALUE[certainty].label || {},
      style: { width: '20%' },
    },
    {
      key: 'date',
      title: 'Date',
      accessor: ({ date }) => <DateDisplay date={date} showDate /> || {},
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
      accessor: ({ date }) => <DateDisplay date={date} showDate /> || {},
      style: { width: '20%' },
    },
  ],

  labRequests: [
    {
      key: 'testType',
      title: 'Test Type',
      accessor: ({ tests }) => tests.map(test => test.labTestType.name).join(', '),
      style: { width: '40%' },
    },
    {
      key: 'testCategory',
      title: 'Test Category',
      accessor: ({ category }) => (category || {}).name,
      style: { width: '40%' },
    },
    {
      key: 'requestDate',
      title: 'Request Date',
      accessor: ({ requestedDate }) => <DateDisplay date={requestedDate} showDate /> || {},
      style: { width: '20%' },
    },
  ],

  imagingRequests: [
    {
      key: 'imagingType',
      title: 'Imaging request type',
      accessor: ({ imagingName }) => (imagingName || {}).label,
      style: { width: '30%' },
    },
    {
      key: 'areaToBeImaged',
      title: 'Area to be imaged',
      accessor: ({ id }) => <ImagingRequestAreas imagingRequestId={id} /> || {},
      style: { width: '50%' },
    },
    {
      key: 'requestDate',
      title: 'Request Date',
      accessor: ({ requestedDate }) => <DateDisplay date={requestedDate} showDate /> || {},
      style: { width: '20%' },
    },
  ],

  medications: [
    {
      key: 'medication',
      title: 'Medication',
      accessor: ({ medication }) => (medication || {}).name,
      style: { width: '40%' },
    },
    {
      key: 'insructions',
      title: 'Instructions',
      accessor: ({ prescription }) => prescription || {},
      style: { width: '30%' },
    },
    {
      key: 'route',
      title: 'Route',
      accessor: ({ route }) => DRUG_ROUTE_VALUE_TO_LABEL[route] || {},
      style: { width: '10%' },
    },
    {
      key: 'prescriptionDate',
      title: 'Prescription Date',
      accessor: ({ date }) => <DateDisplay date={date} showDate /> || {},
      style: { width: '20%' },
    },
  ],
};

export const EncounterRecord = React.memo(
  ({
    patient,
    encounter,
    certificateData,
    labRequests,
    imagingRequests,
    notes,
    discharge,
    village,
    pad,
  }) => {
    const { firstName, lastName, dateOfBirth, sex, displayId } = patient;
    const { department, location, examiner, reasonForEncounter, startDate } = encounter;
    const { title, subTitle, logo } = certificateData;

    const { getLocalisation } = useLocalisation();
    const imagingTypes = getLocalisation('imagingTypes') || {};
    const updatedImagingRequests = imagingRequests.data.map(imagingRequest => ({
      ...imagingRequest,
      imagingName: imagingTypes[imagingRequest.imagingType],
    }));

    console.log(CERTAINTY_OPTIONS_BY_VALUE);

    return (
      <CertificateWrapper>
        <PrintLetterhead
          title={title}
          subTitle={subTitle}
          logoSrc={logo}
          pageTitle="Patient Encounter Record"
        />

        <SummaryHeading>Patient Details</SummaryHeading>
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
            <LocalisedDisplayValue name="streetVillage">{pad.streetVillage}</LocalisedDisplayValue>
            <LocalisedDisplayValue name="villageName">{village}</LocalisedDisplayValue>
          </div>
        </RowContainer>

        <SummaryHeading>Encounter Details</SummaryHeading>
        <Divider />
        <RowContainer>
          <div>
            <LocalisedDisplayValue name="facility">{location.facility.name}</LocalisedDisplayValue>
            <DisplayValue name="Supervising clinician" size="10px">
              {examiner.displayName}
            </DisplayValue>
            <DisplayValue name="Discharging clinician" size="10px">
              {discharge.discharger.displayName}
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
              <DateDisplay date={discharge.createdAt} showDate={false} showExplicitDate />
            </DisplayValue>
          </div>
        </RowContainer>

        <TableHeading>Diagnoses</TableHeading>
        <CompactListTable data={encounter.diagnoses} columns={columns.diagnoses} />

        <TableHeading>Notes</TableHeading>
        {notes.data.map(note => (
          <>
            <Table>
              <Row>
                <Cell width="45%">
                  <BoldText>{noteTypes.find(x => x.value === note.noteType).label}</BoldText>
                </Cell>
                <Cell>
                  <DateDisplay date={note.date} showDate />
                </Cell>
              </Row>
              <Row>
                <Cell colSpan={2}>
                  {note.noteItems.map(noteItem => (
                    <>
                      <BoldText>
                        <DateDisplay date={noteItem.date} showDate showTime />
                      </BoldText>
                      {noteItem.content}
                      <br />
                    </>
                  ))}
                </Cell>
              </Row>
            </Table>
          </>
        ))}

        <TableHeading>Procedures</TableHeading>
        <CompactListTable data={encounter.procedures} columns={columns.procedures} />

        <TableHeading>Lab Requests</TableHeading>
        <CompactListTable data={labRequests.data} columns={columns.labRequests} />

        <TableHeading>Imaging Requests</TableHeading>
        <CompactListTable data={updatedImagingRequests} columns={columns.imagingRequests} />

        <TableHeading>Medications</TableHeading>
        <CompactListTable data={encounter.medications} columns={columns.medications} />
      </CertificateWrapper>
    );
  },
);
