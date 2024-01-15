import React from 'react';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import { CertificateHeader, Col, Row, Watermark } from './Layout';
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
import { P } from './Typography';

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
  console.log('certData', JSON.stringify(certificateData));
  // const { watermark, logo } = certficateData;
  // const { getLocalisation } = useLocalisation();

  return (
    <Document>
      <Page size="A4">
        {/*{watermark && <Watermark src={watermark} />}*/}
        <CertificateHeader>
          <LetterheadSection
            getLocalisation={getLocalisation}
            // logoSrc={logo}
            certificateTitle="Patient Encounter Record"
          />
        </CertificateHeader>
        <CertificateWrapper>
          <PatientDetailsWithAddress getLocalisation={getLocalisation} patient={patient} />
          <EncounterDetails encounter={encounter} />
        </CertificateWrapper>
      </Page>
    </Document>
  );
};
