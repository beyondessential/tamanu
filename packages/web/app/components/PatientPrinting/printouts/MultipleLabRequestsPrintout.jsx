import React from 'react';
import PropTypes from 'prop-types';

import { DateDisplay } from '../../DateDisplay';

import { PrintLetterhead } from './reusable/PrintLetterhead';
import { CertificateWrapper } from './reusable/CertificateWrapper';
import { ListTable } from './reusable/ListTable';
import { PatientDetailPrintout } from './reusable/PatientDetailPrintout';
import { NotesSection } from './reusable/NotesSection';
import { Divider } from './reusable/Divider';
import { DateFacilitySection } from './reusable/DateFacilitySection';
import { useLocalisedText } from '../../LocalisedText';

export const MultipleLabRequestsPrintout = React.memo(
  ({ patient, labRequests, encounter, village, additionalData, certificateData }) => {
    const clinicianText = useLocalisedText({ path: 'fields.clinician.shortLabel' }).toLowerCase();
    const { title, subTitle, logo } = certificateData;

    const idsAndNotes = labRequests.map(lr => [lr.displayId, lr.notes]);
    const columns = [
      {
        key: 'displayId',
        title: 'Test ID',
        widthProportion: 2,
      },
      {
        key: 'date',
        title: 'Request date',
        accessor: ({ requestedDate }) => <DateDisplay date={requestedDate} />,
        widthProportion: 2,
      },
      {
        key: 'requestedBy',
        title: `Requesting ${clinicianText}`,
        accessor: ({ requestedBy }) => requestedBy?.displayName,
        widthProportion: 2,
      },
      {
        key: 'sampleTime',
        title: 'Sample time',
        accessor: ({ sampleTime }) => <DateDisplay date={sampleTime} showTime />,
        widthProportion: 2,
      },
      {
        key: 'priority',
        title: 'Priority',
        accessor: ({ priority }) => priority?.name || '',
        widthProportion: 2,
      },
      {
        key: 'category',
        title: 'Test category',
        accessor: ({ category }) => category?.name || '',
        widthProportion: 2,
      },
      {
        key: 'testType',
        title: 'Test type',
        accessor: ({ labTestPanelRequest, tests }) => {
          if (labTestPanelRequest) {
            return labTestPanelRequest.labTestPanel.name;
          }
          return tests?.map(test => test.labTestType?.name).join(', ') || '';
        },
        widthProportion: 3,
      },
    ];

    return (
      <CertificateWrapper>
        <PrintLetterhead title={title} subTitle={subTitle} logoSrc={logo} pageTitle="Lab Request" />
        <PatientDetailPrintout
          patient={patient}
          village={village}
          additionalData={additionalData}
        />
        <Divider />
        <DateFacilitySection encounter={encounter} />
        <ListTable data={labRequests} columns={columns} />
        <NotesSection idsAndNotes={idsAndNotes} />
      </CertificateWrapper>
    );
  },
);

MultipleLabRequestsPrintout.propTypes = {
  patient: PropTypes.object.isRequired,
  additionalData: PropTypes.object.isRequired,
  village: PropTypes.object.isRequired,
  encounter: PropTypes.object.isRequired,
  labRequests: PropTypes.array.isRequired,
  certificateData: PropTypes.object.isRequired,
};
