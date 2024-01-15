import React from 'react';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import { CertificateHeader, Col, Watermark } from './Layout';
import { PrintLetterhead } from '@tamanu/web-frontend/app/components/PatientPrinting';
import { LetterheadSection } from './LetterheadSection';
import { useLocalisation } from '@tamanu/web-frontend/app/contexts/Localisation';
import { PatientDetailsWithAddress } from './printComponents/PatientDetailsWithAddress';
import { renderDataItems } from './printComponents/renderDataItems';
import { DataSection } from './printComponents/DataSection';
import { DataItem } from './printComponents/DataItem';
import { CertificateWrapper } from '@tamanu/web-frontend/app/components/PatientPrinting/printouts/reusable/CertificateWrapper';

const EncounterDetails = ({ encounter }) => {
  return (
    <DataSection title="Encounter details">
      <Col>
        <DataItem label="Facility" value="yo" key="Facility" />
      </Col>
      <Col>
        <DataItem label="Facility" value="yo" key="Facility" />
      </Col>
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
          <EncounterDetails />
        </CertificateWrapper>
      </Page>
    </Document>
  );
};
