import React from 'react';
import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { CertificateHeader, FixedHeader, PageBreakPadding, Watermark } from './Layout';
import { LetterheadSection } from './LetterheadSection';
import { PatientDetailsWithAddress } from './printComponents/PatientDetailsWithAddress';
import { startCase } from 'lodash';
import { Footer } from './printComponents/Footer';
import { ENCOUNTER_TYPES, NOTE_TYPES } from '@tamanu/constants';
import { getDisplayDate } from './getDisplayDate';
import { EncounterDetailsExtended } from './printComponents/EncounterDetailsExtended';

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
  headerLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    fontWeight: 400,
    color: '#888888',
  },
  headerValue: {
    fontSize: 8,
    fontWeight: 400,
    fontFamily: 'Helvetica',
    color: '#888888',
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
    alignItems: 'flex-start',
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

export const DRUG_ROUTE_VALUE_TO_LABEL = {
  dermal: 'Dermal',
  ear: 'Ear',
  eye: 'Eye',
  intramuscular: 'IM',
  intravenous: 'IV',
  inhaled: 'Inhaled',
  nasal: 'Nasal',
  oral: 'Oral',
  rectal: 'Rectal',
  subcutaneous: 'S/C',
  sublingual: 'Sublingual',
  topical: 'Topical',
  vaginal: 'Vaginal',
};

const ENCOUNTER_LABELS = {
  [ENCOUNTER_TYPES.ADMISSION]: 'Hospital admission',
  [ENCOUNTER_TYPES.TRIAGE]: 'Triage',
  [ENCOUNTER_TYPES.CLINIC]: 'Clinic',
  [ENCOUNTER_TYPES.IMAGING]: 'Imaging',
  [ENCOUNTER_TYPES.EMERGENCY]: 'Emergency short stay',
  [ENCOUNTER_TYPES.OBSERVATION]: 'Active ED patient',
  [ENCOUNTER_TYPES.SURVEY_RESPONSE]: 'Form response',
  [ENCOUNTER_TYPES.VACCINATION]: 'Vaccination record',
};

const NOTE_TYPE_LABELS = {
  [NOTE_TYPES.TREATMENT_PLAN]: 'Treatment plan',
  [NOTE_TYPES.ADMISSION]: 'Admission',
  [NOTE_TYPES.CLINICAL_MOBILE]: 'Clinical note (mobile)',
  [NOTE_TYPES.DIETARY]: 'Dietary',
  [NOTE_TYPES.DISCHARGE]: 'Discharge planning',
  [NOTE_TYPES.HANDOVER]: 'Handover note',
  [NOTE_TYPES.MEDICAL]: 'Medical',
  [NOTE_TYPES.NURSING]: 'Nursing',
  [NOTE_TYPES.OTHER]: 'Other',
  [NOTE_TYPES.PHARMACY]: 'Pharmacy',
  [NOTE_TYPES.PHYSIOTHERAPY]: 'Physiotherapy',
  [NOTE_TYPES.SOCIAL]: 'Social welfare',
  [NOTE_TYPES.SURGICAL]: 'Surgical',
  [NOTE_TYPES.SYSTEM]: 'System',
};

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
      accessor: ({ newEncounterType }) => ENCOUNTER_LABELS[newEncounterType],
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
      style: { width: '20%' },
    },
    {
      key: 'testCategory',
      title: 'Test category',
      style: { width: '25%' },
    },
    {
      key: 'requestedByName',
      title: 'Requested By',
      style: { width: '20%' },
    },
    {
      key: 'requestDate',
      title: 'Request date',
      accessor: ({ requestDate }) => getDisplayDate(requestDate, DATE_FORMAT),
      style: { width: '17.5%' },
    },
    {
      key: 'completedDate',
      title: 'Published date',
      accessor: ({ completedDate }) => getDisplayDate(completedDate, DATE_FORMAT),
      style: { width: '17.5%' },
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
      accessor: imagingRequest =>
        imagingRequest?.areas?.length
          ? imagingRequest?.areas.map(area => area.name).join(', ')
          : imagingRequest?.areaNote,
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
      accessor: imagingRequest =>
        imagingRequest?.results[0]?.completedAt
          ? getDisplayDate(imagingRequest?.results[0]?.completedAt, DATE_FORMAT)
          : '--/--/----',
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

const NotesSection = ({ notes }) => (
  <View>
    <Text style={textStyles.sectionTitle}>Notes</Text>
    <Table>
      {notes.map(note => (
        <Row key={note.id}>
          <FlexCell>
            <Text style={textStyles.tableColumnHeader}>{NOTE_TYPE_LABELS[note.noteType]}</Text>
            {`\n`}
            <Text style={textStyles.tableCellContent}>{note.content}</Text>
            {`\n`}
            <Text style={textStyles.tableCellFooter}>
              {note.noteType === NOTE_TYPES.TREATMENT_PLAN ? 'Last updated: ' : ''}
            </Text>
            <Text style={textStyles.tableCellFooter}>{note.author?.displayName || ''}</Text>
            <Text style={textStyles.tableCellFooter}>
              {note.onBehalfOf ? ` on behalf of ${note.onBehalfOf.displayName}` : null}
            </Text>
            <Text style={textStyles.tableCellFooter}>
              {`${getDisplayDate(note.date)} ${getDisplayDate(note.date, 'h:mma')}`}
            </Text>
          </FlexCell>
        </Row>
      ))}
    </Table>
  </View>
);

const EncounterRecordHeader = ({ patient }) => (
  <View style={{ flexDirection: 'row' }}>
    <Text style={textStyles.headerLabel}>Patient encounter record | </Text>
    <Text style={textStyles.headerLabel}>Patient name: </Text>
    <Text style={textStyles.headerValue}>
      {patient.firstName} {patient.lastName} |{' '}
    </Text>
    <Text style={textStyles.headerLabel}>Patient ID: </Text>
    <Text style={textStyles.headerValue}>{patient.displayId}</Text>
  </View>
);

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
  clinicianText,
}) => {
  const { watermark, logo } = certificateData;

  return (
    <Document>
      <Page size="A4" style={{ padding: 30 }}>
        {watermark && <Watermark src={watermark} />}
        {/*<MultiPageHeader*/}
        {/*  documentName="Patient Encounter Record"*/}
        {/*  patientName={getName(patient)}*/}
        {/*  patiendId={patient.displayId}*/}
        {/*/>*/}
        <FixedHeader>
          <View
            fixed
            render={({ pageNumber }) =>
              pageNumber > 1 && <EncounterRecordHeader patient={patient} />
            }
          />
        </FixedHeader>
        <View fixed render={({ pageNumber }) => pageNumber > 1 && <PageBreakPadding />} />
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
        <EncounterDetailsExtended
          encounter={encounter}
          discharge={discharge}
          clinicianText={clinicianText}
        />
        <SectionSpacing />
        {encounterTypeHistory.length > 0 && (
          <TableSection
            title="Encounter types"
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
        {imagingRequests.length > 0 && (
          <TableSection
            title="Imaging requests"
            data={imagingRequests}
            columns={COLUMNS.imagingRequests}
          />
        )}
        {medications.length > 0 && (
          <TableSection title="Medications" data={medications} columns={COLUMNS.medications} />
        )}
        {notes.length > 0 && <NotesSection notes={notes} />}
        <Footer />
      </Page>
    </Document>
  );
};
