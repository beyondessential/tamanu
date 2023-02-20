import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import { Divider, Box } from '@material-ui/core';
import { Timelapse, Business, AssignmentLate, Category } from '@material-ui/icons';
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
import { Colors } from '../../constants';

const Container = styled.div`
  padding: 12px 30px;
`;

const TileContainer = styled.div`
  display: flex;
  align-items: stretch;
  overflow: auto;
  padding-bottom: 20px;

  > div {
    flex: 1;
    min-width: 140px;
    margin: 0 8px;

    &:last-child {
      margin-right: 0;
    }

    &:first-child {
      margin-left: 0;
    }
  }
`;

const Rule = styled(Divider)`
  margin: 0 0 20px 0;
`;

const LabIcon = styled.img`
  width: 22px;
  height: 22px;
  border: none;
`;

const CardContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  border-radius: 5px;
  padding: 18px;
  margin-bottom: 15px;
`;

const BorderSection = styled.div`
  padding: 0 10px;
  border-left: 1px solid ${Colors.outline};
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

const TestCategoryTile = ({ labRequest }) => (
  <Tile title="Test Category" Icon={Category} text={(labRequest.category || {}).name} />
);

const SampleCollectedTile = ({ labRequest }) => (
  <Tile title="Sample collected" text={<DateDisplay date={labRequest.requestedDate} />} />
);

const LabTile = ({ labRequest, setModal }) => (
  <Tile
    title="Laboratory"
    Icon={Business}
    text={(labRequest.laboratory || {}).name || 'Unknown'}
    actions={[
      {
        label: 'Change laboratory',
        onClick: () => {
          setModal(MODALS.CHANGE_LABORATORY);
        },
      },
    ]}
  />
);

const StatusTile = ({ labRequest, setModal }) => (
  <Tile
    title="Status"
    Icon={Timelapse}
    text={LAB_REQUEST_STATUS_CONFIG[labRequest.status]?.label || 'Unknown'}
    actions={[
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
    ]}
  />
);

const PriorityTile = ({ labRequest }) => (
  <Tile
    title="Priority"
    Icon={AssignmentLate}
    text={(labRequest.priority || {}).name || 'Unknown'}
  />
);

const Menu = ({ setModal, status }) => {
  const menuActions = [
    {
      label: 'Print label',
      onClick: () => {
        setModal(MODALS.PRINT);
      },
    },
  ];

  if (status !== LAB_REQUEST_STATUSES.PUBLISHED) {
    menuActions.unshift({
      label: 'Cancel request',
      onClick: () => {
        setModal(MODALS.CANCEL);
      },
    });
  }
  return <MenuButton status={status} actions={menuActions} />;
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

  return (
    <Container>
      <Heading2 gutterBottom>Labs</Heading2>
      <CardContainer>
        <LabIcon src={labsIcon} />
        <Box pr={3} pl={3}>
          <CardItem label="Lab test ID" value={labRequest.displayId} />
          <CardItem label="Request date" value={<DateDisplay date={labRequest.requestedDate} />} />
        </Box>
        <BorderSection>
          <CardItem label="Requesting clinician" value="Jane Smith" />
          <CardItem label="Department" value="Cardiology" />
        </BorderSection>
        {!isReadOnly && (
          <Box display="flex" alignItems="center">
            <OutlinedButton>Print request</OutlinedButton>
            <Menu isReadOnly={isReadOnly} />
          </Box>
        )}
      </CardContainer>
      <LabRequestNoteForm labRequest={labRequest} isReadOnly={isReadOnly} />
      <TileContainer>
        <TestCategoryTile labRequest={labRequest} />
        <StatusTile labRequest={labRequest} isReadOnly={isReadOnly} setModal={setModal} />
        <SampleCollectedTile labRequest={labRequest} />
        <LabTile labRequest={labRequest} isReadOnly={isReadOnly} setModal={setModal} />
        <PriorityTile labRequest={labRequest} isReadOnly={isReadOnly} setModal={setModal} />
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
