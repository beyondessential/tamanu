import React from 'react';
import moment from 'moment';
import styled from 'styled-components';
import { Typography, Box } from '@material-ui/core';

import { NotesSection, LocalisedLabel } from './SimplePrintout';
import { PrintLetterhead } from './PrintLetterhead';
import { CertificateWrapper } from './CertificateWrapper';
import { DateDisplay } from '../DateDisplay';
import { PatientBarcode } from './PatientBarcode';
import { GridTable } from './GridTable';
import { LoadingIndicator } from '../LoadingIndicator';

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
  ({ patientData, prescriptionData, encounterData, certificateData, isLoading }) => {
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
    const {
      prescriber,
      medication,
      route,
      prescription,
      quantity,
      repeats,
      date,
      note,
    } = prescriptionData;

    if (isLoading) {
      return <LoadingIndicator />;
    }

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
            <LocalisedLabel name="sex">{sex}</LocalisedLabel>
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
            Date: date ? moment(date).format('DD/MM/YYYY') : null,
            Prescriber: prescriber?.displayName,
            'Prescriber ID': prescriber?.id,
            Facility: encounterData?.location?.Facility?.name,
            Medication: medication.name,
            Instructions: prescription,
            Route: route,
            Quantity: quantity,
            Repeats: repeats,
          }}
        />
        <NotesSection notes={[{ content: note }]} />
        <Text>Signed:</Text>
        <SignatureBox />
      </CertificateWrapper>
    );
  },
);
