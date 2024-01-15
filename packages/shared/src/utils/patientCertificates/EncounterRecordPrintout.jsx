import React from 'react';
import styled from 'styled-components';
import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { CertificateHeader, Col, Watermark } from './Layout';
import { PrintLetterhead } from '@tamanu/web-frontend/app/components/PatientPrinting';
import { LetterheadSection } from './LetterheadSection';
import { useLocalisation } from '@tamanu/web-frontend/app/contexts/Localisation';
import { PatientDetailsWithAddress } from './printComponents/PatientDetailsWithAddress';
import { renderDataItems } from './printComponents/renderDataItems';
import { DataSection } from './printComponents/DataSection';
import { DataItem } from './printComponents/DataItem';
import { CertificateWrapper } from '@tamanu/web-frontend/app/components/PatientPrinting/printouts/reusable/CertificateWrapper';
import {
  DateDisplay,
  formatShort,
  formatShortest,
  formatTime,
  useLocalisedText,
} from '@tamanu/web-frontend/app/components';
import { ENCOUNTER_OPTIONS_BY_VALUE } from '@tamanu/web-frontend/app/constants';
import { MultiPageHeader } from './printComponents/MultiPageHeader';
import { getName } from '../patientAccessors';
import { EncounterDetails } from './printComponents/EncounterDetails';
import { ListTable } from '@tamanu/web-frontend/app/components/PatientPrinting/printouts/reusable/ListTable';
import { startCase } from 'lodash';

const borderStyle = '1 solid black';

const textStyles = StyleSheet.create({
  sectionTitle: {
    fontFamily: 'Helvetica-Bold',
    marginBottom: 3,
    fontSize: 14,
    fontWeight: 500,
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
    borderLeft: borderStyle,
    borderBottom: borderStyle,
    marginBottom: -1,
  },
  baseCell: {
    flexDirection: 'row',
    borderLeft: borderStyle,
    alignItems: 'center',
    padding: 5,
  },
  flexCell: {
    flex: 1,
  },
  p: {
    fontFamily: 'Helvetica',
    fontSize: 9,
  },
  header: {
    fontFamily: 'Helvetica-Bold',
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
      accessor: ({ date }) => (date ? `${formatShort(date)} ${formatTime(date)}` : {}),
      // accessor: ({ date }) => <DateDisplay date={date} showDate showTime /> || {},

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
      accessor: ({ date }) => (date ? `${formatShort(date)} ${formatTime(date)}` : {}),
      style: { width: '35%' },
    },
  ],
  diagnoses: [
    {
      key: 'diagnoses',
      title: 'Diagnoses',
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
      accessor: ({ date }) => (date ? formatShort(date) : {}),
      style: { width: '25%' },
    },
  ],
};

const TableSection = ({ title, data, columns }) => {
  return (
    <View>
      <Text style={textStyles.sectionTitle}>{title}</Text>
      <DataTable data={data} columns={columns} />
      <SectionSpacing />
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
      <Page size="A4">
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
        <CertificateWrapper>
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
        </CertificateWrapper>
      </Page>
    </Document>
  );
};
