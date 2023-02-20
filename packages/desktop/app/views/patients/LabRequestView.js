import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import Box from '@material-ui/core/Box';
import { Divider } from '@material-ui/core';
import { LAB_REQUEST_STATUSES, LAB_REQUEST_STATUS_CONFIG } from 'shared/constants';
import { usePatientNavigation } from '../../utils/usePatientNavigation';
import { useLabRequest } from '../../contexts/LabRequest';
import {
  Heading2,
  Tile,
  CardItem,
  OutlinedButton,
  MenuButton,
  DateDisplay,
} from '../../components';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { LabRequestChangeLabModal } from './components/LabRequestChangeLabModal';
import { LabRequestNoteForm } from '../../forms/LabRequestNoteForm';
import { LabRequestChangeStatusModal } from './components/LabRequestChangeStatusModal';
import { LabRequestPrintModal } from './components/LabRequestPrintModal';
import { LabRequestCancelModal } from './components/LabRequestCancelModal';
import { LabRequestResultsTable } from './components/LabRequestResultsTable';
import { LabRequestLogModal } from './components/LabRequestLogModal';
import { labsIcon } from '../../constants/images';

const Container = styled.div`
  padding: 12px 30px;
`;

const TileContainer = styled.div`
  display: flex;
  align-items: stretch;
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

const HIDDEN_STATUSES = [
  LAB_REQUEST_STATUSES.DELETED,
  LAB_REQUEST_STATUSES.CANCELLED,
  LAB_REQUEST_STATUSES.ENTERED_IN_ERROR,
];

const MODALS = {
  CHANGE_STATUS: 'changeStatus',
  VIEW_STATUS_LOG: 'viewStatusLog',
  RECORD_SAMPLE: 'recordSample',
  PRINT: 'print',
  CHANGE_LABORATORY: 'changeLaboratory',
  CHANGE_PRIORITY: 'changePriority',
  CANCEL: 'cancel',
};

export const LabRequestView = () => {
  // Todo: make print modal work with params
  const [modal, setModal] = useState(null);
  const { isLoading, labRequest, updateLabRequest } = useLabRequest();
  const { navigateToLabRequest } = usePatientNavigation();

  const closeModal = () => {
    setModal(null);
  };

  const patient = useSelector(state => state.patient);

  const updateLabReq = async data => {
    await updateLabRequest(labRequest.id, data);
    navigateToLabRequest(labRequest.id);
  };

  if (isLoading) return <LoadingIndicator />;

  const isReadOnly = HIDDEN_STATUSES.includes(labRequest.status);
  const menuActions = [
    {
      label: 'Print label',
      onClick: () => {
        setModal(MODALS.PRINT);
      },
    },
  ];

  if (status !== LAB_REQUEST_STATUSES.PUBLISHED) {
    menuActions.push({
      label: 'Cancel request',
      onClick: () => {
        setModal(MODALS.CANCEL);
      },
    });
  }

  return (
    <Container>
      <Heading2 style={{ marginBottom: 20 }}>Labs</Heading2>
      <LabContainer>
        <LabIcon src={labsIcon} />
        <Box pr={3} pl={3}>
          <CardItem label="Lab test ID" value={labRequest.displayId} />
          <CardItem label="Request date" value={<DateDisplay date={labRequest.requestedDate} />} />
        </Box>
        <Divider />
        <Box pl={3} pr={3}>
          <CardItem label="Requesting clinician" value="Jane Smith" />
          <CardItem label="Department" value="Cardiology" />
        </Box>
        {!isReadOnly && (
          <Box>
            <OutlinedButton>Print request</OutlinedButton>
            <MenuButton isReadOnly={isReadOnly} status={status} actions={menuActions} />
          </Box>
        )}
      </LabContainer>
      <Placeholder>
        <LabRequestNoteForm labRequest={labRequest} isReadOnly={isReadOnly} />
      </Placeholder>
      <TileContainer>
        <Tile title="Test Category" text={(labRequest.category || {}).name} />
        <Tile
          title="Status"
          text={LAB_REQUEST_STATUS_CONFIG[labRequest.status]?.label || 'Unknown'}
          actions={
            !isReadOnly && [
              {
                label: 'Change status',
                onClick: () => {
                  setModal(MODALS.CHANGE_STATUS);
                },
              },
              {
                label: 'View status log',
                onClick: () => {
                  setModal(MODALS.VIEW_STATUS_LOG);
                },
              },
            ]
          }
        />
        <Tile title="Sample collected" text={<DateDisplay date={labRequest.requestedDate} />} />
        <Tile
          title="Laboratory"
          text={(labRequest.laboratory || {}).name || 'Unknown'}
          actions={
            !isReadOnly && [
              {
                label: 'Change laboratory',
                onClick: () => {
                  setModal(MODALS.CHANGE_LABORATORY);
                },
              },
            ]
          }
        />
        <Tile title="Priority" text={(labRequest.priority || {}).name || 'Unknown'} />
      </TileContainer>
      <Rule />
      <LabRequestResultsTable labRequest={labRequest} patient={patient} isReadOnly={isReadOnly} />
      <LabRequestChangeStatusModal
        status={status}
        updateLabReq={updateLabReq}
        open={modal === MODALS.CHANGE_STATUS}
        onClose={() => closeModal()}
      />
      <LabRequestPrintModal
        labRequest={labRequest}
        patient={patient}
        open={modal === MODALS.PRINT}
        onClose={() => closeModal()}
      />
      <LabRequestChangeLabModal
        laboratory={labRequest.laboratory}
        updateLabReq={updateLabReq}
        open={modal === MODALS.CHANGE_LABORATORY}
        onClose={() => closeModal()}
      />
      <LabRequestCancelModal
        updateLabReq={updateLabReq}
        labRequestId={labRequest.id}
        open={modal === MODALS.CANCEL}
        onClose={() => closeModal()}
      />
      <LabRequestLogModal
        labRequest={labRequest}
        open={modal === MODALS.VIEW_STATUS_LOG}
        onClose={() => closeModal()}
      />
    </Container>
  );
};
