import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import Box from '@material-ui/core/Box';
import IconButton from '@material-ui/core/IconButton';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import { Divider } from '@material-ui/core';
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
  Heading2,
  Tile,
  CardItem,
  OutlinedButton,
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
import { labsIcon } from '../../constants/images';

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

export const OldLabRequestView = () => {
  const { isLoading, labRequest, updateLabRequest } = useLabRequest();
  const { navigateToLabRequest } = usePatientNavigation();

  const patient = useSelector(state => state.patient);

  const updateLabReq = async data => {
    await updateLabRequest(labRequest.id, data);
    navigateToLabRequest(labRequest.id);
  };

  if (isLoading) return <LoadingIndicator />;

  const isReadOnly = HIDDEN_STATUSES.includes(labRequest.status);

  return (
    <div>
      <SimpleTopBar title="Lab request 2">
        <LabRequestActionDropdown
          labRequest={labRequest}
          patient={patient}
          updateLabReq={updateLabReq}
          isReadOnly={isReadOnly}
        />
      </SimpleTopBar>
      <ContentPane>
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
          <TextInput
            value={(labRequest.priority || {}).name}
            label="Priority"
            disabled={isReadOnly}
          />
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

const Container = styled.div`
  padding: 12px 30px;
`;

const TileContainer = styled.div`
  display: flex;
  align-items: flex-start;
  margin-bottom: 12px;
  overflow: auto;
`;

const Rule = styled(Divider)`
  margin: 20px 0;
`;

const Placeholder = styled.div`
  background: white;
  border-radius: 3px;
  margin-bottom: 12px;
  padding: 30px;
`;

const LabIcon = styled.img`
  width: 22px;
  height: 22px;
  border: none;
`;

const LabContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  border-radius: 5px;
  padding: 18px;

  margin-bottom: 20px;
`;

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

  return (
    <Container>
      <Heading2 style={{ marginBottom: 20 }}>Labs</Heading2>
      <LabContainer>
        <LabIcon src={labsIcon} />
        <Box pr={3} pl={3}>
          <CardItem label="Lab test ID" value="HGU59KRC" />
          <CardItem label="Request date" value="01/01/2023" />
        </Box>
        <Divider />
        <Box pl={3} pr={3}>
          <CardItem label="Requesting clinician" value="Jane Smith" />
          <CardItem label="Department" value="Cardiology" />
        </Box>
        <Box>
          <OutlinedButton>Print request</OutlinedButton>
          <IconButton>
            <MoreVertIcon />
          </IconButton>
        </Box>
      </LabContainer>
      <Placeholder>Notes</Placeholder>
      <TileContainer>
        <Tile title="Text Category" text="FBC" />
        <Tile title="Status" text="Reception pending" />
        <Tile title="Sample collected" text="23/01/22" />
        <Tile title="Laboratory" text="Fiji CDC" />
        <Tile title="Priority" text="standard" />
      </TileContainer>
      <Rule />
      <LabRequestResultsTable labRequest={labRequest} patient={patient} isReadOnly={isReadOnly} />
    </Container>
  );
};
