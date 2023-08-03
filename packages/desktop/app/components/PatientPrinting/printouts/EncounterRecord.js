import React from 'react';
import styled from 'styled-components';
import { Typography } from '@material-ui/core';
import { startCase } from 'lodash';

import { NOTE_TYPES } from '@tamanu/shared/constants';

import { PrintLetterhead } from './reusable/PrintLetterhead';
import { DateDisplay } from '../../DateDisplay';
import { capitaliseFirstLetter } from '../../../utils/capitalise';
import { CertificateWrapper } from './reusable/CertificateWrapper';
import { ListTable } from './reusable/ListTable';
import { DisplayValue, LocalisedDisplayValue } from './reusable/CertificateLabels';
import {
  DRUG_ROUTE_VALUE_TO_LABEL,
  ENCOUNTER_OPTIONS_BY_VALUE,
  NOTE_TYPE_LABELS,
} from '../../../constants';

import { ImagingRequestData } from './reusable/ImagingRequestData';

// STYLES
const CompactListTable = styled(ListTable)`
  margin: 0;
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
  width: 100%;
  margin-bottom: 10px;
`;

const Row = styled.tr`
  border-bottom: 1px solid black;
`;

const RowContent = styled.div`
  margin: 0.5rem;
  font-size: 10px;
  white-space: pre-wrap;
`;

const NoteMeta = styled.div`
  font-size: 8px;
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
  margin-top: 5px;
  margin-bottom: 4px;
`;

const TableHeading = styled(SummaryHeading)`
  margin-left: 3px;
  margin-top: 15px;
  margin-bottom: 5px;
`;

const Divider = styled.div`
  border-bottom: 0.5px solid #000000;
  height: 0;
  margin: 0;
  margin-bottom: 6px;
`;

const ChildNote = styled.div`
  margin-top: 10px;
  &:nth-of-type(1) {
    margin-top: 0;
  }
`;

// Needed to do this to get the printing styles to work correctly. Was getting strange behaviour like
// cutting off the top of the page and overlapping headers without it
export const ShiftedCertificateWrapper = styled(CertificateWrapper)`
  @media print {
    top: -32px;
    padding-top: 32px;
  }
`;

const COLUMNS = {
  encounterTypes: [
    {
      key: 'encounterType',
      title: 'Type',
      accessor: ({ newEncounterType }) => ENCOUNTER_OPTIONS_BY_VALUE[newEncounterType].label,
      style: { width: '70%' },
    },
    {
      key: 'dateMoved',
      title: 'Date & time moved',
      accessor: ({ date }) => <DateDisplay date={date} showDate showTime /> || {},
      style: { width: '30%' },
    },
  ],

  locations: [
    {
      key: 'to',
      title: 'Area',
      accessor: ({ newLocationGroup }) => startCase(newLocationGroup) || '----',
      style: { width: '30%' },
    },
    {
      key: 'location',
      title: 'Location',
      accessor: ({ newLocation }) => startCase(newLocation),
      style: { width: '40%' },
    },
    {
      key: 'dateMoved',
      title: 'Date & time moved',
      accessor: ({ date }) => <DateDisplay date={date} showDate showTime /> || {},
      style: { width: '30%' },
    },
  ],

  diagnoses: [
    {
      key: 'diagnoses',
      title: 'Diagnoses',
      accessor: ({ diagnosis }) => `${diagnosis?.name} (${diagnosis?.code})`,
      style: { width: '60%' },
    },
    {
      key: 'type',
      title: 'Type',
      accessor: ({ isPrimary }) => (isPrimary ? 'Primary' : 'Secondary'),
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
      accessor: ({ procedureType }) => `${procedureType?.name} (${procedureType?.code})`,
      style: { width: '80%' },
    },
    {
      key: 'procedureDate',
      title: 'Procedure date',
      accessor: ({ date }) => <DateDisplay date={date} showDate /> || {},
      style: { width: '20%' },
    },
  ],

  labRequests: [
    {
      key: 'testType',
      title: 'Test type',
      style: { width: '20%' },
    },
    {
      key: 'testCategory',
      title: 'Test category',
      style: { width: '20%' },
    },
    {
      key: 'requestedByName',
      title: 'Requested by',
      style: { width: '20%' },
    },
    {
      key: 'requestDate',
      title: 'Request date',
      accessor: ({ requestDate }) => <DateDisplay date={requestDate} showDate /> || {},
      style: { width: '20%' },
    },
    {
      key: 'completedDate',
      title: 'Completed date',
      accessor: ({ completedDate }) => <DateDisplay date={completedDate} showDate /> || {},
      style: { width: '20%' },
    },
  ],

  imagingRequests: [
    {
      key: 'imagingType',
      title: 'Imaging request type',
      accessor: ({ imagingName }) => imagingName?.label,
      style: { width: '20%' },
    },
    {
      key: 'areaToBeImaged',
      title: 'Area to be imaged',
      accessor: ({ id }) => <ImagingRequestData imagingRequestId={id} dataType="areas" />,
      style: { width: '20%' },
    },
    {
      key: 'requestedBy',
      title: 'Requested by',
      accessor: ({ requestedBy }) => requestedBy?.displayName,
      style: { width: '20%' },
    },
    {
      key: 'requestDate',
      title: 'Request date',
      accessor: ({ requestedDate }) => <DateDisplay date={requestedDate} showDate />,
      style: { width: '20%' },
    },
    {
      key: 'completedDate',
      title: 'Completed date',
      accessor: ({ id }) => <ImagingRequestData imagingRequestId={id} dataType="completedDate" />,
      style: { width: '20%' },
    },
  ],

  medications: [
    {
      key: 'medication',
      title: 'Medication',
      accessor: ({ medication }) => medication?.name,
      style: { width: '20%' },
    },
    {
      key: 'insructions',
      title: 'Instructions',
      accessor: ({ prescription }) => prescription || '',
      style: { width: '30%' },
    },
    {
      key: 'route',
      title: 'Route',
      accessor: ({ route }) => DRUG_ROUTE_VALUE_TO_LABEL[route] || '',
      style: { width: '10%' },
    },
    {
      key: 'prescriber',
      title: 'Prescriber',
      accessor: ({ prescriber }) => prescriber?.displayName,
      style: { width: '20%' },
    },
    {
      key: 'prescriptionDate',
      title: 'Prescription date',
      accessor: ({ date }) => <DateDisplay date={date} showDate />,
      style: { width: '20%' },
    },
  ],
};

export const EncounterRecord = React.memo(
  ({
    patient,
    encounter,
    certificateData,
    encounterTypeHistory,
    locationHistory,
    diagnoses,
    procedures,
    labRequests,
    imagingRequests,
    notes,
    discharge,
    village,
    pad,
    medications,
  }) => {
    const { firstName, lastName, dateOfBirth, sex, displayId } = patient;
    const { department, location, examiner, reasonForEncounter, startDate, endDate } = encounter;
    const { title, subTitle, logo } = certificateData;

    return (
      <ShiftedCertificateWrapper>
        <PrintLetterhead
          title={title}
          subTitle={subTitle}
          logoSrc={logo}
          pageTitle="Patient Encounter Record"
        />

        <SummaryHeading>Patient details</SummaryHeading>
        <Divider />
        <RowContainer>
          <div>
            <DisplayValue name="Patient name">
              {firstName} {lastName}
            </DisplayValue>
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
              {discharge?.discharger?.displayName}
            </DisplayValue>
            <DisplayValue name="Reason for encounter" size="10px">
              {reasonForEncounter}
            </DisplayValue>
          </div>
          <div>
            <DisplayValue name="Discharging department" size="10px">
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

        {encounterTypeHistory.length > 0 ? (
          <>
            <TableHeading>Encounter Types</TableHeading>
            <CompactListTable data={encounterTypeHistory} columns={COLUMNS.encounterTypes} />
          </>
        ) : null}

        {locationHistory.length > 0 ? (
          <>
            <TableHeading>Locations</TableHeading>
            <CompactListTable data={locationHistory} columns={COLUMNS.locations} />
          </>
        ) : null}

        {diagnoses.length > 0 ? (
          <>
            <TableHeading>Diagnoses</TableHeading>
            <CompactListTable data={diagnoses} columns={COLUMNS.diagnoses} />
          </>
        ) : null}

        {procedures.length > 0 ? (
          <>
            <TableHeading>Procedures</TableHeading>
            <CompactListTable data={procedures} columns={COLUMNS.procedures} />
          </>
        ) : null}

        {labRequests.length > 0 ? (
          <>
            <TableHeading>Lab Requests</TableHeading>
            <CompactListTable data={labRequests} columns={COLUMNS.labRequests} />
          </>
        ) : null}

        {imagingRequests.length > 0 ? (
          <>
            <TableHeading>Imaging Requests</TableHeading>
            <CompactListTable data={imagingRequests} columns={COLUMNS.imagingRequests} />
          </>
        ) : null}

        {medications.length > 0 ? (
          <>
            <TableHeading>Medications</TableHeading>
            <CompactListTable data={medications} columns={COLUMNS.medications} />
          </>
        ) : null}

        {notes.length > 0 ? (
          <>
            <TableHeading>Notes</TableHeading>
            <Table>
              {notes.map(note => (
                <Row>
                  <RowContent>
                    <BoldText>{NOTE_TYPE_LABELS[note.noteType]}</BoldText>
                    <ChildNote>{note.content}</ChildNote>
                    <NoteMeta>
                      <span>
                        {note.noteType === NOTE_TYPES.TREATMENT_PLAN ? 'Last updated: ' : ''}
                      </span>
                      <span>{note.author?.displayName || ''} </span>
                      {note.onBehalfOf ? (
                        <span>on behalf of {note.onBehalfOf.displayName} </span>
                      ) : null}
                      <DateDisplay date={note.date} showTime />
                    </NoteMeta>
                  </RowContent>
                </Row>
              ))}
            </Table>
          </>
        ) : null}
      </ShiftedCertificateWrapper>
    );
  },
);
