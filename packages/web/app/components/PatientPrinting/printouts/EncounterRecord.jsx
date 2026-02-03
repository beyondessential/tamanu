import React from 'react';
import styled from 'styled-components';
import { Typography } from '@material-ui/core';
import { startCase } from 'lodash';

import {
  NOTE_TYPES,
  DRUG_ROUTE_LABELS,
  ENCOUNTER_TYPE_LABELS,
  REFERENCE_TYPES,
} from '@tamanu/constants';

import { PrintLetterhead } from './reusable/PrintLetterhead';
import { DateDisplay } from '../../DateDisplay';
import { capitaliseFirstLetter } from '../../../utils/capitalise';
import { CertificateWrapper } from './reusable/CertificateWrapper';
import { ListTable } from './reusable/ListTable';
import { DisplayValue, LocalisedDisplayValue } from './reusable/CertificateLabels';

import { ImagingRequestData } from './reusable/ImagingRequestData';
import { TranslatedText, TranslatedReferenceData, TranslatedEnum } from '../../Translation';

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
      accessor: ({ newEncounterType }) => (
        <TranslatedEnum enumValues={ENCOUNTER_TYPE_LABELS} value={newEncounterType} />
      ),
      style: { width: '70%' },
    },
    {
      key: 'dateMoved',
      title: 'Date & time moved',
      accessor: ({ date }) => (
        <DateDisplay date={date} timeFormat="default" data-testid="datedisplay-8jmd" />
      ),
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
      accessor: ({ date }) => (
        <DateDisplay date={date} timeFormat="default" data-testid="datedisplay-7isg" />
      ),
      style: { width: '30%' },
    },
  ],

  diagnoses: [
    {
      key: 'diagnoses',
      title: 'Diagnoses',
      accessor: ({ diagnosis }) =>
        diagnosis && (
          <>
            <span>
              <TranslatedReferenceData
                fallback={diagnosis.name}
                value={diagnosis.id}
                category="diagnosis"
                data-testid="translatedreferencedata-nbvb"
              />
            </span>
            <span> {diagnosis.code}</span>
          </>
        ),
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
      accessor: ({ date }) => <DateDisplay date={date} data-testid="datedisplay-hynw" />,
      style: { width: '20%' },
    },
  ],

  procedures: [
    {
      key: 'procedure',
      title: 'Procedure',
      accessor: ({ procedureType }) =>
        procedureType && (
          <>
            <span>
              <TranslatedReferenceData
                fallback={procedureType.name}
                value={procedureType.id}
                category={procedureType.type}
                data-testid="translatedreferencedata-rjcy"
              />
            </span>
            <span> {procedureType.code}</span>
          </>
        ),
      style: { width: '80%' },
    },
    {
      key: 'procedureDate',
      title: 'Procedure date',
      accessor: ({ date }) => <DateDisplay date={date} data-testid="datedisplay-deyp" />,
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
      accessor: ({ requestDate }) => (
        <DateDisplay date={requestDate} data-testid="datedisplay-db0y" />
      ),
      style: { width: '20%' },
    },
    {
      key: 'completedDate',
      title: 'Completed date',
      accessor: ({ completedDate }) => (
        <DateDisplay date={completedDate} data-testid="datedisplay-sl34" />
      ),
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
      accessor: ({ id }) => (
        <ImagingRequestData
          imagingRequestId={id}
          dataType="areas"
          data-testid="imagingrequestdata-ntts"
        />
      ),
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
      accessor: ({ requestedDate }) => (
        <DateDisplay date={requestedDate} data-testid="datedisplay-wkf6" />
      ),
      style: { width: '20%' },
    },
    {
      key: 'completedDate',
      title: 'Completed date',
      accessor: ({ id }) => (
        <ImagingRequestData
          imagingRequestId={id}
          dataType="completedDate"
          data-testid="imagingrequestdata-wnn7"
        />
      ),
      style: { width: '20%' },
    },
  ],

  medications: [
    {
      key: 'medication',
      title: 'Medication',
      accessor: ({ medication }) =>
        medication && (
          <TranslatedReferenceData
            fallback={medication.name}
            value={medication.id}
            category={medication.type}
            data-testid="translatedreferencedata-2n2s"
          />
        ),
      style: { width: '20%' },
    },
    {
      key: 'instructions',
      title: 'Instructions',
      accessor: ({ prescription }) => prescription || '',
      style: { width: '30%' },
    },
    {
      key: 'route',
      title: 'Route',
      accessor: ({ route }) => <TranslatedEnum value={route} enumValues={DRUG_ROUTE_LABELS} />,
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
      accessor: ({ date }) => <DateDisplay date={date} data-testid="datedisplay-2lth" />,
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
      <ShiftedCertificateWrapper data-testid="shiftedcertificatewrapper-khpm">
        <PrintLetterhead
          title={title}
          subTitle={subTitle}
          logoSrc={logo}
          pageTitle="Patient Encounter Record"
          data-testid="printletterhead-k8x1"
        />
        <SummaryHeading data-testid="summaryheading-pwt1">Patient details</SummaryHeading>
        <Divider data-testid="divider-xaef" />
        <RowContainer data-testid="rowcontainer-atcx">
          <div>
            <DisplayValue name="Patient name" data-testid="displayvalue-jxjj">
              {firstName} {lastName}
            </DisplayValue>
            <LocalisedDisplayValue name="dateOfBirth" data-testid="localiseddisplayvalue-268h">
              <DateDisplay date={dateOfBirth} format="explicit" data-testid="datedisplay-0c0e" />
            </LocalisedDisplayValue>
            <LocalisedDisplayValue name="sex" data-testid="localiseddisplayvalue-8h2t">
              {capitaliseFirstLetter(sex)}
            </LocalisedDisplayValue>
          </div>
          <div>
            <LocalisedDisplayValue name="displayId" data-testid="localiseddisplayvalue-7d40">
              {displayId}
            </LocalisedDisplayValue>
            <LocalisedDisplayValue name="streetVillage" data-testid="localiseddisplayvalue-rq0r">
              {pad.streetVillage}
            </LocalisedDisplayValue>
            <LocalisedDisplayValue name="villageName" data-testid="localiseddisplayvalue-sfqy">
              {village}
            </LocalisedDisplayValue>
          </div>
        </RowContainer>
        <SummaryHeading data-testid="summaryheading-kk2c">Encounter Details</SummaryHeading>
        <Divider data-testid="divider-mt1l" />
        <RowContainer data-testid="rowcontainer-hbq1">
          <div>
            <LocalisedDisplayValue name="facility" data-testid="localiseddisplayvalue-aqgr">
              <TranslatedReferenceData
                fallback={location.facility.name}
                value={location.facility.id}
                category="facility"
                data-testid="translatedreferencedata-76fg"
              />
            </LocalisedDisplayValue>
            <DisplayValue
              name={
                <TranslatedText
                  stringId="general.supervisingClinician.label"
                  fallback="Supervising :clinician"
                  replacements={{
                    clinician: (
                      <TranslatedText
                        stringId="general.localisedField.clinician.label.short"
                        fallback="Clinician"
                        casing="lower"
                        data-testid="translatedtext-2t0s"
                      />
                    ),
                  }}
                  data-testid="translatedtext-dxkf"
                />
              }
              size="10px"
              data-testid="displayvalue-3aa2"
            >
              {examiner.displayName}
            </DisplayValue>
            <DisplayValue
              name={
                <TranslatedText
                  stringId="general.dischargingClinician.label"
                  fallback="Discharging :clinician"
                  replacements={{
                    clinician: (
                      <TranslatedText
                        stringId="general.localisedField.clinician.label.short"
                        fallback="Clinician"
                        casing="lower"
                        data-testid="translatedtext-0nh8"
                      />
                    ),
                  }}
                  data-testid="translatedtext-1llw"
                />
              }
              size="10px"
              data-testid="displayvalue-3u1y"
            >
              {discharge?.discharger?.displayName}
            </DisplayValue>
            <DisplayValue name="Reason for encounter" size="10px" data-testid="displayvalue-s62a">
              {reasonForEncounter}
            </DisplayValue>
          </div>
          <div>
            <DisplayValue name="Discharging department" size="10px" data-testid="displayvalue-tr66">
              <TranslatedReferenceData
                fallback={department.name}
                value={department.id}
                category="department"
                data-testid="translatedreferencedata-qn59"
              />
            </DisplayValue>
            <DisplayValue name="Date of admission" size="10px" data-testid="displayvalue-w117">
              <DateDisplay date={startDate} format="explicit" data-testid="datedisplay-rnzz" />
            </DisplayValue>
            <DisplayValue name="Date of discharge" size="10px" data-testid="displayvalue-k7iz">
              <DateDisplay date={endDate} format="explicit" data-testid="datedisplay-abwy" />
            </DisplayValue>
          </div>
        </RowContainer>
        {encounterTypeHistory.length > 0 ? (
          <>
            <TableHeading data-testid="tableheading-iwfx">Encounter Types</TableHeading>
            <CompactListTable
              data={encounterTypeHistory}
              columns={COLUMNS.encounterTypes}
              data-testid="compactlisttable-8a6c"
            />
          </>
        ) : null}
        {locationHistory.length > 0 ? (
          <>
            <TableHeading data-testid="tableheading-6b2f">Locations</TableHeading>
            <CompactListTable
              data={locationHistory}
              columns={COLUMNS.locations}
              data-testid="compactlisttable-92zm"
            />
          </>
        ) : null}
        {diagnoses.length > 0 ? (
          <>
            <TableHeading data-testid="tableheading-st4a">Diagnoses</TableHeading>
            <CompactListTable
              data={diagnoses}
              columns={COLUMNS.diagnoses}
              data-testid="compactlisttable-t9bs"
            />
          </>
        ) : null}
        {procedures.length > 0 ? (
          <>
            <TableHeading data-testid="tableheading-5x1d">Procedures</TableHeading>
            <CompactListTable
              data={procedures}
              columns={COLUMNS.procedures}
              data-testid="compactlisttable-mkvu"
            />
          </>
        ) : null}
        {labRequests.length > 0 ? (
          <>
            <TableHeading data-testid="tableheading-aq73">Lab Requests</TableHeading>
            <CompactListTable
              data={labRequests}
              columns={COLUMNS.labRequests}
              data-testid="compactlisttable-0b6z"
            />
          </>
        ) : null}
        {imagingRequests.length > 0 ? (
          <>
            <TableHeading data-testid="tableheading-m9v4">Imaging Requests</TableHeading>
            <CompactListTable
              data={imagingRequests}
              columns={COLUMNS.imagingRequests}
              data-testid="compactlisttable-c6f4"
            />
          </>
        ) : null}
        {medications.length > 0 ? (
          <>
            <TableHeading data-testid="tableheading-h9xk">Medications</TableHeading>
            <CompactListTable
              data={medications}
              columns={COLUMNS.medications}
              data-testid="compactlisttable-8k89"
            />
          </>
        ) : null}
        {notes.length > 0 ? (
          <>
            <TableHeading data-testid="tableheading-3225">Notes</TableHeading>
            <Table data-testid="table-oqy4">
              {notes.map((note, index) => (
                <Row key={note.id} data-testid={`row-6q5a-${index}`}>
                  <RowContent data-testid={`rowcontent-yeda-${index}`}>
                    <BoldText data-testid={`boldtext-wzyl-${index}`}>
                      <TranslatedReferenceData
                        value={note.noteTypeReference?.id}
                        fallback={note.noteTypeReference?.name}
                        category={REFERENCE_TYPES.NOTE_TYPE}
                      />
                    </BoldText>
                    <ChildNote data-testid={`childnote-wtgf-${index}`}>{note.content}</ChildNote>
                    <NoteMeta data-testid={`notemeta-q7d7-${index}`}>
                      <span>
                        {note.noteTypeId === NOTE_TYPES.TREATMENT_PLAN ? 'Last updated: ' : ''}
                      </span>
                      <span>{note.author?.displayName || ''} </span>
                      {note.onBehalfOf ? (
                        <span>on behalf of {note.onBehalfOf.displayName} </span>
                      ) : null}
                      <DateDisplay
                        date={note.date}
                        timeFormat="default"
                        data-testid={`datedisplay-zlgm-${index}`}
                      />
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
