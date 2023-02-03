import React from 'react';
import styled from 'styled-components';
import { Typography, Box } from '@material-ui/core';

import { DateDisplay } from '../../../DateDisplay';
import { capitaliseFirstLetter } from '../../../../utils/capitalise';

import { PrintLetterhead } from './PrintLetterhead';
import { CertificateWrapper } from './CertificateWrapper';
import { LocalisedCertificateLabel } from './CertificateLabels';
import { PatientBarcode } from './PatientBarcode';
import { GridTable } from './GridTable';

const Text = styled(Typography)`
  ${props => (props.$boldTitle ? 'font-weight: 500;' : '')}
  font-size: 14px;
`;

const RowContainer = styled.div`
  display: flex;
  justify-content: space-between;
`;

const NotesBox = styled(Box)`
  padding-left: 0.5rem;
  padding-top: 0.5rem;
  margin-bottom: 16px;
  border: 1px solid black;
  height: ${props => (props.$height ? props.$height : '75px')};
  min-height: ${props => (props.$minHeight ? props.$minHeight : '150px')};
  text-overflow: ellipsis;
  overflow: hidden;
`;

export const NotesSection = ({
  notes = [],
  title = 'Notes:',
  height,
  emptyMinHeight,
  boldTitle,
  separator = ' ',
}) => {
  const noteContentList = notes.map(note => note.content);
  return (
    <>
      <Text $boldTitle={boldTitle}>{title}</Text>
      <NotesBox $height={height} $minHeight={noteContentList.length ? '0px' : emptyMinHeight}>
        {separator ? noteContentList.join(separator) : noteContentList}
      </NotesBox>
    </>
  );
};

export const LocalisedLabel = ({ name, children, size }) => (
  <LocalisedCertificateLabel margin="9px" name={name} size={size}>
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
          <LocalisedLabel name="sex">{capitaliseFirstLetter(sex)}</LocalisedLabel>
        </div>
        <div>
          <LocalisedLabel name="displayId">{displayId}</LocalisedLabel>
          <PatientBarcode patient={patientData} barWidth={2} barHeight={60} margin={0} />
        </div>
      </RowContainer>
      <GridTable data={tableData} />
      <NotesSection notes={notes} />
    </CertificateWrapper>
  );
});
