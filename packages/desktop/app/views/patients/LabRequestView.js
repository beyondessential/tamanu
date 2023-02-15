import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { LAB_REQUEST_STATUSES, LAB_REQUEST_STATUS_CONFIG, NOTE_TYPES } from 'shared/constants';
import { usePatientNavigation } from '../../utils/usePatientNavigation';
import { useLabRequest } from '../../contexts/LabRequest';
import { useApi, useSuggester } from '../../api';
import { useCertificate } from '../../utils/useCertificate';

import { DeleteButton } from '../../components/Button';
import { ContentPane } from '../../components/ContentPane';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { DataFetchingTable } from '../../components/Table';
import { ManualLabResultModal } from '../../components/ManualLabResultModal';
import { FormGrid } from '../../components/FormGrid';
import {
  SelectInput,
  DateInput,
  TextInput,
  DateTimeInput,
  AutocompleteField,
} from '../../components/Field';
import { ConfirmCancelRow } from '../../components/ButtonRow';
import { ConfirmModal } from '../../components/ConfirmModal';
import { LabRequestPrintout } from '../../components/PatientPrinting/LabRequestPrintout';
import { DropdownButton } from '../../components/DropdownButton';
import { Modal } from '../../components/Modal';
import { LabRequestNoteForm } from '../../forms/LabRequestNoteForm';
import { LabRequestAuditPane } from '../../components/LabRequestAuditPane';

import { capitaliseFirstLetter } from '../../utils/capitalise';
import { getCompletedDate, getMethod } from '../../utils/lab';
import { CancelModal } from '../../components/CancelModal';
import { SimpleTopBar } from '../../components';
import { useLocalisation } from '../../contexts/Localisation';

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

const ResultsPane = React.memo(({ labRequest, patient, isReadOnly }) => {
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
    <>
      <ManualLabResultModal
        open={isModalOpen}
        labRequest={labRequest}
        labTest={activeTest}
        onClose={closeModal}
        isReadOnly={isReadOnly}
      />
      <DataFetchingTable
        columns={sexAppropriateColumns}
        endpoint={`labRequest/${labRequest.id}/tests`}
        onRowClick={openModal}
        initialSort={{ order: 'asc', orderBy: 'id' }}
      />
    </>
  );
});

const ChangeLabStatusModal = ({ status: currentStatus, updateLabReq, open, onClose }) => {
  const [status, setStatus] = useState(currentStatus);
  const updateLabStatus = useCallback(async () => {
    await updateLabReq({ status });
    onClose();
  }, [updateLabReq, status, onClose]);
  const labStatuses = useMemo(
    () => [
      { value: 'reception_pending', label: 'Reception pending' },
      { value: 'results_pending', label: 'Results pending' },
      { value: 'to_be_verified', label: 'To be verified' },
      { value: 'verified', label: 'Verified' },
      { value: 'published', label: 'Published' },
    ],
    [],
  );
  return (
    <>
      <Modal open={open} onClose={onClose} title="Change lab request status">
        <FormGrid columns={1}>
          <SelectInput
            label="Status"
            name="status"
            options={labStatuses}
            value={status}
            onChange={({ target: { value } }) => setStatus(value)}
          />
          <ConfirmCancelRow onConfirm={updateLabStatus} confirmText="Save" onCancel={onClose} />
        </FormGrid>
      </Modal>
    </>
  );
};

const ChangeLaboratoryModal = ({ laboratory, updateLabReq, open, onClose }) => {
  const [lab, setLab] = useState(laboratory);
  const laboratorySuggester = useSuggester('labTestLaboratory');
  const updateLab = useCallback(async () => {
    await updateLabReq({
      labTestLaboratoryId: lab,
    });
    onClose();
  }, [updateLabReq, lab, onClose]);
  return (
    <>
      <Modal open={open} onClose={onClose} title="Change lab request laboratory">
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
          <ConfirmCancelRow onConfirm={updateLab} confirmText="Save" onCancel={onClose} />
        </FormGrid>
      </Modal>
    </>
  );
};

const DeleteRequestModal = ({ updateLabReq, open, onClose }) => {
  const { navigateToEncounter } = usePatientNavigation();
  const deleteLabRequest = useCallback(async () => {
    await updateLabReq({
      status: 'deleted',
    });
    onClose();
    navigateToEncounter();
  }, [updateLabReq, onClose, navigateToEncounter]);

  return (
    <>
      <ConfirmModal
        title="Delete lab request"
        open={open}
        text="WARNING: This action is irreversible!"
        subText="Are you sure you want to delete this lab request?"
        onCancel={onClose}
        onConfirm={deleteLabRequest}
        ConfirmButton={DeleteButton}
        confirmButtonText="Delete"
      />
    </>
  );
};

const PrintModal = ({ labRequest, patient, open, onClose }) => {
  const api = useApi();
  const certificateData = useCertificate();
  const [notes, setNotes] = useState([]);
  const [tests, setTests] = useState([]);
  const [encounter, setEncounter] = useState({});
  const [notesLoading, setNotesLoading] = useState(false);
  const [testsLoading, setTestsLoading] = useState(false);
  const [encounterLoading, setEncounterLoading] = useState(false);

  useEffect(() => {
    setEncounterLoading(true);
    (async () => {
      const res = await api.get(`encounter/${labRequest.encounterId}`);
      setEncounter(res);
    })();
    setEncounterLoading(false);
  }, [api, labRequest.encounterId]);

  useEffect(() => {
    setTestsLoading(true);
    (async () => {
      const res = await api.get(`labRequest/${labRequest.id}/tests`);
      setTests(res.data);
    })();
    setTestsLoading(false);
  }, [api, labRequest.id]);
  useEffect(() => {
    setNotesLoading(true);
    (async () => {
      const res = await api.get(`labRequest/${labRequest.id}/notes`);
      setNotes(res.data);
    })();
    setNotesLoading(false);
  }, [api, labRequest.id]);

  return (
    <>
      <Modal title="Lab Request" open={open} onClose={onClose} width="md" printable>
        {encounterLoading || testsLoading || notesLoading ? (
          <LoadingIndicator />
        ) : (
          <LabRequestPrintout
            labRequestData={{ ...labRequest, tests, notes }}
            patientData={patient}
            encounterData={encounter}
            certificateData={certificateData}
          />
        )}
      </Modal>
    </>
  );
};

const LabRequestCancelModal = ({ open, onClose, updateLabReq, labRequestId }) => {
  const api = useApi();
  const { getLocalisation } = useLocalisation();
  const cancellationReasonOptions = getLocalisation('labsCancellationReasons') || [];

  const onConfirmCancel = async ({ reasonForCancellation }) => {
    const reasonText = cancellationReasonOptions.find(x => x.value === reasonForCancellation)
      ?.label;
    const note = `Request cancelled. Reason: ${reasonText}.`;

    let status;
    if (reasonForCancellation === 'duplicate') {
      status = LAB_REQUEST_STATUSES.DELETED;
    } else if (reasonForCancellation === 'entered-in-error') {
      status = LAB_REQUEST_STATUSES.ENTERED_IN_ERROR;
    } else {
      status = LAB_REQUEST_STATUSES.CANCELLED;
    }

    await api.post(`labRequest/${labRequestId}/notes`, {
      content: note,
      authorId: api.user.id,
      noteType: NOTE_TYPES.OTHER,
    });

    await updateLabReq({
      status,
      reasonForCancellation,
    });
  };

  return (
    <CancelModal
      title="Cancel lab request"
      open={open}
      onClose={onClose}
      options={cancellationReasonOptions}
      helperText="This reason will permanently delete the lab request record"
      bodyText="Please select reason for cancelling lab request and click 'Confirm'"
      onConfirm={onConfirmCancel}
    />
  );
};

const LabRequestActionDropdown = ({ labRequest, patient, updateLabReq }) => {
  const { modal } = useParams();
  const [statusModalOpen, setStatusModalOpen] = useState(modal === 'status');
  const [printModalOpen, setPrintModalOpen] = useState(modal === 'print');
  const [labModalOpen, setLabModalOpen] = useState(modal === 'laboratory');
  const [cancelModalOpen, setCancelModalOpen] = useState(modal === 'cancel');
  const [deleteModalOpen, setDeleteModalOpen] = useState(modal === 'delete');

  const api = useApi();
  const [hasTests, setHasTests] = useState(true); // default to true to hide delete button at first
  const { id: labRequestId, status } = labRequest;

  // show delete button if no test has results
  useEffect(() => {
    (async () => {
      const { data: tests } = await api.get(`/labRequest/${labRequestId}/tests`);
      const testsWithResults = tests.filter(t => t.result);
      if (!testsWithResults.length) {
        setHasTests(false);
      }
    })();
  }, [api, labRequestId, setHasTests]);

  const actions = [
    { label: 'Change status', onClick: () => setStatusModalOpen(true) },
    { label: 'Print lab request', onClick: () => setPrintModalOpen(true) },
    { label: 'Change laboratory', onClick: () => setLabModalOpen(true) },
  ];

  if (status !== LAB_REQUEST_STATUSES.PUBLISHED) {
    actions.push({ label: 'Cancel request', onClick: () => setCancelModalOpen(true) });
  }

  if (!hasTests) {
    actions.push({ label: 'Delete', onClick: () => setDeleteModalOpen(true) });
  }

  // Hide all actions if the lab request is cancelled, deleted or entered-in-error
  const hideActions =
    status === LAB_REQUEST_STATUSES.CANCELLED ||
    status === LAB_REQUEST_STATUSES.DELETED ||
    status === LAB_REQUEST_STATUSES.ENTERED_IN_ERROR;

  return (
    <>
      <ChangeLabStatusModal
        status={status}
        updateLabReq={updateLabReq}
        open={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
      />
      <PrintModal
        labRequest={labRequest}
        patient={patient}
        open={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
      />
      <DeleteRequestModal
        labRequestId={labRequestId}
        updateLabReq={updateLabReq}
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
      />
      <ChangeLaboratoryModal
        laboratory={labRequest.laboratory}
        updateLabReq={updateLabReq}
        open={labModalOpen}
        onClose={() => setLabModalOpen(false)}
      />
      <LabRequestCancelModal
        updateLabReq={updateLabReq}
        labRequestId={labRequestId}
        open={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
      />
      {!hideActions && <DropdownButton actions={actions} variant="outlined" />}
    </>
  );
};

const LabRequestInfoPane = ({ labRequest, isReadOnly }) => (
  <FormGrid columns={3}>
    <TextInput value={labRequest.displayId} label="Request ID" disabled={isReadOnly} />
    <TextInput
      value={(labRequest.category || {}).name}
      label="Request type"
      disabled={isReadOnly}
    />
    <TextInput
      value={labRequest.urgent ? 'Urgent' : 'Standard'}
      label="Urgency"
      disabled={isReadOnly}
    />
    <TextInput value={(labRequest.priority || {}).name} label="Priority" disabled={isReadOnly} />
    <TextInput
      value={LAB_REQUEST_STATUS_CONFIG[labRequest.status]?.label || 'Unknown'}
      label="Status"
      disabled={isReadOnly}
    />
    <TextInput
      value={(labRequest.laboratory || {}).name}
      label="Laboratory"
      disabled={isReadOnly}
    />
    <DateInput
      value={labRequest.requestedDate}
      saveDateAsString
      label="Requested date"
      disabled={isReadOnly}
    />
    <DateTimeInput
      value={labRequest.sampleTime}
      saveDateAsString
      label="Sample date"
      disabled={isReadOnly}
    />
    <LabRequestNoteForm labRequest={labRequest} isReadOnly={isReadOnly} />
  </FormGrid>
);

export const LabRequestView = () => {
  const { isLoading, labRequest, updateLabRequest } = useLabRequest();
  const { navigateToLabRequest } = usePatientNavigation();

  const patient = useSelector(state => state.patient);

  const updateLabReq = async data => {
    await updateLabRequest(labRequest.id, data);
    navigateToLabRequest(labRequest.id);
  };

  if (isLoading) return <LoadingIndicator />;

  const isReadOnly =
    labRequest.status === LAB_REQUEST_STATUSES.CANCELLED ||
    labRequest.status === LAB_REQUEST_STATUSES.ENTERED_IN_ERROR ||
    labRequest.status === LAB_REQUEST_STATUSES.DELETED;

  return (
    <div>
      <SimpleTopBar title="Lab request">
        <LabRequestActionDropdown
          labRequest={labRequest}
          patient={patient}
          updateLabReq={updateLabReq}
          isReadOnly={isReadOnly}
        />
      </SimpleTopBar>
      <ContentPane>
        <LabRequestInfoPane labRequest={labRequest} isReadOnly={isReadOnly} />
      </ContentPane>
      <ContentPane>
        <ResultsPane labRequest={labRequest} patient={patient} isReadOnly={isReadOnly} />
      </ContentPane>
      <ContentPane>
        <LabRequestAuditPane labRequest={labRequest} />
      </ContentPane>
    </div>
  );
};
