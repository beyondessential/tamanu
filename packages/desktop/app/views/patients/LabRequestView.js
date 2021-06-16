import React from 'react';
import { connect } from 'react-redux';
import { push } from 'connected-react-router';

import { Button } from '../../components/Button';
import { ContentPane } from '../../components/ContentPane';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { PatientInfoPane } from '../../components/PatientInfoPane';
import { TwoColumnDisplay } from '../../components/TwoColumnDisplay';
import { DataFetchingTable } from '../../components/Table';
import { ManualLabResultModal } from '../../components/ManualLabResultModal';

import { TopBar } from '../../components/TopBar';
import { FormGrid } from '../../components/FormGrid';
import { DateInput, TextInput, DateTimeInput } from '../../components/Field';

import { ChangeLabStatusModal } from '../../components/ChangeLabStatusModal';
import { LAB_REQUEST_STATUS_LABELS } from '../../constants';

import { capitaliseFirstLetter } from '../../utils/capitalise';

const makeRangeStringAccessor = sex => row => {
  const type = row.labTestType;

  if (sex === 'male') {
    return `${type.maleMin} – ${type.maleMax}`;
  }

  return `${type.femaleMin} – ${type.femaleMax}`;
};

const columns = sex => [
  { title: 'Test', key: 'type', accessor: row => row.labTestType.name },
  {
    title: 'Result',
    key: 'result',
    accessor: ({ result }) => (result ? capitaliseFirstLetter(result) : ''),
  },
  { title: 'Reference', key: 'reference', accessor: makeRangeStringAccessor(sex) },
];

const ResultsPane = React.memo(({ labRequest, patient }) => {
  const [activeTest, setActiveTest] = React.useState(null);
  const [isModalOpen, setModalOpen] = React.useState(false);

  const closeModal = React.useCallback(() => setModalOpen(false), [setModalOpen]);
  const openModal = React.useCallback(
    test => {
      if (test.result) return;
      setActiveTest(test);
      setModalOpen(true);
    },
    [setActiveTest],
  );

  const sexAppropriateColumns = columns(patient.sex);

  return (// TODO: AL
    <div>
      <ManualLabResultModal
        open={isModalOpen}
        labRequest={labRequest}
        labTest={activeTest}
        onClose={closeModal}
      />
      <DataFetchingTable
        columns={sexAppropriateColumns}
        endpoint={`labRequest/${labRequest.id}/tests`}
        onRowClick={openModal}
      />
    </div>
  );
});

const BackLink = connect(null, dispatch => ({
  onClick: () => dispatch(push('/patients/encounter')),
}))(({ onClick }) => <Button onClick={onClick}>&lt; Back to encounter information</Button>);

const ChangeLabStatusButton = React.memo(({ labRequest }) => {
  const [isModalOpen, setModalOpen] = React.useState(false);
  const openModal = React.useCallback(() => setModalOpen(true), [setModalOpen]);
  const closeModal = React.useCallback(() => setModalOpen(false), [setModalOpen]);
  return (
    <React.Fragment>
      <Button variant="outlined" onClick={openModal}>
        Change status
      </Button>
      <ChangeLabStatusModal labRequest={labRequest} open={isModalOpen} onClose={closeModal} />
    </React.Fragment>
  );
});

const LabRequestInfoPane = React.memo(({ labRequest }) => (
  <FormGrid columns={3}>
    <TextInput value={labRequest.id} label="Request ID" />
    <TextInput value={(labRequest.category || {}).name} label="Request type" />
    <TextInput value={labRequest.urgent ? 'Urgent' : 'Standard'} label="Urgency" />
    <TextInput value={LAB_REQUEST_STATUS_LABELS[labRequest.status] || 'Unknown'} label="Status" />
    <DateInput value={labRequest.requestedDate} label="Requested date" />
    <DateTimeInput value={labRequest.sampleTime} label="Sample date" />
    <TextInput multiline value={labRequest.note} label="Notes" style={{ gridColumn: '1 / -1' }} />
  </FormGrid>
));

export const DumbLabRequestView = React.memo(({ labRequest, patient, loading }) => {
  if (loading) return <LoadingIndicator />;
  return (
    <TwoColumnDisplay>
      <PatientInfoPane patient={patient} />
      <div>
        <TopBar title="Lab request">
          <ChangeLabStatusButton labRequest={labRequest} />
        </TopBar>
        <BackLink />
        <ContentPane>
          <LabRequestInfoPane labRequest={labRequest} />
        </ContentPane>
        <ResultsPane labRequest={labRequest} patient={patient} />
      </div>
    </TwoColumnDisplay>
  );
});

export const LabRequestView = connect(state => ({
  loading: state.labRequest.loading,
  labRequest: state.labRequest,
  patient: state.patient,
}))(DumbLabRequestView);
