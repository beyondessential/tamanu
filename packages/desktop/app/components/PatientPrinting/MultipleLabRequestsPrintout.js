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

const StyledLabRequestId = styled.b`
  margin-right: 10px;
`;

const columns = [
  {
    key: 'displayId',
    title: 'Test ID',
  },
  {
    key: 'date',
    title: 'Request date',
    accessor: ({ requestedDate }) => <DateDisplay date={requestedDate} />,
  },
  {
    key: 'requestedBy',
    title: 'Requesting clinician',
    accessor: ({ requestedBy }) => requestedBy?.displayName,
  },
  {
    key: 'sampleTime',
    title: 'Sample time',
    accessor: ({ sampleTime }) => <DateDisplay date={sampleTime} showTime />,
    style: { textAlign: 'center' },
  },
  {
    key: 'priority',
    title: 'Priority',
    accessor: ({ priority }) => priority?.name || '',
  },
  {
    key: 'category',
    title: 'Test category',
    accessor: ({ category }) => category?.name || '',
  },
  {
    key: 'testType',
    title: 'Test type',
    accessor: ({ tests }) => tests?.map(test => test.labTestType?.name).join(', ') || '',
  },
];

export const MultipleLabRequestsPrintout = React.memo(
  ({ patientData, labRequests, certificateData }) => {
    const { title, subTitle, logo } = certificateData;
    const { facility } = useAuth();
    const notes = labRequests
      .map(labRequest => {
        const labRequestNotes = labRequest.notePages
          .map(({ noteItems }) => noteItems[0]?.content)
          .join(', ');

        if (!labRequestNotes) {
          return null;
        }

        return {
          content: (
            <p>
              <StyledLabRequestId>{labRequest.displayId}</StyledLabRequestId>
              {labRequestNotes}
            </p>
          ),
        };
      })
      .filter(note => !!note);

    return (
      <CertificateWrapper>
        <PrintLetterhead title={title} subTitle={subTitle} logoSrc={logo} pageTitle="Lab Request" />
        <PatientDetailPrintout patientData={patientData} />

        <StyledDivider />

        <RowContainer>
          <StyledDiv>
            <CertificateLabel margin="9px" name="Date" size="14px">
              <DateDisplay date={getCurrentDateString()} />
            </CertificateLabel>
          </StyledDiv>
          <StyledDiv $marginLeft="150">
            <LocalisedLabel name="facility" size="14px">
              {facility.name}
            </LocalisedLabel>
          </StyledDiv>
        </RowContainer>

        <ListTable
          data={labRequests}
          columns={columns}
          gridTemplateColumns="2fr 2fr 2fr 2fr 2fr 2fr 3fr"
        />
        <StyledNotesSectionWrapper>
          <NotesSection title="Notes" notes={notes} height="auto" separator={null} boldTitle />
        </StyledNotesSectionWrapper>
      </CertificateWrapper>
    );
  },
);

MultipleLabRequestsPrintout.propTypes = {
  patientData: PropTypes.object.isRequired,
  labRequests: PropTypes.array.isRequired,
  certificateData: PropTypes.object.isRequired,
};
