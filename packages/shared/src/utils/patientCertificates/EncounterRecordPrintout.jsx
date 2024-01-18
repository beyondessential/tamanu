import React from 'react';
import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { CertificateHeader, Watermark } from './Layout';
import { LetterheadSection } from './LetterheadSection';
import { PatientDetailsWithAddress } from './printComponents/PatientDetailsWithAddress';
import {
  DRUG_ROUTE_VALUE_TO_LABEL,
  ENCOUNTER_OPTIONS_BY_VALUE,
} from '@tamanu/web-frontend/app/constants';
import { MultiPageHeader } from './printComponents/MultiPageHeader';
import { getName } from '../patientAccessors';
import { EncounterDetails } from './printComponents/EncounterDetails';
import { startCase } from 'lodash';
import { Footer } from './printComponents/Footer';
import { getDisplayDate } from './getDisplayDate';
import { useImagingRequest } from '@tamanu/web-frontend/app/api/queries/useImagingRequest';

const borderStyle = '1 solid black';

const DATE_FORMAT = 'dd/MM/yyyy';

const DATE_TIME_FORMAT = 'dd/MM/yyyy h:mma';

const textStyles = StyleSheet.create({
  sectionTitle: {
    fontFamily: 'Helvetica-Bold',
    marginBottom: 3,
    fontSize: 14,
    fontWeight: 500,
  },
  tableColumnHeader: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
  },
  tableCellContent: {
    fontFamily: 'Helvetica',
    fontSize: 10,
  },
  tableCellFooter: {
    fontFamily: 'Helvetica',
    fontSize: 8,
  },
});

const tableStyles = StyleSheet.create({
  table: {
    flexDirection: 'column',
    marginBottom: 15,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    borderTop: borderStyle,
    borderRight: borderStyle,
    borderBottom: borderStyle,
    marginBottom: -1,
  },
  baseCell: {
    flexDirection: 'row',
    borderLeft: borderStyle,
    alignItems: 'center',
    padding: 7,
  },
  flexCell: {
    flex: 1,
  },
  p: {
    fontFamily: 'Helvetica',
    fontSize: 10,
  },
});

const Table = props => <View style={tableStyles.table} {...props} />;
const Row = props => <View style={tableStyles.row} {...props} />;
const P = ({ style = {}, children }) => <Text style={[tableStyles.p, style]}>{children}</Text>;
const FlexCell = ({ children, style = {}, fontStyle = {} }) => (
  <View style={[tableStyles.baseCell, tableStyles.flexCell, style]}>
    <P style={fontStyle}>{children}</P>
  </View>
);

const Cell = ({ children, style = {} }) => (
  <View style={[tableStyles.baseCell, style]}>
    <P>{children}</P>
  </View>
);

const HeaderCell = ({ children, style }) => (
  <View style={[tableStyles.baseCell, style]}>
    <P style={{ fontFamily: 'Helvetica-Bold' }}>{children}</P>
  </View>
);

const SectionSpacing = () => <View style={{ paddingBottom: '10px' }} />;

const COLUMNS = {
  encounterTypes: [
    {
      key: 'encounterType',
      title: 'Type',
      accessor: ({ newEncounterType }) => ENCOUNTER_OPTIONS_BY_VALUE[newEncounterType].label,
      style: { width: '65%' },
    },
    {
      key: 'dateMoved',
      title: 'Date & time moved',
      accessor: ({ date }) => getDisplayDate(date, DATE_TIME_FORMAT),
      style: { width: '35%' },
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
      style: { width: '35%' },
    },
    {
      key: 'dateMoved',
      title: 'Date & time moved',
      accessor: ({ date }) => getDisplayDate(date, DATE_TIME_FORMAT),
      style: { width: '35%' },
    },
  ],
  diagnoses: [
    {
      key: 'diagnosis',
      title: 'Diagnosis',
      accessor: ({ diagnosis }) => `${diagnosis?.name} (${diagnosis?.code})`,
      style: { width: '55%' },
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
      accessor: ({ date }) => getDisplayDate(date, DATE_FORMAT),
      style: { width: '25%' },
    },
  ],
  procedures: [
    {
      key: 'procedure',
      title: 'Procedure',
      accessor: ({ procedureType }) => `${procedureType?.name} (${procedureType?.code})`,
      style: { width: '75%' },
    },
    {
      key: 'procedureDate',
      title: 'Procedure date',
      accessor: ({ date }) => getDisplayDate(date, DATE_FORMAT),
      style: { width: '25%' },
    },
  ],
  labRequests: [
    {
      key: 'testType',
      title: 'Test type',
      style: { width: '22.5%' },
    },
    {
      key: 'testCategory',
      title: 'Test category',
      style: { width: '25%' },
    },
    {
      key: 'requestedByName',
      title: 'Requested By',
      style: { width: '22.5%' },
    },
    {
      key: 'requestDate',
      title: 'Request date',
      accessor: ({ requestDate }) => getDisplayDate(requestDate, DATE_FORMAT),
      style: { width: '15%' },
    },
    {
      key: 'completedDate',
      title: 'Published date',
      accessor: ({ completedDate }) => getDisplayDate(completedDate, DATE_FORMAT),
      style: { width: '15%' },
    },
  ],
  imagingRequests: [
    {
      key: 'imagingType',
      title: 'Request type',
      accessor: ({ imagingName }) => imagingName?.label,
      style: { width: '20%' },
    },
    {
      key: 'areaToBeImaged',
      title: 'Area to be imaged',
      accessor: ({ id }) => imagingRequestDataAccessor(id, 'areas'),
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
      accessor: ({ requestedDate }) => getDisplayDate(requestedDate, DATE_FORMAT),
      style: { width: '20%' },
    },
    {
      key: 'completedDate',
      title: 'Completed date',
      accessor: ({ id }) => imagingRequestDataAccessor(id, 'completedDate'),
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
      key: 'instructions',
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
      style: { width: '30%' },
    },
    {
      key: 'prescriptionDate',
      title: 'Prescription date',
      accessor: ({ date }) => getDisplayDate(date, DATE_FORMAT),
      style: { width: '20%' },
    },
  ],
};

const imagingRequestDataAccessor = (imagingRequestId, dataType) => {
  const imagingRequestQuery = useImagingRequest(imagingRequestId);
  const imagingRequest = imagingRequestQuery.data;
  if (dataType === 'areas') {
    return imagingRequest?.areas?.length
      ? imagingRequest?.areas.map(area => area.name).join(', ')
      : imagingRequest?.areaNote;
  }
  if (dataType === 'completedDate') {
    return imagingRequest?.results[0]?.completedAt
      ? getDisplayDate(imagingRequest?.results[0]?.completedAt, DATE_FORMAT)
      : '--/--/----';
  }
  return null;
};

const DataTable = ({ data, columns }) => (
  <Table>
    <Row>
      {columns.map(({ key, title, style }) => (
        <HeaderCell key={key} style={style}>
          {title}
        </HeaderCell>
      ))}
    </Row>
    {data.map(row => (
      <Row key={row.id}>
        {columns.map(({ key, accessor, style }) => (
          <Cell key={key} style={style}>
            {accessor ? accessor(row) : row[key] || ''}
          </Cell>
        ))}
      </Row>
    ))}
  </Table>
);

const TableSection = ({ title, data, columns }) => {
  return (
    <View>
      <Text style={textStyles.sectionTitle}>{title}</Text>
      <DataTable data={data} columns={columns} />
      <SectionSpacing />
    </View>
  );
};

const NotesSection = ({ notes }) => {
  return (
    <View>
      <Text style={textStyles.sectionTitle}>Notes</Text>
      {/*<Table>*/}
      {/*  {notes.map(note => (*/}
      {/*    <Row>*/}
      {/*      <FlexCell>*/}
      {/*        <Text style={textStyles.tableColumnHeader}>{NOTE_TYPE_LABELS[note.noteType]}</Text>*/}
      {/*        {'\n'}*/}
      {/*        <Text style={textStyles.tableCellContent}>{note.content}</Text>*/}
      {/*        <Text style={textStyles.tableCellFooter}>*/}
      {/*          {note.noteType === NOTE_TYPES.TREATMENT_PLAN ? 'Last updated: ' : ''}*/}
      {/*        </Text>*/}
      {/*        <Text style={textStyles.tableCellFooter}>{note.author?.displayName || ''}</Text>*/}
      {/*        <Text style={textStyles.tableCellFooter}>*/}
      {/*          {note.onBehalfOf ? `on behalf of ${note.onBehalfOf.displayName}` : null}*/}
      {/*        </Text>*/}
      {/*        <Text style={textStyles.tableCellFooter}>*/}
      {/*          {`${formatShort(note.date)} ${formatTime(note.date)}`}*/}
      {/*        </Text>*/}
      {/*      </FlexCell>*/}
      {/*    </Row>*/}
      {/*  ))}*/}
      {/*</Table>*/}
    </View>
  );
};

export const EncounterRecordPrintout = ({
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
  getLocalisation,
}) => {
  const { watermark, logo } = certificateData;

  return (
    <Document>
      <Page size="A4" style={{ padding: 30 }}>
        {/*<Page size="A4">*/}
        {watermark && <Watermark src={watermark} />}
        <MultiPageHeader
          documentName="Patient Encounter Record"
          patientName={getName(patient)}
          patiendId={patient.displayId}
        />
        <CertificateHeader>
          <LetterheadSection
            getLocalisation={getLocalisation}
            logoSrc={logo}
            certificateTitle="Patient Encounter Record"
          />
        </CertificateHeader>
        <SectionSpacing />
        <PatientDetailsWithAddress getLocalisation={getLocalisation} patient={patient} />
        <SectionSpacing />
        <EncounterDetails encounter={encounter} />
        <SectionSpacing />
        {encounterTypeHistory.length > 0 && (
          <TableSection
            title="Encounter Types"
            data={encounterTypeHistory}
            columns={COLUMNS.encounterTypes}
          />
        )}
        {locationHistory.length > 0 && (
          <TableSection title="Location" data={locationHistory} columns={COLUMNS.locations} />
        )}
        {diagnoses.length > 0 && (
          <TableSection title="Diagnoses" data={diagnoses} columns={COLUMNS.diagnoses} />
        )}
        {procedures.length > 0 && (
          <TableSection title="Procedures" data={procedures} columns={COLUMNS.procedures} />
        )}
        {labRequests.length > 0 && (
          <TableSection title="Lab requests" data={labRequests} columns={COLUMNS.labRequests} />
        )}
        {/*{medications.length > 0 && (*/}
        {/*  <TableSection title="Medications" data={medications} columns={COLUMNS.medications} />*/}
        {/*)}*/}
        {/*{imagingRequests.length > 0 && (*/}
        {/*  <TableSection*/}
        {/*    title="Imaging requests"*/}
        {/*    data={imagingRequests}*/}
        {/*    columns={COLUMNS.imagingRequests}*/}
        {/*  />*/}
        {/*)}*/}

        {/*{notes.length > 0 && <NotesSection notes={notes} />}*/}
        {/*<Footer />*/}
      </Page>
    </Document>
  );
};
