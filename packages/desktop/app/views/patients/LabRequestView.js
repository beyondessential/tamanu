import React, { useState, useCallback, useMemo } from 'react';
import { connect, useDispatch } from 'react-redux';
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
import {
  SelectField,
  DateInput,
  TextInput,
  DateTimeInput,
  AutocompleteField,
} from '../../components/Field';
import { ConfirmCancelRow } from '../../components/ButtonRow';

import { LAB_REQUEST_STATUS_LABELS } from '../../constants';

import { capitaliseFirstLetter } from '../../utils/capitalise';
import { getCompletedDate, getMethod } from '../../utils/lab';
import { Modal } from '../../components/Modal';
import { LabRequestNoteForm } from '../../forms/LabRequestNoteForm';
import { LabRequestAuditPane } from '../../components/LabRequestAuditPane';
import { useLabRequest } from '../../contexts/LabRequest';
import { useSuggester } from '../../api/singletons';

const makeRangeStringAccessor = sex => ({ labTestType }) => {
  const max = sex === 'male' ? labTestType.maleMax : labTestType.femaleMax;
  const min = sex === 'male' ? labTestType.maleMin : labTestType.femaleMin;
  const hasMax = max || max === 0;
  const hasMin = min || min === 0;

  if (hasMin && hasMax) return `${min} - ${max}`;
  if (hasMin) return `>${min}`;
  if (hasMax) return `<${max}`;
  return 'N/A';
};

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
  { title: 'Completed', key: 'completedDate', accessor: getCompletedDate, sortable: false },
];

const ResultsPane = React.memo(({ labRequest, patient }) => {
  const [activeTest, setActiveTest] = useState(null);
  const [isModalOpen, setModalOpen] = useState(false);

  const closeModal = useCallback(() => setModalOpen(false), [setModalOpen]);
  const openModal = useCallback(
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

const BackLink = () => {
  const dispatch = useDispatch();
  return (
    <Button
      onClick={() => {
        dispatch(push('/patients/encounter'));
      }}
    >
      &lt; Back to encounter information
    </Button>
  );
};
const ChangeLabStatusButton = ({ status: currentStatus, updateLabReq }) => {
  const [status, setStatus] = useState(currentStatus);
  const [isModalOpen, setModalOpen] = useState(false);
  const openModal = useCallback(() => setModalOpen(true), [setModalOpen]);
  const closeModal = useCallback(() => setModalOpen(false), [setModalOpen]);
  const updateLabStatus = useCallback(async () => {
    await updateLabReq({ status });
    closeModal();
  }, [updateLabReq, status]);
  const labStatuses = useMemo(() => [
    { value: 'reception_pending', label: 'Reception pending' },
    { value: 'results_pending', label: 'Results pending' },
    { value: 'to_be_verified', label: 'To be verified' },
    { value: 'verified', label: 'Verified' },
    { value: 'published', label: 'Published' },
  ]);
  return (
    <>
      <Button variant="outlined" onClick={openModal} style={{ marginRight: '0.5rem' }}>
        Change status
      </Button>
      <Modal open={isModalOpen} onClose={closeModal} title="Change lab request status">
        <FormGrid columns={1}>
          <SelectField
            label="Status"
            field={{ name: 'status' }}
            options={labStatuses}
            value={status}
            form={{ initialValues: { status } }}
            onChange={({ target: { value } }) => {
              setStatus(value);
            }}
          />
          <ConfirmCancelRow onConfirm={updateLabStatus} confirmText="Save" onCancel={closeModal} />
        </FormGrid>
      </Modal>
    </>
  );
};

const ChangeLaboratoryButton = ({ laboratory, updateLabReq }) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [lab, setLab] = useState(laboratory);
  const openModal = useCallback(() => setModalOpen(true), [setModalOpen]);
  const closeModal = useCallback(() => setModalOpen(false), [setModalOpen]);
  const laboratorySuggester = useSuggester('labTestLaboratory');
  const updateLab = useCallback(async () => {
    await updateLabReq({
      labTestLaboratoryId: lab,
    });
    closeModal();
  }, [updateLabReq, lab]);
  return (
    <>
      <Button variant="outlined" onClick={openModal}>
        Change laboratory
      </Button>
      <Modal open={isModalOpen} onClose={closeModal} title="Change lab request laboratory">
        <FormGrid columns={1}>
          <AutocompleteField
            label="Laboratory"
            field={{ name: 'labTestLaboratoryId' }}
            suggester={laboratorySuggester}
            value={lab}
            onChange={({ target: { value } }) => {
              setLab(value);
            }}
          />
          <ConfirmCancelRow onConfirm={updateLab} confirmText="Save" onCancel={closeModal} />
        </FormGrid>
      </Modal>
    </>
  );
};

const DeleteButton = ({ updateLabReq }) => {
  const dispatch = useDispatch();
  const [isModalOpen, setModalOpen] = useState(false);
  const openModal = useCallback(() => setModalOpen(true), [setModalOpen]);
  const closeModal = useCallback(() => setModalOpen(false), [setModalOpen]);
  const deleteLabRequest = useCallback(async () => {
    await updateLabReq({
      status: 'deleted',
    });
    closeModal();
    dispatch(push('/patients/encounter'));
  }, [updateLabReq]);
  return (
    <>
      <Button variant="outlined" onClick={openModal} style={{ marginRight: '0.5rem' }}>
        Delete
      </Button>
      <Modal open={isModalOpen} onClose={closeModal} title="Delete lab request">
        <ConfirmCancelRow onConfirm={deleteLabRequest} confirmText="Delete" onCancel={closeModal} />
      </Modal>
    </>
  );
};

const LabRequestInfoPane = ({ labRequest }) => (
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
);

export const DumbLabRequestView = React.memo(({ patient }) => {
  const { isLoading, labRequest, updateLabRequest } = useLabRequest();
  const updateLabReq = useCallback(
    async data => {
      await updateLabRequest(labRequest.id, data);
    },
    [labRequest],
  );
  if (isLoading) return <LoadingIndicator />;
  return (
    <TwoColumnDisplay>
      <PatientInfoPane patient={patient} />
      <div>
        <TopBar title="Lab request">
          <div>
            <DeleteButton updateLabReq={updateLabReq} />
            <ChangeLabStatusButton status={labRequest.status} updateLabReq={updateLabReq} />
            <ChangeLaboratoryButton
              laboratory={labRequest.laboratory}
              updateLabReq={updateLabReq}
            />
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
