import React from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
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
import { Colors, DRUG_ROUTE_VALUE_TO_LABEL } from '../../constants';

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

    return (
      <CertificateWrapper>
        <PrintLetterhead
          title={title}
          subTitle={subTitle}
          logoSrc={logo}
          pageTitle="Prescription"
        />
        <PatientDetailPrintout patientData={patientData} />

        <StyledDivider />

        <RowContainer>
          <StyledDiv>
            <CertificateLabel margin="9px" name="Date" size="14px">
              <DateDisplay date={getCurrentDateString()} />
            </CertificateLabel>
            <LocalisedLabel name="prescriber" size="14px">
              {prescriber?.displayName}
            </LocalisedLabel>
          </StyledDiv>
          <StyledDiv $marginLeft="150">
            <LocalisedLabel name="prescriberId" size="14px">
              {prescriber?.displayId}
            </LocalisedLabel>
            <LocalisedLabel name="facility" size="14px">
              {facility.name}
            </LocalisedLabel>
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
