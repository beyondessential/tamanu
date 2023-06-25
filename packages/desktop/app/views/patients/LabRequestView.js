import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import { Box, Divider } from '@material-ui/core';
import { Timelapse, Business, AssignmentLate } from '@material-ui/icons';
import { LAB_REQUEST_STATUSES, LAB_REQUEST_STATUS_CONFIG } from '@tamanu/shared/constants';
import { useAuth } from '../../contexts/Auth';
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
  MODAL_TRANSITION_DURATION,
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
  display: flex;
  flex-direction: column;
  height: calc(100vh - 50px);
`;

const Rule = styled(Divider)`
  margin: 0 0 20px 0;
`;

const FixedTileRow = styled(TileContainer)`
  min-height: 138px;
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

const Menu = ({ setModal, status, disabled }) => {
  const menuActions = {
    'Print label': () => {
      setModal(MODAL_IDS.LABEL_PRINT);
    },
  };

  if (status !== LAB_REQUEST_STATUSES.PUBLISHED) {
    menuActions['Cancel request'] = () => {
      setModal(MODAL_IDS.CANCEL);
    };
  }
  return <MenuButton disabled={disabled} status={status} actions={menuActions} />;
};

export const LabRequestView = () => {
  const query = useUrlSearchParams();
  const { ability } = useAuth();
  const [modalId, setModalId] = useState(query.get('modal'));
  const [modalOpen, setModalOpen] = useState(false);
  const { isLoading, labRequest, updateLabRequest } = useLabRequest();
  const { navigateToLabRequest } = usePatientNavigation();

  const closeModal = () => {
    setModalOpen(false);
    /**
     * Wait for close animation to finish this is somewhat of a hack to
     * get around the issue of the modal contents mounting vanishing before
     * the closing animation is complete.
     * @see NASS-745 https://linear.app/bes/issue/NASS-745/contents-of-modals-mount-in-a-weird-way-that-is-causing-issues
     */
    setTimeout(() => {
      setModalId(null);
    }, MODAL_TRANSITION_DURATION);
  };

  const patient = useSelector(state => state.patient);

  const updateLabReq = async data => {
    await updateLabRequest(labRequest.id, data);
    navigateToLabRequest(labRequest.id);
  };

  const handleChangeModalId = id => {
    setModalId(id);
    setModalOpen(true);
  };

  if (isLoading) return <LoadingIndicator />;

  const canWriteLabRequest = ability.can('write', 'LabRequest');
  const canWriteLabTest = ability.can('write', 'LabTest');

  const isHidden = HIDDEN_STATUSES.includes(labRequest.status);
  const areLabRequestsReadOnly = !canWriteLabRequest || isHidden;
  const areLabTestsReadOnly = !canWriteLabTest || isHidden;
  // If the value of status is enteredInError or deleted, it should display to the user as Cancelled
  const displayStatus = areLabRequestsReadOnly ? LAB_REQUEST_STATUSES.CANCELLED : labRequest.status;

  const ActiveModal = MODALS[modalId] || null;

  return (
    // TODO: Likely need to wrap this effect in a flex so that the table expands properly
    <Container>
      <Heading2 gutterBottom>Labs</Heading2>
      <LabRequestCard
        labRequest={labRequest}
        isReadOnly={areLabRequestsReadOnly}
        actions={
          <Box display="flex" alignItems="center">
            <OutlinedButton
              disabled={isHidden}
              onClick={() => {
                handleChangeModalId(MODAL_IDS.PRINT);
              }}
            >
              Print request
            </OutlinedButton>
            <Menu setModal={handleChangeModalId} status={labRequest.status} disabled={isHidden} />
          </Box>
        }
      />
      <LabRequestNoteForm labRequestId={labRequest.id} isReadOnly={areLabRequestsReadOnly} />
      <FixedTileRow>
        <Tile
          Icon={() => <img src={TestCategoryIcon} alt="test category" />}
          text="Test Category"
          main={labRequest.category?.name || '-'}
        />
        <Tile
          Icon={Timelapse}
          text="Status"
          main={
            <TileTag $color={LAB_REQUEST_STATUS_CONFIG[labRequest.status]?.color}>
              {LAB_REQUEST_STATUS_CONFIG[displayStatus]?.label || 'Unknown'}
            </TileTag>
          }
          actions={{
            ...(!areLabRequestsReadOnly && {
              'Change status': () => {
                handleChangeModalId(MODAL_IDS.CHANGE_STATUS);
              },
            }),
            'View status log': () => {
              handleChangeModalId(MODAL_IDS.VIEW_STATUS_LOG);
            },
          }}
        />
        <Tile
          Icon={() => <img src={BeakerIcon} alt="beaker" />}
          text="Sample collected"
          isReadOnly={areLabRequestsReadOnly}
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
              handleChangeModalId(MODAL_IDS.RECORD_SAMPLE);
            },
          }}
        />
        <Tile
          Icon={Business}
          text="Laboratory"
          main={labRequest.laboratory?.name || '-'}
          isReadOnly={areLabRequestsReadOnly}
          actions={{
            'Change laboratory': () => {
              handleChangeModalId(MODAL_IDS.CHANGE_LABORATORY);
            },
          }}
        />
        <Tile
          Icon={AssignmentLate}
          text="Priority"
          main={labRequest.priority?.name || '-'}
          isReadOnly={areLabRequestsReadOnly}
          actions={{
            'Change priority': () => {
              handleChangeModalId(MODAL_IDS.CHANGE_PRIORITY);
            },
          }}
        />
      </FixedTileRow>
      <Rule />

      <LabRequestResultsTable
        labRequest={labRequest}
        patient={patient}
        isReadOnly={areLabTestsReadOnly}
      />
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
