import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import { Box } from '@material-ui/core';
import { AssignmentLate, Business, Timelapse } from '@material-ui/icons';
import {
  LAB_REQUEST_STATUS_CONFIG,
  LAB_REQUEST_STATUS_LABELS,
  LAB_REQUEST_STATUSES,
} from '@tamanu/constants';
import {
  OutlinedButton,
  Button,
  MODAL_TRANSITION_DURATION,
  TranslatedText,
  TranslatedReferenceData,
  TranslatedEnum,
} from '@tamanu/ui-components';
import { useAuth } from '../../contexts/Auth';
import BeakerIcon from '../../assets/images/beaker.svg';
import TestCategoryIcon from '../../assets/images/testCategory.svg';
import { useLabRequest } from '../../contexts/LabRequest';
import {
  DateDisplay,
  Heading2,
  MenuButton,
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
import { LabResultsPrintoutModal } from '../../components/PatientPrinting/modals/LabResultsPrintoutModal';
import { LabRequestSampleDetailsModal } from './components/LabRequestSampleDetailsModal';
import { LabAttachmentModal } from '../../components/LabAttachmentModal';
import { ConditionalTooltip } from '../../components/Tooltip';
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

const INTERIM_STATUSES = [
  LAB_REQUEST_STATUSES.RECEPTION_PENDING,
  LAB_REQUEST_STATUSES.RESULTS_PENDING,
  LAB_REQUEST_STATUSES.INTERIM_RESULTS,
  LAB_REQUEST_STATUSES.TO_BE_VERIFIED,
];

const MODAL_IDS = {
  CANCEL: 'cancel',
  CHANGE_LABORATORY: 'changeLaboratory',
  CHANGE_PRIORITY: 'changePriority',
  CHANGE_STATUS: 'changeStatus',
  ENTER_RESULTS: 'enterResults',
  LABEL_PRINT: 'labelPrint',
  PRINT: 'print',
  RESULTS_PRINT: 'resultsPrint',
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
    <LabRequestPrintLabelModal
      {...props}
      labRequests={[labRequest]}
      data-testid="labrequestprintlabelmodal-cdyn"
    />
  ),
  [MODAL_IDS.PRINT]: LabRequestPrintModal,
  [MODAL_IDS.RESULTS_PRINT]: LabResultsPrintoutModal,
  [MODAL_IDS.RECORD_SAMPLE]: LabRequestRecordSampleModal,
  [MODAL_IDS.SAMPLE_DETAILS]: LabRequestSampleDetailsModal,
  [MODAL_IDS.VIEW_STATUS_LOG]: LabRequestLogModal,
  [MODAL_IDS.VIEW_REPORT]: LabAttachmentModal,
};

const Menu = ({ setModal, status, disabled }) => {
  const menuActions = [
    {
      label: (
        <TranslatedText
          stringId="lab.action.printLabel"
          fallback="Print label"
          data-testid="translatedtext-gntp"
        />
      ),
      action: () => setModal(MODAL_IDS.LABEL_PRINT),
    },
  ];

  if (INTERIM_STATUSES.includes(status)) {
    menuActions.push({
      label: (
        <TranslatedText
          stringId="lab.action.printInterimReport"
          fallback="Print interim report"
          data-testid="translatedtext-print-interim-report"
        />
      ),
      action: () => setModal(MODAL_IDS.RESULTS_PRINT),
    });
  }

  if (status !== LAB_REQUEST_STATUSES.PUBLISHED) {
    menuActions.push({
      label: (
        <TranslatedText
          stringId="lab.action.cancelRequest"
          fallback="Cancel request"
          data-testid="translatedtext-gas9"
        />
      ),
      action: () => setModal(MODAL_IDS.CANCEL),
    });
  }

  return (
    <MenuButton
      disabled={disabled}
      status={status}
      actions={menuActions}
      data-testid="menubutton-z3am"
    />
  );
};

export const LabRequestView = () => {
  const query = useUrlSearchParams();
  const { ability } = useAuth();
  const [modalId, setModalId] = useState(query.get('modal'));
  const [modalOpen, setModalOpen] = useState(false);
  const [labTestTableRefreshCount, setLabTestTableRefreshCount] = useState(0);
  const { isLoading, labRequest, updateLabRequest } = useLabRequest();

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
  };

  const handleChangeModalId = id => {
    setModalId(id);
    setModalOpen(true);
  };

  if (isLoading) return <LoadingIndicator data-testid="loadingindicator-tn29" />;

  const canWriteLabRequest = ability?.can('write', 'LabRequest');
  const canWriteLabRequestStatus = ability?.can('write', 'LabRequestStatus');
  const canWriteLabTest = ability?.can('write', 'LabTest');

  const isPublished = labRequest.status === LAB_REQUEST_STATUSES.PUBLISHED;
  const isVerified = labRequest.status === LAB_REQUEST_STATUSES.VERIFIED;

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
            label: (
              <TranslatedText
                stringId="lab.action.recordSample"
                fallback="Record sample"
                data-testid="translatedtext-jzdb"
              />
            ),
            action: () => handleChangeModalId(MODAL_IDS.RECORD_SAMPLE),
          },
        ]
      : [
          {
            label: (
              <TranslatedText
                stringId="general.action.edit"
                fallback="Edit"
                data-testid="translatedtext-ezxm"
              />
            ),
            action: () => handleChangeModalId(MODAL_IDS.RECORD_SAMPLE),
          },
          {
            label: (
              <TranslatedText
                stringId="lab.action.viewDetails"
                fallback="View details"
                data-testid="translatedtext-aep2"
              />
            ),
            action: () => handleChangeModalId(MODAL_IDS.SAMPLE_DETAILS),
          },
        ];

  const handleChangeStatus = () => {
    if (labRequest.status === LAB_REQUEST_STATUSES.SAMPLE_NOT_COLLECTED) return;
    handleChangeModalId(MODAL_IDS.CHANGE_STATUS);
  };

  return (
    <Container data-testid="container-pag3">
      <TopContainer data-testid="topcontainer-ikm7">
        <Heading2 data-testid="heading2-fg64">
          <TranslatedText
            stringId="lab.view.title"
            fallback="Labs"
            data-testid="translatedtext-d9t6"
          />
        </Heading2>
        <LabRequestCard
          labRequest={labRequest}
          isReadOnly={areLabRequestsReadOnly}
          actions={
            <Box display="flex" alignItems="center" data-testid="box-qy3e">
              {isPublished || isVerified ? (
                <OutlinedButton
                  disabled={isHidden}
                  onClick={() => {
                    handleChangeModalId(MODAL_IDS.RESULTS_PRINT);
                  }}
                  data-testid="outlinedbutton-fdjm"
                >
                  <TranslatedText
                    stringId="lab.action.printResults"
                    fallback="Print results"
                    data-testid="translatedtext-7zng"
                  />
                </OutlinedButton>
              ) : (
                <OutlinedButton
                  disabled={isHidden}
                  onClick={() => {
                    handleChangeModalId(MODAL_IDS.PRINT);
                  }}
                  data-testid="outlinedbutton-fdjm"
                >
                  <TranslatedText
                    stringId="lab.action.printRequest"
                    fallback="Print request"
                    data-testid="translatedtext-7zng"
                  />
                </OutlinedButton>
              )}
              <Menu
                setModal={handleChangeModalId}
                status={labRequest.status}
                disabled={isHidden}
                data-testid="menu-pub2"
              />
            </Box>
          }
          data-testid="labrequestcard-y9cn"
        />
        <LabRequestNoteForm
          labRequestId={labRequest.id}
          isReadOnly={areLabRequestsReadOnly}
          data-testid="labrequestnoteform-1bev"
        />
        <FixedTileRow data-testid="fixedtilerow-xxmq">
          <Tile
            Icon={() => <img src={TestCategoryIcon} alt="test category" />}
            text={
              <TranslatedText
                stringId="lab.testCategory.label"
                fallback="Test category"
                data-testid="translatedtext-4nhr"
              />
            }
            main={
              labRequest.category?.name ? (
                <TranslatedReferenceData
                  fallback={labRequest.category.name}
                  value={labRequest.category.id}
                  category="labTestCategory"
                  data-testid="translatedreferencedata-hhx8"
                />
              ) : (
                '-'
              )
            }
            data-testid="tile-gjdv"
          />
          <Tile
            Icon={Timelapse}
            text={
              <TranslatedText
                stringId="lab.view.tile.status.label"
                fallback="Status"
                data-testid="translatedtext-om89"
              />
            }
            main={
              <TileTag
                $color={LAB_REQUEST_STATUS_CONFIG[displayStatus]?.color}
                data-testid="tiletag-zdg8"
              >
                <TranslatedEnum
                  enumValues={LAB_REQUEST_STATUS_LABELS}
                  value={displayStatus}
                  data-testid="translatedenum-lab-request-status"
                />
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
                          data-testid="translatedtext-a4ay"
                        />
                      }
                      data-testid="conditionaltooltip-2le1"
                    >
                      <LabelContainer
                        color={
                          labRequest.status === LAB_REQUEST_STATUSES.SAMPLE_NOT_COLLECTED &&
                          Colors.softText
                        }
                        data-testid="labelcontainer-mjji"
                      >
                        <TranslatedText
                          stringId="lab.action.changeStatus"
                          fallback="Change status"
                          data-testid="translatedtext-kj5a"
                        />
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
                    data-testid="translatedtext-v5ab"
                  />
                ),
                action: () => handleChangeModalId(MODAL_IDS.VIEW_STATUS_LOG),
              },
            ]}
            data-testid="tile-pczb"
          />
          <Tile
            Icon={() => <img src={BeakerIcon} alt="beaker" />}
            text={
              <TranslatedText
                stringId="lab.view.tile.sampleTime.label"
                fallback="Sample collected"
                data-testid="translatedtext-b14b"
              />
            }
            isReadOnly={areLabRequestsReadOnly}
            main={
              <>
                <DateDisplay
                  color={labRequest.sampleTime ? 'unset' : Colors.softText}
                  date={labRequest.sampleTime}
                  showTime
                  data-testid="datedisplay-h6el"
                />
              </>
            }
            actions={actions}
            data-testid="tile-v8kr"
          />
          <Tile
            Icon={Business}
            text={
              <TranslatedText
                stringId="lab.laboratory.label"
                fallback="Laboratory"
                data-testid="translatedtext-e0i1"
              />
            }
            main={
              labRequest.laboratory?.name ? (
                <TranslatedReferenceData
                  fallback={labRequest.laboratory.name}
                  value={labRequest.laboratory.id}
                  category="labTestLaboratory"
                  data-testid="translatedreferencedata-b4nb"
                />
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
                    data-testid="translatedtext-x9gm"
                  />
                ),
                action: () => handleChangeModalId(MODAL_IDS.CHANGE_LABORATORY),
              },
            ]}
            data-testid="tile-eeus"
          />
          <Tile
            Icon={AssignmentLate}
            text={
              <TranslatedText
                stringId="lab.view.tile.priority.label"
                fallback="Priority"
                data-testid="translatedtext-okhs"
              />
            }
            main={
              labRequest.priority?.name ? (
                <TranslatedReferenceData
                  fallback={labRequest.priority.name}
                  value={labRequest.priority.id}
                  category="labTestPriority"
                  data-testid="translatedreferencedata-tqow"
                />
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
                    data-testid="translatedtext-epp5"
                  />
                ),
                action: () => handleChangeModalId(MODAL_IDS.CHANGE_PRIORITY),
              },
            ]}
            data-testid="tile-phsp"
          />
        </FixedTileRow>
      </TopContainer>
      <BottomContainer data-testid="bottomcontainer-7egh">
        <TableButtonRow variant="small" data-testid="tablebuttonrow-dosc">
          {hasAttachment && (
            <Button
              onClick={() => handleChangeModalId(MODAL_IDS.VIEW_REPORT)}
              data-testid="button-sigg"
            >
              <TranslatedText
                stringId="lab.action.viewReport"
                fallback="View report"
                data-testid="translatedtext-8zw9"
              />
            </Button>
          )}
          {canEnterResults && (
            <Button
              onClick={() => handleChangeModalId(MODAL_IDS.ENTER_RESULTS)}
              data-testid="button-oep6"
            >
              <TranslatedText
                stringId="lab.action.enterResults"
                fallback="Enter results"
                data-testid="translatedtext-veq6"
              />
            </Button>
          )}
        </TableButtonRow>
        <LabRequestResultsTable
          labRequest={labRequest}
          patient={patient}
          refreshCount={labTestTableRefreshCount}
          data-testid="labrequestresultstable-66qv"
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
          data-testid="activemodal-26e9"
        />
      )}
    </Container>
  );
};
