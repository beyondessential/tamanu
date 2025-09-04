import React from 'react';
import styled from 'styled-components';
import { Box, Typography } from '@mui/material';

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

export const NoteContentSection = ({
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
      <Text $boldTitle={boldTitle} data-testid="text-7htz">
        {title}
      </Text>
      <NotesBox
        $height={height}
        $minHeight={noteContentList.length ? '0px' : emptyMinHeight}
        data-testid="notesbox-l4n4"
      >
        {separator ? noteContentList.join(separator) : noteContentList}
      </NotesBox>
    </>
  );
};

export const SimplePrintout = React.memo(
  ({ patient, village, additionalData, tableData, notes, certificate }) => {
    const { pageTitle, title, subTitle, logo } = certificate;
    return (
      <CertificateWrapper data-testid="certificatewrapper-nzk8">
        <PrintLetterhead
          title={title}
          subTitle={subTitle}
          logoSrc={logo}
          pageTitle={pageTitle}
          data-testid="printletterhead-pse6"
        />
        <PatientDetailPrintout
          patient={patient}
          village={village}
          additionalData={additionalData}
          data-testid="patientdetailprintout-q3ab"
        />
        <GridTable data={tableData} data-testid="gridtable-99er" />
        <NoteContentSection notes={notes} data-testid="notecontentsection-v312" />
      </CertificateWrapper>
    );
  },
);
