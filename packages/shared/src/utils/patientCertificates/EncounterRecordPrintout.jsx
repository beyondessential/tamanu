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
  useLocalisedText,
} from '@tamanu/web-frontend/app/components';

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

const HeaderCell = ({ children }) => (
  <View style={[tableStyles.baseCell]}>
    <P style={{ fontFamily: 'Helvetica-Bold' }}>{children}</P>
  </View>
);

const PageGap = () => <View style={{ marginVertical: '10px' }} />;

const EncounterDetails = ({ encounter }) => {
  const clinicianText = useLocalisedText({ path: 'fields.clinician.shortLabel' });
  const {
    location,
    examiner,
    discharge,
    department,
    startDate,
    endDate,
    reasonForEncounter,
  } = encounter;

  return (
    <DataSection title="Encounter details">
      <Col>
        <DataItem label="Facility" value={location.facility.name} key="facility" />
        <DataItem
          // label={`Supervising ${clinicianText}`}
          label="Supervising clinician"
          value={examiner.displayName}
          key="supervisingClinician"
        />
        <DataItem
          // label={`Discharging ${clinicianText}`}
          label="Discharging clinician"
          value={discharge.discharger.displayName}
          key="dischargingClinician"
        />
      </Col>
      <Col>
        <DataItem label="Department" value={department.name} key="department" />
        <DataItem label="Date of admission" value={formatShort(startDate)} key="dateOfAdmission" />
        <DataItem label="Date of discharge" value={formatShort(endDate)} key="dateOfDischarge" />
      </Col>
      <DataItem label="Reason for encounter" value={reasonForEncounter} key="reasonForEncounter" />
    </DataSection>
  );
};

const EncounterTypesSection = ({ encounterTypeHistory }) => {
  return (
    <View>
      <Text style={textStyles.sectionTitle}>Encounter Types</Text>
      <Table>
        <Row>
          <HeaderCell>Type</HeaderCell>
          <HeaderCell>Date & time moved</HeaderCell>
        </Row>
      </Table>
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
        <CertificateHeader>
          <LetterheadSection
            getLocalisation={getLocalisation}
            logoSrc={logo}
            certificateTitle="Patient Encounter Record"
          />
        </CertificateHeader>
        <PageGap />
        <CertificateWrapper>
          <PatientDetailsWithAddress getLocalisation={getLocalisation} patient={patient} />
          <PageGap />
          <EncounterDetails encounter={encounter} />
          <PageGap />
          <EncounterTypesSection />
        </CertificateWrapper>
      </Page>
    </Document>
  );
};
