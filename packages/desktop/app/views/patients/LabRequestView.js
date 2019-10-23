import React from 'react';
import { connect } from 'react-redux';
import { push } from 'connected-react-router';

import { Button } from '../../components/Button';
import { ContentPane } from '../../components/ContentPane';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { PatientInfoPane } from '../../components/PatientInfoPane';
import { TwoColumnDisplay } from '../../components/TwoColumnDisplay';
import { Table } from '../../components/Table';
import { ManualLabResultModal } from '../../components/ManualLabResultModal';

import { FormGrid } from '../../components/FormGrid';
import { DateInput, TextInput, DateTimeInput } from '../../components/Field';

import { LAB_REQUEST_STATUS_LABELS } from '../../constants';

const columns = [
  { title: 'Test', key: 'type', accessor: row => row.type.name },
  { title: 'Result', key: 'result', accessor: row => row.result },
  { title: 'Reference', key: 'reference', accessor: row => row.type.maleRange.join('-') },
];

const ResultsPane = React.memo(({ labRequest }) => {
  const [activeTest, setActiveTest] = React.useState(null);
  const clearActiveTest = React.useCallback(() => setActiveTest(null), [setActiveTest]);
  const openModal = React.useCallback(
    test => {
      if (test.result) return;
      setActiveTest(test);
    },
    [setActiveTest],
  );

  return (
    <div>
      <ManualLabResultModal
        labRequest={labRequest}
        labTest={activeTest}
        onClose={clearActiveTest}
      />
      <Table columns={columns} data={labRequest.tests} onRowClick={openModal} />
    </div>
  );
});

const BackLink = connect(
  null,
  dispatch => ({ onClick: () => dispatch(push('/patients/visit')) }),
)(({ onClick }) => <Button onClick={onClick}>&lt; Back to visit information</Button>);

const LabRequestInfoPane = React.memo(({ labRequest }) => (
  <FormGrid columns={3}>
    <TextInput value={labRequest._id} label="Request ID" />
    <TextInput value={(labRequest.category || {}).name} label="Request type" />
    <TextInput value={labRequest.urgent ? 'Urgent' : 'Standard'} label="Urgency" />
    <TextInput value={LAB_REQUEST_STATUS_LABELS[labRequest.status] || 'Unknown'} label="Status" />
    <DateInput value={labRequest.requestedDate} label="Requested date" />
    <DateTimeInput value={labRequest.sampleTime} label="Sample date" />
    <TextInput multiline value={labRequest.notes} label="Notes" style={{ gridColumn: '1 / -1' }} />
  </FormGrid>
));

export const DumbLabRequestView = React.memo(({ labRequest, patient, loading }) => (
  <React.Fragment>
    <LoadingIndicator loading={loading}>
      <TwoColumnDisplay>
        <PatientInfoPane patient={patient} />
        <div>
          <BackLink />
          <ContentPane>
            <LabRequestInfoPane labRequest={labRequest} />
          </ContentPane>
          <ResultsPane labRequest={labRequest} />
        </div>
      </TwoColumnDisplay>
    </LoadingIndicator>
  </React.Fragment>
));

export const LabRequestView = connect(state => ({
  loading: state.visit.loading,
  labRequest: state.labRequest,
  patient: state.patient,
}))(DumbLabRequestView);
