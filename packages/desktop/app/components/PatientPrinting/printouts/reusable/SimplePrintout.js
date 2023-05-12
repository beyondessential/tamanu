import React from 'react';
import styled from 'styled-components';
import { Typography, Box } from '@material-ui/core';

import { PrintLetterhead } from './PrintLetterhead';
import { CertificateWrapper } from './CertificateWrapper';
import { GridTable } from './GridTable';
import { PatientDetailPrintout } from './PatientDetailPrintout';

const Text = styled(Typography)`
  ${props => (props.$boldTitle ? 'font-weight: 500;' : '')}
  font-size: 14px;
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

export const SimplePrintout = React.memo(
  ({ patient, village, additionalData, tableData, notes, certificate }) => {
    const { pageTitle, title, subTitle, logo } = certificate;
    return (
      <CertificateWrapper>
        <PrintLetterhead title={title} subTitle={subTitle} logoSrc={logo} pageTitle={pageTitle} />
        <PatientDetailPrintout
          patient={patient}
          village={village}
          additionalData={additionalData}
        />
        <GridTable data={tableData} />
        <NotesSection notes={notes} />
      </CertificateWrapper>
    );
  },
);
