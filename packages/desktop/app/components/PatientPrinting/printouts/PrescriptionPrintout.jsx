import { Box, Typography } from '@material-ui/core';
import React from 'react';
import styled from 'styled-components';

import { DateDisplay } from '../../DateDisplay';

import { CertificateWrapper } from './reusable/CertificateWrapper';
import { GridTable } from './reusable/GridTable';
import { PatientDetailPrintout } from './reusable/PatientDetailPrintout';
import { PrintLetterhead } from './reusable/PrintLetterhead';
import { NoteContentSection } from './reusable/SimplePrintout';

const Text = styled(Typography)`
  font-size: 14px;
`;

const SignatureBox = styled(Box)`
  border: 1px solid black;
  height: 60px;
`;

export const PrescriptionPrintout = React.memo(
  ({ patientData, prescriptionData, encounterData, certificateData }) => {
    const { additionalData, village } = patientData;
    const { title, subTitle, logo } = certificateData;
    const { prescriber, medication, route, prescription, quantity, date, note } = prescriptionData;

    return (
      <CertificateWrapper>
        <PrintLetterhead
          title={title}
          subTitle={subTitle}
          logoSrc={logo}
          pageTitle="Prescription"
        />
        <PatientDetailPrintout
          patient={patientData}
          additionalData={additionalData}
          village={village}
        />
        <GridTable
          data={{
            Date: date ? <DateDisplay date={date} /> : null,
            Prescriber: prescriber?.displayName,
            'Prescriber ID': prescriber?.displayId,
            Facility: encounterData?.location?.facility?.name,
            Medication: medication.name,
            Instructions: prescription,
            Route: route,
            Quantity: quantity,
            Repeats: '', // There isn't a separate saved value for repeats currently
          }}
        />
        <NoteContentSection notes={[{ content: note }]} />
        <Text>Signed:</Text>
        <SignatureBox />
      </CertificateWrapper>
    );
  },
);
