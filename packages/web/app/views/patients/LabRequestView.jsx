import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import { Box } from '@material-ui/core';
import { AssignmentLate, Business, Timelapse } from '@material-ui/icons';
import { LAB_REQUEST_STATUS_CONFIG, LAB_REQUEST_STATUSES } from '@tamanu/constants';
import { useAuth } from '../../contexts/Auth';
import BeakerIcon from '../../assets/images/beaker.svg';
import TestCategoryIcon from '../../assets/images/testCategory.svg';
import { usePatientNavigation } from '../../utils/usePatientNavigation';
import { useLabRequest } from '../../contexts/LabRequest';
import {
  Button,
  DateDisplay,
  Heading2,
  MenuButton,
  MODAL_TRANSITION_DURATION,
  OutlinedButton,
  TableButtonRow,
  Tile,
  TileContainer,
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
import { LabRequestRecordSampleModal } from './components/LabRequestRecordSampleModal';
import { LabTestResultsModal } from './components/LabTestResultsModal';
import { useUrlSearchParams } from '../../utils/useUrlSearchParams';
import { LabRequestPrintLabelModal } from '../../components/PatientPrinting/modals/LabRequestPrintLabelModal';
import { LabRequestSampleDetailsModal } from './components/LabRequestSampleDetailsModal';
import { Colors } from '../../constants';
import { TranslatedText, TranslatedReferenceData } from '../../components/Translation';
import { LabAttachmentModal } from '../../components/LabAttachmentModal';
import { ConditionalTooltip } from '../../components/Tooltip';

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
  display: flex;
  flex-direction: column;
  flex: 1;
`;

const LabelContainer = styled.div`
  color: ${p => p.color || Colors.darkestText};
`;

const FixedTileRow = styled(TileContainer)`
  flex-shrink: 0;
`;

const HIDDEN_STATUSES = [
  LAB_REQUEST_STATUSES.DELETED,
  LAB_REQUEST_STATUSES.CANCELLED,
  LAB_REQUEST_STATUSES.INVALIDATED,
  LAB_REQUEST_STATUSES.ENTERED_IN_ERROR,
];

// These statuses are a little unique, as from a user's perspective they've just cancelled the request so they expect the status to be cancelled
const STATUSES_TO_DISPLAY_AS_CANCELLED = [
  LAB_REQUEST_STATUSES.DELETED,
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
  VIEW_REPORT: 'viewReport',
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
  [MODAL_IDS.VIEW_REPORT]: LabAttachmentModal,
};

const Menu = ({ setModal, status, disabled }) => {
  const menuActions = [
    {
      label: <TranslatedText
        stringId="lab.action.printLabel"
        fallback="Print label"
        data-testid='translatedtext-7v81' />,
      action: () => setModal(MODAL_IDS.LABEL_PRINT),
    },
  ];

  if (status !== LAB_REQUEST_STATUSES.PUBLISHED) {
    menuActions.push({
      label: <TranslatedText
        stringId="lab.action.cancelRequest"
        fallback="Cancel request"
        data-testid='translatedtext-m10y' />,
      action: () => setModal(MODAL_IDS.CANCEL),
    });
  }
  return (
    <MenuButton
      disabled={disabled}
      status={status}
      actions={menuActions}
      data-testid='menubutton-1dt6' />
  );
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
  const displayAsCancelled = STATUSES_TO_DISPLAY_AS_CANCELLED.includes(labRequest.status);
  const areLabRequestsReadOnly = !canWriteLabRequest || isHidden;
  const areLabTestsReadOnly = !canWriteLabTest || isHidden || isPublished;
  const hasAttachment = Boolean(labRequest.latestAttachment);
  const canEnterResults = !isPublished && !areLabTestsReadOnly;

  // If the value of status is enteredInError or deleted, it should display to the user as Cancelled
  const displayStatus = displayAsCancelled ? LAB_REQUEST_STATUSES.CANCELLED : labRequest.status;

  const ActiveModal = MODALS[modalId] || null;

  const actions =
    labRequest.status === LAB_REQUEST_STATUSES.SAMPLE_NOT_COLLECTED
      ? [
          {
            label: <TranslatedText
              stringId="lab.action.recordSample"
              fallback="Record sample"
              data-testid='translatedtext-rmgy' />,
            action: () => handleChangeModalId(MODAL_IDS.RECORD_SAMPLE),
          },
        ]
      : [
          {
            label: <TranslatedText
              stringId="general.action.edit"
              fallback="Edit"
              data-testid='translatedtext-g4yv' />,
            action: () => handleChangeModalId(MODAL_IDS.RECORD_SAMPLE),
          },
          {
            label: <TranslatedText
              stringId="lab.action.viewDetails"
              fallback="View details"
              data-testid='translatedtext-hii4' />,
            action: () => handleChangeModalId(MODAL_IDS.SAMPLE_DETAILS),
          },
        ];

  const handleChangeStatus = () => {
    if (labRequest.status === LAB_REQUEST_STATUSES.SAMPLE_NOT_COLLECTED) return;
    handleChangeModalId(MODAL_IDS.CHANGE_STATUS);
  };

  return (
    <Container>
      <TopContainer>
        <Heading2>
          <TranslatedText
            stringId="lab.view.title"
            fallback="Labs"
            data-testid='translatedtext-c7wx' />
        </Heading2>
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
                data-testid='outlinedbutton-fj4d'>
                <TranslatedText
                  stringId="lab.action.printRequest"
                  fallback="Print request"
                  data-testid='translatedtext-nxwe' />
              </OutlinedButton>
              <Menu
                setModal={handleChangeModalId}
                status={labRequest.status}
                disabled={isHidden}
                data-testid='menu-dj1u' />
            </Box>
          }
        />
        <LabRequestNoteForm labRequestId={labRequest.id} isReadOnly={areLabRequestsReadOnly} />
        <FixedTileRow>
          <Tile
            Icon={() => <img src={TestCategoryIcon} alt="test category" />}
            text={<TranslatedText
              stringId="lab.testCategory.label"
              fallback="Test Category"
              data-testid='translatedtext-tjb5' />}
            main={
              labRequest.category?.name ? (
                <TranslatedReferenceData
                  fallback={labRequest.category.name}
                  value={labRequest.category.id}
                  category="labTestCategory"
                  data-testid='translatedreferencedata-918e' />
              ) : (
                '-'
              )
            }
          />
          <Tile
            Icon={Timelapse}
            text={<TranslatedText
              stringId="lab.view.tile.status.label"
              fallback="Status"
              data-testid='translatedtext-jvfq' />}
            main={
              <TileTag $color={LAB_REQUEST_STATUS_CONFIG[displayStatus]?.color}>
                {LAB_REQUEST_STATUS_CONFIG[displayStatus]?.label || 'Unknown'}
              </TileTag>
            }
            actions={[
              !areLabRequestsReadOnly &&
                canWriteLabRequestStatus && {
                  label: (
                    <ConditionalTooltip
                      visible={labRequest.status === LAB_REQUEST_STATUSES.SAMPLE_NOT_COLLECTED}
                      title={
                        <TranslatedText
                          stringId="lab.tooltip.cannotChangeStatus"
                          fallback="You cannot change the status of lab request without entering the sample details"
                          data-testid='translatedtext-kd8y' />
                      }
                    >
                      <LabelContainer
                        color={
                          labRequest.status === LAB_REQUEST_STATUSES.SAMPLE_NOT_COLLECTED &&
                          Colors.softText
                        }
                      >
                        <TranslatedText
                          stringId="lab.action.changeStatus"
                          fallback="Change status"
                          data-testid='translatedtext-p6hb' />
                      </LabelContainer>
                    </ConditionalTooltip>
                  ),
                  action: handleChangeStatus,
                },
              {
                label: (
                  <TranslatedText
                    stringId="lab.action.viewStatusLog"
                    fallback="View status log"
                    data-testid='translatedtext-c1st' />
                ),
                action: () => handleChangeModalId(MODAL_IDS.VIEW_STATUS_LOG),
              },
            ]}
          />
          <Tile
            Icon={() => <img src={BeakerIcon} alt="beaker" />}
            text={
              <TranslatedText
                stringId="lab.view.tile.sampleTime.label"
                fallback="Sample collected"
                data-testid='translatedtext-7lev' />
            }
            isReadOnly={areLabRequestsReadOnly}
            main={
              <>
                <DateDisplay
                  color={labRequest.sampleTime ? 'unset' : Colors.softText}
                  date={labRequest.sampleTime}
                  showTime
                  data-testid='datedisplay-e16d' />
              </>
            }
            actions={actions}
          />
          <Tile
            Icon={Business}
            text={<TranslatedText
              stringId="lab.laboratory.label"
              fallback="Laboratory"
              data-testid='translatedtext-g2pf' />}
            main={
              labRequest.laboratory?.name ? (
                <TranslatedReferenceData
                  fallback={labRequest.laboratory.name}
                  value={labRequest.laboratory.id}
                  category="labTestLaboratory"
                  data-testid='translatedreferencedata-bg0m' />
              ) : (
                '-'
              )
            }
            isReadOnly={areLabRequestsReadOnly}
            actions={[
              {
                label: (
                  <TranslatedText
                    stringId="lab.action.changeLaboratory"
                    fallback="Change laboratory"
                    data-testid='translatedtext-xaax' />
                ),
                action: () => handleChangeModalId(MODAL_IDS.CHANGE_LABORATORY),
              },
            ]}
          />
          <Tile
            Icon={AssignmentLate}
            text={<TranslatedText
              stringId="lab.view.tile.priority.label"
              fallback="Priority"
              data-testid='translatedtext-f0c3' />}
            main={
              labRequest.priority?.name ? (
                <TranslatedReferenceData
                  fallback={labRequest.priority.name}
                  value={labRequest.priority.id}
                  category="labTestPriority"
                  data-testid='translatedreferencedata-4gdp' />
              ) : (
                '-'
              )
            }
            isReadOnly={areLabRequestsReadOnly}
            actions={[
              {
                label: (
                  <TranslatedText
                    stringId="lab.action.changePriority"
                    fallback="Change priority"
                    data-testid='translatedtext-9os3' />
                ),
                action: () => handleChangeModalId(MODAL_IDS.CHANGE_PRIORITY),
              },
            ]}
          />
        </FixedTileRow>
      </TopContainer>
      <BottomContainer>
        <TableButtonRow variant="small">
          {hasAttachment && (
            <Button
              onClick={() => handleChangeModalId(MODAL_IDS.VIEW_REPORT)}
              data-testid='button-8bww'>
              <TranslatedText
                stringId="lab.action.viewReport"
                fallback="View report"
                data-testid='translatedtext-y5rn' />
            </Button>
          )}
          {canEnterResults && (
            <Button
              onClick={() => handleChangeModalId(MODAL_IDS.ENTER_RESULTS)}
              data-testid='button-feto'>
              <TranslatedText
                stringId="lab.action.enterResults"
                fallback="Enter results"
                data-testid='translatedtext-n1k8' />
            </Button>
          )}
        </TableButtonRow>
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
