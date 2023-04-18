import React from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import Divider from '@material-ui/core/Divider';

import { getCurrentDateString } from 'shared/utils/dateTime';

import { DateDisplay } from '../../DateDisplay';
import { useAuth } from '../../../contexts/Auth';
import { Colors, DRUG_ROUTE_VALUE_TO_LABEL } from '../../../constants';

import { PatientDetailPrintout } from './reusable/PatientDetailPrintout';
import { NotesSection } from './reusable/SimplePrintout';
import { PrintLetterhead } from './reusable/PrintLetterhead';
import { CertificateWrapper } from './reusable/CertificateWrapper';
import { ListTable } from './reusable/ListTable';
import { CertificateLabel, LocalisedCertificateLabel } from './reusable/CertificateLabels';

const RowContainer = styled.div`
  display: flex;
  justify-content: flex-start;
`;

const SignatureText = styled(Typography)`
  font-weight: 500;
  display: inline;
  font-size: 14px;
  margin-right: 20px;
`;

const SignatureLine = styled(Divider)`
  display: inline-block;
  background-color: ${Colors.darkestText};
  width: 400px;
  position: absolute;
  bottom: 14px;
`;

const StyledDivider = styled(Divider)`
  margin-top: 20px;
  margin-bottom: 20px;
  background-color: ${Colors.darkestText};
`;

const StyledNotesSectionWrapper = styled.div`
  margin-top: 30px;
  margin-bottom: 40px;
`;

const StyledDiv = styled.div`
  ${props => (props.$marginLeft ? `margin-left: ${props.$marginLeft}px;` : '')}
`;

const LocalisedLabel = styled(LocalisedCertificateLabel)`
  font-size: 14px;
  margin-bottom: 9px;
`;

const Label = styled(CertificateLabel)`
  font-size: 14px;
  margin-bottom: 9px;
`;

const columns = [
  {
    key: 'medication',
    title: 'Medication',
    accessor: ({ medication }) => (medication || {}).name,
    style: { width: '31.25%' },
  },
  {
    key: 'prescription',
    title: 'Instructions',
    style: { width: '31.25%' },
  },
  {
    key: 'route',
    title: 'Route',
    accessor: ({ route }) => DRUG_ROUTE_VALUE_TO_LABEL[route] || '',
    style: { width: '12.5%' },
  },
  {
    key: 'quantity',
    title: 'Quantity',
    style: { textAlign: 'center', width: '12.5%' },
  },
  {
    key: 'repeats',
    title: 'Repeats',
    style: { textAlign: 'center', width: '12.5%' },
  },
];

export const MultiplePrescriptionPrintout = React.memo(
  ({ patientData, prescriber, prescriptions, certificateData }) => {
    const { title, subTitle, logo } = certificateData;
    const { facility } = useAuth();
    const { village, additionalData } = patientData;

    return (
      <CertificateWrapper>
        <PrintLetterhead
          title={title}
          subTitle={subTitle}
          logoSrc={logo}
          pageTitle="Prescription"
        />
        <PatientDetailPrintout
          patient={patientData}
          village={village}
          additionalData={additionalData}
        />

        <StyledDivider />

        <RowContainer>
          <StyledDiv>
            <Label name="Date">
              <DateDisplay date={getCurrentDateString()} />
            </Label>
            <LocalisedLabel name="prescriber">{prescriber?.displayName}</LocalisedLabel>
          </StyledDiv>
          <StyledDiv $marginLeft="150">
            <LocalisedLabel name="prescriberId">{prescriber?.displayId}</LocalisedLabel>
            <LocalisedLabel name="facility">{facility.name}</LocalisedLabel>
          </StyledDiv>
        </RowContainer>

        <ListTable data={prescriptions} columns={columns} />
        <StyledNotesSectionWrapper>
          <NotesSection title="Notes" boldTitle />
        </StyledNotesSectionWrapper>
        <SignatureText>Signed</SignatureText>
        <SignatureLine />
      </CertificateWrapper>
    );
  },
);

MultiplePrescriptionPrintout.propTypes = {
  patientData: PropTypes.object.isRequired,
  prescriber: PropTypes.object.isRequired,
  prescriptions: PropTypes.array.isRequired,
  certificateData: PropTypes.object.isRequired,
};
