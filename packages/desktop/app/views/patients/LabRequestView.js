import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import { Box } from '@material-ui/core';
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
  MODAL_TRANSITION_DURATION,
  Button,
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
import { LabTestResultsModal } from './components/LabTestResultsModal';
import { useUrlSearchParams } from '../../utils/useUrlSearchParams';
import { LabRequestPrintLabelModal } from '../../components/PatientPrinting/modals/LabRequestPrintLabelModal';
import { LabRequestSampleDetailsModal } from './components/LabRequestSampleDetailsModal';
import { Colors } from '../../constants';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: calc(100vh - 58px);
  flex: 1;
`;

const TopContainer = styled.div`
  padding: 18px 30px;
  background-color: ${Colors.background};
`;

const BottomContainer = styled.div`
  background-color: ${Colors.white};
  padding: 18px 30px;
  flex: 1;
`;

const FixedTileRow = styled(TileContainer)`
  flex-shrink: 0;
`;

const HIDDEN_STATUSES = [
  LAB_REQUEST_STATUSES.DELETED,
  LAB_REQUEST_STATUSES.CANCELLED,
  LAB_REQUEST_STATUSES.ENTERED_IN_ERROR,
];

const MODAL_IDS = {
  CANCEL: 'cancel',
  CHANGE_LABORATORY: 'changeLaboratory',
  CHANGE_PRIORITY: 'changePriority',
  CHANGE_STATUS: 'changeStatus',
  ENTER_RESULTS: 'enterResults',
  LABEL_PRINT: 'labelPrint',
  PRINT: 'print',
  RECORD_SAMPLE: 'recordSample',
  SAMPLE_DETAILS: 'sampleDetails',
  VIEW_STATUS_LOG: 'viewStatusLog',
};

const MODALS = {
  [MODAL_IDS.CANCEL]: LabRequestCancelModal,
  [MODAL_IDS.CHANGE_LABORATORY]: LabRequestChangeLabModal,
  [MODAL_IDS.CHANGE_PRIORITY]: LabRequestChangePriorityModal,
  [MODAL_IDS.CHANGE_STATUS]: LabRequestChangeStatusModal,
  [MODAL_IDS.ENTER_RESULTS]: LabTestResultsModal,
  [MODAL_IDS.LABEL_PRINT]: ({ labRequest, ...props }) => (
    <LabRequestPrintLabelModal {...props} labRequests={[labRequest]} />
  ),
  [MODAL_IDS.PRINT]: LabRequestPrintModal,
  [MODAL_IDS.RECORD_SAMPLE]: LabRequestRecordSampleModal,
  [MODAL_IDS.SAMPLE_DETAILS]: LabRequestSampleDetailsModal,
  [MODAL_IDS.VIEW_STATUS_LOG]: LabRequestLogModal,
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
  const [labTestTableRefreshCount, setLabTestTableRefreshCount] = useState(0);
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

  const handleRefreshLabTestTable = () => {
    setLabTestTableRefreshCount(oldVal => oldVal + 1);
  };

  const updateLabReq = async data => {
    await updateLabRequest(labRequest.id, data);
    navigateToLabRequest(labRequest.id);
  };

  const handleChangeModalId = id => {
    setModalId(id);
    setModalOpen(true);
  };

  if (isLoading) return <LoadingIndicator />;

  const canWriteLabRequest = ability?.can('write', 'LabRequest');
  const canWriteLabRequestStatus = ability?.can('write', 'LabRequestStatus');
  const canWriteLabTest = ability?.can('write', 'LabTest');

  const isPublished = labRequest.status === LAB_REQUEST_STATUSES.PUBLISHED;
  const isHidden = HIDDEN_STATUSES.includes(labRequest.status);
  const areLabRequestsReadOnly = !canWriteLabRequest || isHidden;
  const areLabTestsReadOnly = !canWriteLabTest || isHidden;

  // If the value of status is enteredInError or deleted, it should display to the user as Cancelled
  const displayStatus = areLabRequestsReadOnly ? LAB_REQUEST_STATUSES.CANCELLED : labRequest.status;

  const ActiveModal = MODALS[modalId] || null;
  const actions =
    labRequest.status === LAB_REQUEST_STATUSES.SAMPLE_NOT_COLLECTED
      ? { 'Record sample': () => handleChangeModalId(MODAL_IDS.RECORD_SAMPLE) }
      : {
          Edit: () => handleChangeModalId(MODAL_IDS.RECORD_SAMPLE),
          'View Details': () => handleChangeModalId(MODAL_IDS.SAMPLE_DETAILS),
        };

  return (
    <Container>
      <TopContainer>
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
              ...(!areLabRequestsReadOnly &&
                canWriteLabRequestStatus && {
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
                <DateDisplay
                  color={labRequest.sampleTime ? 'unset' : Colors.softText}
                  date={labRequest.sampleTime}
                  showTime
                />
              </>
            }
            actions={actions}
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
      </TopContainer>
      <BottomContainer>
        {!isPublished && !areLabTestsReadOnly && (
          <Box display="flex" justifyContent="flex-end" marginBottom="20px">
            <Button onClick={() => handleChangeModalId(MODAL_IDS.ENTER_RESULTS)}>
              Enter results
            </Button>
          </Box>
        )}
        <LabRequestResultsTable
          labRequest={labRequest}
          patient={patient}
          refreshCount={labTestTableRefreshCount}
        />
      </BottomContainer>
      {modalId && (
        <ActiveModal
          labRequest={labRequest}
          patient={patient}
          updateLabReq={updateLabReq}
          refreshLabTestTable={handleRefreshLabTestTable}
          open={modalOpen}
          onClose={closeModal}
        />
      )}
    </Container>
  );
};
