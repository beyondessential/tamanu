import React from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import Divider from '@material-ui/core/Divider';

import { getCurrentDateString } from 'shared/utils/dateTime';

import { DateDisplay } from '../../DateDisplay';
import { useAuth } from '../../../contexts/Auth';
import { Colors } from '../../../constants';
import { getFullLocationName } from '../../../utils/location';

import { LocalisedLabel } from './reusable/SimplePrintout';
import { PrintLetterhead } from './reusable/PrintLetterhead';
import { CertificateWrapper } from './reusable/CertificateWrapper';
import { ListTable } from './reusable/ListTable';
import { PatientDetailPrintout } from './reusable/PatientDetailPrintout';
import { CertificateLabel } from './reusable/CertificateLabels';
import { NotesPagesSection } from './reusable/NotesPagesSection';

const RowContainer = styled.div`
  display: flex;
  justify-content: space-around;
`;

// TODO: deduplicate
export const StyledDivider = styled(Divider)`
  margin-top: 20px;
  margin-bottom: 20px;
  background-color: ${Colors.darkestText};
`;

const StyledDiv = styled.div`
  ${props => (props.$marginLeft ? `margin-left: ${props.$marginLeft}px;` : '')}
`;

const columns = [
  {
    key: 'displayId',
    title: 'Test ID',
    style: { width: '13.33%' },
  },
  {
    key: 'date',
    title: 'Request date',
    accessor: ({ requestedDate }) => <DateDisplay date={requestedDate} />,
    style: { width: '13.33%' },
  },
  {
    key: 'requestedBy',
    title: 'Requesting clinician',
    accessor: ({ requestedBy }) => requestedBy?.displayName,
    style: { width: '13.33%' },
  },
  {
    key: 'sampleTime',
    title: 'Sample time',
    accessor: ({ sampleTime }) => <DateDisplay date={sampleTime} showTime />,
    style: { textAlign: 'center', width: '13.33%' },
  },
  {
    key: 'priority',
    title: 'Priority',
    accessor: ({ priority }) => priority?.name || '',
    style: { width: '13.33%' },
  },
  {
    key: 'category',
    title: 'Test category',
    accessor: ({ category }) => category?.name || '',
    style: { width: '13.33%' },
  },
  {
    key: 'testType',
    title: 'Test type',
    accessor: ({ tests }) => tests?.map(test => test.labTestType?.name).join(', ') || '',
    style: { width: '20%' },
  },
];

export const MultipleLabRequestsPrintout = React.memo(
  ({ patientData, labRequests, encounterData, certificateData }) => {
    const { title, subTitle, logo } = certificateData;
    const { facility } = useAuth();
    const idsAndNotePages = labRequests.map(lr => [lr.displayId, lr.notePages]);

    return (
      <CertificateWrapper>
        <PrintLetterhead title={title} subTitle={subTitle} logoSrc={logo} pageTitle="Lab Request" />
        <PatientDetailPrintout patientData={patientData} />

        <StyledDivider />

        <RowContainer>
          <StyledDiv>
            <CertificateLabel name="Print date" size="14px">
              <DateDisplay date={getCurrentDateString()} />
            </CertificateLabel>
          </StyledDiv>
          <StyledDiv>
            <LocalisedLabel name="facility" size="14px">
              {facility.name}
            </LocalisedLabel>
          </StyledDiv>
          <StyledDiv>
            <LocalisedLabel name="locationId" size="14px">
              {getFullLocationName(encounterData?.location)}
            </LocalisedLabel>
          </StyledDiv>
        </RowContainer>

        <ListTable data={labRequests} columns={columns} />
        <NotesPagesSection idsAndNotePages={idsAndNotePages} />
      </CertificateWrapper>
    );
  },
);

MultipleLabRequestsPrintout.propTypes = {
  patientData: PropTypes.object.isRequired,
  labRequests: PropTypes.array.isRequired,
  certificateData: PropTypes.object.isRequired,
};
