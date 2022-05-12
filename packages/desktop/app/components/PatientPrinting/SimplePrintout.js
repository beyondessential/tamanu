import React from 'react';
import styled from 'styled-components';

import { Typography, Box } from '@material-ui/core';
import { PrintLetterhead } from './PrintLetterhead';
import { CertificateWrapper } from './CertificateWrapper';
import { LocalisedCertificateLabel } from './CertificateLabels';
import { DateDisplay } from '../DateDisplay';
import { PatientBarcode } from './PatientBarcode';

import { GridTable } from './GridTable';

const Text = styled(Typography)`
  font-size: 14px;
`;

const RowContainer = styled.div`
  display: flex;
  justify-content: space-between;
`;

const NotesBox = styled(Box)`
  padding-left: 0.5rem;
  padding-top: 0.5rem;
  border: 1px solid black;
  height: 75px;
  text-overflow: ellipsis;
  overflow: hidden;
`;

const LocalisedLabel = ({ name, children }) => (
  <LocalisedCertificateLabel margin="9px" name={name}>
    {children}
  </LocalisedCertificateLabel>
);

export const SimplePrintout = React.memo(({ patientData, tableData, notes, certificateData }) => {
  const { firstName, lastName, dateOfBirth, sex, displayId } = patientData;
  const { pageTitle, title, subTitle, logo } = certificateData;

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
        </div>
        <div>
          <LocalisedLabel name="displayId">{displayId}</LocalisedLabel>
          <PatientBarcode patient={patientData} barWidth={2} barHeight={60} mmeargin={0} />
        </div>
      </RowContainer>
      <GridTable data={tableData} />
      <Text>Notes:</Text>
      <NotesBox>{notes.map(note => note.content)}</NotesBox>
      <div />
    </CertificateWrapper>
  );
});
