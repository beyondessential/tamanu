import React from 'react';
import { Document, StyleSheet, View } from '@react-pdf/renderer';
import { startCase } from 'lodash';

import {
  ENCOUNTER_TYPE_LABELS,
  NOTE_TYPE_LABELS,
  DRUG_ROUTE_LABELS,
  NOTE_TYPES,
} from '@tamanu/constants';

import { CertificateHeader, Watermark } from './Layout';
import { LetterheadSection } from './LetterheadSection';
import { PatientDetailsWithAddress } from './printComponents/PatientDetailsWithAddress';
import { getDisplayDate } from './getDisplayDate';
import { EncounterDetailsExtended } from './printComponents/EncounterDetailsExtended';
import { MultiPageHeader } from './printComponents/MultiPageHeader';
import { getName } from '../patientAccessors';
import { Footer } from './printComponents/Footer';
import { useLanguageContext, withLanguageContext } from '../pdf/languageContext';
import { Page } from '../pdf/Page';
import { Text } from '../pdf/Text';
import { formatShort, formatTime } from '@tamanu/utils/dateTime';

const borderStyle = '1 solid black';

const pageStyles = StyleSheet.create({
  body: {
    paddingHorizontal: 50,
    paddingTop: 30,
    paddingBottom: 50,
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
    marginBottom: 5,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    borderTop: borderStyle,
    borderRight: borderStyle,
    borderBottom: borderStyle,
    marginBottom: -1,
  },
  notesRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    borderTop: borderStyle,
    marginBottom: -1,
  },
  baseCell: {
    flexDirection: 'row',
    borderLeft: borderStyle,
    alignItems: 'flex-start',
    padding: 7,
  },
  p: {
    fontFamily: 'Helvetica',
    fontSize: 10,
  },
  notesCell: {
    width: '100%',
    flexDirection: 'column',
    borderLeft: borderStyle,
    borderRight: borderStyle,
    borderBottom: borderStyle,
    alignItems: 'flex-start',
    padding: 7,
  },
  notesFooter: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
});

const Table = (props) => <View style={tableStyles.table} {...props} />;
const Row = (props) => (
  <View
    style={[tableStyles.row, props.width && { width: props.width, justifyContent: 'start' }]}
    {...props}
  />
);
const P = ({ style = {}, bold, children }) => (
  <Text bold={bold} style={[tableStyles.p, style]}>
    {children}
  </Text>
);

const Cell = ({ children, style = {} }) => (
  <View style={[tableStyles.baseCell, style]}>
    <P>{children}</P>
  </View>
);

const HeaderCell = ({ children, style }) => (
  <View style={[tableStyles.baseCell, style]}>
    <P bold>{children}</P>
  </View>
);

const NotesCell = ({ children, style = {} }) => (
  <View style={[tableStyles.notesCell, style]}>{children}</View>
);

const SectionSpacing = () => <View style={{ paddingBottom: '10px' }} />;

const MultipageTableHeading = ({ title, style = textStyles.sectionTitle }) => {
  const { getTranslation } = useLanguageContext();
  let firstPageOccurrence = Number.MAX_SAFE_INTEGER;
  return (
    <Text
      fixed
      style={style}
      render={({ pageNumber, subPageNumber }) => {
        if (pageNumber < firstPageOccurrence && subPageNumber) {
          firstPageOccurrence = pageNumber;
        }
        return pageNumber === firstPageOccurrence
          ? title
          : `${title} ${getTranslation('pdf.heading.contentContinued', 'cont...')}`;
      }}
    />
  );
};

const DataTableHeading = ({ columns, title, width }) => {
  return (
    <View fixed>
      <MultipageTableHeading title={title} />
      <Row wrap={false} width={width}>
        {columns.map(({ key, title, style }) => {
          if (Array.isArray(title)) {
            return (
              <View
                key={key}
                style={[tableStyles.baseCell, { flexDirection: 'column', padding: 4 }, style]}
              >
                <P style={{ fontFamily: 'Helvetica-Bold' }}>{title[0]}</P>
                <P>{title[1]}</P>
              </View>
            );
          }
          return (
            <HeaderCell key={key} style={style}>
              {title}
            </HeaderCell>
          );
        })}
      </Row>
    </View>
  );
};

const DataTable = ({ data, columns, title, type }) => {
  let width = null;
  if (type === 'vitals' && columns.length <= 12) {
    width = 138 + (columns.length - 1) * 50 + 'px';
  }

  return (
    <Table>
      <DataTableHeading columns={columns} title={title} width={width} />
      {data.map((row) => (
        <Row key={row.id} wrap={false} width={width}>
          {columns.map(({ key, accessor, style }) => (
            <Cell key={key} style={style}>
              {accessor ? accessor(row) : row[key] || ''}
            </Cell>
          ))}
        </Row>
      ))}
    </Table>
  );
};

const TableSection = ({ title, data, columns, type }) => {
  return (
    <View>
      <View minPresenceAhead={70} />
      <DataTable data={data} columns={columns} title={title} type={type} />
      <SectionSpacing />
    </View>
  );
};

const NoteFooter = ({ note }) => {
  const { getTranslation } = useLanguageContext();
  return (
    <Text style={textStyles.tableCellFooter}>
      {[
        note.noteType === NOTE_TYPES.TREATMENT_PLAN &&
          `${getTranslation('general.lastUpdated.label', 'Last updated')}:`,
        note.author?.displayName,
        note.onBehalfOf &&
          getTranslation('note.table.onBehalfOf', 'on behalf of :changeOnBehalfOfName', {
            replacements: {
              changeOnBehalfOfName: note.onBehalfOf.displayName,
            },
          }),
        formatShort(note.date),
        getDisplayDate(note.date, 'h:mma'),
      ]
        .filter(Boolean)
        .join(' ')}
    </Text>
  );
};
const NotesMultipageCellPadding = () => {
  let firstPageOccurrence = Number.MAX_SAFE_INTEGER;
  return (
    <View
      fixed
      render={({ pageNumber, subPageNumber }) => {
        if (pageNumber < firstPageOccurrence && subPageNumber) {
          firstPageOccurrence = pageNumber;
        }
        return pageNumber !== firstPageOccurrence && <View style={{ paddingBottom: 7 }} />;
      }}
    />
  );
};

const NotesSection = ({ notes }) => {
  const { getTranslation, getEnumTranslation } = useLanguageContext();
  return (
    <>
      <View minPresenceAhead={80} />
      <View>
        <MultipageTableHeading title={getTranslation('general.notes.label', 'Notes')} />
        <Table>
          {notes.map((note) => (
            <>
              <View minPresenceAhead={80} />
              <View style={tableStyles.notesRow} key={note.id}>
                <View
                  style={{
                    borderTop: borderStyle,
                    position: 'absolute',
                    top: -1,
                    right: 0,
                    left: 0,
                  }}
                  fixed
                />
                <NotesCell>
                  <NotesMultipageCellPadding />
                  <MultipageTableHeading
                    title={getEnumTranslation(NOTE_TYPE_LABELS, note.noteType)}
                    style={textStyles.tableColumnHeader}
                  />
                  <Text style={textStyles.tableCellContent}>{`${note.content}\n`}</Text>
                  <NoteFooter note={note} />
                  <View
                    style={{
                      borderBottom: borderStyle,
                      position: 'absolute',
                      bottom: -1,
                      right: -1,
                      left: -1,
                    }}
                    fixed
                  />
                </NotesCell>
              </View>
            </>
          ))}
        </Table>
      </View>
    </>
  );
};

const EncounterRecordPrintoutComponent = ({
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
  vitalsData,
  recordedDates,
  getVitalsColumn,
}) => {
  const { getTranslation, getEnumTranslation } = useLanguageContext();
  const { watermark, logo } = certificateData;

  const COLUMNS = {
    encounterTypes: [
      {
        key: 'encounterType',
        title: getTranslation('encounter.type.label', 'Type'),
        accessor: ({ newEncounterType }) =>
          getEnumTranslation(ENCOUNTER_TYPE_LABELS, newEncounterType),
        style: { width: '65%' },
      },
      {
        key: 'dateMoved',
        title: getTranslation('pdf.encounterRecord.dateAndTimeMoved', 'Date & time moved'),
        accessor: ({ date }) => (date ? `${formatShort(date)} ${formatTime(date)}` : '--/--/---- --:----'),
        style: { width: '35%' },
      },
    ],
    locations: [
      {
        key: 'to',
        title: getTranslation('general.localisedField.locationGroupId.label', 'Area'),
        accessor: ({ newLocationGroup }) => startCase(newLocationGroup) || '----',
        style: { width: '30%' },
      },
      {
        key: 'location',
        title: getTranslation('general.localisedField.locationId.label', 'Location'),
        accessor: ({ newLocation }) => startCase(newLocation),
        style: { width: '35%' },
      },
      {
        key: 'dateMoved',
        title: getTranslation('pdf.encounterRecord.dateAndTimeMoved', 'Date & time moved'),
        accessor: ({ date }) => (date ? `${formatShort(date)} ${formatTime(date)}` : '--/--/---- --:----'),
        style: { width: '35%' },
      },
    ],
    diagnoses: [
      {
        key: 'diagnosis',
        title: getTranslation('general.localisedField.diagnosis.label', 'Diagnosis'),
        accessor: ({ diagnosis }) => `${diagnosis?.name} (${diagnosis?.code})`,
        style: { width: '55%' },
      },
      {
        key: 'type',
        title: getTranslation('encounter.type.label', 'Type'),
        accessor: ({ isPrimary }) => (isPrimary ? 'Primary' : 'Secondary'),
        style: { width: '20%' },
      },
      {
        key: 'date',
        title: getTranslation('general.date.label', 'Date'),
        accessor: ({ date }) => (date ? formatShort(date) : '--/--/----'),
        style: { width: '25%' },
      },
    ],
    procedures: [
      {
        key: 'procedure',
        title: getTranslation('procedure.procedureType.label', 'Procedure'),
        accessor: ({ procedureType }) => `${procedureType?.name} (${procedureType?.code})`,
        style: { width: '75%' },
      },
      {
        key: 'procedureDate',
        title: getTranslation('procedure.date.label', 'Procedure date'),
        accessor: ({ date }) => (date ? formatShort(date) : '--/--/----'),
        style: { width: '25%' },
      },
    ],
    labRequests: [
      {
        key: 'testType',
        title: getTranslation('lab.testType.label', 'Test type'),
        style: { width: '20%' },
      },
      {
        key: 'testCategory',
        title: getTranslation('lab.testCategory.label', 'Test category'),
        style: { width: '25%' },
      },
      {
        key: 'requestedByName',
        title: getTranslation('general.requestedBy.label', 'Requested by'),
        style: { width: '20%' },
      },
      {
        key: 'requestDate',
        title: getTranslation('general.requestDate.label', 'Request date'),
        accessor: ({ requestDate }) => (requestDate ? formatShort(requestDate) : '--/--/----'),
        style: { width: '17.5%' },
      },
      {
        key: 'publishedDate',
        title: getTranslation('pdf.encounterRecord.publishedDate', 'Published date'),
        accessor: ({ publishedDate }) =>
          publishedDate ? formatShort(publishedDate) : '--/--/----',
        style: { width: '17.5%' },
      },
    ],
    imagingRequests: [
      {
        key: 'imagingType',
        title: getTranslation('general.requestType.label', 'Request type'),
        accessor: ({ imagingName }) => imagingName?.label,
        style: { width: '17%' },
      },
      {
        key: 'areaToBeImaged',
        title: getTranslation('imaging.areas.label', 'Areas to be imaged'),
        accessor: (imagingRequest) =>
          imagingRequest?.areas?.length
            ? imagingRequest?.areas.map((area) => area.name).join(', ')
            : imagingRequest?.areaNote,
        style: { width: '25%' },
      },
      {
        key: 'requestedBy',
        title: getTranslation('general.requestedBy.label', 'Requested by'),
        accessor: ({ requestedBy }) => requestedBy?.displayName,
        style: { width: '18%' },
      },
      {
        key: 'requestDate',
        title: getTranslation('general.requestDate.label', 'Request date'),
        accessor: ({ requestedDate }) =>
          requestedDate ? formatShort(requestedDate) : '--/--/----',
        style: { width: '20%' },
      },
      {
        key: 'completedDate',
        title: getTranslation('pdf.encounterRecord.completedDate', 'Completed date'),
        accessor: (imagingRequest) =>
          imagingRequest?.results[0]?.completedAt
            ? formatShort(imagingRequest?.results[0]?.completedAt)
            : '--/--/----',
        style: { width: '20%' },
      },
    ],
    medications: [
      {
        key: 'medication',
        title: getTranslation('medication.medication.label', 'Medication'),
        accessor: ({ medication }) => medication?.name,
        style: { width: '20%' },
      },
      {
        key: 'instructions',
        title: getTranslation('medication.medication.instructions', 'Instructions'),
        accessor: ({ prescription }) => prescription || '',
        style: { width: '30%' },
      },
      {
        key: 'route',
        title: getTranslation('medication.route.label', 'Route'),
        accessor: ({ route }) => (route ? getEnumTranslation(DRUG_ROUTE_LABELS, route) : ''),
        style: { width: '12.5%' },
      },
      {
        key: 'prescriber',
        title: getTranslation('medication.prescriber.label', 'Prescriber'),
        accessor: ({ prescriber }) => prescriber?.displayName,
        style: { width: '25%' },
      },
      {
        key: 'prescriptionDate',
        title: getTranslation('medication.date.label', 'Prescription date'),
        accessor: ({ date }) => (date ? formatShort(date) : '--/--/----'),
        style: { width: '22.5%' },
      },
    ],
  };

  return (
    <Document>
      <Page size="A4" style={pageStyles.body} wrap>
        {watermark && <Watermark src={watermark} />}
        <MultiPageHeader
          documentName={
            discharge
              ? getTranslation('pdf.encounterRecord.title', 'Patient encounter record')
              : getTranslation(
                  'pdf.encounterProgressRecord.title',
                  'Patient encounter progress record',
                )
          }
          patientId={patientData.displayId}
          patientName={getName(patientData)}
        />
        <CertificateHeader>
          <LetterheadSection
            logoSrc={logo}
            certificateTitle={
              discharge
                ? getTranslation('pdf.encounterRecord.title', 'Patient encounter record')
                : getTranslation(
                    'pdf.encounterProgressRecord.title',
                    'Patient encounter progress record',
                  )
            }
            letterheadConfig={certificateData}
          />
        </CertificateHeader>
        <SectionSpacing />
        <PatientDetailsWithAddress getLocalisation={getLocalisation} patient={patientData} />
        <SectionSpacing />
        <EncounterDetailsExtended encounter={encounter} discharge={discharge} />
        <SectionSpacing />
        {encounterTypeHistory.length > 0 && (
          <TableSection
            title={getTranslation('pdf.encounterRecord.section.encounterTypes', 'Encounter types')}
            data={encounterTypeHistory}
            columns={COLUMNS.encounterTypes}
          />
        )}
        {locationHistory.length > 0 && (
          <TableSection
            title={getTranslation('general.localisedField.locationId.label', 'Location')}
            data={locationHistory}
            columns={COLUMNS.locations}
          />
        )}
        {diagnoses.length > 0 && (
          <TableSection
            title={getTranslation('general.localisedField.diagnosis.label', 'Diagnosis')}
            data={diagnoses}
            columns={COLUMNS.diagnoses}
          />
        )}
        {procedures.length > 0 && (
          <TableSection
            title={getTranslation('discharge.procedures.label', 'Procedures')}
            data={procedures}
            columns={COLUMNS.procedures}
          />
        )}
        {labRequests.length > 0 && (
          <TableSection
            title={getTranslation('pdf.encounterRecord.section.labRequests', 'Lab requests')}
            data={labRequests}
            columns={COLUMNS.labRequests}
          />
        )}
        {imagingRequests.length > 0 && (
          <TableSection
            title={getTranslation(
              'pdf.encounterRecord.section.imagingRequests',
              'Imaging requests',
            )}
            data={imagingRequests}
            columns={COLUMNS.imagingRequests}
          />
        )}
        {medications.length > 0 && (
          <TableSection
            title={getTranslation('pdf.encounterRecord.section.medications', 'Medications')}
            data={medications}
            columns={COLUMNS.medications}
          />
        )}
        {notes.length > 0 && <NotesSection notes={notes} />}
        <Footer />
      </Page>
      {vitalsData.length > 0 && recordedDates.length > 0 ? (
        <>
          {[0, 12, 24, 36, 48].map((start) => {
            return recordedDates.length > start ? (
              <Page size="A4" orientation="landscape" style={pageStyles.body}>
                <MultiPageHeader
                  documentName={
                    discharge
                      ? getTranslation('pdf.encounterRecord.title', 'Patient encounter record')
                      : getTranslation(
                          'pdf.encounterProgressRecord.title',
                          'Patient encounter progress record',
                        )
                  }
                  patientId={patientData.displayId}
                  patientName={getName(patientData)}
                />
                <TableSection
                  title={getTranslation('pdf.encounterRecord.section.vitals', 'Vitals')}
                  data={vitalsData}
                  columns={getVitalsColumn(start)}
                  type="vitals"
                />
                <Footer />
              </Page>
            ) : null;
          })}
        </>
      ) : null}
    </Document>
  );
};

export const EncounterRecordPrintout = withLanguageContext(EncounterRecordPrintoutComponent);
