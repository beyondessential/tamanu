import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import { Box, Divider } from '@material-ui/core';
import { Timelapse, Business, AssignmentLate, Category } from '@material-ui/icons';
import { LAB_REQUEST_STATUSES, LAB_REQUEST_STATUS_CONFIG } from 'shared/constants';
import { usePatientNavigation } from '../../utils/usePatientNavigation';
import { useLabRequest } from '../../contexts/LabRequest';
import {
  Heading2,
  Tile,
  TileContainer,
  MenuButton,
  DateDisplay,
  OutlinedButton,
  TileTag,
} from '../../components';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { LabRequestChangeLabModal } from './components/LabRequestChangeLabModal';
import { LabRequestNoteForm } from '../../forms/LabRequestNoteForm';
import { LabRequestChangeStatusModal } from './components/LabRequestChangeStatusModal';
import { LabRequestPrintModal } from './components/LabRequestPrintModal';
import { LabRequestCancelModal } from './components/LabRequestCancelModal';
import { LabRequestResultsTable } from './components/LabRequestResultsTable';
import { LabRequestLogModal } from './components/LabRequestLogModal';
import { LabRequestCard } from './components/LabRequestCard';
import { LabRequestChangePriorityModal } from './components/LabRequestChangePriorityModal';
import { useUrlSearchParams } from '../../utils/useUrlSearchParams';

const Container = styled.div`
  padding: 12px 30px;
`;

const Rule = styled(Divider)`
  margin: 0 0 20px 0;
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

const Menu = ({ setModal, status }) => {
  const menuActions = {
    'Print label': () => {
      setModal(MODALS.PRINT);
    },
  };

  if (status !== LAB_REQUEST_STATUSES.PUBLISHED) {
    menuActions['Cancel request'] = () => {
      setModal(MODALS.CANCEL);
    };
  }
  return <MenuButton status={status} actions={menuActions} />;
};

export const LabRequestView = () => {
  const query = useUrlSearchParams();
  const [modal, setModal] = useState(query.get('modal'));
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

  return (
    <Container>
      <Heading2 gutterBottom>Labs</Heading2>
      <LabRequestCard
        labRequest={labRequest}
        isReadOnly={isReadOnly}
        actions={
          <Box display="flex" alignItems="center">
            <OutlinedButton>Print request</OutlinedButton>
            <Menu setModal={setModal} status={labRequest.status} />
          </Box>
        }
      />
      <LabRequestNoteForm labRequestId={labRequest.id} isReadOnly={isReadOnly} />
      <TileContainer>
        <Tile Icon={Category} text="Test Category" main={(labRequest.category || {}).name} />
        <Tile
          Icon={Timelapse}
          text="Status"
          main={
            <TileTag $color={LAB_REQUEST_STATUS_CONFIG[labRequest.status]?.color}>
              {LAB_REQUEST_STATUS_CONFIG[labRequest.status]?.label || 'Unknown'}
            </TileTag>
          }
          isReadOnly={isReadOnly}
          actions={{
            'Change status': () => {
              setModal(MODALS.CHANGE_STATUS);
            },
            'View status log': () => {
              setModal(MODALS.VIEW_STATUS_LOG);
            },
          }}
        />
        <Tile text="Sample collected" main={<DateDisplay date={labRequest.requestedDate} />} />
        <Tile
          Icon={Business}
          text="Laboratory"
          main={(labRequest.laboratory || {}).name || 'Unknown'}
          isReadOnly={isReadOnly}
          actions={{
            'Change laboratory': () => {
              setModal(MODALS.CHANGE_LABORATORY);
            },
          }}
        />
        <Tile
          Icon={AssignmentLate}
          text="Priority"
          main={(labRequest.priority || {}).name || 'Unknown'}
          isReadOnly={isReadOnly}
          actions={{
            'Change priority': () => {
              setModal(MODALS.CHANGE_PRIORITY);
            },
          }}
        />
      </TileContainer>
      <Rule />
      <LabRequestResultsTable labRequest={labRequest} patient={patient} isReadOnly={isReadOnly} />
      <LabRequestChangeStatusModal
        status={labRequest.status}
        updateLabReq={updateLabReq}
        open={modal === MODALS.CHANGE_STATUS}
        onClose={closeModal}
      />
      <LabRequestPrintModal
        labRequest={labRequest}
        patient={patient}
        open={modal === MODALS.PRINT}
        onClose={closeModal}
      />
      <LabRequestChangeLabModal
        labTestLaboratoryId={labRequest.laboratory?.id}
        updateLabReq={updateLabReq}
        open={modal === MODALS.CHANGE_LABORATORY}
        onClose={closeModal}
      />
      <LabRequestCancelModal
        updateLabReq={updateLabReq}
        labRequestId={labRequest.id}
        open={modal === MODALS.CANCEL}
        onClose={closeModal}
      />
      <LabRequestLogModal
        labRequest={labRequest}
        open={modal === MODALS.VIEW_STATUS_LOG}
        onClose={closeModal}
      />
      <LabRequestChangePriorityModal
        priority={labRequest.labTestPriorityId}
        updateLabReq={updateLabReq}
        open={modal === MODALS.CHANGE_PRIORITY}
        onClose={closeModal}
      />
    </Container>
  );
};
