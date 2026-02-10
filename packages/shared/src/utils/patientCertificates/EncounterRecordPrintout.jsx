import React from 'react';
import { Document, StyleSheet, View } from '@react-pdf/renderer';
import { get, startCase } from 'lodash';

import {
  ENCOUNTER_TYPE_LABELS,
  DRUG_ROUTE_LABELS,
  NOTE_TYPES,
  REFERENCE_TYPES,
} from '@tamanu/constants';
import { parseDate, trimToDate } from '@tamanu/utils/dateTime';

import { CertificateHeader, Watermark } from './Layout';
import { LetterheadSection } from './LetterheadSection';
import { PatientDetailsWithAddress } from './printComponents/PatientDetailsWithAddress';
import { EncounterDetailsExtended } from './printComponents/EncounterDetailsExtended';
import { MultiPageHeader } from './printComponents/MultiPageHeader';
import { getName } from '../patientAccessors';
import { Footer } from './printComponents/Footer';
import { useLanguageContext, withLanguageContext } from '../pdf/languageContext';
import { withDateTimeContext, useDateTimeFormat } from '../pdf/withDateTimeContext';
import { Page } from '../pdf/Page';
import { Text } from '../pdf/Text';
import { getMedicationDoseDisplay, getTranslatedFrequency } from '../medication';
import { getReferenceDataStringId } from '../translation/getReferenceDataStringId';

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
    marginBottom: 3,
    fontSize: 11,
  },
  tableColumnHeader: {
    fontWeight: 700,
    fontSize: 10,
  },
  tableCellContent: {
    fontSize: 10,
  },
  tableCellFooter: {
    fontSize: 8,
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
    padding: '5px 5px',
    fontSize: 8,
  },
  p: {
    fontWeight: 400,
    fontSize: 8,
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

const getDateTitleArray = (date, formatShortest, formatTime) => {
  const parsedDate = parseDate(date);
  const shortestDate = formatShortest(parsedDate);
  const timeWithSeconds = formatTime(parsedDate);

  return [shortestDate, timeWithSeconds?.toLowerCase()];
};

const formatValue = (value, config) => {
  const { rounding = 0, unit = '' } = config || {};
  const float = Number.parseFloat(value);

  if (isNaN(float)) {
    return value || '—'; // em dash
  }

  const unitSuffix = unit && unit.length <= 2 ? unit : '';
  if (rounding > 0 || rounding === 0) {
    return `${float.toFixed(rounding)}${unitSuffix}`;
  }
  return `${float}${unitSuffix}`;
};

const getVitalsColumn = (startIndex, getTranslation, recordedDates, formatters) => {
  const { formatShortest, formatTime } = formatters;
  const dateArray = [...recordedDates].reverse().slice(startIndex, startIndex + 12);
  return [
    {
      key: 'measure',
      title: getTranslation('vitals.table.column.measure', 'Measure'),
      accessor: ({ value }) => value,
      style: { width: 140, alignItems: 'flex-end' },
    },
    ...dateArray
      .sort((a, b) => b.localeCompare(a))
      .map(date => ({
        title: getDateTitleArray(date, formatShortest, formatTime),
        key: date,
        accessor: cells => {
          const { value, config } = cells[date];
          return formatValue(value, config);
        },
        style: { width: 60, },
      })),
  ];
};

const Table = props => <View style={tableStyles.table} {...props} />;
const Row = props => (
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

const Cell = ({ children, style = {}, bold = false }) => (
  <View style={[tableStyles.baseCell, style]}>
    <P bold={bold}>{children}</P>
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
      bold
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
        {columns.map(({ key, title, style }, index) => {
          if (Array.isArray(title)) {
            const rotateStyle =
              index > 0 ? { transform: 'rotate(-90deg)', paddingBottom: 10, paddingTop: 10 } : {};
            return (
              <View key={key} style={[tableStyles.baseCell, style]}>
                <View style={rotateStyle}>
                  <P bold>{title[0]}</P>
                  <P>{title[1]}</P>
                </View>
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
      {data.map(row => (
        <Row key={row.id} wrap={false} width={width}>
          {columns.map(({ key, accessor, style }, index) => (
            <Cell key={key} style={style} bold={type === 'vitals' && index === 0}>
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
  const { formatShortDateTime } = useDateTimeFormat();
  return (
    <Text style={textStyles.tableCellFooter}>
      {[
        note.noteTypeId === NOTE_TYPES.TREATMENT_PLAN &&
          `${getTranslation('general.lastUpdated.label', 'Last updated')}:`,
        note.author?.displayName,
        note.onBehalfOf &&
          getTranslation('note.table.onBehalfOf', 'on behalf of :changeOnBehalfOfName', {
            replacements: {
              changeOnBehalfOfName: note.onBehalfOf.displayName,
            },
          }),
        formatShortDateTime(note.date),
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
  const { getTranslation } = useLanguageContext();
  return (
    <>
      <View minPresenceAhead={80} />
      <View>
        <MultipageTableHeading title={getTranslation('general.notes.label', 'Notes')} />
        <Table>
          {notes.map(note => (
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
                    title={getTranslation(
                      getReferenceDataStringId(note.noteTypeId, REFERENCE_TYPES.NOTE_TYPE),
                      note.noteTypeReference?.name || note.noteTypeId
                    )}
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
  vitalsData,
  recordedDates,
  settings,
}) => {
  const getSetting = (key) => get(settings, key);
  const { getTranslation, getEnumTranslation } = useLanguageContext();
  const { formatShort, formatShortest, formatTime, formatShortDateTime } = useDateTimeFormat();
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
        accessor: ({ date }) => formatShortDateTime(date),
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
        accessor: ({ date }) => formatShortDateTime(date),
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
        accessor: ({ date }) => formatShort(date),
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
        accessor: ({ date }) => formatShort(date),
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
        accessor: ({ requestDate }) => formatShort(requestDate),
        style: { width: '17.5%' },
      },
      {
        key: 'publishedDate',
        title: getTranslation('pdf.encounterRecord.publishedDate', 'Published date'),
        accessor: ({ publishedDate }) => formatShort(publishedDate),
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
        accessor: imagingRequest =>
          imagingRequest?.areas?.length
            ? imagingRequest?.areas.map(area => area.name).join(', ')
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
        accessor: ({ requestedDate }) => formatShort(requestedDate),
        style: { width: '20%' },
      },
      {
        key: 'completedDate',
        title: getTranslation('pdf.encounterRecord.completedDate', 'Completed date'),
        accessor: imagingRequest => formatShort(imagingRequest?.results[0]?.completedAt),
        style: { width: '20%' },
      },
    ],
    medications: [
      {
        key: 'medication',
        title: getTranslation('medication.medication.label', 'Medication'),
        accessor: ({ medication }) => medication?.name,
        style: { width: '21%' },
      },
      {
        key: 'dose',
        title: getTranslation('pdf.table.column.dose', 'Dose'),
        accessor: medication => {
          return (
            <Text>
              {getMedicationDoseDisplay(medication, getTranslation, getEnumTranslation)}
              {medication?.isPrn && ` ${getTranslation('medication.table.prn', 'PRN')}`}
            </Text>
          );
        },
        style: { width: '9%' },
      },
      {
        key: 'frequency',
        title: getTranslation('pdf.table.column.frequency', 'Frequency'),
        accessor: ({ frequency }) => getTranslatedFrequency(frequency, getTranslation),
        style: { width: '19%' },
      },
      {
        key: 'route',
        title: getTranslation('medication.route.label', 'Route'),
        accessor: ({ route }) => (route ? getEnumTranslation(DRUG_ROUTE_LABELS, route) : ''),
        style: { width: '10%' },
      },
      {
        key: 'prescriber',
        title: getTranslation('medication.prescriber.label', 'Prescriber'),
        accessor: ({ prescriber }) => prescriber?.displayName,
        style: { width: '18%' },
      },
      {
        key: 'prescriptionDate',
        title: getTranslation('medication.date.label', 'Prescription date'),
        accessor: ({ date }) => formatShort(trimToDate(date)),
        style: { width: '23%' },
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
        <PatientDetailsWithAddress patient={patientData} getSetting={getSetting} />
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
          {[0, 12, 24, 36, 48].map(start => {
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
                  columns={getVitalsColumn(start, getTranslation, recordedDates, { formatShortest, formatTime })}
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

export const EncounterRecordPrintout = withLanguageContext(
  withDateTimeContext(EncounterRecordPrintoutComponent),
);
