import React from 'react';
import styled from 'styled-components';
import { Typography, Box } from '@material-ui/core';

import { DateDisplay } from '../../DateDisplay';
import { capitaliseFirstLetter } from '../../../utils/capitalise';

import { NotesSection } from './reusable/SimplePrintout';
import { PrintLetterhead } from './reusable/PrintLetterhead';
import { CertificateWrapper } from './reusable/CertificateWrapper';
import { PatientBarcode } from './reusable/PatientBarcode';
import { GridTable } from './reusable/GridTable';
import { LocalisedCertificateLabel } from './reusable/CertificateLabels';

const LocalisedLabel = styled(LocalisedCertificateLabel)`
  margin-bottom: 9px;
`;

const RowContainer = styled.div`
  display: flex;
  justify-content: space-between;
`;

const Text = styled(Typography)`
  font-size: 14px;
`;

const SignatureBox = styled(Box)`
  border: 1px solid black;
  height: 60px;
`;

export const PrescriptionPrintout = React.memo(
  ({ patientData, prescriptionData, encounterData, certificateData }) => {
    const {
      firstName,
      lastName,
      dateOfBirth,
      sex,
      displayId,
      additionalData,
      village,
    } = patientData;
    const { streetVillage } = additionalData;
    const { name: villageName } = village;
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
        <RowContainer>
          <div>
            <LocalisedLabel name="firstName">{firstName}</LocalisedLabel>
            <LocalisedLabel name="lastName">{lastName}</LocalisedLabel>
            <LocalisedLabel name="dateOfBirth">
              <DateDisplay date={dateOfBirth} showDate={false} showExplicitDate />
            </LocalisedLabel>
            <LocalisedLabel name="sex">{capitaliseFirstLetter(sex)}</LocalisedLabel>
            <LocalisedLabel name="streetVillage">{streetVillage}</LocalisedLabel>
          </div>
          <div>
            <LocalisedLabel name="villageName">{villageName}</LocalisedLabel>
            <LocalisedLabel name="displayId">{displayId}</LocalisedLabel>
            <PatientBarcode patient={patientData} barWidth={2} barHeight={60} margin={0} />
          </div>
        </RowContainer>
        <GridTable
          data={{
            Date: date ? <DateDisplay date={date} /> : null,
            Prescriber: prescriber?.displayName,
            'Prescriber ID': '', // We don't currently store this in the db, add it later
            Facility: encounterData?.location?.facility?.name,
            Medication: medication.name,
            Instructions: prescription,
            Route: route,
            Quantity: quantity,
            Repeats: '', // There isn't a separate saved value for repeats currently
          }}
        />
        <NotesSection notes={[{ content: note }]} />
        <Text>Signed:</Text>
        <SignatureBox />
      </CertificateWrapper>
    );
  },
);
