import React from 'react';
import { connect } from 'react-redux';
import { push } from 'connected-react-router';

import { Button } from '../../components/Button';
import { ContentPane } from '../../components/ContentPane';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { PatientInfoPane } from '../../components/PatientInfoPane';
import { TabDisplay } from '../../components/TabDisplay';
import { TwoColumnDisplay } from '../../components/TwoColumnDisplay';
import { Table } from '../../components/Table';

import { FormGrid } from '../../components/FormGrid';
import { DateInput, TextInput, DateTimeInput } from '../../components/Field';

import { IMAGING_REQUEST_STATUS_LABELS } from '../../constants';

const NotesPane = React.memo(({ imagingRequest }) => <ContentPane>{imagingRequest.notes}</ContentPane>);

const columns = [
  { title: 'Test', key: 'type', accessor: row => row.type.name },
  { title: 'Result', key: 'result', accessor: row => row.result },
  { title: 'Reference', key: 'reference', accessor: row => row.type.maleRange.join('-') },
];

const ResultsPane = React.memo(({ imagingRequest }) => (
  <Table columns={columns} data={imagingRequest.tests} />
));

const TABS = [
  {
    label: 'Results',
    key: 'results',
    render: ({ imagingRequest }) => <ResultsPane imagingRequest={imagingRequest} />,
  },
  {
    label: 'Notes',
    key: 'notes',
    render: ({ imagingRequest }) => <NotesPane imagingRequest={imagingRequest} />,
  },
];

const BackLink = connect(
  null,
  dispatch => ({ onClick: () => dispatch(push('/patients/visit')) }),
)(({ onClick }) => <Button onClick={onClick}>&lt; Back to visit information</Button>);

const ImagingRequestInfoPane = React.memo(({ imagingRequest }) => (
  <FormGrid columns={3}>
    <TextInput value={imagingRequest._id} label="Request ID" />
    <TextInput value={(imagingRequest.category || {}).name} label="Request type" />
    <TextInput value={imagingRequest.urgent ? 'Urgent' : 'Standard'} label="Urgency" />
    <TextInput value={IMAGING_REQUEST_STATUS_LABELS[imagingRequest.status] || 'Unknown'} label="Status" />
    <DateInput value={imagingRequest.requestedDate} label="Requested date" />
    <DateTimeInput value={imagingRequest.sampleTime} label="Sample date" />
    <TextInput multiline value={imagingRequest.notes} label="Notes" style={{ gridColumn: '1 / -1' }} />
  </FormGrid>
));

export const DumbImagingRequestView = React.memo(({ imagingRequest, patient, loading }) => {
  const [currentTab, setCurrentTab] = React.useState('results');

  return (
    <React.Fragment>
      <LoadingIndicator loading={loading}>
        <TwoColumnDisplay>
          <PatientInfoPane patient={patient} />
          <div>
            <BackLink />
            <ContentPane>
              <ImagingRequestInfoPane imagingRequest={imagingRequest} />
            </ContentPane>
            <TabDisplay
              tabs={TABS}
              currentTab={currentTab}
              onTabSelect={setCurrentTab}
              imagingRequest={imagingRequest}
            />
          </div>
        </TwoColumnDisplay>
      </LoadingIndicator>
    </React.Fragment>
  );
});

export const ImagingRequestView = connect(state => ({
  loading: state.visit.loading,
  imagingRequest: state.imagingRequest,
  patient: state.patient,
}))(DumbImagingRequestView);
