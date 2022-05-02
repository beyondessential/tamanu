import React from 'react';
import styled from 'styled-components';

import { Typography, Box } from '@material-ui/core';
import { PrintLetterhead } from './PrintLetterhead';
import { CertificateWrapper } from './CertificateWrapper';
import { LocalisedCertificateLabel as LocalisedLabel } from './CertificateLabels';
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

const getTableData = labRequestData => ({
  'Request number': labRequestData.displayId,
  'Order date': labRequestData.requestedDate,
  Facility: labRequestData.labTestLaboratoryId,
  Department: '',
  'Requested by': '',
  'Sample time': '',
  Priority: '',
  'Test type': '',
  'Test requested': '',
});

export const LabRequestPrintout = React.memo(({ labRequestData, patientData, certificateData }) => {
  const { firstName, lastName, dateOfBirth, sex } = patientData;
  const { title, subTitle, logo } = certificateData;
  const tableData = getTableData(labRequestData);
  return (
    <CertificateWrapper>
      {/* TODO: Right align header text */}
      <PrintLetterhead title={title} subTitle={subTitle} logoSrc={logo} pageTitle="Lab Request" />
      <RowContainer>
        <div>
          <LocalisedLabel name="firstName">{firstName}</LocalisedLabel>
          <LocalisedLabel name="lastName">{lastName}</LocalisedLabel>
          <LocalisedLabel name="dateOfBirth">
            <DateDisplay date={dateOfBirth} showDate={false} showExplicitDate />
          </LocalisedLabel>
          <LocalisedLabel name="sex">{sex}</LocalisedLabel>
        </div>
        <PatientBarcode patient={patientData} />
      </RowContainer>
      <GridTable data={tableData} />
      <Text>Notes:</Text>
      <Box border={1} height={75} />
    </CertificateWrapper>
  );
});
