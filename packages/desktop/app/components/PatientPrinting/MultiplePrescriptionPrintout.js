import React from 'react';
import styled from 'styled-components';
import { Typography, Box } from '@material-ui/core';
import Divider from '@material-ui/core/Divider';

import { getCurrentDateString } from 'shared/utils/dateTime';

import { NotesSection, LocalisedLabel } from './SimplePrintout';
import { DateDisplay } from '../DateDisplay';
import { PrintLetterhead } from './PrintLetterhead';
import { CertificateWrapper } from './CertificateWrapper';
import { ListTable } from './ListTable';
import { PatientDetailPrintout } from './PatientDetailPrintout';
import { CertificateLabel } from './CertificateLabels';
import { useAuth } from '../../contexts/Auth';

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

const columns = [
  {
    key: 'medication',
    title: 'Medication',
    accessor: ({ medication }) => (medication || {}).name,
  },
  {
    key: 'prescription',
    title: 'Instructions',
  },
  {
    key: 'route',
    title: 'Route',
  },
  {
    key: 'quantity',
    title: 'Quantity',
  },
  {
    key: 'repeats',
    title: 'Repeats',
  },
];

export const MultiplePrescriptionPrintout = React.memo(
  ({ patientData, prescriber, prescriptions, certificateData }) => {
    const { title, subTitle, logo } = certificateData;
    const { facility } = useAuth();

    return (
      <CertificateWrapper>
        <PrintLetterhead
          title={title}
          subTitle={subTitle}
          logoSrc={logo}
          pageTitle="Prescription"
        />
        <PatientDetailPrintout patientData={patientData} />

        <Divider />

        <RowContainer>
          <div>
            <CertificateLabel name="Date">
              <DateDisplay date={getCurrentDateString()} showDate={false} showExplicitDate />
            </CertificateLabel>
            <LocalisedLabel name="prescriber">{prescriber?.displayName}</LocalisedLabel>
          </div>
          <div>
            <LocalisedLabel name="facility">{facility.name}</LocalisedLabel>
          </div>
        </RowContainer>

        <ListTable data={prescriptions} columns={columns} />
        <NotesSection notes={[]} />
        <Text>Signed:</Text>
        <SignatureBox />
      </CertificateWrapper>
    );
  },
);
