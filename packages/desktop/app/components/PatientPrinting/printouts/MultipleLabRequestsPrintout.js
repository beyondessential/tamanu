import React from 'react';
import PropTypes from 'prop-types';

import { DateDisplay } from '../../DateDisplay';

import { PrintLetterhead } from './reusable/PrintLetterhead';
import { CertificateWrapper } from './reusable/CertificateWrapper';
import { ListTable } from './reusable/ListTable';
import { PatientDetailPrintout } from './reusable/PatientDetailPrintout';
import { NotesPagesSection } from './reusable/NotesPagesSection';
import { Divider } from './reusable/Divider';
import { DateFacilitySection } from './reusable/DateFacilitySection';

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
    const idsAndNotePages = labRequests.map(lr => [lr.displayId, lr.notePages]);

    return (
      <CertificateWrapper>
        <PrintLetterhead title={title} subTitle={subTitle} logoSrc={logo} pageTitle="Lab Request" />
        <PatientDetailPrintout patientData={patientData} />

        <Divider />
        <DateFacilitySection encounter={encounterData} />

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
