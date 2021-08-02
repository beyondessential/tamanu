import React from 'react';
import { connect } from 'react-redux';
import { push } from 'connected-react-router';

import { AddButton, Button } from '../../components/Button';
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
import { ChangeLaboratoryModal } from '../../components/ChangeLaboratoryModal';
import { DateDisplay } from '../../components';
import { LabRequestNoteForm } from '../../forms/LabRequestNoteForm';
import { LabRequestAuditPane } from '../../components/LabRequestAuditPane';
import { useLabRequest } from '../../contexts/LabRequest';

const makeRangeStringAccessor = sex => ({ labTestType }) => {
  const max = (sex === 'male') ? labTestType.maleMax : labTestType.femaleMax;
  const min = (sex === 'male') ? labTestType.maleMin : labTestType.femaleMin;
  const hasMax = max || (max === 0);
  const hasMin = min || (min === 0);

  if (hasMin && hasMax) return `${min} - ${max}`;
  if (hasMin) return `>${min}`;
  if (hasMax) return `<${max}`;
  return 'N/A';
};

const getDate = ({ completedDate }) => <DateDisplay date={completedDate} />;
const getMethod = ({ labTestMethod }) => (labTestMethod || {}).name || 'Unknown';

const columns = sex => [
  { title: 'Test', key: 'type', accessor: row => row.labTestType.name },
  {
    title: 'Result',
    key: 'result',
    accessor: ({ result }) => (result ? capitaliseFirstLetter(result) : ''),
  },
  { title: 'Clinical range', key: 'reference', accessor: makeRangeStringAccessor(sex) },
  { title: 'Method', key: 'labTestMethod', accessor: getMethod, sortable: false },
  { title: 'Laboratory officer', key: 'laboratoryOfficer' },
  { title: 'Verification', key: 'verification' },
  { title: 'Completed', key: 'completedDate', accessor: getDate, sortable: false },
];

const ResultsPane = React.memo(({ labRequest, patient }) => {
  const [activeTest, setActiveTest] = React.useState(null);
  const [isModalOpen, setModalOpen] = React.useState(false);

  const closeModal = React.useCallback(() => setModalOpen(false), [setModalOpen]);
  const openModal = React.useCallback(
    test => {
      setActiveTest(test);
      setModalOpen(true);
    },
    [setActiveTest],
  );

  const sexAppropriateColumns = columns(patient.sex);

  return (
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

const ChangeLaboratoryButton = React.memo(({ labRequest }) => {
  const [isModalOpen, setModalOpen] = React.useState(false);
  const openModal = React.useCallback(() => setModalOpen(true), [setModalOpen]);
  const closeModal = React.useCallback(() => setModalOpen(false), [setModalOpen]);
  return (
    <React.Fragment>
      <Button variant="outlined" onClick={openModal}>
        Change laboratory
      </Button>
      <ChangeLaboratoryModal labRequest={labRequest} open={isModalOpen} onClose={closeModal} />
    </React.Fragment>
  );
});

const LabRequestInfoPane = React.memo(({ labRequest }) => (
  <FormGrid columns={3}>
    <TextInput value={labRequest.displayId} label="Request ID" />
    <TextInput value={(labRequest.category || {}).name} label="Request type" />
    <TextInput value={labRequest.urgent ? 'Urgent' : 'Standard'} label="Urgency" />
    <TextInput value={(labRequest.priority || {}).name} label="Priority" />
    <TextInput value={LAB_REQUEST_STATUS_LABELS[labRequest.status] || 'Unknown'} label="Status" />
    <TextInput value={(labRequest.laboratory || {}).name} label="Laboratory" />
    <DateInput value={labRequest.requestedDate} label="Requested date" />
    <DateTimeInput value={labRequest.sampleTime} label="Sample date" />
    <LabRequestNoteForm labRequest={labRequest} />
  </FormGrid>
));

export const DumbLabRequestView = React.memo(({ patient }) => {
  const { isLoading, labRequest } = useLabRequest();
  if (isLoading) return <LoadingIndicator />;
  return (
    <TwoColumnDisplay>
      <PatientInfoPane patient={patient} />
      <div>
        <TopBar title="Lab request">
          <div>
            <ChangeLabStatusButton labRequest={labRequest} />{' '}
            <ChangeLaboratoryButton labRequest={labRequest} />
          </div>
        </TopBar>
        <BackLink />
        <ContentPane>
          <LabRequestInfoPane labRequest={labRequest} />
        </ContentPane>
        <ResultsPane labRequest={labRequest} patient={patient} />
        <LabRequestAuditPane labRequest={labRequest} />
      </div>
    </TwoColumnDisplay>
  );
});

export const LabRequestView = connect(state => ({
  patient: state.patient,
}))(DumbLabRequestView);
