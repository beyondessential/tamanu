import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import { Box, Divider } from '@material-ui/core';
import { Timelapse, Business, AssignmentLate } from '@material-ui/icons';
import { LAB_REQUEST_STATUSES, LAB_REQUEST_STATUS_CONFIG } from 'shared/constants';
import BeakerIcon from '../../assets/images/beaker.svg';
import TestCategoryIcon from '../../assets/images/testCategory.svg';
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
  SmallBodyText,
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
import { LabRequestRecordSampleModal } from './components/LabRequestRecordSampleModal';
import { useUrlSearchParams } from '../../utils/useUrlSearchParams';
import { LabRequestPrintLabelModal } from '../../components/PatientPrinting/modals/LabRequestPrintLabelModal';

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

const MODAL_IDS = {
  CHANGE_STATUS: 'changeStatus',
  VIEW_STATUS_LOG: 'viewStatusLog',
  RECORD_SAMPLE: 'recordSample',
  PRINT: 'print',
  LABEL_PRINT: 'labelPrint',
  CHANGE_LABORATORY: 'changeLaboratory',
  CHANGE_PRIORITY: 'changePriority',
  CANCEL: 'cancel',
};

const MODALS = {
  [MODAL_IDS.CHANGE_STATUS]: LabRequestChangeStatusModal,
  [MODAL_IDS.VIEW_STATUS_LOG]: LabRequestLogModal,
  [MODAL_IDS.RECORD_SAMPLE]: LabRequestRecordSampleModal,
  [MODAL_IDS.PRINT]: LabRequestPrintModal,
  [MODAL_IDS.LABEL_PRINT]: ({ labRequest, ...props }) => (
    <LabRequestPrintLabelModal {...props} labRequests={[labRequest]} />
  ),
  [MODAL_IDS.CHANGE_LABORATORY]: LabRequestChangeLabModal,
  [MODAL_IDS.CHANGE_PRIORITY]: LabRequestChangePriorityModal,
  [MODAL_IDS.CANCEL]: LabRequestCancelModal,
};

const Menu = ({ setModal, status }) => {
  const menuActions = {
    'Print label': () => {
      setModal(MODALS.LABEL_PRINT);
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
  const [modalId, setModalId] = useState(query.get('modal'));
  const [modalOpen, setModalOpen] = useState(false);
  const { isLoading, labRequest, updateLabRequest } = useLabRequest();
  const { navigateToLabRequest } = usePatientNavigation();

  const closeModal = () => {
    setModalOpen(false);
    // Wait for close animation to finish
    setTimeout(() => {
      setModalId(null);
    }, 300);
  };

  const patient = useSelector(state => state.patient);

  const updateLabReq = async data => {
    await updateLabRequest(labRequest.id, data);
    navigateToLabRequest(labRequest.id);
  };

  const handleChangeModal = id => {
    setModalId(id);
    setModalOpen(true);
  };

  if (isLoading) return <LoadingIndicator />;

  const isReadOnly = HIDDEN_STATUSES.includes(labRequest.status);
  // If the value of status is enteredInError or deleted, it should display to the user as Cancelled
  const displayStatus = isReadOnly ? LAB_REQUEST_STATUSES.CANCELLED : labRequest.status;

  const ActiveModal = MODALS[modalId] || null;

  return (
    <Container>
      <Heading2 gutterBottom>Labs</Heading2>
      <LabRequestCard
        labRequest={labRequest}
        isReadOnly={isReadOnly}
        actions={
          <Box display="flex" alignItems="center">
            <OutlinedButton
              onClick={() => {
                handleChangeModal(MODAL_IDS.PRINT);
              }}
            >
              Print request
            </OutlinedButton>
            <Menu setModal={handleChangeModal} status={labRequest.status} />
          </Box>
        }
      />
      <LabRequestNoteForm labRequestId={labRequest.id} isReadOnly={isReadOnly} />
      <TileContainer>
        <Tile
          Icon={() => <img src={TestCategoryIcon} alt="test category" />}
          text="Test Category"
          main={labRequest.category?.name}
        />
        <Tile
          Icon={Timelapse}
          text="Status"
          main={
            <TileTag $color={LAB_REQUEST_STATUS_CONFIG[labRequest.status]?.color}>
              {LAB_REQUEST_STATUS_CONFIG[displayStatus]?.label || 'Unknown'}
            </TileTag>
          }
          isReadOnly={isReadOnly}
          actions={{
            'Change status': () => {
              handleChangeModal(MODAL_IDS.CHANGE_STATUS);
            },
            'View status log': () => {
              handleChangeModal(MODAL_IDS.VIEW_STATUS_LOG);
            },
          }}
        />
        <Tile
          Icon={() => <img src={BeakerIcon} alt="beaker" />}
          text="Sample collected"
          main={
            <>
              <DateDisplay date={labRequest.sampleTime} showTime />
              <Box display="flex" alignItem="center">
                <SmallBodyText style={{ marginRight: 3 }} color="textTertiary">
                  Site:
                </SmallBodyText>
                <SmallBodyText>{labRequest?.site?.name || '-'}</SmallBodyText>
              </Box>
            </>
          }
          actions={{
            [labRequest.status === LAB_REQUEST_STATUSES.SAMPLE_NOT_COLLECTED
              ? 'Record sample'
              : 'Edit']: () => {
              handleChangeModal(MODAL_IDS.RECORD_SAMPLE);
            },
          }}
        />
        <Tile
          Icon={Business}
          text="Laboratory"
          main={(labRequest.laboratory || {}).name || 'Unknown'}
          isReadOnly={isReadOnly}
          actions={{
            'Change laboratory': () => {
              handleChangeModal(MODAL_IDS.CHANGE_LABORATORY);
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
              handleChangeModal(MODAL_IDS.CHANGE_PRIORITY);
            },
          }}
        />
      </TileContainer>
      <Rule />

      <LabRequestResultsTable labRequest={labRequest} patient={patient} isReadOnly={isReadOnly} />
      {modalId && (
        <ActiveModal
          labRequest={labRequest}
          patient={patient}
          updateLabReq={updateLabReq}
          open={modalOpen}
          onClose={closeModal}
        />
      )}
    </Container>
  );
};
