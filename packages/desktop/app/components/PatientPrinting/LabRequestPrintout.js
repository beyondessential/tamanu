import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

import { Typography, Box } from '@material-ui/core';
import { PrintLetterhead } from './PrintLetterhead';
import { CertificateWrapper } from './CertificateWrapper';
import { LocalisedCertificateLabel as LocalisedLabel } from './CertificateLabels';
import { DateDisplay } from '../DateDisplay';
import { PatientBarcode } from './PatientBarcode';

import { GridTable } from './GridTable';
import { useApi } from '../../api';

const Text = styled(Typography)`
  font-size: 14px;
`;

const RowContainer = styled.div`
  display: flex;
  justify-content: space-between;
`;

const LabRequestTable = ({ labRequestData }) => {
  const api = useApi();
  const [tests, setTests] = useState([]);
  const {
    displayId,
    requestedDate,
    sampleTime,
    laboratory,
    requestedBy,
    priority,
    category,
  } = labRequestData;

  useEffect(() => {
    (async () => {
      const res = await api.get(`labRequest/${labRequestData.id}/tests`);
      setTests(res.data);
    })();
  }, [api, labRequestData.id]);

  return (
    <GridTable
      data={{
        'Request number': displayId,
        'Order date': requestedDate,
        Facility: laboratory?.name,
        Department: '',
        'Requested by': requestedBy?.displayName,
        'Sample time': sampleTime,
        Priority: priority?.name,
        'Test type': category?.name,
        'Test requested': tests.map(test => test.labTestType?.name).join(', '),
      }}
    />
  );
};

export const LabRequestPrintout = React.memo(({ labRequestData, patientData, certificateData }) => {
  const api = useApi();
  const [notes, setNotes] = useState([]);
  const { firstName, lastName, dateOfBirth, sex } = patientData;
  const { title, subTitle, logo } = certificateData;

  useEffect(() => {
    (async () => {
      const res = await api.get(`labRequest/${labRequestData.id}/notes`);
      setNotes(res.data);
    })();
  }, [api, labRequestData.id]);

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
      <LabRequestTable labRequestData={labRequestData} />
      <Text>Notes:</Text>
      <Box border={1} height={75}>
        {notes.map(note => note.content)}
      </Box>
    </CertificateWrapper>
  );
});
