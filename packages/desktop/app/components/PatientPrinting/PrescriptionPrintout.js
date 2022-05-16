import React, { useEffect, useState } from 'react';
import moment from 'moment';
import styled from 'styled-components';

import { useApi } from '../../api';
import { NotesSection, LocalisedLabel } from './SimplePrintout';
import { PrintLetterhead } from './PrintLetterhead';
import { CertificateWrapper } from './CertificateWrapper';
import { DateDisplay } from '../DateDisplay';
import { PatientBarcode } from './PatientBarcode';
import { GridTable } from './GridTable';

const RowContainer = styled.div`
  display: flex;
  justify-content: space-between;
`;

// TODO: Make this more DRY
export const PrescriptionPrintout = React.memo(
  ({ prescriptionData, patientData, certificateData }) => {
    const api = useApi();

    const {
      firstName,
      lastName,
      dateOfBirth,
      sex,
      displayId,
      streetVillage,
      villageName,
    } = patientData;
    const { pageTitle, title, subTitle, logo } = certificateData;
    const { date } = prescriptionData;

    return (
      <CertificateWrapper>
        <PrintLetterhead title={title} subTitle={subTitle} logoSrc={logo} pageTitle={pageTitle} />
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
            Date: date,
            Prescriber: '',
            'Prescriber ID': '',
            Facility: '',
            Medication: '',
            Instructions: '',
            Route: '',
            Quantity: '',
            Repeats: '',
          }}
        />
        <NotesSection notes={notes} />
        <div />
      </CertificateWrapper>
    );
  },
);
