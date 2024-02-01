import React from 'react';
import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { CertificateHeader, FixedFooter, FixedHeader, PageBreakPadding, Watermark } from './Layout';
import { LetterheadSection } from './LetterheadSection';
import { PatientDetailsWithAddress } from './printComponents/PatientDetailsWithAddress';
import { startCase } from 'lodash';
import { Footer } from './printComponents/Footer';
import {
  ENCOUNTER_LABELS,
  NOTE_TYPE_LABELS,
  DRUG_ROUTE_VALUE_TO_LABEL,
  NOTE_TYPES,
} from '@tamanu/constants';
import { getDisplayDate } from './getDisplayDate';
import { EncounterDetailsExtended } from './printComponents/EncounterDetailsExtended';
import { MultiPageHeader } from './printComponents/MultiPageHeader';
import { getName } from '../patientAccessors';

const borderStyle = '1 solid black';

const DATE_FORMAT = 'dd/MM/yyyy';

const DATE_TIME_FORMAT = 'dd/MM/yyyy h:mma';

const pageStyles = StyleSheet.create({
  body: {
    paddingHorizontal: 50,
    paddingTop: 30,
    paddingBottom: 70,
  },
});

const textStyles = StyleSheet.create({
  sectionTitle: {
    fontFamily: 'Helvetica-Bold',
    marginBottom: 3,
    fontSize: 11,
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
      accessor: ({ date }) => (date ? getDisplayDate(date, DATE_TIME_FORMAT) : '--/--/----'),
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
      accessor: ({ date }) => (date ? getDisplayDate(date, DATE_TIME_FORMAT) : '--/--/----'),
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
      accessor: ({ date }) => (date ? getDisplayDate(date, DATE_FORMAT) : '--/--/----'),
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
      accessor: ({ date }) => (date ? getDisplayDate(date, DATE_FORMAT) : '--/--/----'),
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
      title: 'Requested by',
      style: { width: '20%' },
    },
    {
      key: 'requestDate',
      title: 'Request date',
      accessor: ({ requestDate }) =>
        requestDate ? getDisplayDate(requestDate, DATE_FORMAT) : '--/--/----',
      style: { width: '17.5%' },
    },
    {
      key: 'completedDate',
      title: 'Published date',
      accessor: ({ completedDate }) =>
        completedDate ? getDisplayDate(completedDate, DATE_FORMAT) : '--/--/----',
      style: { width: '17.5%' },
    },
  ],
  imagingRequests: [
    {
      key: 'imagingType',
      title: 'Request type',
      accessor: ({ imagingName }) => imagingName?.label,
      style: { width: '17%' },
    },
    {
      key: 'areaToBeImaged',
      title: 'Area to be imaged',
      accessor: imagingRequest =>
        imagingRequest?.areas?.length
          ? imagingRequest?.areas.map(area => area.name).join(', ')
          : imagingRequest?.areaNote,
      style: { width: '25%' },
    },
    {
      key: 'requestedBy',
      title: 'Requested by',
      accessor: ({ requestedBy }) => requestedBy?.displayName,
      style: { width: '18%' },
    },
    {
      key: 'requestDate',
      title: 'Request date',
      accessor: ({ requestedDate }) =>
        requestedDate ? getDisplayDate(requestedDate, DATE_FORMAT) : '--/--/----',
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
      style: { width: '12.5%' },
    },
    {
      key: 'prescriber',
      title: 'Prescriber',
      accessor: ({ prescriber }) => prescriber?.displayName,
      style: { width: '25%' },
    },
    {
      key: 'prescriptionDate',
      title: 'Prescription date',
      accessor: ({ date }) => (date ? getDisplayDate(date, DATE_FORMAT) : '--/--/----'),
      style: { width: '22.5%' },
    },
  ],
};

const TableHeading = ({ title }) => {
  let firstPageOccurence = Number.MAX_SAFE_INTEGER;
  return (
    <Text
      fixed
      style={textStyles.sectionTitle}
      render={({ pageNumber, subPageNumber }) => {
        if (pageNumber < firstPageOccurence && subPageNumber) {
          firstPageOccurence = pageNumber;
        }
        return pageNumber === firstPageOccurence ? title : `${title} cont...`;
      }}
    >
      {title}
    </Text>
  );
};

const DataTableHeader = ({ columns, title }) => {
  return (
    <View fixed>
      <TableHeading title={title} />
      <Row wrap={false}>
        {columns.map(({ key, title, style }) => (
          <HeaderCell key={key} style={style}>
            {title}
          </HeaderCell>
        ))}
      </Row>
    </View>
  );
};

const DataTable = ({ data, columns, title }) => (
  <Table>
    <DataTableHeader columns={columns} title={title} />
    {data.map(row => (
      <Row key={row.id} wrap={false}>
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
      <View minPresenceAhead={35} />
      <DataTable data={data} columns={columns} title={title} />
      <SectionSpacing />
    </View>
  );
};

const NoteFooter = ({ note }) => (
  <View>
    <Text style={textStyles.tableCellFooter}>
      {note.noteType === NOTE_TYPES.TREATMENT_PLAN ? 'Last updated: ' : ''}
    </Text>
    <Text style={textStyles.tableCellFooter}>{note.author?.displayName || ''}</Text>
    <Text style={textStyles.tableCellFooter}>
      {note.onBehalfOf ? ` on behalf of ${note.onBehalfOf.displayName}` : null}
    </Text>
    <Text style={textStyles.tableCellFooter} fixed>
      {` ${getDisplayDate(note.date)} ${getDisplayDate(note.date, 'h:mma')}`}
    </Text>
  </View>
);

const NotesSection = ({ notes }) => (
  <View>
    <TableHeading title="Notes" />
    <Table>
      {/*<View style={{ borderTop: '1px solid black' }} fixed />*/}
      {notes.map(note => (
        <Row key={note.id}>
          <FlexCell>
            <Text style={textStyles.tableColumnHeader} fixed>
              {NOTE_TYPE_LABELS[note.noteType]}
              {`\n`}
            </Text>
            <Text style={textStyles.tableCellContent}>
              {note.content}
              {`\n`}
            </Text>
            <NoteFooter note={note} />
          </FlexCell>
        </Row>
      ))}
      {/*<View style={{ borderBottom: '1px solid black' }} fixed />*/}
    </Table>
  </View>
);

export const EncounterRecordPrintout = ({
  patientData,
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
  medications,
  getLocalisation,
  clinicianText,
}) => {
  const { watermark, logo } = certificateData;

  return (
    <Document>
      <Page size="A4" style={pageStyles.body} wrap>
        {watermark && <Watermark src={watermark} />}
        <MultiPageHeader
          documentName="Patient encounter record"
          patientId={patientData.displayId}
          patientName={getName(patientData)}
        />
        <CertificateHeader>
          <LetterheadSection
            getLocalisation={getLocalisation}
            logoSrc={logo}
            certificateTitle="Patient encounter record"
            letterheadConfig={certificateData}
          />
        </CertificateHeader>
        <SectionSpacing />
        <PatientDetailsWithAddress getLocalisation={getLocalisation} patient={patientData} />
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
