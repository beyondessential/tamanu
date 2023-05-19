import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { LAB_REQUEST_STATUSES, LAB_REQUEST_STATUS_CONFIG } from 'shared/constants';
import { usePatientNavigation } from '../../utils/usePatientNavigation';
import { useLabRequest } from '../../contexts/LabRequest';
import {
  DateInput,
  TextInput,
  DateTimeInput,
  SimpleTopBar,
  ContentPane,
  FormGrid,
} from '../../components';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { LabRequestChangeLabModal } from './components/LabRequestChangeLabModal';
import { DropdownButton } from '../../components/DropdownButton';
import { LabRequestNoteForm } from '../../forms/LabRequestNoteForm';
import { LabRequestAuditPane } from '../../components/LabRequestAuditPane';
import { LabRequestChangeStatusModal } from './components/LabRequestChangeStatusModal';
import { LabRequestPrintModal } from './components/LabRequestPrintModal';
import { LabRequestCancelModal } from './components/LabRequestCancelModal';
import { LabRequestResultsTable } from './components/LabRequestResultsTable';

const HIDDEN_STATUSES = [
  LAB_REQUEST_STATUSES.DELETED,
  LAB_REQUEST_STATUSES.CANCELLED,
  LAB_REQUEST_STATUSES.ENTERED_IN_ERROR,
];

const LabRequestActionDropdown = ({ labRequest, patient, updateLabReq }) => {
  const { modal } = useParams();
  const [statusModalOpen, setStatusModalOpen] = useState(modal === 'status');
  const [printModalOpen, setPrintModalOpen] = useState(modal === 'print');
  const [labModalOpen, setLabModalOpen] = useState(modal === 'laboratory');
  const [cancelModalOpen, setCancelModalOpen] = useState(modal === 'cancel');

  const { id: labRequestId, status } = labRequest;

  const actions = [
    { label: 'Change status', onClick: () => setStatusModalOpen(true) },
    { label: 'Print lab request', onClick: () => setPrintModalOpen(true) },
    { label: 'Change laboratory', onClick: () => setLabModalOpen(true) },
  ];

  if (status !== LAB_REQUEST_STATUSES.PUBLISHED) {
    actions.push({ label: 'Cancel request', onClick: () => setCancelModalOpen(true) });
  }

  // Hide all actions if the lab request is cancelled, deleted or entered-in-error
  const hideActions = HIDDEN_STATUSES.includes(status);

  return (
    <>
      <LabRequestChangeStatusModal
        status={status}
        updateLabReq={updateLabReq}
        open={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
      />
      <LabRequestPrintModal
        labRequest={labRequest}
        patient={patient}
        open={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
      />
      <LabRequestChangeLabModal
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

export const LabRequestView = () => {
  const { isLoading, labRequest, updateLabRequest } = useLabRequest();
  const { navigateToLabRequest } = usePatientNavigation();

  const patient = useSelector(state => state.patient);

  const updateLabReq = async data => {
    await updateLabRequest(labRequest.id, data);
    navigateToLabRequest(labRequest.id);
  };

  if (isLoading) return <LoadingIndicator />;

  const isReadOnly = HIDDEN_STATUSES.includes(labRequest.status);
  // If the value of status is enteredInError or deleted, it should display to the user as Cancelled
  const displayStatus = isReadOnly ? LAB_REQUEST_STATUSES.CANCELLED : labRequest.status;

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
        <FormGrid columns={3}>
          <TextInput value={labRequest.displayId} label="Test ID" disabled={isReadOnly} />
          <TextInput
            value={(labRequest.category || {}).name}
            label="Test category"
            disabled={isReadOnly}
          />
          <TextInput
            value={labRequest.urgent ? 'Urgent' : 'Standard'}
            label="Urgency"
            disabled={isReadOnly}
          />
          <TextInput
            value={(labRequest.priority || {}).name}
            label="Priority"
            disabled={isReadOnly}
          />
          <TextInput
            value={LAB_REQUEST_STATUS_CONFIG[displayStatus]?.label || 'Unknown'}
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
      </ContentPane>
      <ContentPane>
        <LabRequestResultsTable labRequest={labRequest} patient={patient} isReadOnly={isReadOnly} />
      </ContentPane>
      <ContentPane>
        <LabRequestAuditPane labRequest={labRequest} />
      </ContentPane>
    </div>
  );
};
